import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/auth';
import { normalizeBundlePrices } from '@/lib/security';
import Setting from '@/models/Setting';
import Product from '@/models/Product';
import Customer from '@/models/Customer';
import BundleSubscription from '@/models/BundleSubscription';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

let migrationDone = false;
async function runBundleMigration() {
  if (migrationDone) return;
  try {
    const subscriptions = await BundleSubscription.find({
      $or: [
        { customer_email: { $exists: false } },
        { product_name: { $exists: false } },
        { amount: { $gt: 9000 } }
      ]
    });
    if (subscriptions.length > 0) {
      console.log(`[Migration] Running bundle migration for ${subscriptions.length} records...`);
      for (const sub of subscriptions) {
        let changed = false;
        let amt = sub.amount;
        if (amt > 9000) {
          amt = Math.round(amt / 100);
          changed = true;
        }
        let email = sub.customer_email;
        if (!email) {
          const customer = await Customer.findById(sub.customer_id).select('email').lean();
          email = customer?.email || 'unknown@customer.com';
          changed = true;
        }
        let prodName = sub.product_name;
        if (!prodName) {
          prodName = 'Complete Bundle';
          changed = true;
        }
        if (changed) {
          await BundleSubscription.updateOne(
            { _id: sub._id },
            {
              $set: {
                amount: amt,
                customer_email: email,
                product_name: prodName
              }
            }
          );
        }
      }
      console.log('[Migration] Bundle migration completed successfully.');
    }
    migrationDone = true;
  } catch (error) {
    console.error('[Migration] Bundle migration error:', error);
  }
}

const DEFAULT_SETTINGS = {
  bundle_enabled: true,
  bundle_title: 'Complete Bundle',
  bundle_description: 'All products + future updates included',
  bundle_price: 207,
  bundle_original_price: 8497,
  bundle_timer_enabled: true,
  bundle_timer_days: 0,
  bundle_timer_hours: 24,
  bundle_timer_minutes: 0,
  bundle_timer_action: 'hide_timer',
  bundle_features: ['Instant Download', 'Lifetime Access', 'Free Future Updates', '7-Day Guarantee'],
  bundle_badge_text: 'Limited Time Deal',
  bundle_badge_color: '#f5c842',
  bundle_cta_text: 'Unlock Bundle →',
  bundle_show_discount: true,
  bundle_banner_image: '',
  bundle_sales_limit: 0,
  bundle_validity_days: 0,
  bundle_allow_repurchase: false,
  bundle_send_email: true,
};

function json(body, status = 200) {
  return NextResponse.json(body, { status });
}

function toBundleSettings(settings = {}) {
  const bundlePrices = normalizeBundlePrices(settings, DEFAULT_SETTINGS);

  return {
    bundle_enabled: settings.bundle_enabled ?? DEFAULT_SETTINGS.bundle_enabled,
    bundle_title: settings.bundle_title || DEFAULT_SETTINGS.bundle_title,
    bundle_description: settings.bundle_description || DEFAULT_SETTINGS.bundle_description,
    bundle_price: bundlePrices.bundle_price,
    bundle_original_price: bundlePrices.bundle_original_price,
    bundle_timer_enabled: settings.bundle_timer_enabled ?? DEFAULT_SETTINGS.bundle_timer_enabled,
    bundle_timer_days: settings.bundle_timer_days ?? DEFAULT_SETTINGS.bundle_timer_days,
    bundle_timer_hours: settings.bundle_timer_hours ?? DEFAULT_SETTINGS.bundle_timer_hours,
    bundle_timer_minutes: settings.bundle_timer_minutes ?? DEFAULT_SETTINGS.bundle_timer_minutes,
    bundle_timer_action: settings.bundle_timer_action || DEFAULT_SETTINGS.bundle_timer_action,
    bundle_features: Array.isArray(settings.bundle_features) && settings.bundle_features.length > 0
      ? settings.bundle_features : DEFAULT_SETTINGS.bundle_features,
    bundle_badge_text: settings.bundle_badge_text || DEFAULT_SETTINGS.bundle_badge_text,
    bundle_badge_color: settings.bundle_badge_color || DEFAULT_SETTINGS.bundle_badge_color,
    bundle_cta_text: settings.bundle_cta_text || DEFAULT_SETTINGS.bundle_cta_text,
    bundle_show_discount: settings.bundle_show_discount ?? DEFAULT_SETTINGS.bundle_show_discount,
    bundle_banner_image: settings.bundle_banner_image || DEFAULT_SETTINGS.bundle_banner_image,
    bundle_sales_limit: settings.bundle_sales_limit ?? DEFAULT_SETTINGS.bundle_sales_limit,
    bundle_validity_days: settings.bundle_validity_days ?? DEFAULT_SETTINGS.bundle_validity_days,
    bundle_allow_repurchase: settings.bundle_allow_repurchase ?? DEFAULT_SETTINGS.bundle_allow_repurchase,
    bundle_send_email: settings.bundle_send_email ?? DEFAULT_SETTINGS.bundle_send_email,
    updatedAt: settings.updatedAt,
  };
}

