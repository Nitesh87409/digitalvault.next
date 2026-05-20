import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectMongo from '@/lib/mongodb';
import Review from '@/models/Review';
import Order from '@/models/Order';
import Product from '@/models/Product';
import Customer from '@/models/Customer';
import { verifyCustomer } from '@/lib/auth';

const MAX_REVIEW_LENGTH = 1000;

function parseRating(value) {
  const rating = Number.parseInt(value, 10);
  return Number.isInteger(rating) ? rating : null;
}

function unauthorized(message = 'Unauthorized. Please login.') {
  return NextResponse.json({ flag: false, message }, { status: 401 });
}

async function getVerifiedPurchase(request, productId) {
  const user = verifyCustomer(request);
  if (!user?.id || !mongoose.Types.ObjectId.isValid(user.id)) {
    return { error: unauthorized() };
  }
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return {
      error: NextResponse.json({ flag: false, message: 'Invalid product' }, { status: 400 }),
    };
  }

  const [customer, product, order] = await Promise.all([
    Customer.findOne({ _id: user.id, is_blocked: { $ne: true } }).select('name').lean(),
    Product.findById(productId).select('_id').lean(),
    Order.findOne({
      customer_id: user.id,
      product_id: productId,
      payment_status: 1,
    }).select('_id customer_id product_id').lean(),
  ]);

  if (!customer) return { error: unauthorized() };
  if (!product) {
    return {
      error: NextResponse.json({ flag: false, message: 'Product not found' }, { status: 404 }),
    };
  }
  if (!order) {
    return {
      error: NextResponse.json({ flag: false, message: 'You must purchase this product to review it.' }, { status: 403 }),
    };
  }

  return { customer, userId: user.id };
}

// Get approved reviews for a product
export async function GET(request) {
  try {
    await connectMongo();
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json({ flag: false, message: 'Valid product ID is required' }, { status: 400 });
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

    const body = await request.json();
    const { product_id, rating, review_text } = body;

    if (!product_id || !rating) {
      return NextResponse.json({ flag: false, message: 'Product and rating are required' }, { status: 400 });
    }

    const parsedRating = parseRating(rating);
    if (!parsedRating || parsedRating < 1 || parsedRating > 5) {
      return NextResponse.json({ flag: false, message: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    const cleanText = typeof review_text === 'string' ? review_text.trim().slice(0, MAX_REVIEW_LENGTH) : '';
    const verified = await getVerifiedPurchase(request, product_id);
    if (verified.error) return verified.error;

    // Check if review already exists
    const existingReview = await Review.findOne({ product_id, customer_id: verified.userId }).lean();
    if (existingReview) {
      return NextResponse.json({ flag: false, message: 'You have already reviewed this product.' }, { status: 400 });
    }

    const newReview = new Review({
      product_id,
      customer_id: verified.userId,
      customer_name: verified.customer.name || 'Customer',
      rating: parsedRating,
      review_text: cleanText,
      verified_purchase: true,
      is_approved: true
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
