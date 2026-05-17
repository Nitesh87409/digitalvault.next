import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import Otp from '@/models/Otp';
import Customer from '@/models/Customer';
import Setting from '@/models/Setting';
import { sendSMS } from '@/lib/sms';

function generateRandomOTP(length) {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(min + Math.random() * (max - min + 1)).toString();
}

export async function POST(request) {
  try {
    await connectDB();
    const { phone } = await request.json();
    if (!phone) return NextResponse.json({ flag: 0, message: 'Mobile number is required' });

    const normalizedPhone = phone.trim();
    
    // Fetch settings
    let settings = await Setting.findOne();
    if (!settings) settings = await Setting.create({});
    
    if (!settings.mobile_otp_enabled) {
      return NextResponse.json({ flag: 0, message: 'Mobile OTP login is disabled' });
    }

    // Check if customer exists
    const customer = await Customer.findOne({ phone: normalizedPhone });
    if (!customer) {
      return NextResponse.json({ flag: 0, message: 'No account found with this mobile number' });
    }
    if (customer.is_blocked) {
      return NextResponse.json({ flag: 0, message: 'Your account is blocked.' });
    }

    // Check cooldown
    const existingOtp = await Otp.findOne({ identifier: normalizedPhone, type: 'mobile' });
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
    await Otp.deleteMany({ identifier: normalizedPhone, type: 'mobile' });

    await Otp.create({
      identifier: normalizedPhone,
      type: 'mobile',
      otp_hash,
      expires_at,
      resend_after,
      attempts: 0
    });

    const smsMessage = `Your DigitalVault login code is: ${otp}. Expires in ${expiryMinutes} minutes.`;
    await sendSMS({ to: normalizedPhone, message: smsMessage });

    return NextResponse.json({ flag: 1, message: 'OTP sent to mobile', cooldown: cooldownSeconds });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ flag: 0, message: 'Server error' });
  }
}
