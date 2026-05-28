import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Blog from '@/models/Blog';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (slug) {
      const blog = await Blog.findOne({ slug, status: true }).lean();
      if (!blog) {
        return NextResponse.json({ flag: false, message: 'Blog article not found' }, { status: 404 });
      }
      return NextResponse.json({ flag: true, blog });
    }

    const blogs = await Blog.find({ status: true }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ flag: true, blogs });
  } catch (error) {
    console.error('[Public Blogs] GET error:', error);
    return NextResponse.json({ flag: false, message: 'Server error' }, { status: 500 });
  }
}
