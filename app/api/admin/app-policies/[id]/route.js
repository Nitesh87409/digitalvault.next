import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AppPolicy from '@/models/AppPolicy';
import { verifyAdmin } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    const admin = verifyAdmin(request);
    if (!admin) return NextResponse.json({ flag: false, message: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();
    const { appName, slug, contactEmail, privacyPolicy, termsConditions } = body;

    const trimmedAppName = typeof appName === 'string' ? appName.trim() : '';
    let trimmedSlug = typeof slug === 'string' ? slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : '';

    if (!trimmedAppName || !trimmedSlug) {
      return NextResponse.json({ flag: false, message: 'App Name and Slug are required' }, { status: 400 });
    }

    const slugExists = await AppPolicy.findOne({ slug: trimmedSlug, _id: { $ne: id } });
    if (slugExists) {
      return NextResponse.json({ flag: false, message: 'Slug already exists. Please choose another.' }, { status: 400 });
    }

    const appPolicy = await AppPolicy.findByIdAndUpdate(
      id,
      {
        appName: trimmedAppName,
        slug: trimmedSlug,
        contactEmail: typeof contactEmail === 'string' ? contactEmail.trim() : '',
        privacyPolicy: typeof privacyPolicy === 'string' ? privacyPolicy : '',
        termsConditions: typeof termsConditions === 'string' ? termsConditions : '',
      },
      { new: true }
    );

    if (!appPolicy) {
      return NextResponse.json({ flag: false, message: 'App Policy not found' }, { status: 404 });
    }

    return NextResponse.json({ flag: true, message: 'App Policy updated successfully', appPolicy });
  } catch (error) {
    console.error('[Admin AppPolicies PUT] error:', error);
    return NextResponse.json({ flag: false, message: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const admin = verifyAdmin(request);
    if (!admin) return NextResponse.json({ flag: false, message: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const deletedPolicy = await AppPolicy.findByIdAndDelete(id);
    if (!deletedPolicy) {
      return NextResponse.json({ flag: false, message: 'App Policy not found' }, { status: 404 });
    }

    return NextResponse.json({ flag: true, message: 'App Policy deleted successfully' });
  } catch (error) {
    console.error('[Admin AppPolicies DELETE] error:', error);
    return NextResponse.json({ flag: false, message: 'Server error' }, { status: 500 });
  }
}
