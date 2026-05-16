import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Category from '@/models/Category';

export async function GET() {
  try {
    await connectDB();
    const categories = await Category.find().sort({ createdAt: -1 });
    return NextResponse.json({ flag: true, categories });
  } catch (error) {
    return NextResponse.json({ flag: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { name } = await req.json();
    if (!name || name.trim() === '') {
      return NextResponse.json({ flag: false, message: 'Category name is required' }, { status: 400 });
    }

    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    await connectDB();
    const existing = await Category.findOne({ slug });
    if (existing) {
      return NextResponse.json({ flag: false, message: 'Category already exists' }, { status: 400 });
    }

    const category = await Category.create({ name: name.trim(), slug });
    return NextResponse.json({ flag: true, message: 'Category created', category });
  } catch (error) {
    if (error.code === 11000) {
      return NextResponse.json({ flag: false, message: 'Category already exists' }, { status: 400 });
    }
    return NextResponse.json({ flag: false, message: error.message }, { status: 500 });
  }
}
