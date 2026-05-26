import crypto from 'node:crypto';
import ApiThrottle from '@/models/ApiThrottle';
import { sanitizeRichText } from '@/lib/sanitize-content';

const RATE_LIMIT_GLOBAL_KEY = '__digitalvault_rate_limit_store__';

function getStore() {
  if (!globalThis[RATE_LIMIT_GLOBAL_KEY]) {
    globalThis[RATE_LIMIT_GLOBAL_KEY] = new Map();
  }
  return globalThis[RATE_LIMIT_GLOBAL_KEY];
}

export function getClientIp(request) {
  const trustProxy =
    process.env.TRUST_PROXY_HEADERS === 'true' ||
    (process.env.TRUST_PROXY_HEADERS !== 'false' && process.env.NODE_ENV === 'production');
  const headerValue = trustProxy
    ? request.headers.get('cf-connecting-ip') ||
      request.headers.get('x-real-ip') ||
      request.headers.get('x-forwarded-for') ||
      ''
    : '';

  const forwardedIp = headerValue.split(',')[0]?.trim();
  return forwardedIp || 'unknown';
}

export function buildRateLimitKey(request, scope, identifier = '') {
  const ip = getClientIp(request);
  return [scope, ip, identifier.toLowerCase().trim()].filter(Boolean).join('|');
}

export function consumeRateLimit(key, { limit = 5, windowMs = 60_000 } = {}) {
  const store = getStore();
  const now = Date.now();

  // Periodic pruning sweep to prevent in-memory Map leaks
  if (store.size > 500 || Math.random() < 0.05) {
    for (const [k, v] of store.entries()) {
      if (v.resetAt <= now) {
        store.delete(k);
      }
    }
  }

  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (entry.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }

  entry.count += 1;
  store.set(key, entry);

  return {
    allowed: true,
    remaining: Math.max(0, limit - entry.count),
    resetAt: entry.resetAt,
  };
}

export async function consumePersistentRateLimit(key, { limit = 5, windowMs = 60_000 } = {}) {
  const now = Date.now();
  const nextResetAt = new Date(now + windowMs);

  const current = await ApiThrottle.findOne({ key }).select('count resetAt').lean();

  if (!current || !current.resetAt || new Date(current.resetAt).getTime() <= now) {
    await ApiThrottle.findOneAndUpdate(
      { key },
      { $set: { count: 1, resetAt: nextResetAt } },
      { upsert: true, setDefaultsOnInsert: true }
    );

    return {
      allowed: true,
      remaining: Math.max(0, limit - 1),
      resetAt: nextResetAt.getTime(),
    };
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(current.resetAt).getTime(),
      retryAfterSeconds: Math.max(1, Math.ceil((new Date(current.resetAt).getTime() - now) / 1000)),
    };
  }

  const updated = await ApiThrottle.findOneAndUpdate(
    { key },
    { $inc: { count: 1 } },
    { new: true }
  ).select('count resetAt').lean();

  return {
    allowed: true,
    remaining: Math.max(0, limit - (updated?.count || current.count + 1)),
    resetAt: new Date(updated?.resetAt || current.resetAt).getTime(),
  };
}

export function generateSecureOtp(length = 6) {
  const safeLength = Number.isInteger(length) && length > 0 ? length : 6;
  const lowerBound = safeLength === 1 ? 0 : 10 ** (safeLength - 1);
  const upperBound = 10 ** safeLength - 1;

  return crypto.randomInt(lowerBound, upperBound + 1).toString().padStart(safeLength, '0');
}

export function normalizeBundlePrices(settings = {}, defaults = {}) {
  const fallbackPrice = defaults.bundle_price ?? 207;
  const fallbackOriginalPrice = defaults.bundle_original_price ?? 8497;
  const bundlePrice = Number(settings.bundle_price ?? fallbackPrice);
  const originalPrice = Number(settings.bundle_original_price ?? fallbackOriginalPrice);
  const safeBundlePrice = Number.isFinite(bundlePrice) && bundlePrice > 0 ? bundlePrice : fallbackPrice;
  const safeOriginalPrice = Number.isFinite(originalPrice) && originalPrice > 0 ? originalPrice : fallbackOriginalPrice;

  return {
    bundle_price: Math.min(safeBundlePrice, safeOriginalPrice),
    bundle_original_price: Math.max(safeBundlePrice, safeOriginalPrice),
  };
}

