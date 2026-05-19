import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import Admin from "@/models/Admin";
import { generateToken } from "@/lib/auth";
import { buildRateLimitKey, consumeRateLimit } from "@/lib/security";

const ADMIN_LOGIN_LIMIT = { limit: 5, windowMs: 60_000 };

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

    const rateLimit = consumeRateLimit(buildRateLimitKey(request, "admin-login", email), ADMIN_LOGIN_LIMIT);
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
    console.error("[Admin] login error:", e);
    return NextResponse.json({ flag: 0, message: "Server error" }, { status: 500 });
  }
}
