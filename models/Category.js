import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  slug:      { type: String, required: true, unique: true },
  parent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
}, { timestamps: true });

export default mongoose.models.Category || mongoose.model('Category', CategorySchema);
