import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Blog from '@/models/Blog';
import { renderBlogContentWithProductImages, resolveBlogFeaturedImage } from '@/lib/blog-product-images';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (slug) {
      const blog = await Blog.findOne({ slug, status: true }).populate('product_id', 'name images').lean();
      if (!blog) {
        return NextResponse.json({ flag: false, message: 'Blog article not found' }, { status: 404 });
      }
      return NextResponse.json({
        flag: true,
        blog: {
          ...blog,
          image: resolveBlogFeaturedImage(blog),
          content: renderBlogContentWithProductImages(blog.content, blog.product_id),
        }
      });
    }

    const blogs = await Blog.find({ status: true })
      .populate('product_id', 'name images')
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({
      flag: true,
      blogs: blogs.map((blog) => ({
        ...blog,
        image: resolveBlogFeaturedImage(blog),
      }))
    });
  } catch (error) {
    console.error('[Public Blogs] GET error:', error);
    return NextResponse.json({ flag: false, message: 'Server error' }, { status: 500 });
  }
}
