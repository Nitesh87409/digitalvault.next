import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Faq from '@/models/Faq';

export const dynamic = 'force-dynamic';

const defaultFaqs = [
  { q: 'How do I get my download after payment?', a: "After successful payment, you'll receive an email with a secure download link. You also have lifetime access via My Account.", order: 1 },
  { q: 'Can I use these products for clients?', a: 'Yes! You get a commercial license to use all products for personal and client projects.', order: 2 },
  { q: 'What payment methods are accepted?', a: 'We accept all major credit/debit cards, UPI, net banking, and wallets via Razorpay.', order: 3 },
  { q: 'Is there a refund policy?', a: 'Yes! We offer a 7-day no-questions-asked refund policy.', order: 4 },
  { q: 'Do I get future updates?', a: 'Yes! All future updates are free for existing customers forever.', order: 5 },
];

export async function GET(request) {
  try {
    await connectDB();
    let faqs = await Faq.find({ is_active: true }).sort({ order: 1 }).lean();
    
    // Seed default FAQs if collection is empty
    if (faqs.length === 0) {
      const count = await Faq.countDocuments();
      if (count === 0) {
        await Faq.insertMany(defaultFaqs);
        faqs = await Faq.find({ is_active: true }).sort({ order: 1 }).lean();
      }
    }

    return NextResponse.json({ flag: 1, faqs });
  } catch (e) {
    console.error('[Faqs GET] error:', e);
    return NextResponse.json({ flag: 0, message: 'Server error' }, { status: 500 });
  }
}
