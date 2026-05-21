import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import Customer from "@/models/Customer";
import Setting from "@/models/Setting";
import { generateToken, verifyCustomer } from "@/lib/auth";
import { buildRateLimitKey, consumeRateLimit } from "@/lib/security";

const CUSTOMER_AUTH_LIMIT = { limit: 5, windowMs: 60_000 };

function deny(message, status = 400) {
  return NextResponse.json({ flag: 0, message }, { status });
}

function normalizeEmail(value) {
  return typeof value === "string" ? value.toLowerCase().trim() : "";
}

async function isPasswordAuthEnabled() {
  const settings = await Setting.findOne().lean();
  return settings?.password_login_enabled !== false;
}

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const action = typeof body?.action === "string" ? body.action.trim() : "";

    if (!action) {
      return deny("Invalid action", 400);
    }

    if (action === "register") {
      if (!(await isPasswordAuthEnabled())) {
        return deny("Password registration is disabled.", 403);
      }

      const name = typeof body?.name === "string" ? body.name.trim() : "";
      const email = normalizeEmail(body?.email);
      const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
      const password = typeof body?.password === "string" ? body.password : "";

      if (!name || !email || !password) {
        return deny("Name, email and password required", 400);
      }

      if (password.length < 6) {
        return deny("Password must be at least 6 characters", 400);
      }

      const rateLimit = consumeRateLimit(buildRateLimitKey(request, "customer-register", email), CUSTOMER_AUTH_LIMIT);
      if (!rateLimit.allowed) {
        return deny("Too many requests. Please try again later.", 429);
      }

      const emailExists = await Customer.findOne({ email });
      if (emailExists) {
        if (emailExists.is_blocked) return deny("Unable to register with this email.", 403);
        if (emailExists.password) return deny("Email already registered", 400);
      }

      if (phone) {
        const phoneExists = await Customer.findOne({ phone });
        if (phoneExists) {
          return deny("Phone number already in use", 400);
        }
      }

      const hashed = await bcrypt.hash(password, 12);
      const customer = emailExists || new Customer({ email });
      customer.name = name;
      customer.phone = phone;
      customer.password = hashed;
      customer.is_verified = true;
      if (!emailExists) {
        customer.is_blocked = false;
      }
      customer.last_login = new Date();
      await customer.save();

      const token = generateToken({ id: customer._id, email: customer.email, name: customer.name, role: "customer" }, "30d");
      const response = NextResponse.json({
        flag: 1,
        message: "Account created!",
        customer: { id: customer._id, name: customer.name, email: customer.email, phone: customer.phone, has_password: !!customer.password },
      });

      response.cookies.set({
        name: "dv_token",
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60,
        path: "/",
      });

      return response;
    }

    if (action === "login") {
      if (!(await isPasswordAuthEnabled())) {
        return deny("Password login is disabled.", 403);
      }

      const email = normalizeEmail(body?.email);
      const password = typeof body?.password === "string" ? body.password : "";

      if (!email || !password) {
        return deny("Email and password required", 400);
      }

      const rateLimit = consumeRateLimit(buildRateLimitKey(request, "customer-login", email), CUSTOMER_AUTH_LIMIT);
      if (!rateLimit.allowed) {
        return deny("Too many login attempts. Please try again later.", 429);
      }

      const customer = await Customer.findOne({ email });
      if (!customer) {
        return deny("Invalid credentials", 401);
      }

      if (customer.is_blocked) {
        return deny("Your account is blocked. Please contact support.", 403);
      }

      const match = await bcrypt.compare(password, customer.password);
      if (!match) {
        return deny("Invalid credentials", 401);
      }

      customer.last_login = new Date();
      await customer.save();

      const token = generateToken({ id: customer._id, email: customer.email, name: customer.name, role: "customer" }, "30d");
      const response = NextResponse.json({
        flag: 1,
        message: "Login successful",
        customer: { id: customer._id, name: customer.name, email: customer.email, phone: customer.phone, has_password: !!customer.password },
      });

      response.cookies.set({
        name: "dv_token",
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60,
        path: "/",
      });

      return response;
    }

    return deny("Invalid action", 400);
  } catch (e) {
    console.error("[Customer] POST error:", e);
    if (e.code === 11000) {
      if (e.keyPattern?.email) return deny("Email already registered", 400);
      if (e.keyPattern?.phone) return deny("Phone number already in use", 400);
    }
    return deny("Server error", 500);
  }
}

export async function PUT(request) {
  try {
    await connectDB();

    const decoded = verifyCustomer(request);
    if (!decoded) return deny("Unauthorized", 401);

    const body = await request.json();
    const action = typeof body?.action === "string" ? body.action.trim() : "";
    const account = await Customer.findById(decoded.id);

    if (!account || account.is_blocked) {
      return deny("Unauthorized", 401);
    }

    if (action === "update") {
      const name = typeof body?.name === "string" ? body.name.trim() : "";
      const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
      const email = typeof body?.email === "string" ? body.email.trim() : account.email;

      if (!name) return deny("Name is required", 400);

      if (email && email !== account.email) {
        const emailExists = await Customer.findOne({ email, _id: { $ne: account._id } });
        if (emailExists) {
          return deny("Email already registered", 400);
        }
        account.email = email;
      }

      if (phone && phone !== account.phone) {
        const phoneExists = await Customer.findOne({ phone, _id: { $ne: account._id } });
        if (phoneExists) {
          return deny("Phone number already in use", 400);
        }
      }
      
      account.name = name;
      account.phone = phone;
      await account.save();

      return NextResponse.json({
        flag: 1,
        message: "Profile updated",
        customer: { id: account._id, name: account.name, email: account.email, phone: account.phone, has_password: !!account.password },
      });
    }

    if (action === "change-password") {
      const currentPassword = typeof body?.current_password === "string" ? body.current_password : "";
      const newPassword = typeof body?.new_password === "string" ? body.new_password : "";

      if (!currentPassword || !newPassword) {
        return deny("All fields required", 400);
      }

      if (newPassword.length < 6) {
        return deny("Password must be at least 6 characters", 400);
      }

      const match = await bcrypt.compare(currentPassword, account.password);
      if (!match) {
        return deny("Current password is incorrect", 401);
      }

      account.password = await bcrypt.hash(newPassword, 12);
      await account.save();

      return NextResponse.json({ flag: 1, message: "Password changed successfully" });
    }

    return deny("Invalid action", 400);
  } catch (e) {
    console.error("[Customer] PUT error:", e);
    if (e.code === 11000) {
      if (e.keyPattern?.email) return deny("Email already registered", 400);
      if (e.keyPattern?.phone) return deny("Phone number already in use", 400);
    }
    return deny(e.message || "Server error", 500);
  }
}
