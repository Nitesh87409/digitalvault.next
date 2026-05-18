import mongoose from 'mongoose';

const CustomerSchema = new mongoose.Schema({
  name:            { type: String, required: true, trim: true },
  email: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone:           { type: String, sparse: true, unique: true },
  password:        { type: String, default: '' },
  google_id:       { type: String, default: null },
  truecaller_id:   { type: String, default: null },
  apple_id:        { type: String, default: null },
  profile_image:   { type: String, default: null },
  auth_provider:   { type: String, enum: ['local', 'google', 'truecaller', 'apple'], default: 'local' },
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
