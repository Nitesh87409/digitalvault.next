import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import Admin from "@/models/Admin";
import Otp from "@/models/Otp";
import { generateToken } from "@/lib/auth";
import { buildRateLimitKey, consumePersistentRateLimit } from "@/lib/security";

const VERIFY_2FA_LIMIT = { limit: 10, windowMs: 60_000 };
const MAX_OTP_ATTEMPTS = 5;

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.toLowerCase().trim() : "";
    const otp = typeof body?.otp === "string" ? body.otp.trim() : (typeof body?.otp === "number" ? String(body.otp) : "");

    if (!email || !otp) {
      return NextResponse.json({ flag: 0, message: "Email and OTP required" }, { status: 400 });
    }

    // Rate limit
    const rateLimit = await consumePersistentRateLimit(buildRateLimitKey(request, "admin-2fa-verify", email), VERIFY_2FA_LIMIT);
    if (!rateLimit.allowed) {
      return NextResponse.json({ flag: 0, message: "Too many attempts. Please try again later." }, { status: 429 });
    }

    // Find OTP record
    const otpRecord = await Otp.findOne({ identifier: email, type: "admin-2fa" }).lean();
    if (!otpRecord) {
      return NextResponse.json({ flag: 0, message: "OTP not found or expired. Please login again." }, { status: 400 });
    }

    // Check expiry
    if (new Date() > otpRecord.expires_at) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return NextResponse.json({ flag: 0, message: "OTP has expired. Please login again." }, { status: 400 });
    }

    // Check max attempts
    if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return NextResponse.json({ flag: 0, message: "Too many failed attempts. Please login again." }, { status: 400 });
    }

    // Verify OTP
    const match = await bcrypt.compare(otp, otpRecord.otp_hash);
    if (!match) {
      await Otp.updateOne({ _id: otpRecord._id }, { $inc: { attempts: 1 } });
      const remaining = MAX_OTP_ATTEMPTS - otpRecord.attempts - 1;
      return NextResponse.json({
        flag: 0,
        message: remaining > 0
          ? `Invalid OTP. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
          : "Invalid OTP. Please login again.",
      }, { status: 401 });
    }

    // OTP verified — delete it
    await Otp.deleteOne({ _id: otpRecord._id });

    // Find admin
    const admin = await Admin.findOne({ email }).lean();
    if (!admin) {
      return NextResponse.json({ flag: 0, message: "Admin not found" }, { status: 401 });
    }

    // Generate token and set cookie
    const token = generateToken({ id: admin._id, email: admin.email, name: admin.name, role: "admin" }, "7d");

    const response = NextResponse.json({
      flag: 1,
      message: "Login successful",
      admin: { name: admin.name, email: admin.email },
    });

    response.cookies.set({
      name: "admin_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (e) {
    console.error("[Admin] 2FA verify error:", e);
    return NextResponse.json({ flag: 0, message: "Server error" }, { status: 500 });
  }
}
