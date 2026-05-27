import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import connectDB from '@/lib/mongodb';
import { verifyCustomer } from '@/lib/auth';
import { getActiveBundleSubscription, getEffectiveCutoffDate } from '@/lib/bundle-access';
import Customer from '@/models/Customer';
import Product from '@/models/Product';
import Setting from '@/models/Setting';
import { buildRateLimitKey, consumePersistentRateLimit } from '@/lib/security';
import { fetchSafeRemoteFile } from '@/lib/safe-download-source';

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

    const rateLimitKey = buildRateLimitKey(request, 'bundle-download');
    const rate = await consumePersistentRateLimit(rateLimitKey, { limit: 15, windowMs: 60_000 });
    if (!rate.allowed) {
      return new NextResponse('Too many download requests. Please try again in a minute.', {
        status: 429,
        headers: {
          'Retry-After': String(rate.retryAfterSeconds),
        },
      });
    }

    const decoded = verifyCustomer(request);
    if (!decoded?.id) {
      return new NextResponse('User not logged in', { status: 401 });
    }

    const customer = await Customer.findById(decoded.id).select('_id is_blocked').lean();
    if (!customer || customer.is_blocked) {
      return new NextResponse('User not logged in', { status: 401 });
    }

    const subscription = await getActiveBundleSubscription(customer._id);
    if (!subscription) {
      return new NextResponse('Bundle access required', { status: 403 });
    }

    const { productId } = await params;
    const product = await Product.findById(productId)
      .select('name file_url included_in_bundle status createdAt')
      .lean();

    if (!product) return new NextResponse('Product not found', { status: 404 });
    if (!product.status) {
      return new NextResponse('Bundle download not allowed for this product', { status: 403 });
    }
    if (!product.included_in_bundle) {
      return new NextResponse('This product is not included in the bundle', { status: 403 });
    }
    if (!product.file_url) {
      return new NextResponse('File not found', { status: 404 });
    }

    // Enforce date-based cutoff at download time
    const settings = await Setting.findOne().select('bundle_cutoff_enabled').lean();
    if (settings?.bundle_cutoff_enabled) {
      const cutoffDate = getEffectiveCutoffDate(subscription);
      if (cutoffDate && product.createdAt && new Date(product.createdAt) > cutoffDate) {
        return new NextResponse('This product was added after your bundle purchase date', { status: 403 });
      }
    }

    // Smart Cloud Detection — redirect cloud storage URLs directly to the user's browser
    const CLOUD_URL_REGEX = /drive\.google\.com|dropbox\.com|mega\.nz|onedrive\.live\.com|mediafire\.com/i;
    if (product.file_url.startsWith('http') && CLOUD_URL_REGEX.test(product.file_url)) {
      return NextResponse.redirect(product.file_url, 302);
    }

    const filename = getFileName(product, product.file_url);

    if (product.file_url.startsWith('http')) {
      const { response: upstream } = await fetchSafeRemoteFile(product.file_url);
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
    if (error.message?.toLowerCase().includes('remote download') || error.message?.toLowerCase().includes('blocked download host')) {
      return new NextResponse('File source is not allowed', { status: 400 });
    }
    return new NextResponse('Server error', { status: 500 });
  }
}
