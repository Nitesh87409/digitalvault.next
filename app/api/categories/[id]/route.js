import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Category from "@/models/Category";
import Product from "@/models/Product";
import { verifyAdmin } from "@/lib/auth";

export async function PUT(request, { params }) {
  try {
    await connectDB();
    const admin = verifyAdmin(request);
    if (!admin) return NextResponse.json({ flag: false, message: "Unauthorized" }, { status: 401 });

    const { id } = params;
    const body = await request.json();
    const newName = (body.name || '').trim();
    if (!newName) return NextResponse.json({ flag: false, message: "Category name is required" }, { status: 400 });

    const slug = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const existing = await Category.findOne({ slug, _id: { $ne: id } }).select('_id').lean();
    if (existing) return NextResponse.json({ flag: false, message: "Category already exists" }, { status: 400 });

    const oldCategory = await Category.findById(id).lean();
    if (!oldCategory) return NextResponse.json({ flag: false, message: "Category not found" }, { status: 404 });

    const oldName = oldCategory.name;
    await Category.findByIdAndUpdate(id, { name: newName, slug });

    // Update all products that had the old category name
    if (oldName !== newName) {
      await Product.updateMany({ category: oldName }, { $set: { category: newName } });
    }

    return NextResponse.json({ flag: true, message: "Category updated successfully" });
  } catch (error) {
    console.error("[Categories] PUT error:", error);
    return NextResponse.json({ flag: false, message: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();

    const admin = verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ flag: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const deleted = await Category.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ flag: false, message: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({ flag: true, message: "Category deleted successfully" });
  } catch (error) {
    console.error("[Categories] DELETE error:", error);
    return NextResponse.json({ flag: false, message: "Server error" }, { status: 500 });
  }
}
