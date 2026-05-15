import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import { verifyAdmin } from '@/lib/auth';

// GET /api/product — all active products
export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const category = searchParams.get('category');
    const admin = verifyAdmin(request);

    if (id) {
      const filter = admin ? { _id: id } : { _id: id, status: true };
      const product = await Product.findOne(filter).lean();
      if (!product) return NextResponse.json({ flag: 0, message: 'Product not found' });
      return NextResponse.json({ flag: 1, product });
    }

    const filter = admin ? {} : { status: true };
    if (category) {
      filter.category = category;
    }

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({ flag: 1, products });
  } catch (e) {
    return NextResponse.json({ flag: 0, message: 'Server error' });
  }
}

// POST /api/product — create product (admin)
export async function POST(request) {
  try {
    const admin = verifyAdmin(request);
    if (!admin) return NextResponse.json({ flag: 0, message: 'Unauthorized' });

    await connectDB();
    const body = await request.json();
    const { name, description, category, images, original_price, sale_price, file_url } = body;

    if (!name || !original_price || !sale_price || !file_url)
      return NextResponse.json({ flag: 0, message: 'All fields required' });
    if (Number(sale_price) <= 0 || Number(original_price) <= 0)
      return NextResponse.json({ flag: 0, message: 'Prices must be greater than zero' });

    const product = await Product.create({
      name: name.trim(),
      description,
      category: category || 'Uncategorized',
      images: images || [],
      original_price: Number(original_price),
      sale_price: Number(sale_price),
      file_url,
    });
    return NextResponse.json({ flag: 1, message: 'Product created', product });
  } catch (e) {
    return NextResponse.json({ flag: 0, message: 'Server error' });
  }
}
