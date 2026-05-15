import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';
import { generateToken } from '@/lib/auth';

// POST /api/admin — login
export async function POST(request) {
  try {
    await connectDB();
    const { email, password } = await request.json();

    if (!email || !password)
      return NextResponse.json({ flag: 0, message: 'Email and password required' });

    const normalizedEmail = email.toLowerCase().trim();

    // Auto create first admin
    let admin = await Admin.findOne({ email: normalizedEmail });
    if (!admin) {
      // Check if any admin exists
      const count = await Admin.countDocuments();
      if (count === 0 && normalizedEmail === process.env.ADMIN_EMAIL?.toLowerCase()) {
        const hashed = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@123', 12);
        admin = await Admin.create({ name: 'Super Admin', email: normalizedEmail, password: hashed });
      } else {
        return NextResponse.json({ flag: 0, message: 'Invalid credentials' });
      }
    }

    const match = await bcrypt.compare(password, admin.password);
    if (!match) return NextResponse.json({ flag: 0, message: 'Invalid credentials' });

    const token = generateToken({ id: admin._id, email: admin.email, name: admin.name, role: 'admin' }, '7d');
    return NextResponse.json({
      flag: 1,
      message: 'Login successful',
      token,
      admin: { name: admin.name, email: admin.email }
    });
  } catch (e) {
    console.error(e.message);
    return NextResponse.json({ flag: 0, message: 'Server error' });
  }
}
