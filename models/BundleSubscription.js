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
  },
  amount: {
    type: Number,
    required: true,
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

BundleSubscriptionSchema.index({ customer_id: 1 });

export default mongoose.models.BundleSubscription || mongoose.model('BundleSubscription', BundleSubscriptionSchema);
