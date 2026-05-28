import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Blog from '@/models/Blog';
import { verifyAdmin } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    const admin = verifyAdmin(request);
    if (!admin) return NextResponse.json({ flag: false, message: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    await connectDB();
    const body = await request.json();
    const { title, excerpt, content, image, author, status, read_time, faqs } = body;

    const trimmedTitle = typeof title === 'string' ? title.trim() : '';
    const trimmedExcerpt = typeof excerpt === 'string' ? excerpt.trim() : '';
    const trimmedContent = typeof content === 'string' ? content : '';

    if (!trimmedTitle || !trimmedExcerpt || !trimmedContent) {
      return NextResponse.json({ flag: false, message: 'Title, excerpt, and content are required' }, { status: 400 });
    }

    const oldBlog = await Blog.findById(id).select('title slug').lean();
    if (!oldBlog) return NextResponse.json({ flag: false, message: 'Blog not found' }, { status: 404 });

    let slug = oldBlog.slug;
    if (oldBlog.title !== trimmedTitle) {
      slug = trimmedTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const slugExists = await Blog.exists({ slug, _id: { $ne: id } });
      if (slugExists) {
        const suffix = Math.random().toString(36).substring(2, 6);
        slug = `${slug}-${suffix}`;
      }
    }

    const blog = await Blog.findByIdAndUpdate(
      id,
      {
        title: trimmedTitle,
        slug,
        excerpt: trimmedExcerpt,
        content: trimmedContent,
        image: typeof image === 'string' ? image.trim() : '',
        author: typeof author === 'string' && author.trim() ? author.trim() : 'Admin',
        status: status !== false,
        read_time: Math.max(1, Number(read_time) || 5),
        faqs: Array.isArray(faqs) ? faqs : [],
      },
      { new: true }
    );

    return NextResponse.json({ flag: true, message: 'Blog updated successfully', blog });
  } catch (error) {
    console.error('[Admin Blogs] PUT error:', error);
    return NextResponse.json({ flag: false, message: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const admin = verifyAdmin(request);
    if (!admin) return NextResponse.json({ flag: false, message: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    await connectDB();

    const deleted = await Blog.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ flag: false, message: 'Blog not found' }, { status: 404 });

    return NextResponse.json({ flag: true, message: 'Blog permanently deleted' });
  } catch (error) {
    console.error('[Admin Blogs] DELETE error:', error);
    return NextResponse.json({ flag: false, message: 'Server error' }, { status: 500 });
  }
}
