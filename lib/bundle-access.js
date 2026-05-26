import BundleSubscription from '@/models/BundleSubscription';
import Product from '@/models/Product';

export async function getActiveBundleSubscription(customer_id) {
  if (!customer_id) return null;

  const now = new Date();
  return BundleSubscription.findOne({
    customer_id: String(customer_id),
    status: 'active',
    $or: [
      { expiry_date: null },
      { expiry_date: { $exists: false } },
      { expiry_date: { $gt: now } },
    ],
  }).lean();
}

export async function hasActiveBundleAccess(customer_id) {
  const subscription = await getActiveBundleSubscription(customer_id);
  return !!subscription;
}

export async function getBundleAccessStatus(customer_id) {
  if (!customer_id) return 'none';
  const hasActive = await hasActiveBundleAccess(customer_id);
  if (hasActive) return 'active';
  
  const hasInactive = await BundleSubscription.findOne({
    customer_id: String(customer_id),
    status: 'inactive',
  }).lean();
  
  if (hasInactive) return 'inactive';
  return 'none';
}

export async function getBundleProducts(cutoffDate = null) {
  const filter = { status: true, included_in_bundle: true };
  if (cutoffDate) {
    filter.createdAt = { $lte: cutoffDate };
  }
  return Product.find(filter).sort({ createdAt: -1 }).lean();
}

/**
 * Returns the effective cutoff date for a subscription.
 * Admin override (access_cutoff_date) takes priority over purchase_date.
 */
export function getEffectiveCutoffDate(subscription) {
  if (!subscription) return null;
  // Admin manual override takes priority
  if (subscription.access_cutoff_date) return new Date(subscription.access_cutoff_date);
  // Fallback to purchase_date
  return new Date(subscription.purchase_date || subscription.createdAt);
}
