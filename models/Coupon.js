import mongoose from 'mongoose';

const CouponSchema = new mongoose.Schema({
  code:           { type: String, required: true, unique: true, uppercase: true, trim: true },
  discount_type:  { type: String, enum: ['percentage', 'flat'], required: true },
  discount_value: { type: Number, required: true },
  min_order:      { type: Number, default: 0 },
  max_uses:       { type: Number, default: null }, // null = unlimited
  per_user_limit: { type: Number, default: 1 },
  used_count:     { type: Number, default: 0 },
  total_revenue:  { type: Number, default: 0 },
  start_date:     { type: Date, default: Date.now },
  end_date:       { type: Date, default: null },
  product_ids:    { type: [mongoose.Schema.Types.ObjectId], ref: 'Product', default: [] }, // empty = all products
  user_type:      { type: String, enum: ['all', 'new', 'specific'], default: 'all' },
  specific_emails:{ type: [String], default: [] },
  status:         { type: Boolean, default: true },
  show_on_banner: { type: Boolean, default: false },
  banner_text:    { type: String, default: '' },
  used_by:        [{ // Track who used it
    user_email: String,
    used_at: { type: Date, default: Date.now },
    order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    discount_amount: Number,
  }],
}, { timestamps: true });

CouponSchema.index({ code: 1, status: 1 });

export default mongoose.models.Coupon || mongoose.model('Coupon', CouponSchema);