async function getSettingsDoc() {
  let settings = await Setting.findOne();
  if (!settings) settings = await Setting.create(DEFAULT_SETTINGS);
  return settings;
}

async function getSubscriptions() {
  const subscriptions = await BundleSubscription.find()
    .sort({ purchase_date: -1, createdAt: -1 })
    .limit(300)
    .lean();

  const customerObjectIds = subscriptions
    .map(sub => sub.customer_id)
    .filter(id => mongoose.Types.ObjectId.isValid(id))
    .map(id => new mongoose.Types.ObjectId(id));

  const customers = customerObjectIds.length
    ? await Customer.find({ _id: { $in: customerObjectIds } })
      .select('name email phone is_blocked total_spent total_orders')
      .lean()
    : [];
  const customerById = new Map(customers.map(customer => [customer._id.toString(), customer]));

  return subscriptions.map(sub => {
    const amountInRupees = sub.amount > 9000 ? Math.round(sub.amount / 100) : sub.amount;
    const customer = customerById.get(sub.customer_id) || null;
    return {
      ...sub,
      amount: amountInRupees,
      customer_email: sub.customer_email || customer?.email || 'unknown@customer.com',
      product_name: sub.product_name || 'Complete Bundle',
      customer,
    };
  });
}

export async function GET(request) {
  try {
    const admin = verifyAdmin(request);
    if (!admin) return json({ flag: 0, message: 'Unauthorized' }, 401);

    await connectDB();
    await runBundleMigration();

    const [settingsDoc, products, subscriptions, revenueAgg] = await Promise.all([
      getSettingsDoc(),
      Product.find()
        .select('name images sale_price original_price status included_in_bundle category')
        .sort({ createdAt: -1 })
        .lean(),
      getSubscriptions(),
      BundleSubscription.aggregate([
        { $match: { status: 'active' } },
        {
          $group: {
            _id: null,
            activeCount: { $sum: 1 },
            revenue: {
              $sum: {
                $cond: [
                  { $gt: ['$amount', 9000] },
                  { $divide: ['$amount', 100] },
                  '$amount'
                ]
              }
            }
          }
        }
      ]),
    ]);

    const stats = revenueAgg[0] || { activeCount: 0, revenue: 0 };
    const bundleProducts = products.filter(product => product.included_in_bundle);
    const totalSalesCount = await BundleSubscription.countDocuments();

    return json({
      flag: 1,
      settings: toBundleSettings(settingsDoc.toObject()),
      stats: {
        activeSubscriptions: stats.activeCount || 0,
        revenue: Math.round(stats.revenue || 0),
        totalProducts: products.length,
        bundleProducts: bundleProducts.length,
        totalSalesCount,
      },
      products,
      subscriptions,
    });
  } catch (error) {
    console.error('[Admin Bundle] GET error:', error);
    return json({ flag: 0, message: 'Server error' }, 500);
  }
}

