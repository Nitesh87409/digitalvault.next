import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import Product from '@/models/Product';
import path from 'path';
import fs from 'fs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const pid = searchParams.get('pid');

    if (!token || !pid) {
      return NextResponse.json({ flag: 0, message: 'Invalid request' }, { status: 400 });
    }

    const order = await Order.findOne({ download_token: token, payment_status: 1 })
      .select('product_id token_expires_at')
      .lean();
    if (!order) return new NextResponse('Access denied.', { status: 403 });
    if (order.token_expires_at && new Date(order.token_expires_at) < new Date()) {
      return new NextResponse('Download link expired.', { status: 403 });
    }
    if (order.product_id?.toString() !== pid) {
      return new NextResponse('Access denied - wrong product.', { status: 403 });
    }

    const product = await Product.findById(pid).select('file_url name').lean();
    if (!product?.file_url) return new NextResponse('File not found.', { status: 404 });

    await Order.updateOne({ _id: order._id }, { $inc: { download_count: 1 } });

    if (product.file_url.startsWith('http')) {
      return NextResponse.redirect(product.file_url);
    }

    const publicDir = path.join(process.cwd(), 'public');
    const filePath = path.normalize(path.join(publicDir, product.file_url));
    if (!filePath.startsWith(publicDir)) {
      return new NextResponse('Invalid file path.', { status: 400 });
    }

    if (fs.existsSync(filePath)) {
      const fileBuffer = fs.readFileSync(filePath);
      const fileName = path.basename(filePath);
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Content-Type': 'application/octet-stream',
        },
      });
    }

    return new NextResponse('File not found on server.', { status: 404 });
  } catch (e) {
    console.error(e.message);
    return new NextResponse('Server error.', { status: 500 });
  }
}
