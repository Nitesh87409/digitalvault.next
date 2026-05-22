import mongoose from 'mongoose';

const SettingSchema = new mongoose.Schema({
  password_login_enabled: { type: Boolean, default: true },
  email_otp_enabled: { type: Boolean, default: true },
  mobile_otp_enabled: { type: Boolean, default: false },
  google_login_enabled: { type: Boolean, default: false },
  apple_login_enabled: { type: Boolean, default: false },
  otp_expiry_minutes: { type: Number, default: 5 },
  otp_max_attempts: { type: Number, default: 5 },
  otp_length: { type: Number, default: 6 },
  otp_resend_cooldown_seconds: { type: Number, default: 60 },
  support_email: { type: String, default: 'support@digitalvault.in' },
  support_phone: { type: String, default: '+91 98765 43210' },
  business_hours: { type: String, default: 'Mon–Sat, 10am–6pm IST' },
  app_name: { type: String, default: '' },
  app_logo: { type: String, default: '' },
  bundle_enabled: { type: Boolean, default: true },
  bundle_title: { type: String, default: 'Complete Bundle' },
  bundle_description: { type: String, default: 'All products + future updates included' },
  bundle_price: { type: Number, default: 207 },
  bundle_original_price: { type: Number, default: 8497 },
  bundle_timer_enabled: { type: Boolean, default: true },
  bundle_timer_days: { type: Number, default: 0 },
  bundle_timer_hours: { type: Number, default: 24 },
  bundle_timer_minutes: { type: Number, default: 0 },
  bundle_timer_action: { type: String, default: 'hide_timer' },
}, { timestamps: true });

if (mongoose.models.Setting) {
  delete mongoose.models.Setting;
}

export default mongoose.models.Setting || mongoose.model('Setting', SettingSchema);
