import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import Otp from "@/models/Otp";
import Customer from "@/models/Customer";
import Setting from "@/models/Setting";
import { sendSMS } from "@/lib/sms";
import { buildRateLimitKey, consumePersistentRateLimit, generateSecureOtp } from "@/lib/security";

const SEND_MOBILE_LIMIT = { limit: 5, windowMs: 60_000 };
const GENERIC_OTP_MESSAGE = "If an account exists, an OTP has been sent to mobile";

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const phone = typeof body?.phone === "string" ? body.phone.trim() : "";

    if (!phone) {
      return NextResponse.json({ flag: 0, message: "Mobile number is required" }, { status: 400 });
    }

    const ipLimit = await consumePersistentRateLimit(buildRateLimitKey(request, "otp-send-mobile-ip"), SEND_MOBILE_LIMIT);
    if (!ipLimit.allowed) {
      return NextResponse.json({ flag: 0, message: "Too many requests. Please try again later." }, { status: 429 });
    }

    const phoneLimit = await consumePersistentRateLimit(buildRateLimitKey(request, "otp-send-mobile", phone), SEND_MOBILE_LIMIT);
    if (!phoneLimit.allowed) {
      return NextResponse.json({ flag: 0, message: "Too many requests. Please try again later." }, { status: 429 });
    }

    const settings = (await Setting.findOne().lean()) || {};
    if (!settings.mobile_otp_enabled) {
      return NextResponse.json({ flag: 0, message: "Mobile OTP login is disabled" }, { status: 403 });
    }

    const customer = await Customer.findOne({ phone }).select("is_blocked").lean();
    if (!customer) {
      return NextResponse.json({ flag: 1, message: GENERIC_OTP_MESSAGE, cooldown: settings.otp_resend_cooldown_seconds || 60 });
    }

    if (customer.is_blocked) {
      return NextResponse.json({ flag: 1, message: GENERIC_OTP_MESSAGE, cooldown: settings.otp_resend_cooldown_seconds || 60 });
    }

    const cooldownSeconds = settings.otp_resend_cooldown_seconds || 60;
    const existingOtp = await Otp.findOne({ identifier: phone, type: "mobile" }).select("resend_after").lean();
    if (existingOtp && new Date() < existingOtp.resend_after) {
      return NextResponse.json({ flag: 1, message: GENERIC_OTP_MESSAGE, cooldown: cooldownSeconds });
    }

    const otpLength = settings.otp_length || 6;
    const otp = generateSecureOtp(otpLength);
    const otp_hash = await bcrypt.hash(otp, 12);

    const expiryMinutes = settings.otp_expiry_minutes || 5;
    const now = Date.now();

    await Otp.deleteMany({ identifier: phone, type: "mobile" });

    await Otp.create({
      identifier: phone,
      type: "mobile",
      otp_hash,
      expires_at: new Date(now + expiryMinutes * 60 * 1000),
      resend_after: new Date(now + cooldownSeconds * 1000),
      attempts: 0,
    });

    const smsMessage = `Your DigitalVault login code is: ${otp}. Expires in ${expiryMinutes} minutes.`;
    await sendSMS({ to: phone, message: smsMessage });

    return NextResponse.json({ flag: 1, message: GENERIC_OTP_MESSAGE, cooldown: cooldownSeconds });
  } catch (e) {
    console.error("[OTP] send-mobile error:", e);
    return NextResponse.json({ flag: 0, message: "Server error" }, { status: 500 });
  }
}
