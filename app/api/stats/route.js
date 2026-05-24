import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import Customer from '@/models/Customer';
import Product from '@/models/Product';
import BundleSubscription from '@/models/BundleSubscription';
import Setting from '@/models/Setting';
import { verifyAdmin } from '@/lib/auth';

export async function GET(request) {
  try {
    const admin = verifyAdmin(request);
    if (!admin) return NextResponse.json({ flag: 0, message: 'Unauthorized' }, { status: 401 });

    await connectDB();

    // Revenue chart: last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const [totalOrders, paidStats, totalCustomers, totalProducts, recentOrders, dailyRevenue, bundleSales, settings] = await Promise.all([
      Order.countDocuments(),
      Order.aggregate([
        { $match: { payment_status: 1 } },
        { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$amount' } } }
      ]),
      Customer.countDocuments(),
      Product.countDocuments({ status: true }),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select('name email amount payment_status product_id createdAt')
        .populate('product_id', 'name')
        .lean(),
      // Daily revenue for chart
      Order.aggregate([
        { $match: { payment_status: 1, createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$amount' },
            orders: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      // Bundle sales count
      BundleSubscription.countDocuments(),
      // Bundle settings for alert
      Setting.findOne().select('bundle_sales_limit bundle_enabled').lean(),
    ]);

    const paid = paidStats[0] || { count: 0, revenue: 0 };

    // Fill in missing days for chart
    const chartData = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const dayData = dailyRevenue.find(r => r._id === key);
      chartData.push({
        date: key,
        label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        revenue: dayData?.revenue || 0,
        orders: dayData?.orders || 0,
      });
    }

    // Bundle alert
    let bundleAlert = null;
    const salesLimit = Number(settings?.bundle_sales_limit) || 0;
    if (salesLimit > 0 && settings?.bundle_enabled !== false) {
      const pct = Math.round((bundleSales / salesLimit) * 100);
      if (pct >= 80) {
        bundleAlert = {
          current: bundleSales,
          limit: salesLimit,
          percentage: pct,
          critical: pct >= 95,
        };
      }
    }

    return NextResponse.json({
      flag: 1,
      totalRevenue: paid.revenue || 0,
      totalOrders,
      paidOrders: paid.count || 0,
      totalCustomers,
      totalProducts,
      recentOrders,
      chartData,
      bundleAlert,
    });
  } catch (e) {
    return NextResponse.json({ flag: 0, message: 'Server error' });
  }
}
