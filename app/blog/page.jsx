import connectDB from "@/lib/mongodb";
import Blog from "@/models/Blog";
import BlogClient from "./blog-client";
import { resolveBlogFeaturedImage } from "@/lib/blog-product-images";

export const revalidate = 300;

export async function generateMetadata() {
  let appName = 'DownloadKart';
  let appAltName = '';
  try {
    const Setting = (await import('@/models/Setting')).default;
    const connectDB = (await import('@/lib/mongodb')).default;
    await connectDB();
    const settings = await Setting.findOne().lean();
    if (settings) {
      appName = settings.app_name || appName;
      appAltName = settings.app_alt_name || '';
    }
  } catch (e) {
    console.error('Blog metadata generation error:', e);
  }

  const altSuffix = appAltName ? ` (${appAltName})` : '';

  return {
    title: `Blog & Creator Learning Hub | ${appName}${altSuffix}`,
    description: `Read helpful marketing strategy guides, design tutorial playbooks, and insights to grow your creator online business at ${appAltName || appName}.`,
  };
}

export default async function Page() {
  await connectDB();
  const blogs = await Blog.find({ status: true })
    .populate('product_id', 'name images')
    .sort({ createdAt: -1 })
    .lean();
  
  // Convert mongoose objects to serialized format for RSC safely
  const serializedBlogs = blogs.map(b => ({
    ...b,
    _id: b._id?.toString(),
    product_id: b.product_id?._id?.toString?.() || b.product_id?._id || b.product_id || null,
    image: resolveBlogFeaturedImage(b),
    createdAt: b.createdAt ? new Date(b.createdAt).toISOString() : null,
    updatedAt: b.updatedAt ? new Date(b.updatedAt).toISOString() : null,
    faqs: Array.isArray(b.faqs) 
      ? b.faqs.map(f => ({
          ...f,
          _id: f._id?.toString() || '',
        }))
      : []
  }));

  return <BlogClient initialBlogs={serializedBlogs} />;
}
