import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Category from "@/models/Category";
import { verifyAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await connectDB();
    const all = await Category.find().sort({ createdAt: 1 }).lean();

    // Separate parents and children
    const parents = all.filter(c => !c.parent_id);
    const children = all.filter(c => !!c.parent_id);

    // Also return flat list for backward compatibility
    return NextResponse.json({ flag: true, categories: all, parents, children });
  } catch (error) {
    return NextResponse.json({ flag: false, message: "Server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();

    const admin = verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ flag: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const parent_id = body?.parent_id || null;

    if (!name) {
      return NextResponse.json({ flag: false, message: "Category name is required" }, { status: 400 });
    }

    // Generate slug: if sub-category, prefix with parent slug
    let slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    if (parent_id) {
      const parent = await Category.findById(parent_id).select('slug').lean();
      if (!parent) return NextResponse.json({ flag: false, message: "Parent category not found" }, { status: 400 });
      slug = `${parent.slug}--${slug}`;
    }

    const existing = await Category.findOne({ slug }).select('_id').lean();
    if (existing) {
      return NextResponse.json({ flag: false, message: "Category already exists" }, { status: 400 });
    }

    const category = await Category.create({ name, slug, parent_id });
    return NextResponse.json({ flag: true, message: "Category created", category });
  } catch (error) {
    if (error.code === 11000) {
      return NextResponse.json({ flag: false, message: "Category already exists" }, { status: 400 });
    }
    console.error("[Categories] POST error:", error);
    return NextResponse.json({ flag: false, message: "Server error" }, { status: 500 });
  }
}
