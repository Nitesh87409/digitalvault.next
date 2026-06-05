import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import { sanitizeRichText } from "@/lib/sanitize-content";
import ProductPage from "./product-page";

export const revalidate = 300;

// Shared product fetcher — called once, reused for metadata + page render
async function getProduct(id) {
  try {
    await connectDB();
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    const queryField = isObjectId ? '_id' : 'slug';
    const product = await Product.findOne({ [queryField]: id, status: true })
      .select('name description category images original_price sale_price average_rating total_reviews included_in_bundle slug youtube_video_url')
      .lean();
    if (!product) return null;
    // Serialize for client (convert ObjectId + dates to strings)
    return {
      id: product._id.toString(),
      slug: product.slug || product._id.toString(),
      name: product.name,
      description: sanitizeRichText(product.description || ''),
      category: product.category || 'Uncategorized',
      images: product.images || [],
      original_price: product.original_price,
      sale_price: product.sale_price,
      average_rating: product.average_rating || 0,
      total_reviews: product.total_reviews || 0,
      included_in_bundle: !!product.included_in_bundle,
      youtube_video_url: product.youtube_video_url || '',
    };
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

async function getAppMeta() {
  let appName = 'DownloadKart';
  let appAltName = '';
  try {
    const Setting = (await import('@/models/Setting')).default;
    const settings = await Setting.findOne().lean();
    if (settings) {
      appName = settings.app_name || appName;
      appAltName = settings.app_alt_name ? settings.app_alt_name.split(',')[0].trim() : '';
    }
  } catch {}
  return { appName, appAltName };
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://www.downloadkart.com").replace(/\/+$/, "");

  await connectDB();
  const [product, { appName, appAltName }] = await Promise.all([
    getProduct(id),
    getAppMeta(),
  ]);

  const altSuffix = appAltName ? ` (${appAltName})` : '';

  if (!product) {
    return {
      title: `Product Not Found | ${appName}${altSuffix}`,
      description: "The requested digital product could not be found.",
    };
  }

  const cleanDescription = product.description
    ? product.description.replace(/<[^>]*>/g, "").substring(0, 160).trim()
    : "Premium digital product available for instant download.";

  return {
    title: `${product.name} | ${appName}${altSuffix}`,
    description: cleanDescription,
    openGraph: {
      title: `${product.name} | ${appName}${altSuffix}`,
      description: cleanDescription,
      url: `${baseUrl}/product/${product.slug || product.id}`,
      images: [
        {
          url: product.images?.[0] || '',
          width: 800,
          height: 800,
          alt: product.name,
        }
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: cleanDescription,
      images: [product.images?.[0] || ''],
    }
  };
}

// Construct Cloudinary optimized URL for preload
function getOptimizedImageUrl(url, width) {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  const params = `f_auto,q_auto,w_${width}`;
  return url.replace('/upload/', `/upload/${params}/`);
}

export default async function Page({ params }) {
  const { id } = await params;
  
  // Reuse the same DB connection from generateMetadata (connection is pooled)
  const product = await getProduct(id);

  // Build JSON-LD structured data
  let jsonLd = null;
  if (product) {
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://www.downloadkart.com").replace(/\/+$/, "");
    jsonLd = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": product.name,
      "image": product.images?.[0] || "",
      "description": product.description?.replace(/<[^>]*>/g, "").trim(),
      "offers": {
        "@type": "Offer",
        "price": product.sale_price,
        "priceCurrency": "INR",
        "availability": "https://schema.org/InStock",
        "url": `${baseUrl}/product/${product.slug || product.id}`
      }
    };
  }

  // Preload the main product image so browser starts downloading it immediately
  const preloadImageUrl = product?.images?.[0] ? getOptimizedImageUrl(product.images[0], 800) : null;

  return (
    <>
      {/* Preload main product image for faster LCP */}
      {preloadImageUrl && (
        <link rel="preload" as="image" href={preloadImageUrl} fetchPriority="high" />
      )}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProductPage id={id} initialProduct={product} />
    </>
  );
}
