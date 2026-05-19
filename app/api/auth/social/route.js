import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Customer from '@/models/Customer';
import Setting from '@/models/Setting';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { generateToken } from '@/lib/auth';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const SUPPORTED_PROVIDERS = ['google', 'apple', 'truecaller', 'telegram', 'whatsapp'];

export async function POST(request) {
  try {
    await connectDB();
    const payload = await request.json();
    const { provider, token, userData } = payload;
    
    if (!provider || !SUPPORTED_PROVIDERS.includes(provider)) {
      console.warn(`[Auth] Invalid or missing provider: ${provider}`);
      return NextResponse.json({ flag: 0, message: 'Invalid or unsupported provider.' }, { status: 400 });
    }

    // Check if the setting is enabled
    const settings = await Setting.findOne() || {};
    const providerSettingKey = `${provider}_login_enabled`;
    if (settings[providerSettingKey] === false) {
      console.warn(`[Auth] ${provider} login is disabled in settings.`);
      return NextResponse.json({ flag: 0, message: `${provider.charAt(0).toUpperCase() + provider.slice(1)} login is disabled.` });
    }

    let customerData = {
      email: '',
      name: '',
      phone: '',
      profile_image: '',
      social_id: '',
    };

    // Verify token based on provider
    if (provider === 'google') {
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: token,
          audience: process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        });
        const decoded = ticket.getPayload();
        customerData.email = decoded.email?.toLowerCase().trim();
        customerData.name = decoded.name;
        customerData.profile_image = decoded.picture;
        customerData.social_id = decoded.sub;
      } catch (err) {
        console.error('[Auth] Google token verification failed:', err);
        return NextResponse.json({ flag: 0, message: 'Invalid Google token.' }, { status: 401 });
      }
    } else if (provider === 'apple') {
      try {
        const decoded = jwt.decode(token);
        if (!decoded || !decoded.sub) {
          throw new Error('Invalid token');
        }
        customerData.email = (decoded.email || (userData && userData.email) || '').toLowerCase().trim();
        customerData.name = (userData && userData.name) ? `${userData.name.firstName} ${userData.name.lastName}` : 'Apple User';
        customerData.social_id = decoded.sub;
      } catch (err) {
        console.error('[Auth] Apple token verification failed:', err);
        return NextResponse.json({ flag: 0, message: 'Invalid Apple token.' }, { status: 401 });
      }
    } else {
      if (!userData || !userData.id) {
         console.warn(`[Auth] Missing userData.id for provider: ${provider}`);
         return NextResponse.json({ flag: 0, message: `Invalid payload for ${provider}.` }, { status: 400 });
      }
      customerData.social_id = userData.id;
      customerData.email = (userData.email || '').toLowerCase().trim();
      customerData.name = userData.name || `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`;
      customerData.phone = userData.phone || '';
      customerData.profile_image = userData.profile_image || '';
    }

    if (!customerData.social_id) {
      console.warn(`[Auth] Missing social_id for provider: ${provider}`);
      return NextResponse.json({ flag: 0, message: 'Authentication failed, missing user ID.' }, { status: 400 });
    }

    // Now find or create the customer
    let customer;
    const query = [];
    
    if (customerData.email) {
      query.push({ email: customerData.email });
    }
    
    if (customerData.phone) {
      query.push({ phone: customerData.phone });
    }
    
    const providerIdField = `${provider}_id`;
    if (customerData.social_id) {
      query.push({ [providerIdField]: customerData.social_id });
    }

    if (query.length > 0) {
      customer = await Customer.findOne({ $or: query });
    }

    if (!customer) {
      // Create new customer
      customer = new Customer({
        name: customerData.name || 'User',
        email: customerData.email || undefined,
        phone: customerData.phone || undefined,
        auth_provider: provider,
        is_verified: true,
        profile_image: customerData.profile_image || undefined,
        last_login: new Date()
      });

      // Dynamically assign the provider ID only if truthy
      if (customerData.social_id) {
        customer[providerIdField] = customerData.social_id;
      }

      await customer.save();
    } else {
      // IF CUSTOMER EXISTS
      // update missing provider IDs dynamically
      if (customerData.social_id && !customer[providerIdField]) {
        customer[providerIdField] = customerData.social_id;
      }
      
      // update profile image if needed
      if (!customer.profile_image && customerData.profile_image) {
        customer.profile_image = customerData.profile_image;
      }
      
      // update email/phone if missing
      if (customerData.email && !customer.email) {
        customer.email = customerData.email;
      }
      if (customerData.phone && !customer.phone) {
        customer.phone = customerData.phone;
      }

      customer.last_login = new Date();
      await customer.save();
    }

    if (customer.is_blocked) {
      return NextResponse.json({ flag: 0, message: 'Your account is blocked.' });
    }

    // Generate session JWT using lib/auth
    const authToken = generateToken({ id: customer._id, email: customer.email, name: customer.name, role: 'customer' });

    const safeCustomer = {
      id: customer._id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      profile_image: customer.profile_image,
      tag: customer.tag,
    };

    const response = NextResponse.json({ flag: 1, message: 'Login successful', customer: safeCustomer });
    
    response.cookies.set({
      name: 'dv_token',
      value: authToken,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      sameSite: 'strict',
    });

    return response;
    
  } catch (error) {
    console.error(`[Auth] Social auth error:`, error);
    return NextResponse.json({ flag: 0, message: 'Server error during authentication.' }, { status: 500 });
  }
}
