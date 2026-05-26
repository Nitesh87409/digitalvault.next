import mongoose from 'mongoose';

const BundleSubscriptionSchema = new mongoose.Schema({
  customer_id: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'inactive',
  },
  payment_id: {
    type: String,
    required: true,
  },
  razorpay_order_id: {
    type: String,
    required: true,
    unique: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  customer_email: {
    type: String,
  },
  product_name: {
    type: String,
    default: 'Complete Bundle',
  },
  coupon_code: {
    type: String,
    default: null,
  },
  purchase_date: {
    type: Date,
    default: Date.now,
  },
  expiry_date: {
    type: Date,
    default: null,
  },
  // Admin can override the default cutoff (purchase_date) for specific customers
  // null = use purchase_date as cutoff when bundle_cutoff_enabled is ON
  access_cutoff_date: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

BundleSubscriptionSchema.index({ customer_id: 1 });

export default mongoose.models.BundleSubscription || mongoose.model('BundleSubscription', BundleSubscriptionSchema);
