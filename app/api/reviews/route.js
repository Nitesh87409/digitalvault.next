import { NextResponse } from 'next/server';
import connectMongo from '@/lib/mongodb';
import Review from '@/models/Review';
import Order from '@/models/Order';
import Product from '@/models/Product';
import { verifyCustomer } from '@/lib/auth';

// Get approved reviews for a product
export async function GET(request) {
  try {
    await connectMongo();
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ flag: false, message: 'Product ID is required' }, { status: 400 });
    }

    const reviews = await Review.find({ product_id: productId, is_approved: true })
      .populate('customer_id', 'name')
      .sort({ is_featured: -1, createdAt: -1 });

    return NextResponse.json({ flag: true, reviews });
  } catch (error) {
    console.error('Reviews GET Error:', error);
    return NextResponse.json({ flag: false, message: 'Server error fetching reviews' }, { status: 500 });
  }
}

// Create a review by a customer
export async function POST(request) {
  try {
    await connectMongo();
    
    // Verify customer
    const user = verifyCustomer(request);
    if (!user || !user.id) {
      return NextResponse.json({ flag: false, message: 'Unauthorized. Please login.' }, { status: 401 });
    }

    const body = await request.json();
    const { product_id, rating, review_text } = body;

    if (!product_id || !rating) {
      return NextResponse.json({ flag: false, message: 'Product and rating are required' }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ flag: false, message: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    // Check if the user has purchased the product
    const order = await Order.findOne({
      customer_id: user.id,
      product_id: product_id,
      payment_status: 1
    });

    if (!order) {
      return NextResponse.json({ flag: false, message: 'You must purchase this product to review it.' }, { status: 403 });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ product_id, customer_id: user.id });
    if (existingReview) {
      return NextResponse.json({ flag: false, message: 'You have already reviewed this product.' }, { status: 400 });
    }

    const newReview = new Review({
      product_id,
      customer_id: user.id,
      customer_name: user.name || 'Customer',
      rating: parseInt(rating),
      review_text: review_text?.trim() || '',
      verified_purchase: true, // Automatically verified since we checked the order
      is_approved: true // Auto-approve for now, admin can change it later
    });

    await newReview.save();

    // Update Product average_rating and total_reviews
    await updateProductRatings(product_id);

    return NextResponse.json({ flag: true, message: 'Review submitted successfully', review: newReview });
  } catch (error) {
    if (error.code === 11000) {
       return NextResponse.json({ flag: false, message: 'You have already reviewed this product.' }, { status: 400 });
    }
    console.error('Reviews POST Error:', error);
    return NextResponse.json({ flag: false, message: 'Server error submitting review' }, { status: 500 });
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
