import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import Category from "@/models/Category";
import Blog from "@/models/Blog";

export const revalidate = 3600;

export default async function sitemap() {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://downloadkart.in").replace(/\/+$/, "");

  // 1. Static Pages
  const routes = [
    "",
    "/refund-policy",
    "/terms-privacy",
    "/testimonials",
  ].map((route) => ({
    url: route === "" ? `${baseUrl}/` : `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: "daily",
    priority: route === "" ? 1.0 : 0.8,
  }));

  // 2. Fetch all active products
  let productRoutes = [];
  try {
    await connectDB();
    const products = await Product.find({ status: true }).select("_id slug updatedAt").lean();
    productRoutes = products.map((prod) => ({
      url: `${baseUrl}/product/${prod.slug || prod._id}`,
      lastModified: prod.updatedAt ? new Date(prod.updatedAt).toISOString() : new Date().toISOString(),
      changeFrequency: "weekly",
      priority: 0.9,
    }));
  } catch (error) {
    console.error("Error generating sitemap products:", error);
  }

  // 3. Fetch all categories
  let categoryRoutes = [];
  try {
    await connectDB();
    const categories = await Category.find().select("slug updatedAt").lean();
    categoryRoutes = categories.map((cat) => ({
      url: `${baseUrl}/categories/${cat.slug}`,
      lastModified: cat.updatedAt ? new Date(cat.updatedAt).toISOString() : new Date().toISOString(),
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  } catch (error) {
    console.error("Error generating sitemap categories:", error);
  }

  // 4. Fetch all active blogs
  let blogRoutes = [];
  try {
    await connectDB();
    const blogs = await Blog.find({ status: true }).select("slug updatedAt").lean();
    
    // Add /blog root catalog URL too!
    blogRoutes = [
      {
        url: `${baseUrl}/blog`,
        lastModified: new Date().toISOString(),
        changeFrequency: "daily",
        priority: 0.8,
      },
      ...blogs.map((blog) => ({
        url: `${baseUrl}/blog/${blog.slug}`,
        lastModified: blog.updatedAt ? new Date(blog.updatedAt).toISOString() : new Date().toISOString(),
        changeFrequency: "weekly",
        priority: 0.8,
      }))
    ];
  } catch (error) {
    console.error("Error generating sitemap blogs:", error);
  }

  return [...routes, ...productRoutes, ...categoryRoutes, ...blogRoutes];
}
