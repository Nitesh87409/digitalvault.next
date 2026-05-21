import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Setting from '@/models/Setting';
import { verifyAdmin } from '@/lib/auth';
import { getAdminSettings, getPublicSettings } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await connectDB();
    const admin = verifyAdmin(request);
    const settings = (await Setting.findOne().lean()) || {};

    return NextResponse.json({
      flag: 1,
      settings: admin ? getAdminSettings(settings) : getPublicSettings(settings),
    });
  } catch (e) {
    console.error('[Settings] GET error:', e);
    return NextResponse.json({ flag: 0, message: 'Server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const admin = verifyAdmin(request);
    if (!admin) return NextResponse.json({ flag: 0, message: 'Unauthorized' }, { status: 401 });

    const payload = await request.json();

    let settings = await Setting.findOne();
    if (!settings) {
      settings = new Setting();
    }

    const fields = [
      'password_login_enabled',
      'email_otp_enabled',
      'mobile_otp_enabled',
      'google_login_enabled',
      'apple_login_enabled',
      'otp_expiry_minutes',
      'otp_max_attempts',
      'otp_length',
      'otp_resend_cooldown_seconds',
      'support_email',
      'support_phone',
      'business_hours',
      'app_name',
      'app_logo'
    ];

    fields.forEach((field) => {
      if (payload[field] !== undefined) {
        settings[field] = payload[field];
      }
    });

    await settings.save();
    return NextResponse.json({ flag: 1, message: 'Settings updated successfully', settings: getAdminSettings(settings.toObject()) });
  } catch (e) {
    console.error('[Settings] POST error:', e);
    return NextResponse.json({ flag: 0, message: 'Server error' }, { status: 500 });
  }
}
