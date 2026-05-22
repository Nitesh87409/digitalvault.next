import mongoose from 'mongoose';

const OtpSchema = new mongoose.Schema({
  identifier: { type: String, required: true }, // email or mobile
  type: { type: String, enum: ['email', 'mobile', 'reset-email', 'reset-mobile'], required: true },
  otp_hash: { type: String, required: true },
  expires_at: { type: Date, required: true },
  attempts: { type: Number, default: 0 },
  resend_after: { type: Date, required: true },
}, { timestamps: true });

// TTL index to automatically delete expired OTPs from the database
OtpSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

// Compound index for instant verification check lookups
OtpSchema.index({ identifier: 1, type: 1 });

export default mongoose.models.Otp || mongoose.model('Otp', OtpSchema);