export function getPublicSettings(settings = {}) {
  const envAppName = process.env.NEXT_PUBLIC_APP_NAME || 'DigitalVault';
  const bundlePrices = normalizeBundlePrices(settings);

  return {
    password_login_enabled: settings.password_login_enabled ?? true,
    email_otp_enabled: settings.email_otp_enabled ?? true,
    mobile_otp_enabled: settings.mobile_otp_enabled ?? false,
    google_login_enabled: settings.google_login_enabled ?? false,
    apple_login_enabled: settings.apple_login_enabled ?? false,
    otp_length: settings.otp_length ?? 6,
    support_email: settings.support_email ?? 'support@digitalvault.in',
    support_phone: settings.support_phone ?? '+91 98765 43210',
    business_hours: settings.business_hours ?? 'Mon–Sat, 10am–6pm IST',
    app_name: settings.app_name || envAppName,
    app_logo: settings.app_logo || '',
    app_name_size: settings.app_name_size ?? 20,
    bundle_enabled: settings.bundle_enabled ?? true,
    bundle_title: settings.bundle_title || 'Complete Bundle',
    bundle_description: settings.bundle_description || 'All products + future updates included',
    bundle_price: bundlePrices.bundle_price,
    bundle_original_price: bundlePrices.bundle_original_price,
    bundle_timer_enabled: settings.bundle_timer_enabled ?? true,
    bundle_timer_days: settings.bundle_timer_days ?? 0,
    bundle_timer_hours: settings.bundle_timer_hours ?? 24,
    bundle_timer_minutes: settings.bundle_timer_minutes ?? 0,
    bundle_timer_action: settings.bundle_timer_action || 'hide_timer',
    bundle_features: Array.isArray(settings.bundle_features) && settings.bundle_features.length > 0
      ? settings.bundle_features
      : ['Instant Download', 'Lifetime Access', 'Free Future Updates', '7-Day Guarantee'],
    bundle_badge_text: settings.bundle_badge_text || 'Limited Time Deal',
    bundle_badge_color: settings.bundle_badge_color || '#f5c842',
    bundle_cta_text: settings.bundle_cta_text || 'Unlock Bundle →',
    bundle_show_discount: settings.bundle_show_discount ?? true,
    bundle_banner_image: settings.bundle_banner_image || '',
    bundle_sales_limit: settings.bundle_sales_limit ?? 0,
    bundle_validity_days: settings.bundle_validity_days ?? 0,
    bundle_allow_repurchase: settings.bundle_allow_repurchase ?? false,
    bundle_send_email: settings.bundle_send_email ?? true,
    bundle_cutoff_enabled: settings.bundle_cutoff_enabled ?? false,
    refund_policy_content: sanitizeRichText(settings.refund_policy_content ?? ''),
    terms_privacy_content: sanitizeRichText(settings.terms_privacy_content ?? ''),
    social_instagram_enabled: settings.social_instagram_enabled ?? false,
    social_instagram_url: settings.social_instagram_url || '',
    social_whatsapp_enabled: settings.social_whatsapp_enabled ?? false,
    social_whatsapp_url: settings.social_whatsapp_url || '',
    social_twitter_enabled: settings.social_twitter_enabled ?? false,
    social_twitter_url: settings.social_twitter_url || '',
    social_facebook_enabled: settings.social_facebook_enabled ?? false,
    social_facebook_url: settings.social_facebook_url || '',
    social_telegram_enabled: settings.social_telegram_enabled ?? false,
    social_telegram_url: settings.social_telegram_url || '',
    floating_support_enabled: settings.floating_support_enabled ?? true,
    floating_whatsapp_enabled: settings.floating_whatsapp_enabled ?? true,
    floating_telegram_enabled: settings.floating_telegram_enabled ?? true,
    floating_phone_enabled: settings.floating_phone_enabled ?? true,
    floating_email_enabled: settings.floating_email_enabled ?? true,
    support_bot_enabled: settings.support_bot_enabled ?? false,
    support_bot_model_mode: settings.support_bot_model_mode || 'auto',
    openrouter_model: settings.openrouter_model || 'openrouter/free',
    support_bot_prompt: settings.support_bot_prompt || '',
    custom_social_links: Array.isArray(settings.custom_social_links) ? settings.custom_social_links : [],
    updatedAt: settings.updatedAt || settings.createdAt || '',
  };
}

export function getAdminSettings(settings = {}) {
  return {
    ...getPublicSettings(settings),
    otp_expiry_minutes: settings.otp_expiry_minutes ?? 5,
    otp_max_attempts: settings.otp_max_attempts ?? 5,
    otp_resend_cooldown_seconds: settings.otp_resend_cooldown_seconds ?? 60,
    openrouter_api_key: settings.openrouter_api_key || '',
  };
}
