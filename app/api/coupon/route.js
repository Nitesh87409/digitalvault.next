import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Coupon from '@/models/Coupon';
import Order from '@/models/Order';
import { verifyAdmin } from '@/lib/auth';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Public — validate coupon
    if (action === 'validate') {
      const code = searchParams.get('code');
      const email = searchParams.get('email')?.toLowerCase().trim();
      const amount = Number(searchParams.get('amount'));
      const product_id = searchParams.get('product_id');
      if (!code || !amount || amount <= 0)
        return NextResponse.json({ flag: 0, message: 'Invalid coupon request' });

      const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() }).lean();
      if (!coupon) return NextResponse.json({ flag: 0, message: 'Invalid coupon code' });
      if (!coupon.status) return NextResponse.json({ flag: 0, message: 'This coupon is inactive' });

      // Expiry check
      const now = new Date();
      if (coupon.start_date && now < coupon.start_date)
        return NextResponse.json({ flag: 0, message: 'Coupon not started yet' });
      if (coupon.end_date && now > coupon.end_date)
        return NextResponse.json({ flag: 0, message: 'Coupon has expired' });

      // Usage limit
      if (coupon.max_uses && coupon.used_count >= coupon.max_uses)
        return NextResponse.json({ flag: 0, message: 'Coupon usage limit reached' });

      // Per user limit
      if (email) {
        const userUsage = (coupon.used_by || []).filter(u => u.user_email === email).length;
        if (userUsage >= coupon.per_user_limit)
          return NextResponse.json({ flag: 0, message: 'You have already used this coupon' });

        // New user only check
        if (coupon.user_type === 'new') {
          const orderCount = await Order.countDocuments({ email, payment_status: 1 });
          if (orderCount > 0)
            return NextResponse.json({ flag: 0, message: 'This coupon is for new users only' });
        }

        // Specific email check
        if (coupon.user_type === 'specific' && !coupon.specific_emails.map(e => e.toLowerCase()).includes(email))
          return NextResponse.json({ flag: 0, message: 'This coupon is not valid for your account' });
      }

      // Min order check
      if (amount < coupon.min_order)
        return NextResponse.json({ flag: 0, message: `Minimum order ₹${coupon.min_order} required` });

      // Product specific check
      if (coupon.product_ids.length > 0) {
        if (!product_id || !coupon.product_ids.map(id => id.toString()).includes(product_id))
          return NextResponse.json({ flag: 0, message: 'Coupon not valid for these products' });
      }

      // Calculate discount
      let discount = 0;
      if (coupon.discount_type === 'percentage') {
        discount = Math.round((amount * coupon.discount_value) / 100);
      } else {
        discount = coupon.discount_value;
      }
      discount = Math.min(discount, amount); // Cannot exceed order amount

      return NextResponse.json({
        flag: 1,
        coupon: {
          code: coupon.code,
          discount_type: coupon.discount_type,
          discount_value: coupon.discount_value,
          discount,
          final_amount: amount - discount,
        },
        message: `Coupon applied! You save ₹${discount}`
      });
    }

    // Admin — get all coupons
    const admin = verifyAdmin(request);
    if (!admin) return NextResponse.json({ flag: 0, message: 'Unauthorized' });

    const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ flag: 1, coupons });

  } catch (e) {
    console.error(e.message);
    return NextResponse.json({ flag: 0, message: 'Server error' });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const admin = verifyAdmin(request);
    if (!admin) return NextResponse.json({ flag: 0, message: 'Unauthorized' });

    const body = await request.json();
    const { code, discount_type, discount_value, min_order, max_uses, per_user_limit, start_date, end_date, product_ids, user_type, specific_emails, status } = body;

    if (!code || !discount_type || !discount_value)
      return NextResponse.json({ flag: 0, message: 'Code, type and value required' });
    if (!['percentage', 'flat'].includes(discount_type))
      return NextResponse.json({ flag: 0, message: 'Invalid discount type' });
    if (Number(discount_value) <= 0)
      return NextResponse.json({ flag: 0, message: 'Discount must be greater than zero' });

    const normalizedCode = code.toUpperCase().trim();
    const exists = await Coupon.findOne({ code: normalizedCode });
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
      specific_emails: (specific_emails || []).map(e => e.toLowerCase().trim()).filter(Boolean),
      status: status !== undefined ? status : true,
    });

    return NextResponse.json({ flag: 1, message: 'Coupon created', coupon });
  } catch (e) {
    console.error(e.message);
    return NextResponse.json({ flag: 0, message: 'Server error' });
  }
}

export async function PUT(request) {
  try {
    await connectDB();
    const admin = verifyAdmin(request);
    if (!admin) return NextResponse.json({ flag: 0, message: 'Unauthorized' });

    const body = await request.json();
    const { id, ...updates } = body;
    if (updates.code) updates.code = updates.code.toUpperCase().trim();
    if (updates.specific_emails) {
      updates.specific_emails = updates.specific_emails.map(e => e.toLowerCase().trim()).filter(Boolean);
    }
    if (updates.discount_value) updates.discount_value = Number(updates.discount_value);
    if (updates.min_order !== undefined) updates.min_order = Number(updates.min_order) || 0;
    if (updates.max_uses !== undefined) updates.max_uses = updates.max_uses ? Number(updates.max_uses) : null;
    if (updates.per_user_limit !== undefined) updates.per_user_limit = Number(updates.per_user_limit) || 1;

    const coupon = await Coupon.findByIdAndUpdate(id, updates, { new: true });
    if (!coupon) return NextResponse.json({ flag: 0, message: 'Coupon not found' });

    return NextResponse.json({ flag: 1, message: 'Coupon updated', coupon });
  } catch (e) {
    return NextResponse.json({ flag: 0, message: 'Server error' });
  }
}

export async function DELETE(request) {
  try {
    await connectDB();
    const admin = verifyAdmin(request);
    if (!admin) return NextResponse.json({ flag: 0, message: 'Unauthorized' });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    await Coupon.findByIdAndDelete(id);
    return NextResponse.json({ flag: 1, message: 'Coupon deleted' });
  } catch (e) {
    return NextResponse.json({ flag: 0, message: 'Server error' });
  }
}
