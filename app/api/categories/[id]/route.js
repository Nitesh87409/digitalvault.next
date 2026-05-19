import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Category from "@/models/Category";
import { verifyAdmin } from "@/lib/auth";

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
