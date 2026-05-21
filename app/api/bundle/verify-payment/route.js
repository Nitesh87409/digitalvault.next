import { NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import { verifyCustomer } from '@/lib/auth';
import { normalizeBundlePrices } from '@/lib/security';
import { hasActiveBundleAccess } from '@/lib/bundle-access';
import BundleSubscription from '@/models/BundleSubscription';
import Coupon from '@/models/Coupon';
import Customer from '@/models/Customer';
import Setting from '@/models/Setting';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_BUNDLE_AMOUNT_PAISE = 20700;

function json(body, status = 200) {
  return NextResponse.json(body, { status });
}

async function getBundleAmountPaise() {
  const settings = await Setting.findOne().select('bundle_price bundle_original_price').lean();
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

function verifyPaymentSignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
  if (!process.env.RAZORPAY_KEY_SECRET) throw new Error('RAZORPAY_KEY_SECRET not set');
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  const expectedBuffer = Buffer.from(expected, 'hex');
  const receivedBuffer = Buffer.from(razorpay_signature || '', 'hex');
  return expectedBuffer.length === receivedBuffer.length && crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

async function getActiveCustomer(request) {
  const decoded = verifyCustomer(request);
  if (!decoded?.id) return null;

  const customer = await Customer.findById(decoded.id)
    .select('name email is_blocked total_spent total_orders')
    .lean();
  if (!customer || customer.is_blocked) return null;

  return customer;
}

async function markBundleCouponUsed({ couponCode, email, discountAmountRupees, revenueRupees }) {
  if (!couponCode || !email) return;

  const coupon = await Coupon.findOne({ code: couponCode.toUpperCase().trim() })
    .select('_id max_uses per_user_limit')
    .lean();
  if (!coupon) return;

  const exprChecks = [
    {
      $lt: [
        {
          $size: {
            $filter: {
              input: '$used_by',
              as: 'usage',
              cond: { $eq: ['$$usage.user_email', email] },
            },
          },
        },
        coupon.per_user_limit || 1,
      ],
    },
  ];

  if (coupon.max_uses) {
    exprChecks.push({ $lt: ['$used_count', coupon.max_uses] });
  }

  await Coupon.updateOne(
    {
      _id: coupon._id,
      status: true,
      $expr: exprChecks.length === 1 ? exprChecks[0] : { $and: exprChecks },
    },
    {
      $inc: { used_count: 1, total_revenue: revenueRupees },
      $push: {
        used_by: {
          user_email: email,
          used_at: new Date(),
          discount_amount: discountAmountRupees,
        },
      },
    }
  );

  await Customer.updateOne(
    { email },
    { $push: { coupons_used: { code: couponCode.toUpperCase().trim(), used_at: new Date() } } }
  );
}

export async function POST(request) {
  let body = {};

  try {
    await connectDB();

    const customer = await getActiveCustomer(request);
    if (!customer) return json({ message: 'User not logged in' }, 401);

    body = await request.json().catch(() => ({}));
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.warn('[Bundle] payment verification failed: missing payment fields', {
        customer_id: customer._id?.toString(),
        razorpay_order_id,
        razorpay_payment_id,
      });
      return json({ message: 'Payment verification failed' }, 400);
    }

    if (!verifyPaymentSignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature })) {
      console.warn('[Bundle] payment verification failed: invalid signature', {
        customer_id: customer._id?.toString(),
        razorpay_order_id,
        razorpay_payment_id,
      });
      return json({ message: 'Payment verification failed' }, 400);
    }

    const activeSubscription = await hasActiveBundleAccess(customer._id);
    if (activeSubscription) {
      console.info('[Bundle] payment verification success: already active', {
        customer_id: customer._id?.toString(),
        razorpay_order_id,
        razorpay_payment_id,
      });
      return json({ success: true, message: 'Bundle activated' });
    }

    const razorpayOrder = await getRazorpay().orders.fetch(razorpay_order_id);
    const orderCustomerId = razorpayOrder?.notes?.customer_id;
    if (orderCustomerId && orderCustomerId !== customer._id.toString()) {
      console.warn('[Bundle] payment verification failed: customer mismatch', {
        customer_id: customer._id?.toString(),
        order_customer_id: orderCustomerId,
        razorpay_order_id,
      });
      return json({ message: 'Payment verification failed' }, 400);
    }

    const amount = Number(razorpayOrder?.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      console.error('[Bundle] payment verification failed: invalid Razorpay amount', {
        customer_id: customer._id?.toString(),
        razorpay_order_id,
        amount: razorpayOrder?.amount,
      });
      return json({ message: 'Payment verification failed' }, 400);
    }

    const appliedCouponCode = (razorpayOrder?.notes?.coupon_code || '').trim();

    try {
      await BundleSubscription.create({
        customer_id: customer._id.toString(),
        status: 'active',
        payment_id: razorpay_payment_id,
        razorpay_order_id,
        amount,
        coupon_code: appliedCouponCode ? appliedCouponCode.toUpperCase() : null,
        purchase_date: new Date(),
      });

      await Customer.updateOne(
        { _id: customer._id },
        {
          $inc: { total_spent: amount / 100, total_orders: 1 },
          $set: { last_login: new Date() },
        }
      );

      if (appliedCouponCode) {
        const discountAmountRupees = Math.max(0, ((await getBundleAmountPaise()) - amount) / 100);
        await markBundleCouponUsed({
          couponCode: appliedCouponCode,
          email: customer.email,
          discountAmountRupees,
          revenueRupees: amount / 100,
        });
      }
    } catch (error) {
      console.error('[Bundle] DB save failed after verified payment. Manual rollback/reconcile required:', {
        customer_id: customer._id?.toString(),
        razorpay_order_id,
        razorpay_payment_id,
        error: error.message,
      });
      return json({ message: 'Server error' }, 500);
    }

    console.info('[Bundle] payment verification success', {
      customer_id: customer._id?.toString(),
      razorpay_order_id,
      razorpay_payment_id,
      amount,
    });

    return json({ success: true, message: 'Bundle activated' });
  } catch (error) {
    console.error('[Bundle] verify-payment error:', {
      error: error.message,
      razorpay_order_id: body?.razorpay_order_id,
      razorpay_payment_id: body?.razorpay_payment_id,
    });
    return json({ message: 'Server error' }, 500);
  }
}
