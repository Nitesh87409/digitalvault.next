import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import Product from '@/models/Product';
import path from 'path';
import fs from 'fs';
import { buildRateLimitKey, consumePersistentRateLimit } from '@/lib/security';
import { fetchSafeRemoteFile } from '@/lib/safe-download-source';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await connectDB();

    const rateLimitKey = buildRateLimitKey(request, 'single-download');
    const rate = await consumePersistentRateLimit(rateLimitKey, { limit: 15, windowMs: 60_000 });
    if (!rate.allowed) {
      return new NextResponse('Too many download requests. Please try again in a minute.', {
        status: 429,
        headers: {
          'Retry-After': String(rate.retryAfterSeconds),
        },
      });
    }

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
      const { response: upstream, url: resolvedUrl } = await fetchSafeRemoteFile(product.file_url);
      if (!upstream.ok || !upstream.body) {
        return new NextResponse('File not found.', { status: 404 });
      }

      let filename = 'download';
      try {
        const parsed = new URL(resolvedUrl);
        const base = path.basename(parsed.pathname || '');
        if (base && base.includes('.')) {
          filename = decodeURIComponent(base);
        } else {
          filename = `${(product.name || 'download').replace(/[^\w.-]+/g, '-').replace(/^-+|-+$/g, '') || 'download'}.zip`;
        }
      } catch {
        filename = `${(product.name || 'download').replace(/[^\w.-]+/g, '-').replace(/^-+|-+$/g, '') || 'download'}.zip`;
      }

      const MIME_TYPES = {
        '.pdf': 'application/pdf',
        '.zip': 'application/zip',
        '.rar': 'application/vnd.rar',
        '.7z': 'application/x-7z-compressed',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.webp': 'image/webp',
        '.mp4': 'video/mp4',
        '.mp3': 'audio/mpeg',
        '.csv': 'text/csv',
        '.txt': 'text/plain',
      };
      const ext = path.extname(filename).toLowerCase();
      const contentType = upstream.headers.get('content-type') || MIME_TYPES[ext] || 'application/octet-stream';

      return new NextResponse(upstream.body, {
        headers: {
          'Content-Disposition': `attachment; filename="${filename.replace(/"/g, '')}"`,
          'Content-Type': contentType,
          'Cache-Control': 'no-store',
        },
      });
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
    if (e.message?.toLowerCase().includes('remote download') || e.message?.toLowerCase().includes('blocked download host')) {
      return new NextResponse('File source is not allowed.', { status: 400 });
    }
    return new NextResponse('Server error.', { status: 500 });
  }
}
