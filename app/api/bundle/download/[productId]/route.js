import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import connectDB from '@/lib/mongodb';
import { verifyCustomer } from '@/lib/auth';
import { hasActiveBundleAccess } from '@/lib/bundle-access';
import Customer from '@/models/Customer';
import Product from '@/models/Product';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

function getFileName(product, fileUrl = '') {
  try {
    const parsed = fileUrl.startsWith('http') ? new URL(fileUrl) : null;
    const sourcePath = parsed ? parsed.pathname : fileUrl;
    const base = path.basename(sourcePath || '');
    if (base && base.includes('.')) return decodeURIComponent(base);
  } catch {}

  return `${(product.name || 'bundle-download').replace(/[^\w.-]+/g, '-').replace(/^-+|-+$/g, '') || 'bundle-download'}.zip`;
}

function contentDisposition(filename) {
  const safeName = filename.replace(/"/g, '');
  return `attachment; filename="${safeName}"`;
}

function getContentType(filename, fallback = 'application/octet-stream') {
  return MIME_TYPES[path.extname(filename).toLowerCase()] || fallback;
}

export async function GET(request, { params }) {
  try {
    await connectDB();

    const decoded = verifyCustomer(request);
    if (!decoded?.id) {
      return new NextResponse('User not logged in', { status: 401 });
    }

    const customer = await Customer.findById(decoded.id).select('_id is_blocked').lean();
    if (!customer || customer.is_blocked) {
      return new NextResponse('User not logged in', { status: 401 });
    }

    const hasAccess = await hasActiveBundleAccess(customer._id);
    if (!hasAccess) {
      return new NextResponse('Bundle access required', { status: 403 });
    }

    const { productId } = await params;
    const product = await Product.findById(productId)
      .select('name file_url included_in_bundle status')
      .lean();

    if (!product) return new NextResponse('Product not found', { status: 404 });
    if (!product.status) {
      return new NextResponse('Bundle download not allowed for this product', { status: 403 });
    }
    if (!product.file_url) {
      return new NextResponse('File not found', { status: 404 });
    }

    const filename = getFileName(product, product.file_url);

    if (product.file_url.startsWith('http')) {
      const upstream = await fetch(product.file_url, { cache: 'no-store' });
      if (!upstream.ok || !upstream.body) {
        return new NextResponse('File not found', { status: 404 });
      }

      return new NextResponse(upstream.body, {
        headers: {
          'Content-Disposition': contentDisposition(filename),
          'Content-Type': upstream.headers.get('content-type') || getContentType(filename),
          'Cache-Control': 'no-store',
        },
      });
    }

    const publicDir = path.resolve(process.cwd(), 'public');
    const filePath = path.resolve(publicDir, product.file_url.replace(/^[/\\]+/, ''));
    if (!filePath.startsWith(publicDir)) {
      return new NextResponse('Invalid file path', { status: 400 });
    }
    if (!fs.existsSync(filePath)) {
      return new NextResponse('File not found on server', { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const localFilename = path.basename(filePath);
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Disposition': contentDisposition(localFilename),
        'Content-Type': getContentType(localFilename),
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[Bundle] download error:', error);
    return new NextResponse('Server error', { status: 500 });
  }
}
