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
    const {
      appName,
      slug,
      contactEmail,
      privacyPolicy,
      termsConditions,
      playStoreUrl,
      appIcon,
      shortDescription,
      screenshots,
      rating,
      installs,
      developerName,
      landingPageContent,
    } = body;

    const updateData = {};

    if (body.appName !== undefined) {
      const trimmedAppName = typeof appName === 'string' ? appName.trim() : '';
      if (!trimmedAppName) return NextResponse.json({ flag: false, message: 'App Name is required' }, { status: 400 });
      updateData.appName = trimmedAppName;
    }

    if (body.slug !== undefined) {
      let trimmedSlug = typeof slug === 'string' ? slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : '';
      if (!trimmedSlug) return NextResponse.json({ flag: false, message: 'Slug is required' }, { status: 400 });
      const slugExists = await AppPolicy.findOne({ slug: trimmedSlug, _id: { $ne: id } });
      if (slugExists) {
        return NextResponse.json({ flag: false, message: 'Slug already exists. Please choose another.' }, { status: 400 });
      }
      updateData.slug = trimmedSlug;
    }

    if (body.contactEmail !== undefined) updateData.contactEmail = typeof contactEmail === 'string' ? contactEmail.trim() : '';
    if (body.privacyPolicy !== undefined) updateData.privacyPolicy = typeof privacyPolicy === 'string' ? privacyPolicy : '';
    if (body.termsConditions !== undefined) updateData.termsConditions = typeof termsConditions === 'string' ? termsConditions : '';
    if (body.playStoreUrl !== undefined) updateData.playStoreUrl = typeof playStoreUrl === 'string' ? playStoreUrl.trim() : '';
    if (body.appIcon !== undefined) updateData.appIcon = typeof appIcon === 'string' ? appIcon.trim() : '';
    if (body.shortDescription !== undefined) updateData.shortDescription = typeof shortDescription === 'string' ? shortDescription.trim() : '';
    if (body.screenshots !== undefined) updateData.screenshots = Array.isArray(screenshots) ? screenshots.filter(s => typeof s === 'string' && s.trim()) : [];
    if (body.rating !== undefined) updateData.rating = typeof rating === 'string' ? rating.trim() : '';
    if (body.installs !== undefined) updateData.installs = typeof installs === 'string' ? installs.trim() : '';
    if (body.developerName !== undefined) updateData.developerName = typeof developerName === 'string' ? developerName.trim() : '';
    if (body.landingPageContent !== undefined) updateData.landingPageContent = typeof landingPageContent === 'string' ? landingPageContent : '';

    const appPolicy = await AppPolicy.findByIdAndUpdate(
      id,
      { $set: updateData },
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
