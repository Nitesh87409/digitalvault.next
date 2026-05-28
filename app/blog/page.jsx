import connectDB from "@/lib/mongodb";
import Blog from "@/models/Blog";
import BlogClient from "./blog-client";
import { resolveBlogFeaturedImage } from "@/lib/blog-product-images";

export const metadata = {
  title: "Blog & Creator Learning Hub | DownloadKart",
  description: "Read helpful marketing strategy guides, design tutorial playbooks, and insights to grow your creator online business.",
};

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
