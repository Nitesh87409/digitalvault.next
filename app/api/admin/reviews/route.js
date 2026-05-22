import { NextResponse } from "next/server";
import connectMongo from "@/lib/mongodb";
import Review from "@/models/Review";
import Product from "@/models/Product";
import { verifyAdmin } from "@/lib/auth";

function unauthorized() {
  return NextResponse.json({ flag: false, message: "Unauthorized" }, { status: 401 });
}

function parseRating(value) {
  const rating = Number.parseInt(value, 10);
  return Number.isInteger(rating) ? rating : null;
}

async function updateProductRatings(productId) {
  try {
    const reviews = await Review.find({ product_id: productId, is_approved: true }).select('rating').lean();

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const average_rating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : 0;
    const total_reviews = reviews.length;

    await Product.findByIdAndUpdate(productId, { average_rating, total_reviews });
  } catch (error) {
    console.error("[Admin Reviews] rating update error:", error);
  }
}

export async function GET(request) {
  try {
    await connectMongo();

    const admin = verifyAdmin(request);
    if (!admin) return unauthorized();

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const rating = searchParams.get("rating");
    const status = searchParams.get("status");

    const query = {};
    if (productId) query.product_id = productId;
    if (rating) query.rating = parseRating(rating);
    if (status === "approved") query.is_approved = true;
    if (status === "pending") query.is_approved = false;

    const reviews = await Review.find(query)
      .populate("product_id", "name images")
      .populate("customer_id", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ flag: true, reviews });
  } catch (error) {
    console.error("[Admin Reviews] GET error:", error);
    return NextResponse.json({ flag: false, message: "Server error fetching reviews" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectMongo();

    const admin = verifyAdmin(request);
    if (!admin) return unauthorized();

    const body = await request.json();
    const { product_id, customer_name, rating, review_text, verified_purchase, is_featured, is_approved } = body;

    if (!product_id || !customer_name || !rating) {
      return NextResponse.json({ flag: false, message: "Product, customer name, and rating are required" }, { status: 400 });
    }

    const parsedRating = parseRating(rating);
    if (!parsedRating || parsedRating < 1 || parsedRating > 5) {
      return NextResponse.json({ flag: false, message: "Rating must be between 1 and 5" }, { status: 400 });
    }

    const newReview = new Review({
      product_id,
      customer_name: typeof customer_name === "string" ? customer_name.trim() : "",
      rating: parsedRating,
      review_text: typeof review_text === "string" ? review_text.trim() : "",
      verified_purchase: !!verified_purchase,
      is_featured: !!is_featured,
      is_approved: is_approved !== undefined ? !!is_approved : true,
      is_admin_review: true,
    });

    await newReview.save();
    await updateProductRatings(product_id);

    return NextResponse.json({ flag: true, message: "Review created successfully", review: newReview });
  } catch (error) {
    console.error("[Admin Reviews] POST error:", error);
    return NextResponse.json({ flag: false, message: "Server error creating review" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await connectMongo();

    const admin = verifyAdmin(request);
    if (!admin) return unauthorized();

    const body = await request.json();
    const { id, review_text, rating, is_approved, is_featured, verified_purchase, customer_name } = body;

    if (!id) {
      return NextResponse.json({ flag: false, message: "Review ID is required" }, { status: 400 });
    }

    const review = await Review.findById(id);
    if (!review) {
      return NextResponse.json({ flag: false, message: "Review not found" }, { status: 404 });
    }

    if (review_text !== undefined) review.review_text = typeof review_text === "string" ? review_text.trim() : review_text;
    if (rating !== undefined) {
      const parsedRating = parseRating(rating);
      if (!parsedRating || parsedRating < 1 || parsedRating > 5) {
        return NextResponse.json({ flag: false, message: "Rating must be between 1 and 5" }, { status: 400 });
      }
      review.rating = parsedRating;
    }
    if (is_approved !== undefined) review.is_approved = !!is_approved;
    if (is_featured !== undefined) review.is_featured = !!is_featured;
    if (verified_purchase !== undefined) review.verified_purchase = !!verified_purchase;
    if (customer_name !== undefined) review.customer_name = typeof customer_name === "string" ? customer_name.trim() : customer_name;

    await review.save();
    await updateProductRatings(review.product_id);

    return NextResponse.json({ flag: true, message: "Review updated successfully", review });
  } catch (error) {
    console.error("[Admin Reviews] PUT error:", error);
    return NextResponse.json({ flag: false, message: "Server error updating review" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await connectMongo();

    const admin = verifyAdmin(request);
    if (!admin) return unauthorized();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ flag: false, message: "Review ID is required" }, { status: 400 });
    }

    const review = await Review.findByIdAndDelete(id);
    if (review) {
      await updateProductRatings(review.product_id);
    }

    return NextResponse.json({ flag: true, message: "Review deleted successfully" });
  } catch (error) {
    console.error("[Admin Reviews] DELETE error:", error);
    return NextResponse.json({ flag: false, message: "Server error deleting review" }, { status: 500 });
  }
}
