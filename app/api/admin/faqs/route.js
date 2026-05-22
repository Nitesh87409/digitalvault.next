import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Faq from '@/models/Faq';
import { verifyAdmin } from '@/lib/auth';

function unauthorized() {
  return NextResponse.json({ flag: false, message: 'Unauthorized' }, { status: 401 });
}

export async function GET(request) {
  try {
    await connectDB();
    const admin = verifyAdmin(request);
    if (!admin) return unauthorized();

    const faqs = await Faq.find({}).sort({ order: 1 });
    return NextResponse.json({ flag: true, faqs });
  } catch (error) {
    console.error('[Admin Faqs] GET error:', error);
    return NextResponse.json({ flag: false, message: 'Server error fetching FAQs' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const admin = verifyAdmin(request);
    if (!admin) return unauthorized();

    const body = await request.json();
    const { q, a, order, is_active } = body;

    if (!q || !a) {
      return NextResponse.json({ flag: false, message: 'Question and answer are required' }, { status: 400 });
    }

    const newFaq = new Faq({
      q: typeof q === 'string' ? q.trim() : '',
      a: typeof a === 'string' ? a.trim() : '',
      order: order !== undefined ? Number(order) : 0,
      is_active: is_active !== undefined ? !!is_active : true,
    });

    await newFaq.save();
    return NextResponse.json({ flag: true, message: 'FAQ created successfully', faq: newFaq });
  } catch (error) {
    console.error('[Admin Faqs] POST error:', error);
    return NextResponse.json({ flag: false, message: 'Server error creating FAQ' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await connectDB();
    const admin = verifyAdmin(request);
    if (!admin) return unauthorized();

    const body = await request.json();
    const { id, q, a, order, is_active } = body;

    if (!id) {
      return NextResponse.json({ flag: false, message: 'FAQ ID is required' }, { status: 400 });
    }

    const faq = await Faq.findById(id);
    if (!faq) {
      return NextResponse.json({ flag: false, message: 'FAQ not found' }, { status: 404 });
    }

    if (q !== undefined) faq.q = typeof q === 'string' ? q.trim() : q;
    if (a !== undefined) faq.a = typeof a === 'string' ? a.trim() : a;
    if (order !== undefined) faq.order = Number(order);
    if (is_active !== undefined) faq.is_active = !!is_active;

    await faq.save();
    return NextResponse.json({ flag: true, message: 'FAQ updated successfully', faq });
  } catch (error) {
    console.error('[Admin Faqs] PUT error:', error);
    return NextResponse.json({ flag: false, message: 'Server error updating FAQ' }, { status: 500 });
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
      return NextResponse.json({ flag: false, message: 'FAQ ID is required' }, { status: 400 });
    }

    await Faq.findByIdAndDelete(id);
    return NextResponse.json({ flag: true, message: 'FAQ deleted successfully' });
  } catch (error) {
    console.error('[Admin Faqs] DELETE error:', error);
    return NextResponse.json({ flag: false, message: 'Server error deleting FAQ' }, { status: 500 });
  }
}
