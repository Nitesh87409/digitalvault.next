import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import Otp from '@/models/Otp';
import Customer from '@/models/Customer';
import Setting from '@/models/Setting';
import { generateToken } from '@/lib/auth';

export async function POST(request) {
  try {
    await connectDB();
    const { phone, otp } = await request.json();
    if (!phone || !otp) return NextResponse.json({ flag: 0, message: 'Mobile number and OTP required' });

    const normalizedPhone = phone.trim();

    let settings = await Setting.findOne();
    if (!settings) settings = await Setting.create({});
    if (!settings.mobile_otp_enabled) {
      return NextResponse.json({ flag: 0, message: 'Mobile OTP login is disabled' }, { status: 403 });
    }

    const otpRecord = await Otp.findOne({ identifier: normalizedPhone, type: 'mobile' });
    if (!otpRecord) return NextResponse.json({ flag: 0, message: 'OTP not found or expired' });

    if (new Date() > otpRecord.expires_at) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return NextResponse.json({ flag: 0, message: 'OTP has expired' });
    }

    const maxAttempts = settings.otp_max_attempts || 5;
    if (otpRecord.attempts >= maxAttempts) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return NextResponse.json({ flag: 0, message: 'Too many failed attempts. Request a new OTP.' });
    }

    const match = await bcrypt.compare(otp.toString(), otpRecord.otp_hash);
    if (!match) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return NextResponse.json({ flag: 0, message: 'Invalid OTP' });
    }

    // Success
    await Otp.deleteOne({ _id: otpRecord._id });

    const customer = await Customer.findOne({ phone: normalizedPhone });
    if (!customer) return NextResponse.json({ flag: 0, message: 'Customer not found' });
    if (customer.is_blocked) return NextResponse.json({ flag: 0, message: 'Account is blocked' });

    customer.last_login = new Date();
    await customer.save();

    const token = generateToken({ id: customer._id, email: customer.email, name: customer.name, role: 'customer' });
    const response = NextResponse.json({
      flag: 1,
      message: 'Login successful',
      customer: { id: customer._id, name: customer.name, email: customer.email, phone: customer.phone }
    });
    
    response.cookies.set({
      name: 'dv_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60,
      path: '/'
    });

    return response;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ flag: 0, message: 'Server error' });
  }
}
