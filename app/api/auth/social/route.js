import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Customer from '@/models/Customer';
import Setting from '@/models/Setting';
import { generateToken } from '@/lib/auth';
import { buildRateLimitKey, consumePersistentRateLimit } from '@/lib/security';
import { isSupportedSocialProvider, verifyGoogleLoginToken, verifyAppleLoginToken } from '@/lib/social-auth';

const SOCIAL_AUTH_LIMIT = { limit: 5, windowMs: 60_000 };

function deny(message, status = 400) {
  return NextResponse.json({ flag: 0, message }, { status });
}

async function verifyProviderToken(provider, token) {
  if (provider === 'google') {
    return verifyGoogleLoginToken(token);
  }

  if (provider === 'apple') {
    return verifyAppleLoginToken(token);
  }

  throw new Error('Unsupported provider');
}

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const provider = typeof body?.provider === 'string' ? body.provider.toLowerCase().trim() : '';
    const token = typeof body?.token === 'string' ? body.token.trim() : '';

    if (!isSupportedSocialProvider(provider)) {
      return deny('Only Google and Apple login are supported.', 400);
    }

    if (!token) {
      return deny('Authentication token is required.', 400);
    }

    const rateLimitKey = buildRateLimitKey(request, 'social-auth', provider);
    const rateLimit = await consumePersistentRateLimit(rateLimitKey, SOCIAL_AUTH_LIMIT);
    if (!rateLimit.allowed) {
      return deny('Too many authentication attempts. Please try again later.', 429);
    }

    const settings = (await Setting.findOne().lean()) || {};
    const providerSettingKey = `${provider}_login_enabled`;

    if (settings[providerSettingKey] === false) {
      return deny(`${provider.charAt(0).toUpperCase() + provider.slice(1)} login is disabled.`, 403);
    }

    let verified;
    try {
      verified = await verifyProviderToken(provider, token);
    } catch (error) {
      if (error.message?.includes('environment variables')) {
        throw error;
      }
      console.warn('[Auth] Social token verification failed:', error.message);
      return deny('Authentication failed.', 401);
    }
    const socialIdField = `${provider}_id`;

    if (!verified?.social_id) {
      return deny('Authentication failed.', 401);
    }

    const query = [{ [socialIdField]: verified.social_id }];
    if (verified.email) {
      query.push({ email: verified.email });
    }

    let customer = await Customer.findOne({ $or: query }).lean();

    if (!customer) {
      const createData = {
        name: verified.name || `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
        email: verified.email || undefined,
        auth_provider: provider,
        is_verified: true,
        profile_image: verified.profile_image || undefined,
        last_login: new Date(),
        [socialIdField]: verified.social_id
      };
      const newCustomerDoc = await Customer.create(createData);
      customer = newCustomerDoc.toObject ? newCustomerDoc.toObject() : newCustomerDoc;
    } else {
      const updateData = {
        auth_provider: provider,
        last_login: new Date()
      };

      if (!customer[socialIdField]) {
        updateData[socialIdField] = verified.social_id;
      }

      if (verified.email && !customer.email) {
        updateData.email = verified.email;
      }

      if (verified.profile_image && !customer.profile_image) {
        updateData.profile_image = verified.profile_image;
      }

      if (verified.name && !customer.name) {
        updateData.name = verified.name;
      }

      customer = await Customer.findOneAndUpdate({ _id: customer._id }, { $set: updateData }, { new: true }).lean();
    }

    if (customer.is_blocked) {
      return deny('Your account is blocked.', 403);
    }

    const authToken = generateToken(
      {
        id: customer._id,
        email: customer.email,
        name: customer.name,
        role: 'customer',
      },
      '24h'
    );

    const response = NextResponse.json({
      flag: 1,
      message: 'Login successful',
      customer: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        profile_image: customer.profile_image,
        tag: customer.tag,
      },
    });

    response.cookies.set({
      name: 'dv_token',
      value: authToken,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60,
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    console.error('[Auth] Social auth error:', error);
    return deny('Server error during authentication.', 500);
  }
}
