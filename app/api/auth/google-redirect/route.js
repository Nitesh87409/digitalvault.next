import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Customer from '@/models/Customer';
import Setting from '@/models/Setting';
import { generateToken } from '@/lib/auth';
import { verifyGoogleLoginToken } from '@/lib/social-auth';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const credential = formData.get('credential');
    const gCsrfToken = formData.get('g_csrf_token');

    if (!credential) {
      return redirectWithError(request, 'Authentication failed. Please try again.');
    }

    // Verify CSRF token from Google (sent in both cookie and form body)
    const cookieCsrf = request.cookies.get('g_csrf_token')?.value;
    if (!gCsrfToken || !cookieCsrf || gCsrfToken !== cookieCsrf) {
      return redirectWithError(request, 'Security validation failed. Please try again.');
    }

    await connectDB();

    // Check if Google login is enabled
    const settings = (await Setting.findOne().lean()) || {};
    if (settings.google_login_enabled === false) {
      return redirectWithError(request, 'Google login is currently disabled.');
    }

    // Verify the Google token using existing function
    let verified;
    try {
      verified = await verifyGoogleLoginToken(credential);
    } catch (error) {
      if (error.message?.includes('environment variables')) {
        throw error;
      }
      return redirectWithError(request, 'Google authentication failed. Please try again.');
    }

    if (!verified?.social_id) {
      return redirectWithError(request, 'Google authentication failed. Please try again.');
    }

    // Find or create customer (same logic as /api/auth/social)
    const query = [{ google_id: verified.social_id }];
    if (verified.email) {
      query.push({ email: verified.email });
    }

    let customer = await Customer.findOne({ $or: query }).lean();

    if (!customer) {
      const newCustomerDoc = await Customer.create({
        name: verified.name || 'Google User',
        email: verified.email || undefined,
        auth_provider: 'google',
        is_verified: true,
        profile_image: verified.profile_image || undefined,
        last_login: new Date(),
        google_id: verified.social_id,
      });
      customer = newCustomerDoc.toObject ? newCustomerDoc.toObject() : newCustomerDoc;
    } else {
      const updateData = {
        auth_provider: 'google',
        last_login: new Date(),
      };

      if (!customer.google_id) {
        updateData.google_id = verified.social_id;
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

      customer = await Customer.findOneAndUpdate(
        { _id: customer._id },
        { $set: updateData },
        { new: true }
      ).lean();
    }

    if (customer.is_blocked) {
      return redirectWithError(request, 'Your account is blocked.');
    }

    // Generate auth token (same as /api/auth/social)
    const authToken = generateToken(
      {
        id: customer._id,
        email: customer.email,
        name: customer.name,
        role: 'customer',
      },
      '30d'
    );

    // Build redirect URL back to login page
    const origin = new URL(request.url).origin;
    const redirectUrl = new URL('/login', origin);
    redirectUrl.searchParams.set('google_redirect', 'success');

    const response = NextResponse.redirect(redirectUrl.toString(), 302);

    // Set auth cookie (same config as /api/auth/social)
    response.cookies.set({
      name: 'dv_token',
      value: authToken,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60,
      sameSite: 'lax',
    });

    // Set customer data in a temporary cookie for the client to read
    const customerData = JSON.stringify({
      id: customer._id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      profile_image: customer.profile_image,
      tag: customer.tag,
    });
    response.cookies.set({
      name: 'dv_google_customer',
      value: encodeURIComponent(customerData),
      httpOnly: false,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60,
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    console.error('[Auth] Google redirect error:', error);
    return redirectWithError(request, 'Server error. Please try again.');
  }
}

export async function GET(request) {
  const origin = new URL(request.url).origin;
  return NextResponse.redirect(new URL('/login', origin).toString(), 302);
}

function redirectWithError(request, message) {
  const origin = new URL(request.url).origin;
  const redirectUrl = new URL('/login', origin);
  redirectUrl.searchParams.set('google_redirect', 'error');
  redirectUrl.searchParams.set('error_message', message);
  return NextResponse.redirect(redirectUrl.toString(), 302);
}
