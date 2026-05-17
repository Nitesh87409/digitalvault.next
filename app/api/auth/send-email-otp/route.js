import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import Otp from '@/models/Otp';
import Customer from '@/models/Customer';
import Setting from '@/models/Setting';
import { sendEmailOTP } from '@/lib/mailer';

function generateRandomOTP(length) {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(min + Math.random() * (max - min + 1)).toString();
}

export async function POST(request) {
  try {
    await connectDB();
    const { email } = await request.json();
    if (!email) return NextResponse.json({ flag: 0, message: 'Email is required' });

    const normalizedEmail = email.toLowerCase().trim();
    
    // Fetch settings
    let settings = await Setting.findOne();
    if (!settings) settings = await Setting.create({});
    
    if (!settings.email_otp_enabled) {
      return NextResponse.json({ flag: 0, message: 'Email OTP login is disabled' });
    }

    // Check if customer exists
    const customer = await Customer.findOne({ email: normalizedEmail });
    if (!customer) {
      return NextResponse.json({ flag: 0, message: 'No account found with this email' });
    }
    if (customer.is_blocked) {
      return NextResponse.json({ flag: 0, message: 'Your account is blocked.' });
    }

    // Check cooldown
    const existingOtp = await Otp.findOne({ identifier: normalizedEmail, type: 'email' });
    if (existingOtp && new Date() < existingOtp.resend_after) {
      const waitTime = Math.ceil((existingOtp.resend_after - new Date()) / 1000);
      return NextResponse.json({ flag: 0, message: `Please wait ${waitTime}s before resending.` });
    }

    const otpLength = settings.otp_length || 6;
    const otp = generateRandomOTP(otpLength);
    const otp_hash = await bcrypt.hash(otp, 12);
    
    const expiryMinutes = settings.otp_expiry_minutes || 5;
    const expires_at = new Date(Date.now() + expiryMinutes * 60 * 1000);
    
    const cooldownSeconds = settings.otp_resend_cooldown_seconds || 60;
    const resend_after = new Date(Date.now() + cooldownSeconds * 1000);

    // Clear previous OTPs
    await Otp.deleteMany({ identifier: normalizedEmail, type: 'email' });

    await Otp.create({
      identifier: normalizedEmail,
      type: 'email',
      otp_hash,
      expires_at,
      resend_after,
      attempts: 0
    });

    await sendEmailOTP({ email: normalizedEmail, otp });

    return NextResponse.json({ flag: 1, message: 'OTP sent to email', cooldown: cooldownSeconds });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ flag: 0, message: 'Server error' });
  }
}
