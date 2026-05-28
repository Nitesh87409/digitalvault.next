import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  name:           { type: String, required: true, trim: true },
  description:    { type: String },
  category:       { type: String, default: 'Uncategorized' },
  images:         { type: [String], default: [] },
  original_price: { type: Number, required: true },
  sale_price:     { type: Number, required: true },
  file_url:       { type: String, required: true },
  included_in_bundle: { type: Boolean, default: false },
  status:         { type: Boolean, default: true },
  average_rating: { type: Number, default: 0 },
  total_reviews:  { type: Number, default: 0 },
  slug:           { type: String, unique: true, sparse: true },
}, { timestamps: true });

ProductSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);
