import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import HomepageReview from '@/models/HomepageReview';

export const dynamic = 'force-dynamic';

const defaultReviews = [
  { name: 'Rahul Kumar', role: 'Freelance Designer', review: 'Best investment I made this year. The templates saved me 40+ hours of work. Highly recommended!', initials: 'RK', color: 'linear-gradient(135deg,#f5c842,#e0a800)', textColor: '#0a0a0f', order: 1 },
  { name: 'Priya Sharma', role: 'Startup Founder', review: 'The growth playbook alone is worth 10x the price. My startup grew from 0 to 5k users in 3 months!', initials: 'PS', color: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', textColor: '#fff', order: 2 },
  { name: 'Arjun Mehta', role: 'Digital Marketer', review: 'Instant download worked perfectly. Quality is exceptional. Will definitely buy again!', initials: 'AM', color: 'linear-gradient(135deg,#10b981,#065f46)', textColor: '#fff', order: 3 },
];

export async function GET(request) {
  try {
    await connectDB();
    let reviews = await HomepageReview.find({ is_approved: true }).sort({ order: 1 }).lean();

    // Seed default reviews if collection is empty
    if (reviews.length === 0) {
      const count = await HomepageReview.countDocuments();
      if (count === 0) {
        await HomepageReview.insertMany(defaultReviews);
        reviews = await HomepageReview.find({ is_approved: true }).sort({ order: 1 }).lean();
      }
    }

    return NextResponse.json({ flag: 1, reviews });
  } catch (e) {
    console.error('[HomepageReviews GET] error:', e);
    return NextResponse.json({ flag: 0, message: 'Server error' }, { status: 500 });
  }
}
