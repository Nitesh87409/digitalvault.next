import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { verifyCustomer } from '@/lib/auth';
import { buildRateLimitKey, consumeRateLimit, normalizeBundlePrices } from '@/lib/security';
import { getBundleAccessStatus } from '@/lib/bundle-access';
import Coupon from '@/models/Coupon';
import Customer from '@/models/Customer';
import Setting from '@/models/Setting';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_BUNDLE_AMOUNT_PAISE = 20700;

function json(body, status = 200, headers = {}) {
  return NextResponse.json(body, { status, headers });
}

async function getBundleAmountPaise() {
  const settings = await Setting.findOne().select('bundle_enabled bundle_price bundle_original_price').lean();
  if (settings?.bundle_enabled === false) return null;
  const normalizedPrices = normalizeBundlePrices(settings);
  const dbAmount = Math.round(Number(normalizedPrices.bundle_price || 0) * 100);
  if (Number.isFinite(dbAmount) && dbAmount > 0) return dbAmount;

  const amount = Number(process.env.BUNDLE_PRICE_PAISE);
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount) : DEFAULT_BUNDLE_AMOUNT_PAISE;
}

function getRazorpay() {
  const Razorpay = require('razorpay');
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay keys missing in environment variables');
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

function money(value) {
  return Math.max(0, Math.round(Number(value || 0) * 100) / 100);
}

async function getActiveCustomer(request) {
  const decoded = verifyCustomer(request);
  if (!decoded?.id) return null;

  const customer = await Customer.findById(decoded.id)
    .select('name email phone is_blocked total_orders')
    .lean();
  if (!customer || customer.is_blocked) return null;

  return customer;
}

async function validateBundleCoupon({ code, customer, amountPaise }) {
  if (!code) {
    return {
      coupon: null,
      couponCode: null,
      discountPaise: 0,
      finalAmountPaise: amountPaise,
    };
  }

  const couponCode = code.toUpperCase().trim();
  const coupon = await Coupon.findOne({ code: couponCode }).lean();
  if (!coupon) return { error: 'Invalid coupon' };
  if (!coupon.status) return { error: 'Invalid coupon' };

  const now = new Date();
  if (coupon.start_date && now < new Date(coupon.start_date)) return { error: 'Invalid coupon' };
  if (coupon.end_date && now > new Date(coupon.end_date)) return { error: 'Invalid coupon' };
  if (coupon.max_uses && coupon.used_count >= coupon.max_uses) return { error: 'Invalid coupon' };

  const email = (customer.email || '').toLowerCase();
  const userUsage = (coupon.used_by || []).filter(u => (u.user_email || '').toLowerCase() === email).length;
  if (userUsage >= (coupon.per_user_limit || 1)) return { error: 'Invalid coupon' };

  if (coupon.user_type === 'new' && (customer.total_orders || 0) > 0) return { error: 'Invalid coupon' };
  if (coupon.user_type === 'specific') {
    const allowedEmails = (coupon.specific_emails || []).map(e => e.toLowerCase());
    if (!allowedEmails.includes(email)) return { error: 'Invalid coupon' };
  }

  if ((coupon.product_ids || []).length) return { error: 'Invalid coupon' };

  const amountRupees = money(amountPaise / 100);
  if (amountRupees < (coupon.min_order || 0)) return { error: 'Invalid coupon' };

  const discountRupees = coupon.discount_type === 'percentage'
    ? (amountRupees * coupon.discount_value) / 100
    : coupon.discount_value;
  const discountPaise = Math.min(amountPaise, Math.round(money(discountRupees) * 100));
  const finalAmountPaise = Math.max(0, amountPaise - discountPaise);

  return {
    coupon,
    couponCode,
    discountPaise,
    finalAmountPaise,
  };
}

export async function POST(request) {
  try {
    await connectDB();

    const customer = await getActiveCustomer(request);
    if (!customer) return json({ message: 'User not logged in' }, 401);

    const rateKey = buildRateLimitKey(request, 'bundle-create-order', customer._id.toString());
    const rate = consumeRateLimit(rateKey, { limit: 5, windowMs: 60_000 });
    if (!rate.allowed) {
      return json(
        { message: 'Too many bundle order requests. Try again shortly.' },
        429,
        { 'Retry-After': String(rate.retryAfterSeconds || 60) }
      );
    }

    const bundleStatus = await getBundleAccessStatus(customer._id);
    if (bundleStatus === 'active') {
      return json({ message: 'Bundle already purchased' }, 400);
    }
    if (bundleStatus === 'inactive') {
      return json({ message: 'Your bundle is inactive. Please contact the support team.' }, 400);
    }

    const body = await request.json().catch(() => ({}));
    const bundleAmountPaise = await getBundleAmountPaise();
    if (!bundleAmountPaise) return json({ message: 'Bundle is currently disabled' }, 400);
    const couponResult = await validateBundleCoupon({
      code: body.coupon_code,
      customer,
      amountPaise: bundleAmountPaise,
    });

    if (couponResult.error) return json({ message: couponResult.error }, 400);
    if (couponResult.finalAmountPaise < 100) {
      return json({ message: 'Order amount must be at least ₹1' }, 400);
    }

    let razorpayOrder;
    try {
      razorpayOrder = await getRazorpay().orders.create({
        amount: couponResult.finalAmountPaise,
        currency: 'INR',
        receipt: `bundle_${Date.now()}`,
        notes: {
          type: 'bundle_subscription',
          customer_id: customer._id.toString(),
          coupon_code: couponResult.couponCode || '',
        },
      });
    } catch (error) {
      console.error('[Bundle] Razorpay create-order error:', error);
      return json({ message: 'Razorpay error' }, 500);
    }

    return json({
      razorpay_order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key_id: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('[Bundle] create-order error:', error);
    return json({ message: 'Server error' }, 500);
  }
}
