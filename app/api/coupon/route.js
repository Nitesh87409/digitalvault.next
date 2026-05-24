import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Coupon from '@/models/Coupon';
import Order from '@/models/Order';
import Customer from '@/models/Customer';
import { verifyAdmin, verifyCustomer } from '@/lib/auth';
import { buildRateLimitKey, consumePersistentRateLimit } from '@/lib/security';

const VALIDATE_LIMIT = { limit: 10, windowMs: 60_000 };
const GENERIC_COUPON_ERROR = 'Coupon is invalid or unavailable';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'validate') {
      const decoded = verifyCustomer(request);
      if (!decoded?.id) {
        return NextResponse.json({ flag: 0, message: 'Please login to validate coupon' }, { status: 401 });
      }

      const code = searchParams.get('code');
      const amount = Number(searchParams.get('amount'));
      const product_id = searchParams.get('product_id');
      const is_bundle = searchParams.get('is_bundle') === 'true';
      if (!code || !amount || amount <= 0) {
        return NextResponse.json({ flag: 0, message: 'Invalid coupon request' }, { status: 400 });
      }

      const customer = await Customer.findById(decoded.id).select('email is_blocked').lean();
      if (!customer || customer.is_blocked || !customer.email) {
        return NextResponse.json({ flag: 0, message: 'Please login to validate coupon' }, { status: 401 });
      }

      const normalizedCode = code.toUpperCase().trim();
      const validateRate = await consumePersistentRateLimit(
        buildRateLimitKey(request, 'coupon-validate', `${customer._id}:${normalizedCode}`),
        VALIDATE_LIMIT
      );
      if (!validateRate.allowed) {
        return NextResponse.json({ flag: 0, message: 'Too many coupon attempts. Please try again later.' }, { status: 429 });
      }

      const email = customer.email.toLowerCase().trim();
      const coupon = await Coupon.findOne({ code: normalizedCode }).lean();
      if (!coupon || !coupon.status) {
        return NextResponse.json({ flag: 0, message: GENERIC_COUPON_ERROR });
      }

      const now = new Date();
      if (coupon.start_date && now < coupon.start_date) {
        return NextResponse.json({ flag: 0, message: GENERIC_COUPON_ERROR });
      }
      if (coupon.end_date && now > coupon.end_date) {
        return NextResponse.json({ flag: 0, message: GENERIC_COUPON_ERROR });
      }
      if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
        return NextResponse.json({ flag: 0, message: GENERIC_COUPON_ERROR });
      }

      const userUsage = (coupon.used_by || []).filter((entry) => entry.user_email === email).length;
      if (userUsage >= coupon.per_user_limit) {
        return NextResponse.json({ flag: 0, message: GENERIC_COUPON_ERROR });
      }

      if (coupon.user_type === 'new') {
        const orderCount = await Order.countDocuments({ email, payment_status: 1 });
        if (orderCount > 0) {
          return NextResponse.json({ flag: 0, message: GENERIC_COUPON_ERROR });
        }
      }

      if (coupon.user_type === 'specific') {
        const allowedEmails = (coupon.specific_emails || []).map((entry) => entry.toLowerCase());
        if (!allowedEmails.includes(email)) {
          return NextResponse.json({ flag: 0, message: GENERIC_COUPON_ERROR });
        }
      }

      if (amount < coupon.min_order) {
        return NextResponse.json({ flag: 0, message: GENERIC_COUPON_ERROR });
      }

      const couponProductIds = (coupon.product_ids || []).map((id) => id.toString());
      if (is_bundle) {
        if (couponProductIds.length > 0) {
          return NextResponse.json({ flag: 0, message: GENERIC_COUPON_ERROR });
        }
      } else if (couponProductIds.length > 0 && (!product_id || !couponProductIds.includes(product_id))) {
        return NextResponse.json({ flag: 0, message: GENERIC_COUPON_ERROR });
      }

      let discount = 0;
      if (coupon.discount_type === 'percentage') {
        discount = Math.round((amount * coupon.discount_value) / 100);
      } else {
        discount = Number(coupon.discount_value) || 0;
      }
      discount = Math.min(discount, amount);

      return NextResponse.json({
        flag: 1,
        coupon: {
          code: coupon.code,
          discount_type: coupon.discount_type,
          discount_value: coupon.discount_value,
          discount,
          final_amount: amount - discount,
        },
        message: `Coupon applied! You save ₹${discount}`,
      });
    }

    const admin = verifyAdmin(request);
    if (!admin) return NextResponse.json({ flag: 0, message: 'Unauthorized' }, { status: 401 });

    const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ flag: 1, coupons });
  } catch (e) {
    console.error(e.message);
    return NextResponse.json({ flag: 0, message: 'Server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const admin = verifyAdmin(request);
    if (!admin) return NextResponse.json({ flag: 0, message: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { code, discount_type, discount_value, min_order, max_uses, per_user_limit, start_date, end_date, product_ids, user_type, specific_emails, status } = body;

    if (!code || !discount_type || !discount_value)
      return NextResponse.json({ flag: 0, message: 'Code, type and value required' });
    if (!['percentage', 'flat'].includes(discount_type))
      return NextResponse.json({ flag: 0, message: 'Invalid discount type' });
    if (Number(discount_value) <= 0)
      return NextResponse.json({ flag: 0, message: 'Discount must be greater than zero' });

    const normalizedCode = code.toUpperCase().trim();
    const exists = await Coupon.findOne({ code: normalizedCode }).select('_id').lean();
    if (exists) return NextResponse.json({ flag: 0, message: 'Coupon code already exists' });

    const coupon = await Coupon.create({
      code: normalizedCode,
      discount_type,
      discount_value: Number(discount_value),
      min_order: Number(min_order) || 0,
      max_uses: max_uses ? Number(max_uses) : null,
      per_user_limit: Number(per_user_limit) || 1,
      start_date: start_date || new Date(),
      end_date: end_date || null,
      product_ids: product_ids || [],
      user_type: user_type || 'all',
      specific_emails: (specific_emails || []).map((entry) => entry.toLowerCase().trim()).filter(Boolean),
      status: status !== undefined ? status : true,
    });

    return NextResponse.json({ flag: 1, message: 'Coupon created', coupon });
  } catch (e) {
    console.error(e.message);
    return NextResponse.json({ flag: 0, message: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await connectDB();
    const admin = verifyAdmin(request);
    if (!admin) return NextResponse.json({ flag: 0, message: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { id, ...updates } = body;
    if (updates.code) updates.code = updates.code.toUpperCase().trim();
    if (updates.specific_emails) {
      updates.specific_emails = updates.specific_emails.map((entry) => entry.toLowerCase().trim()).filter(Boolean);
    }
    if (updates.discount_value) updates.discount_value = Number(updates.discount_value);
    if (updates.min_order !== undefined) updates.min_order = Number(updates.min_order) || 0;
    if (updates.max_uses !== undefined) updates.max_uses = updates.max_uses ? Number(updates.max_uses) : null;
    if (updates.per_user_limit !== undefined) updates.per_user_limit = Number(updates.per_user_limit) || 1;

    const coupon = await Coupon.findByIdAndUpdate(id, updates, { new: true });
    if (!coupon) return NextResponse.json({ flag: 0, message: 'Coupon not found' }, { status: 404 });

    return NextResponse.json({ flag: 1, message: 'Coupon updated', coupon });
  } catch (e) {
    return NextResponse.json({ flag: 0, message: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await connectDB();
    const admin = verifyAdmin(request);
    if (!admin) return NextResponse.json({ flag: 0, message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    await Coupon.findByIdAndDelete(id);
    return NextResponse.json({ flag: 1, message: 'Coupon deleted' });
  } catch (e) {
    return NextResponse.json({ flag: 0, message: 'Server error' }, { status: 500 });
  }
}
