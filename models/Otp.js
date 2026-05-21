import mongoose from 'mongoose';

const OtpSchema = new mongoose.Schema({
  identifier: { type: String, required: true }, // email or mobile
  type: { type: String, enum: ['email', 'mobile', 'reset-email', 'reset-mobile'], required: true },
  otp_hash: { type: String, required: true },
  expires_at: { type: Date, required: true },
  attempts: { type: Number, default: 0 },
  resend_after: { type: Date, required: true },
}, { timestamps: true });

export default mongoose.models.Otp || mongoose.model('Otp', OtpSchema);
