import mongoose from 'mongoose';

const AppPolicySchema = new mongoose.Schema({
  appName: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  contactEmail: { type: String, trim: true, default: '' },
  privacyPolicy: { type: String, default: '' },
  termsConditions: { type: String, default: '' },
  playStoreUrl: { type: String, default: '', trim: true },
  appIcon: { type: String, default: '', trim: true },
  shortDescription: { type: String, default: '', trim: true },
  screenshots: { type: [String], default: [] },
  rating: { type: String, default: '', trim: true },
  installs: { type: String, default: '', trim: true },
  developerName: { type: String, default: '', trim: true },
}, { timestamps: true });

if (process.env.NODE_ENV === 'development') {
  delete mongoose.models.AppPolicy;
}

export default mongoose.models.AppPolicy || mongoose.model('AppPolicy', AppPolicySchema);
