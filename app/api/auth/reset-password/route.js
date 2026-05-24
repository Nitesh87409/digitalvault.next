import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import Customer from '@/models/Customer';
import Otp from '@/models/Otp';
import Setting from '@/models/Setting';
import { sendResetEmailOTP } from '@/lib/mailer';
import { sendSMS } from '@/lib/sms';
import { buildRateLimitKey, consumePersistentRateLimit, generateSecureOtp } from '@/lib/security';

const LIMIT = { limit: 5, windowMs: 60_000 };
const GENERIC_MSG = 'If the account exists, an OTP has been sent.';

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const action = typeof body?.action === 'string' ? body.action.trim() : '';

    if (action === 'send-otp') {
      const identifier = typeof body?.identifier === 'string' ? body.identifier.trim().toLowerCase() : '';
      if (!identifier) {
        return NextResponse.json({ flag: 0, message: 'Email or Mobile number required' }, { status: 400 });
      }

      const rateLimitKey = buildRateLimitKey(request, 'reset-send-otp', identifier);
      const limitRes = await consumePersistentRateLimit(rateLimitKey, LIMIT);
      if (!limitRes.allowed) {
        return NextResponse.json({ flag: 0, message: 'Too many requests. Please try again later.' }, { status: 429 });
      }

      const settings = (await Setting.findOne().lean()) || {};
      const isEmail = identifier.includes('@');
      
      if (isEmail && !settings.email_otp_enabled) {
         return NextResponse.json({ flag: 0, message: 'Email reset is disabled.' }, { status: 403 });
      }
      if (!isEmail && !settings.mobile_otp_enabled) {
         return NextResponse.json({ flag: 0, message: 'Mobile reset is disabled.' }, { status: 403 });
      }

      const customer = await Customer.findOne(isEmail ? { email: identifier } : { phone: identifier }).select("is_blocked").lean();
      if (!customer || customer.is_blocked) {
        return NextResponse.json({ flag: 1, message: GENERIC_MSG, cooldown: settings.otp_resend_cooldown_seconds || 60 });
      }

      const type = isEmail ? 'reset-email' : 'reset-mobile';
      
      const cooldownSeconds = settings.otp_resend_cooldown_seconds || 60;
      const existingOtp = await Otp.findOne({ identifier, type }).select("resend_after").lean();
      if (existingOtp && new Date() < existingOtp.resend_after) {
        return NextResponse.json({ flag: 1, message: GENERIC_MSG, cooldown: cooldownSeconds });
      }

      const otpLength = settings.otp_length || 6;
      const otp = generateSecureOtp(otpLength);
      const otp_hash = await bcrypt.hash(otp, 12);
      const expiryMinutes = settings.otp_expiry_minutes || 5;
      const now = Date.now();

      await Otp.deleteMany({ identifier, type });
      await Otp.create({
        identifier,
        type,
        otp_hash,
        expires_at: new Date(now + expiryMinutes * 60 * 1000),
        resend_after: new Date(now + cooldownSeconds * 1000),
        attempts: 0,
      });

      if (isEmail) {
        await sendResetEmailOTP({ email: identifier, otp });
      } else {
        const appName = settings.app_name || process.env.NEXT_PUBLIC_APP_NAME || 'DigitalVault';
        const smsMessage = `Your ${appName} password reset code is: ${otp}. Expires in ${expiryMinutes} minutes.`;
        await sendSMS({ to: identifier, message: smsMessage });
      }

      return NextResponse.json({ flag: 1, message: GENERIC_MSG, cooldown: cooldownSeconds });
    }

    if (action === 'reset') {
      const identifier = typeof body?.identifier === 'string' ? body.identifier.trim().toLowerCase() : '';
      const otp = typeof body?.otp === 'string' ? body.otp.trim() : '';
      const newPassword = typeof body?.new_password === 'string' ? body.new_password : '';

      if (!identifier || !otp || !newPassword) {
        return NextResponse.json({ flag: 0, message: 'All fields required' }, { status: 400 });
      }

      if (newPassword.length < 6) {
        return NextResponse.json({ flag: 0, message: 'Password must be at least 6 characters' }, { status: 400 });
      }

      const isEmail = identifier.includes('@');
      const type = isEmail ? 'reset-email' : 'reset-mobile';

      const otpRecord = await Otp.findOne({ identifier, type }).lean();
      if (!otpRecord) return NextResponse.json({ flag: 0, message: 'OTP not found or expired' });

      if (new Date() > otpRecord.expires_at) {
        await Otp.deleteOne({ _id: otpRecord._id });
        return NextResponse.json({ flag: 0, message: 'OTP has expired' });
      }

      let settings = await Setting.findOne().lean();
      const maxAttempts = settings?.otp_max_attempts || 5;
      if (otpRecord.attempts >= maxAttempts) {
        await Otp.deleteOne({ _id: otpRecord._id });
        return NextResponse.json({ flag: 0, message: 'Too many failed attempts. Request a new OTP.' });
      }

      const match = await bcrypt.compare(otp, otpRecord.otp_hash);
      if (!match) {
        await Otp.updateOne({ _id: otpRecord._id }, { $inc: { attempts: 1 } });
        return NextResponse.json({ flag: 0, message: 'Invalid OTP' });
      }

      const customer = await Customer.findOne(isEmail ? { email: identifier } : { phone: identifier }).select("is_blocked").lean();
      if (!customer || customer.is_blocked) {
         return NextResponse.json({ flag: 0, message: 'Account not found or blocked' });
      }

      const passwordHash = await bcrypt.hash(newPassword, 12);
      await Customer.updateOne({ _id: customer._id }, { password: passwordHash });
      await Otp.deleteOne({ _id: otpRecord._id });

      return NextResponse.json({ flag: 1, message: 'Password reset successful. You can now login.' });
    }

    return NextResponse.json({ flag: 0, message: 'Invalid action' }, { status: 400 });

  } catch (e) {
    console.error('[Reset Password API] Error:', e);
    return NextResponse.json({ flag: 0, message: 'Server error' }, { status: 500 });
  }
}
