import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import ProductPage from "./product-page";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://downloadkart.in").replace(/\/+$/, "");

  try {
    await connectDB();
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    const queryField = isObjectId ? '_id' : 'slug';
    const product = await Product.findOne({ [queryField]: id }).lean();

    if (!product) {
      return {
        title: "Product Not Found | DownloadKart",
        description: "The requested digital product could not be found.",
      };
    }

    const cleanDescription = product.description
      ? product.description.replace(/<[^>]*>/g, "").substring(0, 160).trim()
      : "Premium digital product available for instant download.";

    return {
      title: `${product.name} | DownloadKart`,
      description: cleanDescription,
      openGraph: {
        title: `${product.name} | DownloadKart`,
        description: cleanDescription,
        url: `${baseUrl}/product/${product.slug || product._id}`,
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
  } catch (error) {
    console.error("Error generating product metadata:", error);
    return {
      title: "Digital Product | DownloadKart",
    };
  }
}

export default async function Page({ params }) {
  const { id } = await params;
  
  let jsonLd = null;
  try {
    await connectDB();
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    const queryField = isObjectId ? '_id' : 'slug';
    const product = await Product.findOne({ [queryField]: id }).lean();
    
    if (product) {
      const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://downloadkart.in").replace(/\/+$/, "");
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
          "url": `${baseUrl}/product/${product.slug || product._id}`
        }
      };
    }
  } catch (e) {
    console.error("Error generating JSON-LD structured data:", e);
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProductPage id={id} />
    </>
  );
}
