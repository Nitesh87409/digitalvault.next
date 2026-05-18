import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  name:                { type: String, required: true },
  email:               { type: String, required: true },
  phone:               { type: String, required: false,default: ''},
  customer_id:         { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  amount:              { type: Number, required: true },
  original_amount:     { type: Number, default: 0 },
  discount_amount:     { type: Number, default: 0 },
  coupon_code:         { type: String, default: null },
  product_id:          { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  product_name:        { type: String},
  payment_status:      { type: Number, enum: [0, 1, 2], default: 0 },
  razorpay_order_id:   { type: String },
  razorpay_payment_id: { type: String },
  razorpay_signature:  { type: String },
  download_token:      { type: String },
  token_expires_at:    { type: Date },
  download_count:      { type: Number, default: 0 },
}, { timestamps: true });

OrderSchema.index({ email: 1, payment_status: 1, createdAt: -1 });
OrderSchema.index({ customer_id: 1, payment_status: 1, createdAt: -1 });
OrderSchema.index({ download_token: 1 }, { sparse: true });
OrderSchema.index({ razorpay_order_id: 1 });

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
