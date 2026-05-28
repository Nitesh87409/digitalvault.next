import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Blog from '@/models/Blog';
import { verifyAdmin } from '@/lib/auth';

export async function GET(request) {
  try {
    const admin = verifyAdmin(request);
    if (!admin) return NextResponse.json({ flag: false, message: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const blogs = await Blog.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ flag: true, blogs });
  } catch (error) {
    console.error('[Admin Blogs] GET error:', error);
    return NextResponse.json({ flag: false, message: 'Server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const admin = verifyAdmin(request);
    if (!admin) return NextResponse.json({ flag: false, message: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const body = await request.json();
    const { title, excerpt, content, image, author, status, read_time, faqs } = body;

    const trimmedTitle = typeof title === 'string' ? title.trim() : '';
    const trimmedExcerpt = typeof excerpt === 'string' ? excerpt.trim() : '';
    const trimmedContent = typeof content === 'string' ? content : '';

    if (!trimmedTitle || !trimmedExcerpt || !trimmedContent) {
      return NextResponse.json({ flag: false, message: 'Title, excerpt, and content are required' }, { status: 400 });
    }

    // Auto generate unique slug
    let slug = trimmedTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const slugExists = await Blog.exists({ slug });
    if (slugExists) {
      const suffix = Math.random().toString(36).substring(2, 6);
      slug = `${slug}-${suffix}`;
    }

    const blog = await Blog.create({
      title: trimmedTitle,
      slug,
      excerpt: trimmedExcerpt,
      content: trimmedContent,
      image: typeof image === 'string' ? image.trim() : '',
      author: typeof author === 'string' && author.trim() ? author.trim() : 'Admin',
      status: status !== false,
      read_time: Math.max(1, Number(read_time) || 5),
      faqs: Array.isArray(faqs) ? faqs : [],
    });

    return NextResponse.json({ flag: true, message: 'Blog created successfully', blog });
  } catch (error) {
    console.error('[Admin Blogs] POST error:', error);
    return NextResponse.json({ flag: false, message: 'Server error' }, { status: 500 });
  }
}
