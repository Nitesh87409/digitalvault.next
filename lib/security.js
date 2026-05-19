import crypto from 'node:crypto';

const RATE_LIMIT_GLOBAL_KEY = '__digitalvault_rate_limit_store__';

function getStore() {
  if (!globalThis[RATE_LIMIT_GLOBAL_KEY]) {
    globalThis[RATE_LIMIT_GLOBAL_KEY] = new Map();
  }
  return globalThis[RATE_LIMIT_GLOBAL_KEY];
}

export function getClientIp(request) {
  const trustProxy = process.env.TRUST_PROXY_HEADERS === 'true';
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

export function generateSecureOtp(length = 6) {
  const safeLength = Number.isInteger(length) && length > 0 ? length : 6;
  const lowerBound = safeLength === 1 ? 0 : 10 ** (safeLength - 1);
  const upperBound = 10 ** safeLength - 1;

  return crypto.randomInt(lowerBound, upperBound + 1).toString().padStart(safeLength, '0');
}

export function getPublicSettings(settings = {}) {
  return {
    password_login_enabled: settings.password_login_enabled ?? true,
    email_otp_enabled: settings.email_otp_enabled ?? true,
    mobile_otp_enabled: settings.mobile_otp_enabled ?? false,
    google_login_enabled: settings.google_login_enabled ?? false,
    apple_login_enabled: settings.apple_login_enabled ?? false,
    otp_length: settings.otp_length ?? 6,
  };
}

export function getAdminSettings(settings = {}) {
  return {
    ...getPublicSettings(settings),
    otp_expiry_minutes: settings.otp_expiry_minutes ?? 5,
    otp_max_attempts: settings.otp_max_attempts ?? 5,
    otp_resend_cooldown_seconds: settings.otp_resend_cooldown_seconds ?? 60,
  };
}
