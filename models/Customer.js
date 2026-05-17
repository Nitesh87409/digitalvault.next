import mongoose from 'mongoose';

const CustomerSchema = new mongoose.Schema({
  name:            { type: String, required: true, trim: true },
  email:           { type: String, required: true, unique: true, lowercase: true },
  phone:           { type: String, required: true , unique: true},
  password:        { type: String, required: true },
  is_verified:     { type: Boolean, default: true },
  is_blocked:      { type: Boolean, default: false },
  tag:             { type: String, enum: ['normal', 'vip', 'new', 'high_spender', 'risky'], default: 'new' },
  total_spent:     { type: Number, default: 0 },
  total_orders:    { type: Number, default: 0 },
  last_login:      { type: Date, default: null },
  coupons_used:    [{ code: String, used_at: Date }],
  download_count:  { type: Number, default: 0 },
}, { timestamps: true });

CustomerSchema.index({ is_blocked: 1 });

export default mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);
