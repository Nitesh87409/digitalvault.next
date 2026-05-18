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

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function json(flag, message, extra = {}) {
  return NextResponse.json({ flag, message, ...extra });
}

function money(value) {
  return Math.max(0, Math.round(Number(value || 0) * 100) / 100);
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

async function getActiveCustomer(request) {
  const decoded = verifyCustomer(request);
  if (!decoded) return { error: json(0, 'Unauthorized') };

  const customer = await Customer.findById(decoded.id)
    .select('name email phone is_blocked')
    .lean();
  if (!customer || customer.is_blocked) {
    return { error: json(0, 'Unauthorized') };
  }
  return { customer };
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

async function markCouponUsed({ couponCode, email, orderId, discount, revenue }) {
  if (!couponCode) return;
  await Coupon.updateOne(
    { code: couponCode },
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

    if (type === 'stats') {
      const totalSales = await Order.countDocuments({ payment_status: 1 });
      return NextResponse.json({ flag: 1, totalSales });
    }

    const admin = verifyAdmin(request);
    if (!admin) return json(0, 'Unauthorized');

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
      const { customer, error } = await getActiveCustomer(request);
      if (error) return error;

      const { product_id, coupon_code } = body;
      if (!mongoose.Types.ObjectId.isValid(product_id)) {
        return json(0, 'Product not found');
      }

      const product = await Product.findOne({ _id: product_id, status: true }).lean();
      if (!product) return json(0, 'Product not found');
      if (!customer.phone && !body.phone) return json(0, 'Phone number required');

      const couponResult = await validateCoupon({
        code: coupon_code,
        email: customer.email,
        amount: money(product.sale_price),
        productIds: [product._id],
      });
      if (!couponResult.flag) return json(0, couponResult.message);
      if (couponResult.finalAmount < 1) return json(0, 'Order amount must be at least 1');

      const rzpOrder = await getRazorpay().orders.create({
        amount: Math.round(couponResult.finalAmount * 100),
        currency: 'INR',
        receipt: `rcpt_${Date.now()}`,
      });

      const order = await Order.create({
        customer_id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone || body.phone,
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
      const { customer, error } = await getActiveCustomer(request);
      if (error) return error;

      const { items = [], coupon_code } = body;
      const productIds = [...new Set(items.map(i => i.product_id).filter(Boolean))];
      if (!productIds.length || !productIds.every(id => mongoose.Types.ObjectId.isValid(id))) {
        return json(0, 'No valid products found');
      }
      if (!customer.phone && !body.phone) return json(0, 'Phone number required');

      const products = await Product.find({ _id: { $in: productIds }, status: true }).lean();
      if (!products.length) return json(0, 'No valid products found');

      const totalAmount = money(products.reduce((sum, product) => sum + product.sale_price, 0));
      const couponResult = await validateCoupon({
        code: coupon_code,
        email: customer.email,
        amount: totalAmount,
        productIds: products.map(p => p._id),
      });
      if (!couponResult.flag) return json(0, couponResult.message);
      if (couponResult.finalAmount < 1) return json(0, 'Order amount must be at least 1');

      const rzpOrder = await getRazorpay().orders.create({
        amount: Math.round(couponResult.finalAmount * 100),
        currency: 'INR',
        receipt: `cart_${Date.now()}`,
      });

      const pricedItems = distributeDiscount(products, couponResult.discount);
      const orders = await Order.insertMany(pricedItems.map(({ product, discount, amount }) => ({
        customer_id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone || body.phone,
        amount,
        original_amount: money(product.sale_price),
        discount_amount: discount,
        coupon_code: couponResult.coupon?.code || null,
        product_id: product._id,
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
      const { customer, error } = await getActiveCustomer(request);
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

      const orders = await Order.find({ _id: { $in: ids }, customer_id: customer._id }).lean();
      if (orders.length !== ids.length) return json(0, 'Order not found');
      if (orders.some(order => order.razorpay_order_id !== razorpay_order_id)) {
        return json(0, 'Payment order mismatch');
      }
      if (!verifyPaymentSignature(razorpay_response)) {
        return json(0, 'Payment verification failed');
      }

      const unpaidOrders = orders.filter(order => order.payment_status !== 1);
      if (!unpaidOrders.length) {
        return json(1, 'Payment already verified', { redirect: ids.length > 1 ? '/account' : undefined });
      }

      const tokenById = new Map(unpaidOrders.map(order => [order._id.toString(), uuidv4()]));
      const tokenExpiresAt = new Date('2099-12-31');
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
        { _id: customer._id },
        {
          $inc: { total_spent: paidTotal, total_orders: unpaidOrders.length },
          $set: { last_login: new Date() },
        }
      );

      const couponCode = unpaidOrders.find(order => order.coupon_code)?.coupon_code;
      if (couponCode) {
        await markCouponUsed({
          couponCode,
          email: customer.email,
          orderId: unpaidOrders[0]._id,
          discount: money(unpaidOrders.reduce((sum, order) => sum + (order.discount_amount || 0), 0)),
          revenue: paidTotal,
        });
      }


      await Promise.allSettled(
        unpaidOrders.map(order => {
          console.log('ORDER DATA:', JSON.stringify(order, null, 2));

          return sendOrderConfirmation({
            name: order.name,
            email: order.email,
            download_token: tokenById.get(order._id.toString()),
            amount: order.amount,
            product_name: order.product_name,
          });
        })
      );
      // await Promise.allSettled(unpaidOrders.map(order => sendOrderConfirmation({
      //   name: order.name,
      //   email: order.email,
      //   download_token: tokenById.get(order._id.toString()),
      //   amount: order.amount,
      //   product_name: order.product_name,
      // })));

      const firstToken = tokenById.get(unpaidOrders[0]._id.toString());
      return NextResponse.json({
        flag: 1,
        message: 'Payment verified!',
        download_token: unpaidOrders.length === 1 ? firstToken : undefined,
        redirect: unpaidOrders.length > 1 ? '/account' : undefined,
      });
    }

    if (action === 'my-orders') {
      const { customer, error } = await getActiveCustomer(request);
      if (error) return error;

      const orders = await Order.find({ customer_id: customer._id, payment_status: 1 })
        .populate('product_id', 'name file_url images')
        .sort({ createdAt: -1 })
        .lean();

      return NextResponse.json({ flag: 1, orders: orders || [] });
    }

    if (action === 'get-download') {
      const { token } = body;
      const order = await Order.findOne({ download_token: token, payment_status: 1 })
        .populate('product_id')
        .lean();
      if (!order) return json(0, 'Invalid download link');
      if (order.token_expires_at && new Date(order.token_expires_at) < new Date()) {
        return json(0, 'Download link expired');
      }

      const product = order.product_id;
      if (!product) return json(0, 'Product not found');

      return NextResponse.json({
        flag: 1,
        files: [{ id: product._id, name: product.name, url: product.file_url }],
      });
    }

    return json(0, 'Invalid action');
  } catch (e) {
    console.error('Order error:', e.message);
    return json(0, 'Server error');
  }
}
