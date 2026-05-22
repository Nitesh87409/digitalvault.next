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

  // Dynamic features/highlights list
  bundle_features: { type: [String], default: ['Instant Download', 'Lifetime Access', 'Free Future Updates', '7-Day Guarantee'] },

  // Custom badge text & color
  bundle_badge_text: { type: String, default: 'Limited Time Deal' },
  bundle_badge_color: { type: String, default: '#f5c842' },

  // CTA button text
  bundle_cta_text: { type: String, default: 'Unlock Bundle →' },

  // Show discount % badge
  bundle_show_discount: { type: Boolean, default: true },

  // Banner image URL
  bundle_banner_image: { type: String, default: '' },

  // Sales limit (0 = unlimited)
  bundle_sales_limit: { type: Number, default: 0 },

  // Validity in days (0 = lifetime)
  bundle_validity_days: { type: Number, default: 0 },

  // Allow re-purchase after expiry/inactive
  bundle_allow_repurchase: { type: Boolean, default: false },

  // Send purchase confirmation email
  bundle_send_email: { type: Boolean, default: true },

  // Recycle Bin auto-delete (days, 0 = never auto-delete)
  bin_auto_delete_days: { type: Number, default: 30 },
}, { timestamps: true });

if (mongoose.models.Setting) {
  delete mongoose.models.Setting;
}

export default mongoose.models.Setting || mongoose.model('Setting', SettingSchema);
