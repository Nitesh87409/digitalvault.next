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

  // Custom Pages HTML Content
  refund_policy_content: { 
    type: String, 
    default: `<h1>Refund Policy</h1><p>At DigitalVault, we want to ensure your complete satisfaction with our premium digital items. Since our products are downloadable and digitally delivered, they are generally non-refundable once download links are accessed. However, we proudly offer a <strong>7-Day Refund Guarantee</strong> under the following conditions:</p><ul><li>The digital product is defective or does not function as described on its description page.</li><li>You have contacted our technical support team and we were unable to resolve your download or setup issue within 3 business days.</li></ul><p>To submit a refund request, please email us at support with your complete purchase order details. Approved refunds will be processed back to your original payment method within 5-7 working days.</p>` 
  },
  terms_privacy_content: { 
    type: String, 
    default: `<h1>Terms & Privacy Policy</h1><h2>1. Terms of Service</h2><p>By accessing and using DigitalVault, you agree to comply with and be bound by these terms. Our digital files and products are provided "as is" without warranties of any kind. You are granted a personal or business usage license depending on the product purchased. Reselling, sub-licensing, sharing, or distributing any purchased assets publicly is strictly prohibited.</p><h2>2. Privacy Policy</h2><p>We value your privacy. We collect your name, email address, and phone number solely to manage your orders, deliver instant downloads, and provide support. We do not sell, rent, or share your data with third parties. Payments are securely processed via Razorpay, and we do not store your credit card or financial details on our servers.</p>` 
  },

  // Social Links Configuration
  social_instagram_enabled: { type: Boolean, default: false },
  social_instagram_url: { type: String, default: '' },
  social_whatsapp_enabled: { type: Boolean, default: false },
  social_whatsapp_url: { type: String, default: '' },
  social_twitter_enabled: { type: Boolean, default: false },
  social_twitter_url: { type: String, default: '' },
  social_facebook_enabled: { type: Boolean, default: false },
  social_facebook_url: { type: String, default: '' },
  social_telegram_enabled: { type: Boolean, default: false },
  social_telegram_url: { type: String, default: '' },
  
  // Floating support widget options
  floating_support_enabled: { type: Boolean, default: true },
  floating_whatsapp_enabled: { type: Boolean, default: true },
  floating_telegram_enabled: { type: Boolean, default: true },
  floating_phone_enabled: { type: Boolean, default: true },
  floating_email_enabled: { type: Boolean, default: true },

  // AI Support Bot options
  support_bot_enabled: { type: Boolean, default: false },
  openrouter_api_key: { type: String, default: '' },
  support_bot_model_mode: { type: String, default: 'auto' }, // 'auto' or 'manual'
  openrouter_model: { type: String, default: 'openrouter/free' },
  support_bot_prompt: { 
    type: String, 
    default: 'You are a helpful, friendly, and expert customer support AI assistant for DigitalVault, a premium digital products platform. Your goal is to answer user queries accurately, concisely, and politely.\n\nKey Policies:\n1. Refund Policy: Since our products are digitally delivered, they are generally non-refundable once accessed. However, we offer a 7-Day Refund Guarantee if the product is defective or doesn\'t work as described.\n2. Orders & Delivery: All products are delivered instantly via email and can also be downloaded from the "My Downloads" section.\n\nBehavioral Guidelines:\n- Answer in the user\'s language (e.g. if they ask in Hindi/Hinglish, reply in Hindi/Hinglish).\n- Be polite and clear.\n- Do not hallucinate. If a query is highly complex or requires admin actions, guide them to contact support via direct Call/Email or WhatsApp Helpline.'
  },

  custom_social_links: {
    type: [{
      name: { type: String, required: true },
      url: { type: String, required: true },
      logo: { type: String, default: '' },
      enabled: { type: Boolean, default: true }
    }],
    default: []
  }
}, { timestamps: true });

if (mongoose.models.Setting) {
  delete mongoose.models.Setting;
}

export default mongoose.models.Setting || mongoose.model('Setting', SettingSchema);
