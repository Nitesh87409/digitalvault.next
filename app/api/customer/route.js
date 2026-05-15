import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import Customer from '@/models/Customer';
import { generateToken, verifyCustomer } from '@/lib/auth';

// POST /api/customer — register or login based on action
export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { action } = body;

    // REGISTER
    if (action === 'register') {
      const { name, email, phone, password } = body;
      if (!name || !email || !phone || !password)
        return NextResponse.json({ flag: 0, message: 'All fields required' });
      if (password.length < 6)
        return NextResponse.json({ flag: 0, message: 'Password must be at least 6 characters' });

      const normalizedEmail = email.toLowerCase().trim();
      const exists = await Customer.findOne({ email: normalizedEmail });
      if (exists && !(exists.password === 'guest' && exists.is_verified === false))
        return NextResponse.json({ flag: 0, message: 'Email already registered. Please login.' });

      const hashed = await bcrypt.hash(password, 12);
      const customer = exists || new Customer({ email: normalizedEmail });
      customer.name = name.trim();
      customer.phone = phone;
      customer.password = hashed;
      customer.is_verified = true;
      customer.is_blocked = false;
      customer.last_login = new Date();
      await customer.save();

      const token = generateToken({ id: customer._id, email: customer.email, name: customer.name, role: 'customer' });
      return NextResponse.json({
        flag: 1,
        message: 'Account created!',
        token,
        customer: { id: customer._id, name: customer.name, email: customer.email, phone: customer.phone }
      });
    }

    // LOGIN
    if (action === 'login') {
      const { email, password } = body;
      if (!email || !password)
        return NextResponse.json({ flag: 0, message: 'Email and password required' });

      const customer = await Customer.findOne({ email: email.toLowerCase().trim() });
      if (!customer)
        return NextResponse.json({ flag: 0, message: 'No account found with this email' });
      if (customer.is_blocked)
        return NextResponse.json({ flag: 0, message: 'Your account is blocked. Please contact support.' });

      const match = await bcrypt.compare(password, customer.password);
      if (!match)
        return NextResponse.json({ flag: 0, message: 'Incorrect password' });

      customer.last_login = new Date();
      await customer.save();

      const token = generateToken({ id: customer._id, email: customer.email, name: customer.name, role: 'customer' });
      return NextResponse.json({
        flag: 1,
        message: 'Login successful',
        token,
        customer: { id: customer._id, name: customer.name, email: customer.email, phone: customer.phone }
      });
    }

    return NextResponse.json({ flag: 0, message: 'Invalid action' });
  } catch (e) {
    console.error(e.message);
    return NextResponse.json({ flag: 0, message: 'Server error' });
  }
}

// PUT /api/customer — update profile or change password
export async function PUT(request) {
  try {
    await connectDB();
    const decoded = verifyCustomer(request);
    if (!decoded) return NextResponse.json({ flag: 0, message: 'Unauthorized' });

    const body = await request.json();
    const { action } = body;
    const account = await Customer.findById(decoded.id);
    if (!account || account.is_blocked)
      return NextResponse.json({ flag: 0, message: 'Unauthorized' });

    // UPDATE PROFILE
    if (action === 'update') {
      const { name, phone } = body;
      if (!name) return NextResponse.json({ flag: 0, message: 'Name is required' });

      account.name = name.trim();
      account.phone = phone || '';
      await account.save();

      return NextResponse.json({
        flag: 1,
        message: 'Profile updated',
        customer: { id: account._id, name: account.name, email: account.email, phone: account.phone }
      });
    }

    // CHANGE PASSWORD
    if (action === 'change-password') {
      const { current_password, new_password } = body;
      if (!current_password || !new_password)
        return NextResponse.json({ flag: 0, message: 'All fields required' });
      if (new_password.length < 6)
        return NextResponse.json({ flag: 0, message: 'Password must be at least 6 characters' });

      const match = await bcrypt.compare(current_password, account.password);
      if (!match) return NextResponse.json({ flag: 0, message: 'Current password is incorrect' });

      account.password = await bcrypt.hash(new_password, 12);
      await account.save();
      return NextResponse.json({ flag: 1, message: 'Password changed successfully' });
    }

    return NextResponse.json({ flag: 0, message: 'Invalid action' });
  } catch (e) {
    return NextResponse.json({ flag: 0, message: 'Server error' });
  }
}
