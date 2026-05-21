import BundleSubscription from '@/models/BundleSubscription';
import Product from '@/models/Product';

export async function getActiveBundleSubscription(customer_id) {
  if (!customer_id) return null;

  return BundleSubscription.findOne({
    customer_id: customer_id.toString(),
    status: 'active',
  }).lean();
}

export async function hasActiveBundleAccess(customer_id) {
  const subscription = await getActiveBundleSubscription(customer_id);
  return !!subscription;
}

export async function getBundleProducts() {
  return Product.find({
    included_in_bundle: true,
    status: true,
  }).sort({ createdAt: -1 }).lean();
}
