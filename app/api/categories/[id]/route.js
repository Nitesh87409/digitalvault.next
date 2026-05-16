import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Category from '@/models/Category';

export async function DELETE(req, { params }) {
  try {
    const { id } = params;
    await connectDB();
    const deleted = await Category.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ flag: false, message: 'Category not found' }, { status: 404 });
    }
    return NextResponse.json({ flag: true, message: 'Category deleted successfully' });
  } catch (error) {
    return NextResponse.json({ flag: false, message: error.message }, { status: 500 });
  }
}
