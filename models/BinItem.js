import mongoose from 'mongoose';

const BinItemSchema = new mongoose.Schema({
  type: { type: String, required: true, enum: ['product', 'category', 'coupon', 'review', 'faq', 'testimonial', 'blog'] },
  original_id: { type: String, required: true },
  data: { type: mongoose.Schema.Types.Mixed, required: true },
  deleted_at: { type: Date, default: Date.now },
  auto_delete_at: { type: Date },
}, { timestamps: true });

BinItemSchema.index({ type: 1, deleted_at: -1 });
BinItemSchema.index({ auto_delete_at: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.BinItem || mongoose.model('BinItem', BinItemSchema);
