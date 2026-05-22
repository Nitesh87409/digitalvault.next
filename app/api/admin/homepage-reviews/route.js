import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import HomepageReview from '@/models/HomepageReview';
import { verifyAdmin } from '@/lib/auth';

function unauthorized() {
  return NextResponse.json({ flag: false, message: 'Unauthorized' }, { status: 401 });
}

export async function GET(request) {
  try {
    await connectDB();
    const admin = verifyAdmin(request);
    if (!admin) return unauthorized();

    const reviews = await HomepageReview.find({}).sort({ order: 1 });
    return NextResponse.json({ flag: true, reviews });
  } catch (error) {
    console.error('[Admin HomepageReviews] GET error:', error);
    return NextResponse.json({ flag: false, message: 'Server error fetching reviews' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const admin = verifyAdmin(request);
    if (!admin) return unauthorized();

    const body = await request.json();
    const { name, role, review, rating, initials, color, textColor, order, is_approved } = body;

    if (!name || !role || !review || !initials) {
      return NextResponse.json({ flag: false, message: 'Name, role, review, and initials are required' }, { status: 400 });
    }

    const newReview = new HomepageReview({
      name: typeof name === 'string' ? name.trim() : '',
      role: typeof role === 'string' ? role.trim() : '',
      review: typeof review === 'string' ? review.trim() : '',
      rating: rating !== undefined ? Number(rating) : 5,
      initials: typeof initials === 'string' ? initials.trim() : '',
      color: typeof color === 'string' ? color.trim() : 'linear-gradient(135deg,#f5c842,#e0a800)',
      textColor: typeof textColor === 'string' ? textColor.trim() : '#0a0a0f',
      order: order !== undefined ? Number(order) : 0,
      is_approved: is_approved !== undefined ? !!is_approved : true,
    });

    await newReview.save();
    return NextResponse.json({ flag: true, message: 'Homepage review created successfully', review: newReview });
  } catch (error) {
    console.error('[Admin HomepageReviews] POST error:', error);
    return NextResponse.json({ flag: false, message: 'Server error creating review' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await connectDB();
    const admin = verifyAdmin(request);
    if (!admin) return unauthorized();

    const body = await request.json();
    const { id, name, role, review, rating, initials, color, textColor, order, is_approved } = body;

    if (!id) {
      return NextResponse.json({ flag: false, message: 'Review ID is required' }, { status: 400 });
    }

    const homepageReview = await HomepageReview.findById(id);
    if (!homepageReview) {
      return NextResponse.json({ flag: false, message: 'Review not found' }, { status: 404 });
    }

    if (name !== undefined) homepageReview.name = typeof name === 'string' ? name.trim() : name;
    if (role !== undefined) homepageReview.role = typeof role === 'string' ? role.trim() : role;
    if (review !== undefined) homepageReview.review = typeof review === 'string' ? review.trim() : review;
    if (rating !== undefined) homepageReview.rating = Number(rating);
    if (initials !== undefined) homepageReview.initials = typeof initials === 'string' ? initials.trim() : initials;
    if (color !== undefined) homepageReview.color = typeof color === 'string' ? color.trim() : color;
    if (textColor !== undefined) homepageReview.textColor = typeof textColor === 'string' ? textColor.trim() : textColor;
    if (order !== undefined) homepageReview.order = Number(order);
    if (is_approved !== undefined) homepageReview.is_approved = !!is_approved;

    await homepageReview.save();
    return NextResponse.json({ flag: true, message: 'Homepage review updated successfully', review: homepageReview });
  } catch (error) {
    console.error('[Admin HomepageReviews] PUT error:', error);
    return NextResponse.json({ flag: false, message: 'Server error updating review' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await connectDB();
    const admin = verifyAdmin(request);
    if (!admin) return unauthorized();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ flag: false, message: 'Review ID is required' }, { status: 400 });
    }

    await HomepageReview.findByIdAndDelete(id);
    return NextResponse.json({ flag: true, message: 'Homepage review deleted successfully' });
  } catch (error) {
    console.error('[Admin HomepageReviews] DELETE error:', error);
    return NextResponse.json({ flag: false, message: 'Server error deleting review' }, { status: 500 });
  }
}
