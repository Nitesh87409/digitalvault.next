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

    const { id } = await params;
    const body = await request.json();
    const newName = (body.name || '').trim();
    if (!newName) return NextResponse.json({ flag: false, message: "Category name is required" }, { status: 400 });

    const oldCategory = await Category.findById(id).lean();
    if (!oldCategory) return NextResponse.json({ flag: false, message: "Category not found" }, { status: 404 });

    // Generate slug
    let slug = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (oldCategory.parent_id) {
      const parent = await Category.findById(oldCategory.parent_id).select('slug').lean();
      if (parent) {
        slug = `${parent.slug}--${slug}`;
      }
    }

    const existing = await Category.findOne({ slug, _id: { $ne: id } }).select('_id').lean();
    if (existing) return NextResponse.json({ flag: false, message: "Category already exists" }, { status: 400 });

    const oldName = oldCategory.name;
    const oldSlug = oldCategory.slug;

    await Category.findByIdAndUpdate(id, { name: newName, slug });

    // Propagate parent slug change to sub-categories if this is a parent category
    if (!oldCategory.parent_id && oldSlug !== slug) {
      const subs = await Category.find({ parent_id: id }).lean();
      for (const sub of subs) {
        const subLocalPart = sub.slug.startsWith(`${oldSlug}--`) ? sub.slug.substring(oldSlug.length + 2) : sub.slug;
        const newSubSlug = `${slug}--${subLocalPart}`;
        await Category.findByIdAndUpdate(sub._id, { slug: newSubSlug });
      }
    }

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

    const { id } = await params;
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
