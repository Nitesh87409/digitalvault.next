import { NextResponse } from 'next/server';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import Product from '@/models/Product';
import Customer from '@/models/Customer';
import Coupon from '@/models/Coupon';
import { sendOrderConfirmation } from '@/lib/mailer';
import { verifyAdmin, verifyCustomer } from '@/lib/auth';
import { buildRateLimitKey, consumePersistentRateLimit } from '@/lib/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DOWNLOAD_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const CHECKOUT_LIMIT = { limit: 10, windowMs: 60_000 };
const PAYMENT_VERIFY_LIMIT = { limit: 20, windowMs: 60_000 };

function json(flag, message, extra = {}, status = 200) {
  return NextResponse.json({ flag, message, ...extra }, { status });
}

function money(value) {
  return Math.max(0, Math.round(Number(value || 0) * 100) / 100);
}

function normalizeEmail(value) {
  return typeof value === 'string' ? value.toLowerCase().trim() : '';
}

function normalizePhone(value) {
  const digits = typeof value === 'string' ? value.replace(/\D/g, '') : '';
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPhone(value) {
  return /^\d{10}$/.test(value);
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

function getRazorpayKey() {
  if (!process.env.RAZORPAY_KEY_ID) throw new Error('RAZORPAY_KEY_ID not set');
  return process.env.RAZORPAY_KEY_ID;
}

function getErrorMessage(error, fallback = 'Server error') {
  if (typeof error === 'string' && error.trim()) return error.trim();
  if (typeof error?.message === 'string' && error.message.trim()) return error.message.trim();
  if (typeof error?.error?.description === 'string' && error.error.description.trim()) {
    return error.error.description.trim();
  }
  return fallback;
}

async function createRazorpayOrder(order) {
  try {
    return await getRazorpay().orders.create(order);
  } catch (error) {
    const providerMessage = getErrorMessage(error, 'Unknown Razorpay error');
    console.error('Razorpay order creation failed:', {
      statusCode: error?.statusCode || null,
      code: error?.error?.code || null,
      description: providerMessage,
    });
    if (error?.statusCode === 401) {
      throw new Error('Payment gateway configuration error. Please contact support.');
    }
    throw new Error('Payment gateway is temporarily unavailable. Please try again shortly.');
  }
}

async function getActiveCustomer(request, { required = true } = {}) {
  const decoded = verifyCustomer(request);
  if (!decoded) {
    return required ? { error: json(0, 'Unauthorized', {}, 401) } : { customer: null };
  }

  const customer = await Customer.findById(decoded.id)
    .select('name email phone is_blocked')
    .lean();
  if (!customer || customer.is_blocked) {
    return { error: json(0, 'Unauthorized', {}, 401) };
  }
  return { customer };
}

async function findGuestCustomerByContact(email, phone) {
  const matches = await Customer.find({
    $or: [
      { email },
      { phone },
    ],
  })
    .select('name email phone is_blocked')
    .limit(2)
    .lean();

  const uniqueMatches = new Map(matches.map(customer => [customer._id.toString(), customer]));
  if (uniqueMatches.size > 1) {
    return { error: json(0, 'Email and phone belong to different accounts. Please login or use matching details.', {}, 409) };
  }

  return { customer: matches[0] || null };
}

async function resolveCheckoutCustomer(request, body) {
  const authResult = await getActiveCustomer(request, { required: false });
  if (authResult.error) return authResult;
  if (authResult.customer) {
    const email = normalizeEmail(body.email);
    const phone = normalizePhone(body.phone);
    const updateData = {};
    if (!authResult.customer.email && isValidEmail(email)) updateData.email = email;
    if (!authResult.customer.phone && isValidPhone(phone)) updateData.phone = phone;
    if (Object.keys(updateData).length) {
      const updatedCustomer = await Customer.findByIdAndUpdate(
        authResult.customer._id,
        { $set: updateData },
        { new: true }
      )
        .select('name email phone is_blocked')
        .lean();
      return { customer: updatedCustomer };
    }
    return { customer: authResult.customer };
  }

  const email = normalizeEmail(body.email);
  const phone = normalizePhone(body.phone);

  if (!isValidEmail(email)) return { error: json(0, 'Valid email address required') };
  if (!isValidPhone(phone)) return { error: json(0, 'Valid 10-digit phone number required') };

  const guestResult = await findGuestCustomerByContact(email, phone);
  if (guestResult.error) return guestResult;

  if (guestResult.customer) {
    if (guestResult.customer.is_blocked) {
      return { error: json(0, 'Your account is blocked.', {}, 403) };
    }
    if (
      (guestResult.customer.email && normalizeEmail(guestResult.customer.email) !== email) ||
      (guestResult.customer.phone && normalizePhone(guestResult.customer.phone) !== phone)
    ) {
      return { error: json(0, 'Email and phone do not match the existing account.', {}, 409) };
    }

    const updateData = {};
    if (!guestResult.customer.email) updateData.email = email;
    if (!guestResult.customer.phone) updateData.phone = phone;

    if (Object.keys(updateData).length) {
      const updatedCustomer = await Customer.findByIdAndUpdate(
        guestResult.customer._id,
        { $set: updateData },
        { new: true }
      )
        .select('name email phone is_blocked')
        .lean();
      return { customer: updatedCustomer };
    }

    return { customer: guestResult.customer };
  }

  try {
    const newCustomer = await Customer.create({
      name: 'Guest',
      email,
      phone,
      auth_provider: 'local',
      is_verified: true,
      is_blocked: false,
    });
    return {
      customer: newCustomer.toObject ? newCustomer.toObject() : newCustomer,
    };
  } catch (error) {
    if (error.code !== 11000) throw error;

    const retryResult = await findGuestCustomerByContact(email, phone);
    if (retryResult.error) return retryResult;
    if (!retryResult.customer || retryResult.customer.is_blocked) {
      return { error: json(0, 'Unable to create guest account. Please try logging in.', {}, 409) };
    }
    if (
      (retryResult.customer.email && normalizeEmail(retryResult.customer.email) !== email) ||
      (retryResult.customer.phone && normalizePhone(retryResult.customer.phone) !== phone)
    ) {
      return { error: json(0, 'Email and phone do not match the existing account.', {}, 409) };
    }
    return { customer: retryResult.customer };
  }
}

function getCheckoutContact(customer, body) {
  const bodyEmail = normalizeEmail(body.email);
  const bodyPhone = normalizePhone(body.phone);
  return {
    name: customer.name || 'Guest',
    email: customer.email || bodyEmail,
    phone: bodyPhone || customer.phone || '',
  };
}

async function validateCoupon({ code, email, amount, productIds }) {
  if (!code) return { flag: 1, discount: 0, finalAmount: amount, coupon: null };

  const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() }).lean();
  if (!coupon) return { flag: 0, message: 'Invalid coupon code' };
  if (!coupon.status) return { flag: 0, message: 'This coupon is inactive' };

  const now = new Date();
  if (coupon.start_date && now < new Date(coupon.start_date)) {
    return { flag: 0, message: 'Coupon not started yet' };
  }
  if (coupon.end_date && now > new Date(coupon.end_date)) {
    return { flag: 0, message: 'Coupon has expired' };
  }
  if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
    return { flag: 0, message: 'Coupon usage limit reached' };
  }

  const userUsage = (coupon.used_by || []).filter(u => u.user_email === email).length;
  if (userUsage >= (coupon.per_user_limit || 1)) {
    return { flag: 0, message: 'You have already used this coupon' };
  }

  if (coupon.user_type === 'new') {
    const orderCount = await Order.countDocuments({ email, payment_status: 1 });
    if (orderCount > 0) return { flag: 0, message: 'This coupon is for new users only' };
  }

  if (coupon.user_type === 'specific') {
    const allowedEmails = (coupon.specific_emails || []).map(e => e.toLowerCase());
    if (!allowedEmails.includes(email)) {
      return { flag: 0, message: 'This coupon is not valid for your account' };
    }
  }

  if (amount < (coupon.min_order || 0)) {
    return { flag: 0, message: `Minimum order ${coupon.min_order} required` };
  }

  const couponProductIds = (coupon.product_ids || []).map(id => id.toString());
  if (couponProductIds.length) {
    const allAllowed = productIds.length && productIds.every(id => couponProductIds.includes(id.toString()));
    if (!allAllowed) return { flag: 0, message: 'Coupon not valid for these products' };
  }

  const rawDiscount = coupon.discount_type === 'percentage'
    ? (amount * coupon.discount_value) / 100
    : coupon.discount_value;
  const discount = money(Math.min(rawDiscount, amount));

  return {
    flag: 1,
    coupon,
    discount,
    finalAmount: money(amount - discount),
  };
}

