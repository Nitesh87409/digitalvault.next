import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Blog from '@/models/Blog';
import { verifyAdmin } from '@/lib/auth';
import { resolveBlogFeaturedImage } from '@/lib/blog-product-images';

function normalizeProductId(value) {
  return /^[0-9a-fA-F]{24}$/.test(String(value || '').trim()) ? String(value).trim() : null;
}

function normalizeFeaturedIndex(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

export async function GET(request) {
  try {
    const admin = verifyAdmin(request);
    if (!admin) return NextResponse.json({ flag: false, message: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const blogs = await Blog.find()
      .populate('product_id', 'name images')
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({
      flag: true,
      blogs: blogs.map((blog) => ({
        ...blog,
        product_id: blog.product_id?._id?.toString?.() || blog.product_id?._id || blog.product_id || null,
        resolved_image: resolveBlogFeaturedImage(blog),
      }))
    });
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
    const { title, excerpt, content, image, product_id, featured_product_image_index, author, status, read_time, faqs } = body;

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
      product_id: normalizeProductId(product_id),
      featured_product_image_index: normalizeFeaturedIndex(featured_product_image_index),
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
