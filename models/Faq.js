import mongoose from 'mongoose';

const FaqSchema = new mongoose.Schema({
  q: { type: String, required: true },
  a: { type: String, required: true },
  order: { type: Number, default: 0 },
  is_active: { type: Boolean, default: true },
}, { timestamps: true });

FaqSchema.index({ is_active: 1, order: 1 });

export default mongoose.models.Faq || mongoose.model('Faq', FaqSchema);
