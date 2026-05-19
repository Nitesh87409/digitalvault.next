import crypto from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const APPLE_JWKS_URL = 'https://appleid.apple.com/auth/keys';
const APPLE_ISSUER = 'https://appleid.apple.com';
const APPLE_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

let appleKeyCache = null;
let appleKeyCacheAt = 0;

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not defined in environment variables`);
  }
  return value;
}

function decodeBase64Url(input) {
  return Buffer.from(input, 'base64url');
}

function parseJwt(token) {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }

  const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
  const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));

  return {
    header,
    payload,
    signingInput: `${parts[0]}.${parts[1]}`,
    signature: decodeBase64Url(parts[2]),
  };
}

async function getAppleKeys() {
  const now = Date.now();
  if (appleKeyCache && now - appleKeyCacheAt < APPLE_CACHE_TTL_MS) {
    return appleKeyCache;
  }

  const response = await fetch(APPLE_JWKS_URL, {
    headers: { accept: 'application/json' },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Apple public keys');
  }

  const data = await response.json();
  if (!Array.isArray(data.keys)) {
    throw new Error('Invalid Apple public keys response');
  }

  appleKeyCache = data.keys;
  appleKeyCacheAt = now;
  return appleKeyCache;
}

export async function verifyGoogleLoginToken(token) {
  const audience = requireEnv('GOOGLE_CLIENT_ID');
  const ticket = await googleClient.verifyIdToken({
    idToken: token,
    audience,
  });

  const payload = ticket.getPayload();
  if (!payload) {
    throw new Error('Google token payload is missing');
  }

  if (!['accounts.google.com', 'https://accounts.google.com'].includes(payload.iss)) {
    throw new Error('Invalid Google issuer');
  }

  if (!payload.email || payload.email_verified !== true) {
    throw new Error('Google email is not verified');
  }

  return {
    provider: 'google',
    social_id: payload.sub,
    email: payload.email.toLowerCase().trim(),
    name: payload.name?.trim() || 'Google User',
    profile_image: payload.picture || '',
  };
}

export async function verifyAppleLoginToken(token) {
  const clientId = requireEnv('APPLE_CLIENT_ID');
  const { header, payload, signingInput, signature } = parseJwt(token);

  if (header.alg !== 'RS256') {
    throw new Error('Unsupported Apple token algorithm');
  }

  if (!header.kid) {
    throw new Error('Apple token key id is missing');
  }

  if (payload.iss !== APPLE_ISSUER) {
    throw new Error('Invalid Apple issuer');
  }

  const audience = payload.aud;
  if (audience !== clientId) {
    throw new Error('Invalid Apple audience');
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (!payload.exp || payload.exp <= nowSeconds) {
    throw new Error('Apple token has expired');
  }

  const keys = await getAppleKeys();
  const matchingKey = keys.find((key) => key.kid === header.kid && key.kty === 'RSA' && key.use === 'sig');
  if (!matchingKey) {
    throw new Error('Apple public key not found');
  }

  const publicKey = crypto.createPublicKey({ key: matchingKey, format: 'jwk' });
  const isValid = crypto.verify(
    'RSA-SHA256',
    Buffer.from(signingInput),
    publicKey,
    signature
  );

  if (!isValid) {
    throw new Error('Apple token signature is invalid');
  }

  if (!payload.sub) {
    throw new Error('Apple token subject is missing');
  }

  const email = typeof payload.email === 'string' ? payload.email.toLowerCase().trim() : '';
  const hasUnverifiedEmail =
    email &&
    payload.email_verified !== true &&
    payload.email_verified !== 'true';

  if (hasUnverifiedEmail) {
    throw new Error('Apple email is not verified');
  }

  return {
    provider: 'apple',
    social_id: payload.sub,
    email,
    name: 'Apple User',
    profile_image: '',
  };
}

export function isSupportedSocialProvider(provider) {
  return ['google', 'apple'].includes(provider);
}
