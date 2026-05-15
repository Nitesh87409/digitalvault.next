import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Customer from '@/models/Customer';
import Order from '@/models/Order';
import { verifyAdmin } from '@/lib/auth';

export async function GET(request) {
  try {
    await connectDB();
    const admin = verifyAdmin(request);
    if (!admin) return NextResponse.json({ flag: 0, message: 'Unauthorized' });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single customer detail
    if (id) {
      const customer = await Customer.findById(id).select('-password').lean();
      if (!customer) return NextResponse.json({ flag: 0, message: 'Customer not found' });

      const orders = await Order.find({ email: customer.email, payment_status: 1 })
        .populate('product_id', 'name sale_price images')
        .lean()
        .sort({ createdAt: -1 });

      const totalSpent = orders.reduce((s, o) => s + o.amount, 0);
      const avgOrder = orders.length > 0 ? Math.round(totalSpent / orders.length) : 0;
      const totalDownloads = orders.reduce((s, o) => s + (o.download_count || 0), 0);

      return NextResponse.json({
        flag: 1,
        customer,
        orders,
        stats: { totalSpent, totalOrders: orders.length, avgOrder, totalDownloads }
      });
    }

    // All customers list
    const customers = await Customer.find().select('-password').sort({ createdAt: -1 }).lean();
    const emails = customers.map(c => c.email);
    const orderStats = emails.length ? await Order.aggregate([
      { $match: { email: { $in: emails }, payment_status: 1 } },
      { $group: { _id: '$email', total_orders: { $sum: 1 }, total_spent: { $sum: '$amount' } } }
    ]) : [];
    const statsByEmail = new Map(orderStats.map(s => [s._id, s]));

    const enriched = customers.map((c) => {
      const stats = statsByEmail.get(c.email) || { total_orders: 0, total_spent: 0 };
      const totalSpent = stats.total_spent || 0;
      const computedTag = totalSpent >= 5000 ? 'vip' : totalSpent >= 1000 ? 'high_spender' : stats.total_orders === 0 ? 'new' : 'normal';
      return {
        ...c,
        total_orders: stats.total_orders || 0,
        total_spent: totalSpent,
        tag: c.tag === 'risky' ? 'risky' : computedTag
      };
    });

    return NextResponse.json({ flag: 1, customers: enriched });
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
    const { id, action } = body;

    if (action === 'block') {
      const customer = await Customer.findByIdAndUpdate(id, { is_blocked: true }, { new: true });
      return NextResponse.json({ flag: 1, message: 'Customer blocked', customer });
    }

    if (action === 'unblock') {
      const customer = await Customer.findByIdAndUpdate(id, { is_blocked: false }, { new: true });
      return NextResponse.json({ flag: 1, message: 'Customer unblocked', customer });
    }

    if (action === 'tag') {
      const { tag } = body;
      const customer = await Customer.findByIdAndUpdate(id, { tag }, { new: true });
      return NextResponse.json({ flag: 1, message: 'Tag updated', customer });
    }

    return NextResponse.json({ flag: 0, message: 'Invalid action' });
  } catch (e) {
    return NextResponse.json({ flag: 0, message: 'Server error' });
  }
}
