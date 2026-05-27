import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import { verifyAdmin } from '@/lib/auth';
import { sanitizePlainText, sanitizeRichText } from '@/lib/sanitize-content';
import { normalizeStoredDownloadSource } from '@/lib/safe-download-source';
import cloudinary from '@/lib/cloudinary';

// Extract public ID from Cloudinary URL (with or without v[digits] version segments)
function getCloudinaryPublicId(url) {
  if (!url || !url.includes('res.cloudinary.com')) return null;
  try {
    const uploadIdx = url.indexOf('/upload/');
    if (uploadIdx === -1) return null;
    let path = url.substring(uploadIdx + 8); // skip '/upload/'
    
    // Strip version segment if exists (e.g. 'v12345678/')
    const firstSlash = path.indexOf('/');
    if (firstSlash !== -1) {
      const firstSegment = path.substring(0, firstSlash);
      if (/^v\d+$/.test(firstSegment)) {
        path = path.substring(firstSlash + 1);
      }
    }
    
    // Strip file extension
    const lastDot = path.lastIndexOf('.');
    if (lastDot !== -1) {
      path = path.substring(0, lastDot);
    }
    return path;
  } catch (e) {
    return null;
  }
}

// Delete media asset from Cloudinary
async function deleteFromCloudinary(url) {
  const publicId = getCloudinaryPublicId(url);
  if (!publicId) return false;
  try {
    const res = await cloudinary.uploader.destroy(publicId);
    return res.result === 'ok';
  } catch (e) {
    console.error('Failed to delete from Cloudinary:', e);
    return false;
  }
}

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

    const safeFileUrl = await normalizeStoredDownloadSource(file_url);

    // Fetch existing product to compare images
    const oldProduct = await Product.findById(id).select('images').lean();

    const product = await Product.findByIdAndUpdate(
      id,
      {
        name: sanitizePlainText(name, 200),
        description: sanitizeRichText(description),
        category: sanitizePlainText(category || 'Uncategorized', 120) || 'Uncategorized',
        images: images || [],
        original_price: Number(original_price),
        sale_price: Number(sale_price),
        file_url: safeFileUrl,
        included_in_bundle: !!included_in_bundle,
      },
      { new: true }
    );
    if (!product) return NextResponse.json({ flag: 0, message: 'Product not found' });

    // Compare and delete replaced/removed images from Cloudinary
    if (oldProduct && oldProduct.images) {
      const newImages = images || [];
      const deletedImages = oldProduct.images.filter(img => !newImages.includes(img));
      for (const imgUrl of deletedImages) {
        await deleteFromCloudinary(imgUrl);
      }
    }

    return NextResponse.json({ flag: 1, message: 'Product updated', product });
  } catch (e) {
    if (e.message?.toLowerCase().includes('download')) {
      return NextResponse.json({ flag: 0, message: e.message }, { status: 400 });
    }
    return NextResponse.json({ flag: 0, message: 'Server error' });
  }
}

// PATCH /api/product/[id] — quick status toggle
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const admin = verifyAdmin(request);
    if (!admin) return NextResponse.json({ flag: 0, message: 'Unauthorized' });

    await connectDB();
    const body = await request.json();

    if (typeof body.status === 'boolean') {
      const product = await Product.findByIdAndUpdate(id, { status: body.status }, { new: true });
      if (!product) return NextResponse.json({ flag: 0, message: 'Product not found' });
      return NextResponse.json({ flag: 1, message: product.status ? 'Product visible' : 'Product hidden', product });
    }

    return NextResponse.json({ flag: 0, message: 'Invalid action' });
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
    
    // Fetch product to delete all its images from Cloudinary
    const product = await Product.findById(id).select('images').lean();
    if (product && product.images && product.images.length > 0) {
      for (const imgUrl of product.images) {
        await deleteFromCloudinary(imgUrl);
      }
    }

    await Product.findByIdAndDelete(id);
    return NextResponse.json({ flag: 1, message: 'Product deleted' });
  } catch (e) {
    return NextResponse.json({ flag: 0, message: 'Server error' });
  }
}
