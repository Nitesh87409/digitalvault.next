import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import { verifyAdmin } from '@/lib/auth';

// PUT /api/product/[id] — update product
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const admin = verifyAdmin(request);
    if (!admin) return NextResponse.json({ flag: 0, message: 'Unauthorized' });

    await connectDB();
    const body = await request.json();
    const { name, description, category, images, original_price, sale_price, file_url, included_in_bundle } = body;
    if (!name || !original_price || !sale_price || !file_url)
      return NextResponse.json({ flag: 0, message: 'All fields required' });
    if (Number(sale_price) <= 0 || Number(original_price) <= 0)
      return NextResponse.json({ flag: 0, message: 'Prices must be greater than zero' });

    const product = await Product.findByIdAndUpdate(
      id,
      {
        name: name.trim(),
        description,
        category: category || 'Uncategorized',
        images: images || [],
        original_price: Number(original_price),
        sale_price: Number(sale_price),
        file_url,
        included_in_bundle: !!included_in_bundle,
      },
      { new: true }
    );
    if (!product) return NextResponse.json({ flag: 0, message: 'Product not found' });
    return NextResponse.json({ flag: 1, message: 'Product updated', product });
  } catch (e) {
    return NextResponse.json({ flag: 0, message: 'Server error' });
  }
}

// DELETE /api/product/[id] — delete product
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const admin = verifyAdmin(request);
    if (!admin) return NextResponse.json({ flag: 0, message: 'Unauthorized' });

    await connectDB();
    await Product.findByIdAndDelete(id);
    return NextResponse.json({ flag: 1, message: 'Product deleted' });
  } catch (e) {
    return NextResponse.json({ flag: 0, message: 'Server error' });
  }
}
