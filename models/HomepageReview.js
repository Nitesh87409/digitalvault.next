import mongoose from 'mongoose';

const HomepageReviewSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, required: true },
  review: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5, default: 5 },
  initials: { type: String, required: true },
  color: { type: String, required: true, default: 'linear-gradient(135deg,#f5c842,#e0a800)' },
  textColor: { type: String, required: true, default: '#0a0a0f' },
  order: { type: Number, default: 0 },
  is_approved: { type: Boolean, default: true },
}, { timestamps: true });

HomepageReviewSchema.index({ is_approved: 1, order: 1 });

export default mongoose.models.HomepageReview || mongoose.model('HomepageReview', HomepageReviewSchema);
