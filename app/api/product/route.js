import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import { verifyAdmin } from '@/lib/auth';
import { sanitizePlainText, sanitizeRichText } from '@/lib/sanitize-content';
import { normalizeStoredDownloadSource } from '@/lib/safe-download-source';

const PUBLIC_PRODUCT_FIELDS = 'name description category images original_price sale_price average_rating total_reviews included_in_bundle slug';

function toPublicProduct(product) {
  return {
    id: product._id?.toString(),
    slug: product.slug || product._id?.toString(),
    name: product.name,
    description: sanitizeRichText(product.description || ''),
    category: product.category || 'Uncategorized',
    images: product.images || [],
    original_price: product.original_price,
    sale_price: product.sale_price,
    average_rating: product.average_rating || 0,
    total_reviews: product.total_reviews || 0,
    included_in_bundle: !!product.included_in_bundle,
  };
}

function toAdminProduct(product) {
  return {
    ...product,
    description: sanitizeRichText(product.description || ''),
  };
}

// GET /api/product — all active products
export async function GET(request) {
  try {
    await connectDB();

    // Auto-migrate: populate missing slugs for existing products
    const unsluggedProducts = await Product.find({
      $or: [
        { slug: { $exists: false } },
        { slug: null },
        { slug: "" }
      ]
    });
    if (unsluggedProducts.length > 0) {
      for (const prod of unsluggedProducts) {
        let slug = prod.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
        const exists = await Product.exists({ slug, _id: { $ne: prod._id } });
        if (exists) {
          const suffix = Math.random().toString(36).substring(2, 6);
          slug = `${slug}-${suffix}`;
        }
        await Product.findByIdAndUpdate(prod._id, { slug });
      }
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const category = searchParams.get('category');
    const admin = verifyAdmin(request);

    if (id) {
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
      const queryField = isObjectId ? '_id' : 'slug';
      const filter = admin ? { [queryField]: id } : { [queryField]: id, status: true };
      const product = await Product.findOne(filter)
        .select(admin ? '' : PUBLIC_PRODUCT_FIELDS)
        .lean();
      if (!product) return NextResponse.json({ flag: 0, message: 'Product not found' });
      return NextResponse.json({ flag: 1, product: admin ? toAdminProduct(product) : toPublicProduct(product) });
    }

    const filter = admin ? {} : { status: true };
    if (category) {
      filter.category = category;
    }

    const products = await Product.find(filter)
      .select(admin ? '' : PUBLIC_PRODUCT_FIELDS)
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({ flag: 1, products: admin ? products.map(toAdminProduct) : products.map(toPublicProduct) });
  } catch (e) {
    if (e.message?.toLowerCase().includes('download')) {
      return NextResponse.json({ flag: 0, message: e.message }, { status: 400 });
    }
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
    const { name, description, category, images, original_price, sale_price, file_url, included_in_bundle } = body;

    if (!name || !original_price || !sale_price || !file_url)
      return NextResponse.json({ flag: 0, message: 'All fields required' });
    if (Number(sale_price) <= 0 || Number(original_price) <= 0)
      return NextResponse.json({ flag: 0, message: 'Prices must be greater than zero' });

    const safeFileUrl = await normalizeStoredDownloadSource(file_url);

    // Generate unique slug
    let slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    const slugExists = await Product.exists({ slug });
    if (slugExists) {
      const suffix = Math.random().toString(36).substring(2, 6);
      slug = `${slug}-${suffix}`;
    }

    const product = await Product.create({
      name: sanitizePlainText(name, 200),
      slug,
      description: sanitizeRichText(description),
      category: sanitizePlainText(category || 'Uncategorized', 120) || 'Uncategorized',
      images: images || [],
      original_price: Number(original_price),
      sale_price: Number(sale_price),
      file_url: safeFileUrl,
      included_in_bundle: !!included_in_bundle,
    });
    return NextResponse.json({ flag: 1, message: 'Product created', product });
  } catch (e) {
    return NextResponse.json({ flag: 0, message: 'Server error' });
  }
}
