import { NextResponse } from 'next/server';
import connectMongo from '@/lib/mongodb';
import Review from '@/models/Review';
import Product from '@/models/Product';
import { verifyCustomer } from '@/lib/auth';

// Update own review
export async function PUT(request, { params }) {
  try {
    await connectMongo();
    
    const user = verifyCustomer(request);
    if (!user || !user.id) {
      return NextResponse.json({ flag: false, message: 'Unauthorized. Please login.' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { rating, review_text } = body;

    const review = await Review.findOne({ _id: id, customer_id: user.id });
    if (!review) {
      return NextResponse.json({ flag: false, message: 'Review not found or unauthorized' }, { status: 404 });
    }

    if (rating !== undefined) {
      if (rating < 1 || rating > 5) return NextResponse.json({ flag: false, message: 'Invalid rating' }, { status: 400 });
      review.rating = parseInt(rating);
    }
    
    if (review_text !== undefined) {
      review.review_text = review_text.trim();
    }

    await review.save();
    await updateProductRatings(review.product_id);

    return NextResponse.json({ flag: true, message: 'Review updated successfully', review });
  } catch (error) {
    console.error('Review PUT Error:', error);
    return NextResponse.json({ flag: false, message: 'Server error updating review' }, { status: 500 });
  }
}

// Delete own review
export async function DELETE(request, { params }) {
  try {
    await connectMongo();
    
    const user = verifyCustomer(request);
    if (!user || !user.id) {
      return NextResponse.json({ flag: false, message: 'Unauthorized. Please login.' }, { status: 401 });
    }

    const { id } = await params;

    const review = await Review.findOneAndDelete({ _id: id, customer_id: user.id });
    if (!review) {
      return NextResponse.json({ flag: false, message: 'Review not found or unauthorized' }, { status: 404 });
    }

    await updateProductRatings(review.product_id);

    return NextResponse.json({ flag: true, message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Review DELETE Error:', error);
    return NextResponse.json({ flag: false, message: 'Server error deleting review' }, { status: 500 });
  }
}

async function updateProductRatings(productId) {
  try {
    const reviews = await Review.find({ product_id: productId, is_approved: true }).select('rating').lean();
    
    let totalRating = 0;
    reviews.forEach(r => { totalRating += r.rating; });
    
    const average_rating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : 0;
    const total_reviews = reviews.length;

    await Product.findByIdAndUpdate(productId, { average_rating, total_reviews });
  } catch (error) {
    console.error('Error updating product ratings:', error);
  }
}
