import { NextResponse } from 'next/server';
import connectMongo from '@/lib/mongodb';
import Review from '@/models/Review';
import Product from '@/models/Product';
import Customer from '@/models/Customer';

// Get all reviews for admin
export async function GET(request) {
  try {
    await connectMongo();
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const rating = searchParams.get('rating');
    const status = searchParams.get('status');

    let query = {};
    if (productId) query.product_id = productId;
    if (rating) query.rating = parseInt(rating);
    if (status === 'approved') query.is_approved = true;
    if (status === 'pending') query.is_approved = false;

    const reviews = await Review.find(query)
      .populate('product_id', 'name images')
      .populate('customer_id', 'name email')
      .sort({ createdAt: -1 });

    return NextResponse.json({ flag: true, reviews });
  } catch (error) {
    console.error('Admin Reviews GET Error:', error);
    return NextResponse.json({ flag: false, message: 'Server error fetching reviews' }, { status: 500 });
  }
}

// Create a manual/fake review as admin
export async function POST(request) {
  try {
    await connectMongo();
    const body = await request.json();
    const { product_id, customer_name, rating, review_text, verified_purchase, is_featured, is_approved } = body;

    if (!product_id || !customer_name || !rating) {
      return NextResponse.json({ flag: false, message: 'Product, customer name, and rating are required' }, { status: 400 });
    }

    const newReview = new Review({
      product_id,
      customer_name,
      rating: parseInt(rating),
      review_text,
      verified_purchase: !!verified_purchase,
      is_featured: !!is_featured,
      is_approved: is_approved !== undefined ? !!is_approved : true,
      is_admin_review: true
    });

    await newReview.save();

    // Update Product average_rating and total_reviews
    await updateProductRatings(product_id);

    return NextResponse.json({ flag: true, message: 'Review created successfully', review: newReview });
  } catch (error) {
    console.error('Admin Reviews POST Error:', error);
    return NextResponse.json({ flag: false, message: 'Server error creating review' }, { status: 500 });
  }
}

// Update a review (approve, feature, edit text)
export async function PUT(request) {
  try {
    await connectMongo();
    const body = await request.json();
    const { id, review_text, rating, is_approved, is_featured, verified_purchase, customer_name } = body;

    if (!id) {
      return NextResponse.json({ flag: false, message: 'Review ID is required' }, { status: 400 });
    }

    const review = await Review.findById(id);
    if (!review) {
      return NextResponse.json({ flag: false, message: 'Review not found' }, { status: 404 });
    }

    if (review_text !== undefined) review.review_text = review_text;
    if (rating !== undefined) review.rating = parseInt(rating);
    if (is_approved !== undefined) review.is_approved = !!is_approved;
    if (is_featured !== undefined) review.is_featured = !!is_featured;
    if (verified_purchase !== undefined) review.verified_purchase = !!verified_purchase;
    if (customer_name !== undefined) review.customer_name = customer_name;

    await review.save();
    await updateProductRatings(review.product_id);

    return NextResponse.json({ flag: true, message: 'Review updated successfully', review });
  } catch (error) {
    console.error('Admin Reviews PUT Error:', error);
    return NextResponse.json({ flag: false, message: 'Server error updating review' }, { status: 500 });
  }
}

// Delete a review
export async function DELETE(request) {
  try {
    await connectMongo();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ flag: false, message: 'Review ID is required' }, { status: 400 });
    }

    const review = await Review.findByIdAndDelete(id);
    if (review) {
      await updateProductRatings(review.product_id);
    }

    return NextResponse.json({ flag: true, message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Admin Reviews DELETE Error:', error);
    return NextResponse.json({ flag: false, message: 'Server error deleting review' }, { status: 500 });
  }
}

async function updateProductRatings(productId) {
  try {
    const reviews = await Review.find({ product_id: productId, is_approved: true });
    
    let totalRating = 0;
    reviews.forEach(r => { totalRating += r.rating; });
    
    const average_rating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : 0;
    const total_reviews = reviews.length;

    await Product.findByIdAndUpdate(productId, { average_rating, total_reviews });
  } catch (error) {
    console.error('Error updating product ratings:', error);
  }
}