function distributeDiscount(products, discount) {
  let remaining = money(discount);
  const total = money(products.reduce((sum, product) => sum + product.sale_price, 0));

  return products.map((product, index) => {
    const share = index === products.length - 1
      ? remaining
      : money((discount * product.sale_price) / total);
    remaining = money(remaining - share);
    return {
      product,
      discount: share,
      amount: money(product.sale_price - share),
    };
  });
}

function newDownloadTokenExpiry() {
  return new Date(Date.now() + DOWNLOAD_TOKEN_TTL_MS);
}

async function refreshExpiredDownloadTokens(orders) {
  const now = new Date();
  const updates = [];

  for (const order of orders) {
    const expired = !order.token_expires_at || new Date(order.token_expires_at) <= now;
    if (!order.download_token || expired) {
      order.download_token = uuidv4();
      order.token_expires_at = newDownloadTokenExpiry();
      updates.push({
        updateOne: {
          filter: { _id: order._id, customer_id: order.customer_id, payment_status: 1 },
          update: {
            $set: {
              download_token: order.download_token,
              token_expires_at: order.token_expires_at,
            },
          },
        },
      });
    }
  }

  if (updates.length) {
    await Order.bulkWrite(updates);
  }

  return orders;
}

async function markCouponUsed({ couponCode, email, orderId, discount, revenue }) {
  if (!couponCode) return;
  const coupon = await Coupon.findOne({ code: couponCode }).select('_id max_uses per_user_limit').lean();
  if (!coupon) throw new Error('Coupon not found');

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

  const result = await Coupon.updateOne(
    {
      _id: coupon._id,
      status: true,
      $expr: exprChecks.length === 1 ? exprChecks[0] : { $and: exprChecks },
    },
    {
      $inc: { used_count: 1, total_revenue: revenue },
      $push: {
        used_by: {
          user_email: email,
          order_id: orderId,
          discount_amount: discount,
          used_at: new Date(),
        },
      },
    }
  );
  if (result.modifiedCount !== 1) {
    throw new Error('Coupon usage limit reached');
  }

  await Customer.updateOne(
    { email },
    { $push: { coupons_used: { code: couponCode, used_at: new Date() } } }
  );
}

function verifyPaymentSignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
  if (!process.env.RAZORPAY_KEY_SECRET) throw new Error('RAZORPAY_KEY_SECRET not set');
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');
  return expected === razorpay_signature;
}

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    const admin = verifyAdmin(request);
    if (!admin) return json(0, 'Unauthorized', {}, 401);

    if (type === 'stats') {
      const totalSales = await Order.countDocuments({ payment_status: 1 });
      return NextResponse.json({ flag: 1, totalSales });
    }

    const limit = Math.min(Number(searchParams.get('limit')) || 200, 500);
    const [orders, revenueAgg] = await Promise.all([
      Order.find()
        .populate('product_id', 'name')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),
      Order.aggregate([
        { $match: { payment_status: 1 } },
        { $group: { _id: null, totalRevenue: { $sum: '$amount' } } }
      ]),
    ]);
    return NextResponse.json({
      flag: 1,
      orders,
      totalRevenue: revenueAgg[0]?.totalRevenue || 0,
    });
  } catch (e) {
    console.error('Order GET error:', e.message);
    return json(0, 'Server error');
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { action } = body;

    if (action === 'create') {
      const rate = await consumePersistentRateLimit(buildRateLimitKey(request, 'order-create'), CHECKOUT_LIMIT);
      if (!rate.allowed) return json(0, 'Too many checkout attempts. Please try again shortly.', {}, 429);

      const { product_id, coupon_code } = body;
      if (!mongoose.Types.ObjectId.isValid(product_id)) {
        return json(0, 'Product not found');
      }

      const product = await Product.findOne({ _id: product_id, status: true }).lean();
      if (!product) return json(0, 'Product not found');

      const { customer, error } = await resolveCheckoutCustomer(request, body);
      if (error) return error;

      const checkoutContact = getCheckoutContact(customer, body);
      if (!isValidEmail(checkoutContact.email)) return json(0, 'Email address required');
      if (!isValidPhone(checkoutContact.phone)) return json(0, 'Phone number required');

      const couponResult = await validateCoupon({
        code: coupon_code,
        email: checkoutContact.email,
        amount: money(product.sale_price),
        productIds: [product._id],
      });
      if (!couponResult.flag) return json(0, couponResult.message);
      if (couponResult.finalAmount < 1) return json(0, 'Order amount must be at least 1');

      const rzpOrder = await createRazorpayOrder({
        amount: Math.round(couponResult.finalAmount * 100),
        currency: 'INR',
        receipt: `rcpt_${Date.now()}`,
      });

      const order = await Order.create({
        customer_id: customer._id,
        name: checkoutContact.name,
        email: checkoutContact.email,
        phone: checkoutContact.phone,
        amount: couponResult.finalAmount,
        original_amount: money(product.sale_price),
        discount_amount: couponResult.discount,
        coupon_code: couponResult.coupon?.code || null,
        product_id: product._id,
        product_name: product.name,
        razorpay_order_id: rzpOrder.id,
        payment_status: 0,
      });

      return NextResponse.json({
        flag: 1,
        razorpay_key: getRazorpayKey(),
        razorpay_order_id: rzpOrder.id,
        amount: rzpOrder.amount,
        order_id: order._id,
      });
    }

    if (action === 'cart-checkout') {
      const rate = await consumePersistentRateLimit(buildRateLimitKey(request, 'cart-checkout'), CHECKOUT_LIMIT);
      if (!rate.allowed) return json(0, 'Too many checkout attempts. Please try again shortly.', {}, 429);

      const { items = [], coupon_code } = body;
      const productIds = [...new Set(items.map(i => i.product_id).filter(Boolean))];
      if (!productIds.length || !productIds.every(id => mongoose.Types.ObjectId.isValid(id))) {
        return json(0, 'No valid products found');
      }

      const products = await Product.find({ _id: { $in: productIds }, status: true }).lean();
      if (!products.length) return json(0, 'No valid products found');

      const { customer, error } = await resolveCheckoutCustomer(request, body);
      if (error) return error;

      const checkoutContact = getCheckoutContact(customer, body);
      if (!isValidEmail(checkoutContact.email)) return json(0, 'Email address required');
      if (!isValidPhone(checkoutContact.phone)) return json(0, 'Phone number required');

      const totalAmount = money(products.reduce((sum, product) => sum + product.sale_price, 0));
      const couponResult = await validateCoupon({
        code: coupon_code,
        email: checkoutContact.email,
        amount: totalAmount,
        productIds: products.map(p => p._id),
      });
      if (!couponResult.flag) return json(0, couponResult.message);
      if (couponResult.finalAmount < 1) return json(0, 'Order amount must be at least 1');

      const rzpOrder = await createRazorpayOrder({
        amount: Math.round(couponResult.finalAmount * 100),
        currency: 'INR',
        receipt: `cart_${Date.now()}`,
      });

      const pricedItems = distributeDiscount(products, couponResult.discount);
      const orders = await Order.insertMany(pricedItems.map(({ product, discount, amount }) => ({
        customer_id: customer._id,
        name: checkoutContact.name,
        email: checkoutContact.email,
        phone: checkoutContact.phone,
        amount,
        original_amount: money(product.sale_price),
        discount_amount: discount,
        coupon_code: couponResult.coupon?.code || null,
        product_id: product._id,
        product_name: product.name,
        razorpay_order_id: rzpOrder.id,
        payment_status: 0,
      })));

      return NextResponse.json({
        flag: 1,
        razorpay_key: getRazorpayKey(),
        razorpay_order_id: rzpOrder.id,
        amount: rzpOrder.amount,
        total: couponResult.finalAmount,
        order_ids: orders.map(order => order._id),
        product_count: orders.length,
      });
    }

    if (action === 'payment-success') {
      const rate = await consumePersistentRateLimit(buildRateLimitKey(request, 'payment-success'), PAYMENT_VERIFY_LIMIT);
      if (!rate.allowed) return json(0, 'Too many payment verification attempts. Please try again shortly.', {}, 429);

      const { customer, error } = await getActiveCustomer(request, { required: false });
      if (error) return error;

      const { razorpay_response, order_id, order_ids } = body;
      if (!razorpay_response) return json(0, 'Payment response missing');

      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = razorpay_response;
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return json(0, 'Payment response invalid');
      }

      const ids = (order_ids?.length ? order_ids : [order_id]).filter(Boolean);
      if (!ids.length || !ids.every(id => mongoose.Types.ObjectId.isValid(id))) {
        return json(0, 'Order not found');
      }

      const orderQuery = { _id: { $in: ids } };
      if (customer) orderQuery.customer_id = customer._id;

      const orders = await Order.find(orderQuery).lean();
      if (orders.length !== ids.length) return json(0, 'Order not found');
      const orderCustomerId = orders[0]?.customer_id?.toString();
      if (!orderCustomerId || orders.some(order => order.customer_id?.toString() !== orderCustomerId)) {
        return json(0, 'Order not found');
      }
      if (orders.some(order => order.razorpay_order_id !== razorpay_order_id)) {
        return json(0, 'Payment order mismatch');
      }
      if (!verifyPaymentSignature(razorpay_response)) {
        return json(0, 'Payment verification failed');
      }

      const unpaidOrders = orders.filter(order => order.payment_status !== 1);
      if (!unpaidOrders.length) {
        const existingToken = orders.find(order => order.download_token)?.download_token;
        return json(1, 'Payment already verified', {
          download_token: existingToken,
          redirect: existingToken ? undefined : ids.length > 1 ? '/account?tab=downloads' : undefined,
        });
      }

      const sharedDownloadToken = uuidv4();
      const tokenById = new Map(unpaidOrders.map(order => [order._id.toString(), sharedDownloadToken]));
      const tokenExpiresAt = newDownloadTokenExpiry();
      await Order.bulkWrite(unpaidOrders.map(order => ({
        updateOne: {
          filter: { _id: order._id, payment_status: { $ne: 1 } },
          update: {
            $set: {
              payment_status: 1,
              razorpay_payment_id,
              razorpay_signature,
              download_token: tokenById.get(order._id.toString()),
              token_expires_at: tokenExpiresAt,
            },
          },
        },
      })));

      const paidTotal = money(unpaidOrders.reduce((sum, order) => sum + order.amount, 0));
      await Customer.updateOne(
        { _id: orderCustomerId },
        {
          $inc: { total_spent: paidTotal, total_orders: unpaidOrders.length },
          $set: { last_login: new Date() },
        }
      );

      const couponCode = unpaidOrders.find(order => order.coupon_code)?.coupon_code;
      if (couponCode) {
        await markCouponUsed({
          couponCode,
          email: unpaidOrders[0].email,
          orderId: unpaidOrders[0]._id,
          discount: money(unpaidOrders.reduce((sum, order) => sum + (order.discount_amount || 0), 0)),
          revenue: paidTotal,
        });
      }


      await Promise.allSettled(
        unpaidOrders.map(order => {
          return sendOrderConfirmation({
            name: order.name,
            email: order.email,
            download_token: tokenById.get(order._id.toString()),
            amount: order.amount,
            product_name: order.product_name,
          });
        })
      );

      const firstToken = tokenById.get(unpaidOrders[0]._id.toString());
      return NextResponse.json({
        flag: 1,
        message: 'Payment verified!',
        download_token: firstToken,
      });
    }

    if (action === 'my-orders') {
      const { customer, error } = await getActiveCustomer(request);
      if (error) return error;

      const orders = await Order.find({ customer_id: customer._id, payment_status: 1 })
        .populate('product_id', 'name images')
        .sort({ createdAt: -1 })
        .lean();

      return NextResponse.json({ flag: 1, orders: await refreshExpiredDownloadTokens(orders || []) });
    }

    if (action === 'get-download') {
      const { token } = body;
      const orders = await Order.find({ download_token: token, payment_status: 1 })
        .populate('product_id')
        .lean();
      if (!orders.length) return json(0, 'Invalid download link');
      if (orders.some(order => order.token_expires_at && new Date(order.token_expires_at) < new Date())) {
        return json(0, 'Download link expired');
      }

      const files = orders
        .map(order => order.product_id)
        .filter(Boolean)
        .map(product => ({ id: product._id, name: product.name }));

      if (!files.length) return json(0, 'Product not found');

      return NextResponse.json({
        flag: 1,
        files,
      });
    }

    if (action === 'update-status') {
      const admin = verifyAdmin(request);
      if (!admin) return json(0, 'Unauthorized', {}, 401);
      const { order_id, payment_status } = body;
      if (!mongoose.Types.ObjectId.isValid(order_id) || ![0, 1, 2].includes(payment_status)) {
        return json(0, 'Invalid order or status');
      }
      const order = await Order.findByIdAndUpdate(order_id, { payment_status }, { new: true }).populate('product_id', 'name').lean();
      if (!order) return json(0, 'Order not found');
      return NextResponse.json({ flag: 1, message: 'Order status updated', order });
    }

    if (action === 'export-csv') {
      const admin = verifyAdmin(request);
      if (!admin) return json(0, 'Unauthorized', {}, 401);
      const orders = await Order.find().populate('product_id', 'name').sort({ createdAt: -1 }).lean();
      const headers = ['Customer', 'Email', 'Phone', 'Product', 'Amount (₹)', 'Original (₹)', 'Discount (₹)', 'Coupon', 'Payment ID', 'Status', 'Date'];
      const rows = orders.map(o => [
        (o.name || '').replace(/,/g, ' '),
        (o.email || '').replace(/,/g, ' '),
        (o.phone || '-').replace(/,/g, ' '),
        (o.product_id?.name || o.product_name || '-').replace(/,/g, ' '),
        Math.round(o.amount || 0),
        Math.round(o.original_amount || 0),
        Math.round(o.discount_amount || 0),
        (o.coupon_code || '-').replace(/,/g, ' '),
        (o.razorpay_payment_id || '-').replace(/,/g, ' '),
        o.payment_status === 1 ? 'Paid' : o.payment_status === 2 ? 'Refunded' : 'Pending',
        new Date(o.createdAt).toLocaleDateString('en-IN'),
      ]);
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      return NextResponse.json({ flag: 1, csv });
    }

    return json(0, 'Invalid action');
  } catch (e) {
    const message = getErrorMessage(e);
    console.error('Order error:', message);
    return json(0, message);
  }
}
