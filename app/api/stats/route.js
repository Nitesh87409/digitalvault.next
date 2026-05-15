import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import Customer from '@/models/Customer';
import Product from '@/models/Product';
import { verifyAdmin } from '@/lib/auth';

export async function GET(request) {
  try {
    const admin = verifyAdmin(request);
    if (!admin) return NextResponse.json({ flag: 0, message: 'Unauthorized' });

    await connectDB();

    const [totalOrders, paidStats, totalCustomers, totalProducts, recentOrders] = await Promise.all([
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
    ]);

    const paid = paidStats[0] || { count: 0, revenue: 0 };

    return NextResponse.json({
      flag: 1,
      totalRevenue: paid.revenue || 0,
      totalOrders,
      paidOrders: paid.count || 0,
      totalCustomers,
      totalProducts,
      recentOrders,
    });
  } catch (e) {
    return NextResponse.json({ flag: 0, message: 'Server error' });
  }
}
