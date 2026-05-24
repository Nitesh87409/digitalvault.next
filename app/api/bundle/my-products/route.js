import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { verifyCustomer } from '@/lib/auth';
import { getBundleProducts, hasActiveBundleAccess } from '@/lib/bundle-access';
import Customer from '@/models/Customer';
import { sanitizeRichText } from '@/lib/sanitize-content';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function toPublicProduct(product) {
  return {
    id: product._id?.toString(),
    _id: product._id,
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

export async function GET(request) {
  try {
    await connectDB();

    const decoded = verifyCustomer(request);
    if (!decoded?.id) {
      return NextResponse.json({ message: 'User not logged in' }, { status: 401 });
    }

    const customer = await Customer.findById(decoded.id).select('_id is_blocked').lean();
    if (!customer || customer.is_blocked) {
      return NextResponse.json({ message: 'User not logged in' }, { status: 401 });
    }

    const hasAccess = await hasActiveBundleAccess(customer._id);
    if (!hasAccess) {
      return NextResponse.json({ message: 'Bundle access required' }, { status: 403 });
    }

    const products = await getBundleProducts();
    return NextResponse.json({ products: products.map(toPublicProduct) });
  } catch (error) {
    console.error('[Bundle] my-products error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
