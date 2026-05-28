import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import Admin from "@/models/Admin";
import Otp from "@/models/Otp";
import { buildRateLimitKey, consumePersistentRateLimit, generateSecureOtp } from "@/lib/security";
import { sendAdmin2faOTP } from "@/lib/mailer";

const ADMIN_LOGIN_LIMIT = { limit: 5, windowMs: 60_000 };
const ADMIN_2FA_RESEND_COOLDOWN = 60;
const ADMIN_2FA_EXPIRY_MINUTES = 5;

function requireAdminEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.toLowerCase().trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json({ flag: 0, message: "Email and password required" }, { status: 400 });
    }

    const rateLimit = await consumePersistentRateLimit(buildRateLimitKey(request, "admin-login", email), ADMIN_LOGIN_LIMIT);
    if (!rateLimit.allowed) {
      return NextResponse.json({ flag: 0, message: "Too many login attempts. Please try again later." }, { status: 429 });
    }

    const adminEmail = requireAdminEnv("ADMIN_EMAIL").toLowerCase().trim();
    const adminPassword = requireAdminEnv("ADMIN_PASSWORD");

    if (email !== adminEmail) {
      return NextResponse.json({ flag: 0, message: "Invalid credentials" }, { status: 401 });
    }

    let admin = await Admin.findOne({ email: adminEmail });
    if (!admin) {
      const hashed = await bcrypt.hash(adminPassword, 12);
      admin = await Admin.create({ name: "Super Admin", email: adminEmail, password: hashed });
    }

    const match = await bcrypt.compare(password, admin.password);
    if (!match) {
      return NextResponse.json({ flag: 0, message: "Invalid credentials" }, { status: 401 });
    }

    const existingOtp = await Otp.findOne({ identifier: email, type: "admin-2fa" }).select("resend_after").lean();
    if (existingOtp && new Date() < existingOtp.resend_after) {
      const waitTime = Math.ceil((existingOtp.resend_after - new Date()) / 1000);
      return NextResponse.json({
        flag: 1,
        requires_2fa: true,
        message: "OTP already sent. Check your email.",
        cooldown: waitTime,
      });
    }

    const otp = generateSecureOtp(6);
    const otp_hash = await bcrypt.hash(otp, 12);
    const now = Date.now();

    await Otp.deleteMany({ identifier: email, type: "admin-2fa" });

    await Otp.create({
      identifier: email,
      type: "admin-2fa",
      otp_hash,
      expires_at: new Date(now + ADMIN_2FA_EXPIRY_MINUTES * 60 * 1000),
      resend_after: new Date(now + ADMIN_2FA_RESEND_COOLDOWN * 1000),
      attempts: 0,
    });

    await sendAdmin2faOTP({ email, otp });

    return NextResponse.json({
      flag: 1,
      requires_2fa: true,
      message: "Verification code sent to your email",
      cooldown: ADMIN_2FA_RESEND_COOLDOWN,
    });
  } catch (e) {
    console.error("[Admin] login error:", e);
    return NextResponse.json({ flag: 0, message: "Server error" }, { status: 500 });
  }
}
