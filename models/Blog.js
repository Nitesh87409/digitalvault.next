import mongoose from 'mongoose';

const BlogSchema = new mongoose.Schema({
  title:     { type: String, required: true, trim: true },
  slug:      { type: String, required: true, unique: true },
  excerpt:   { type: String, required: true, trim: true },
  content:   { type: String, required: true },
  image:     { type: String, default: '' },
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  featured_product_image_index: { type: Number, default: null },
  author:    { type: String, default: 'Admin' },
  status:    { type: Boolean, default: true },
  read_time: { type: Number, default: 5 },
  faqs:      {
    type: [
      {
        question: { type: String, required: true },
        answer:   { type: String, required: true }
      }
    ],
    default: []
  }
}, { timestamps: true });

BlogSchema.index({ status: 1, createdAt: -1 });

if (process.env.NODE_ENV === 'development') {
  delete mongoose.models.Blog;
}

export default mongoose.models.Blog || mongoose.model('Blog', BlogSchema);
