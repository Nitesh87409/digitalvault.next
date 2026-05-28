import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/auth';
import BinItem from '@/models/BinItem';
import Product from '@/models/Product';
import Category from '@/models/Category';
import Coupon from '@/models/Coupon';
import Review from '@/models/Review';
import Faq from '@/models/Faq';
import HomepageReview from '@/models/HomepageReview';
import Setting from '@/models/Setting';
import Blog from '@/models/Blog';

export const dynamic = 'force-dynamic';

const TYPE_LABELS = {
  product: '📦 Product',
  category: '📂 Category',
  coupon: '🎟️ Coupon',
  review: '⭐ Review',
  faq: '❓ FAQ',
  testimonial: '💬 Testimonial',
  blog: '📝 Blog',
};

const MODEL_MAP = {
  product: Product,
  category: Category,
  coupon: Coupon,
  review: Review,
  faq: Faq,
  testimonial: HomepageReview,
  blog: Blog,
};

function json(body, status = 200) {
  return NextResponse.json(body, { status });
}

// GET — list all bin items
export async function GET(request) {
  try {
    const admin = verifyAdmin(request);
    if (!admin) return json({ flag: 0, message: 'Unauthorized' }, 401);

    await connectDB();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    const filter = {};
    if (type && type !== 'all') filter.type = type;

    const items = await BinItem.find(filter).sort({ deleted_at: -1 }).lean();

    // Get settings for auto-delete info
    const settings = await Setting.findOne().select('bin_auto_delete_days').lean();

    return json({
      flag: 1,
      items: items.map(item => ({
        _id: item._id,
        type: item.type,
        type_label: TYPE_LABELS[item.type] || item.type,
        name: item.data?.name || item.data?.title || item.data?.code || item.data?.q || item.data?.customer_name || 'Unnamed',
        data: item.data,
        deleted_at: item.deleted_at,
        auto_delete_at: item.auto_delete_at,
      })),
      bin_auto_delete_days: settings?.bin_auto_delete_days ?? 30,
    });
  } catch (e) {
    console.error('[Bin] GET error:', e.message);
    return json({ flag: 0, message: 'Server error' }, 500);
  }
}

// POST — soft delete (move to bin) or restore or update settings
export async function POST(request) {
  try {
    const admin = verifyAdmin(request);
    if (!admin) return json({ flag: 0, message: 'Unauthorized' }, 401);

    await connectDB();
    const body = await request.json();
    const { action } = body;

    // Move item to bin
    if (action === 'soft-delete') {
      const { type, id } = body;
      if (!type || !id || !MODEL_MAP[type]) return json({ flag: 0, message: 'Invalid type or id' }, 400);

      // Category specific check: cannot delete if it has sub-categories
      if (type === 'category') {
        const hasSubs = await Category.exists({ parent_id: id });
        if (hasSubs) {
          return json({ flag: 0, message: 'Cannot delete category because it contains active sub-categories. Please delete or reassign its sub-categories first.' }, 400);
        }
      }

      const Model = MODEL_MAP[type];
      const item = await Model.findById(id).lean();
      if (!item) return json({ flag: 0, message: 'Item not found' }, 404);

      // Get auto-delete days
      const settings = await Setting.findOne().select('bin_auto_delete_days').lean();
      const days = Number(settings?.bin_auto_delete_days) || 30;
      const autoDeleteAt = days > 0 ? new Date(Date.now() + days * 24 * 60 * 60 * 1000) : null;

      await BinItem.create({
        type,
        original_id: id,
        data: item,
        deleted_at: new Date(),
        auto_delete_at: autoDeleteAt,
      });

      await Model.findByIdAndDelete(id);

      return json({ flag: 1, message: `Moved to bin` });
    }

    // Restore from bin
    if (action === 'restore') {
      const { bin_id } = body;
      if (!bin_id) return json({ flag: 0, message: 'Bin item ID required' }, 400);

      const binItem = await BinItem.findById(bin_id).lean();
      if (!binItem) return json({ flag: 0, message: 'Bin item not found' }, 404);

      const Model = MODEL_MAP[binItem.type];
      if (!Model) return json({ flag: 0, message: 'Unknown item type' }, 400);

      // Remove _id and mongoose internals from data to avoid conflicts
      const restoreData = { ...binItem.data };
      delete restoreData._id;
      delete restoreData.__v;
      delete restoreData.createdAt;
      delete restoreData.updatedAt;

      // Handle category parent validation
      if (binItem.type === 'category' && restoreData.parent_id) {
        const parentExists = await Category.findById(restoreData.parent_id).select('_id').lean();
        if (!parentExists) {
          restoreData.parent_id = null;
          // Regenerate clean top-level slug from name
          let nameOnly = restoreData.name || '';
          restoreData.slug = nameOnly.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        }
      }

      try {
        await Model.create(restoreData);
      } catch (err) {
        // If duplicate key (e.g. category slug), add suffix
        if (err.code === 11000) {
          if (restoreData.name) restoreData.name = restoreData.name + ' (restored)';
          if (restoreData.slug) restoreData.slug = restoreData.slug + '-restored';
          if (restoreData.code) restoreData.code = restoreData.code + '_RESTORED';
          await Model.create(restoreData);
        } else {
          throw err;
        }
      }

      await BinItem.findByIdAndDelete(bin_id);
      return json({ flag: 1, message: 'Item restored successfully' });
    }

    // Update auto-delete days
    if (action === 'update-settings') {
      const days = Math.max(0, Math.floor(Number(body.bin_auto_delete_days) || 0));
      await Setting.updateOne({}, { $set: { bin_auto_delete_days: days } }, { upsert: true });

      // Update all existing bin items' auto_delete_at
      if (days > 0) {
        await BinItem.updateMany({}, [
          {
            $set: {
              auto_delete_at: {
                $add: ["$deleted_at", days * 24 * 60 * 60 * 1000]
              }
            }
          }
        ]);
      } else {
        await BinItem.updateMany({}, { $unset: { auto_delete_at: 1 } });
      }

      return json({ flag: 1, message: 'Bin settings updated' });
    }

    return json({ flag: 0, message: 'Invalid action' }, 400);
  } catch (e) {
    console.error('[Bin] POST error:', e.message);
    return json({ flag: 0, message: 'Server error' }, 500);
  }
}

// DELETE — permanent delete from bin
export async function DELETE(request) {
  try {
    const admin = verifyAdmin(request);
    if (!admin) return json({ flag: 0, message: 'Unauthorized' }, 401);

    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const all = searchParams.get('all');

    if (all === 'true') {
      const count = await BinItem.countDocuments();
      await BinItem.deleteMany({});
      return json({ flag: 1, message: `${count} items permanently deleted` });
    }

    if (!id) return json({ flag: 0, message: 'ID required' }, 400);
    const deleted = await BinItem.findByIdAndDelete(id);
    if (!deleted) return json({ flag: 0, message: 'Item not found' }, 404);

    return json({ flag: 1, message: 'Permanently deleted' });
  } catch (e) {
    console.error('[Bin] DELETE error:', e.message);
    return json({ flag: 0, message: 'Server error' }, 500);
  }
}
