import mongoose from 'mongoose';

const AppPolicySchema = new mongoose.Schema({
  appName: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  contactEmail: { type: String, trim: true, default: '' },
  privacyPolicy: { type: String, default: '' },
  termsConditions: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.models.AppPolicy || mongoose.model('AppPolicy', AppPolicySchema);
