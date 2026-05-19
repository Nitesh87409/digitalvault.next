import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import Otp from "@/models/Otp";
import Customer from "@/models/Customer";
import Setting from "@/models/Setting";
import { sendEmailOTP } from "@/lib/mailer";
import { buildRateLimitKey, consumeRateLimit, generateSecureOtp } from "@/lib/security";

const SEND_EMAIL_LIMIT = { limit: 5, windowMs: 60_000 };
const GENERIC_OTP_MESSAGE = "If an account exists, an OTP has been sent to email";

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.toLowerCase().trim() : "";

    if (!email) {
      return NextResponse.json({ flag: 0, message: "Email is required" }, { status: 400 });
    }

    const ipLimit = consumeRateLimit(buildRateLimitKey(request, "otp-send-email-ip"), SEND_EMAIL_LIMIT);
    if (!ipLimit.allowed) {
      return NextResponse.json({ flag: 0, message: "Too many requests. Please try again later." }, { status: 429 });
    }

    const emailLimit = consumeRateLimit(buildRateLimitKey(request, "otp-send-email", email), SEND_EMAIL_LIMIT);
    if (!emailLimit.allowed) {
      return NextResponse.json({ flag: 0, message: "Too many requests. Please try again later." }, { status: 429 });
    }

    const settings = (await Setting.findOne().lean()) || {};
    if (!settings.email_otp_enabled) {
      return NextResponse.json({ flag: 0, message: "Email OTP login is disabled" }, { status: 403 });
    }

    const customer = await Customer.findOne({ email });
    if (!customer) {
      return NextResponse.json({ flag: 1, message: GENERIC_OTP_MESSAGE, cooldown: settings.otp_resend_cooldown_seconds || 60 });
    }

    if (customer.is_blocked) {
      return NextResponse.json({ flag: 1, message: GENERIC_OTP_MESSAGE, cooldown: settings.otp_resend_cooldown_seconds || 60 });
    }

    const existingOtp = await Otp.findOne({ identifier: email, type: "email" });
    if (existingOtp && new Date() < existingOtp.resend_after) {
      const waitTime = Math.ceil((existingOtp.resend_after - new Date()) / 1000);
      return NextResponse.json({ flag: 0, message: `Please wait ${waitTime}s before resending.` }, { status: 429 });
    }

    const otpLength = settings.otp_length || 6;
    const otp = generateSecureOtp(otpLength);
    const otp_hash = await bcrypt.hash(otp, 12);

    const expiryMinutes = settings.otp_expiry_minutes || 5;
    const cooldownSeconds = settings.otp_resend_cooldown_seconds || 60;
    const now = Date.now();

    await Otp.deleteMany({ identifier: email, type: "email" });

    await Otp.create({
      identifier: email,
      type: "email",
      otp_hash,
      expires_at: new Date(now + expiryMinutes * 60 * 1000),
      resend_after: new Date(now + cooldownSeconds * 1000),
      attempts: 0,
    });

    await sendEmailOTP({ email, otp });

    return NextResponse.json({ flag: 1, message: GENERIC_OTP_MESSAGE, cooldown: cooldownSeconds });
  } catch (e) {
    console.error("[OTP] send-email error:", e);
    return NextResponse.json({ flag: 0, message: "Server error" }, { status: 500 });
  }
}
