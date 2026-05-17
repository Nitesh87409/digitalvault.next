import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' }, // Can be null if admin creates it manually without a user
  customer_name: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  review_text: { type: String, trim: true },
  verified_purchase: { type: Boolean, default: false },
  is_featured: { type: Boolean, default: false },
  is_approved: { type: Boolean, default: true },
  is_admin_review: { type: Boolean, default: false },
}, { timestamps: true });

ReviewSchema.index({ product_id: 1, is_approved: 1, createdAt: -1 });

// Ensure a customer can only review a product once unless it's an admin review
ReviewSchema.index({ product_id: 1, customer_id: 1 }, { unique: true, partialFilterExpression: { customer_id: { $exists: true, $type: 'objectId' } } });

export default mongoose.models.Review || mongoose.model('Review', ReviewSchema);
