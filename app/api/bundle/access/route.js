import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { verifyCustomer } from '@/lib/auth';
import { getBundleAccessStatus } from '@/lib/bundle-access';
import Customer from '@/models/Customer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

    const status = await getBundleAccessStatus(customer._id);
    return NextResponse.json({ hasAccess: status === 'active', status });
  } catch (error) {
    console.error('[Bundle] access error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