export async function POST(request) {
  try {
    const admin = verifyAdmin(request);
    if (!admin) return json({ flag: 0, message: 'Unauthorized' }, 401);

    await connectDB();
    await runBundleMigration();
    const body = await request.json();
    const { action } = body;

    if (action === 'save-settings') {
      const settings = await getSettingsDoc();
      const enteredBundlePrice = Number(body.bundle_price);
      const enteredOriginalPrice = Number(body.bundle_original_price);

      if (!Number.isFinite(enteredBundlePrice) || enteredBundlePrice < 1) {
        return json({ flag: 0, message: 'Bundle price must be at least ₹1' }, 400);
      }
      if (!Number.isFinite(enteredOriginalPrice) || enteredOriginalPrice < 1) {
        return json({ flag: 0, message: 'Original price must be at least Rs 1' }, 400);
      }

      if (enteredBundlePrice > enteredOriginalPrice) {
        return json({ flag: 0, message: 'Sale price must be less than or equal to original price' }, 400);
      }

      settings.bundle_enabled = body.bundle_enabled !== false;
      settings.bundle_title = String(body.bundle_title || DEFAULT_SETTINGS.bundle_title).trim();
      settings.bundle_description = String(body.bundle_description || DEFAULT_SETTINGS.bundle_description).trim();
      settings.bundle_price = Math.round(enteredBundlePrice);
      settings.bundle_original_price = Math.round(enteredOriginalPrice);
      settings.bundle_timer_enabled = body.bundle_timer_enabled !== false;
      settings.bundle_timer_days = Math.max(0, Math.floor(Number(body.bundle_timer_days) || 0));
      settings.bundle_timer_hours = Math.max(0, Math.floor(Number(body.bundle_timer_hours) || 0));
      settings.bundle_timer_minutes = Math.max(0, Math.floor(Number(body.bundle_timer_minutes) || 0));
      settings.bundle_timer_action = String(body.bundle_timer_action || DEFAULT_SETTINGS.bundle_timer_action).trim();

      // New fields
      if (Array.isArray(body.bundle_features)) {
        settings.bundle_features = body.bundle_features.map(f => String(f).trim()).filter(Boolean);
      }
      settings.bundle_badge_text = String(body.bundle_badge_text || DEFAULT_SETTINGS.bundle_badge_text).trim();
      settings.bundle_badge_color = String(body.bundle_badge_color || DEFAULT_SETTINGS.bundle_badge_color).trim();
      settings.bundle_cta_text = String(body.bundle_cta_text || DEFAULT_SETTINGS.bundle_cta_text).trim();
      settings.bundle_show_discount = body.bundle_show_discount !== false;
      settings.bundle_banner_image = String(body.bundle_banner_image || '').trim();
      settings.bundle_sales_limit = Math.max(0, Math.floor(Number(body.bundle_sales_limit) || 0));
      settings.bundle_validity_days = Math.max(0, Math.floor(Number(body.bundle_validity_days) || 0));
      settings.bundle_allow_repurchase = !!body.bundle_allow_repurchase;
      settings.bundle_send_email = body.bundle_send_email !== false;

      await settings.save();

      return json({ flag: 1, message: 'Bundle settings saved', settings: toBundleSettings(settings.toObject()) });
    }

    if (action === 'toggle-product') {
      const { product_id, included_in_bundle } = body;
      if (!mongoose.Types.ObjectId.isValid(product_id)) {
        return json({ flag: 0, message: 'Invalid product' }, 400);
      }

      const product = await Product.findByIdAndUpdate(
        product_id,
        { included_in_bundle: !!included_in_bundle },
        { new: true }
      ).select('name included_in_bundle');

      if (!product) return json({ flag: 0, message: 'Product not found' }, 404);
      return json({ flag: 1, message: 'Product updated', product });
    }

    if (action === 'set-subscription-status') {
      const { subscription_id, status } = body;
      if (!mongoose.Types.ObjectId.isValid(subscription_id) || !['active', 'inactive'].includes(status)) {
        return json({ flag: 0, message: 'Invalid subscription update' }, 400);
      }

      const subscription = await BundleSubscription.findByIdAndUpdate(
        subscription_id,
        { status },
        { new: true }
      ).lean();

      if (!subscription) return json({ flag: 0, message: 'Subscription not found' }, 404);
      return json({ flag: 1, message: 'Subscription status updated', subscription });
    }

    if (action === 'export-csv') {
      const subs = await getSubscriptions();
      const headers = ['Name', 'Email', 'Phone', 'Product', 'Amount (₹)', 'Coupon', 'Payment ID', 'Purchase Date', 'Status'];
      const rows = subs.map(sub => [
        (sub.customer?.name || 'Unknown').replace(/,/g, ' '),
        (sub.customer_email || sub.customer?.email || '').replace(/,/g, ' '),
        (sub.customer?.phone || '-').replace(/,/g, ' '),
        (sub.product_name || 'Complete Bundle').replace(/,/g, ' '),
        Math.round(sub.amount || 0),
        (sub.coupon_code || '-').replace(/,/g, ' '),
        (sub.payment_id || '-').replace(/,/g, ' '),
        new Date(sub.purchase_date || sub.createdAt).toLocaleDateString('en-IN'),
        sub.status || 'unknown',
      ]);
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      return json({ flag: 1, csv });
    }

    return json({ flag: 0, message: 'Invalid action' }, 400);
  } catch (error) {
    console.error('[Admin Bundle] POST error:', error);
    return json({ flag: 0, message: 'Server error' }, 500);
  }
}
