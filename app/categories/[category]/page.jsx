import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import CategoryClient from "./category-client";

export const revalidate = 300;

export async function generateMetadata({ params }) {
  const { category } = await params;
  const categoryName = decodeURIComponent(category);

  let appName = 'DownloadKart';
  let appAltName = '';

  try {
    await connectDB();
    const Setting = (await import('@/models/Setting')).default;
    const settings = await Setting.findOne().lean();
    if (settings) {
      appName = settings.app_name || appName;
      appAltName = settings.app_alt_name || '';
    }
  } catch (e) {
    console.error('Category metadata generation error:', e);
  }

  const altSuffix = appAltName ? ` (${appAltName})` : '';

  return {
    title: `${categoryName} – Digital Templates & Products | ${appName}${altSuffix}`,
    description: `Explore the best collection of ${categoryName} on ${appName}${altSuffix}. Instant delivery!`,
  };
}

export default async function Page({ params }) {
  const { category } = await params;
  const categoryName = decodeURIComponent(category);

  await connectDB();
  
  // Fetch active products matching this category
  const products = await Product.find({ category: categoryName, status: true }).sort({ createdAt: -1 }).lean();

  // Convert mongoose _id and dates to plain serializable types safely
  const serializedProducts = products.map(p => ({
    ...p,
    id: p._id?.toString(),
    _id: p._id?.toString(),
    createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : null,
    updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : null,
  }));

  return <CategoryClient initialProducts={serializedProducts} categoryName={categoryName} />;
}
