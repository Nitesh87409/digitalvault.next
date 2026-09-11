import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AppPolicy from '@/models/AppPolicy';
import { verifyAdmin } from '@/lib/auth';

export async function GET(request) {
  try {
    const admin = verifyAdmin(request);
    if (!admin) return NextResponse.json({ flag: false, message: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const appPolicies = await AppPolicy.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ flag: true, appPolicies });
  } catch (error) {
    console.error('[Admin AppPolicies] GET error:', error);
    return NextResponse.json({ flag: false, message: 'Server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const admin = verifyAdmin(request);
    if (!admin) return NextResponse.json({ flag: false, message: 'Unauthorized' }, { status: 401 });

    await connectDB();
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
    } = body;

    const trimmedAppName = typeof appName === 'string' ? appName.trim() : '';
    let trimmedSlug = typeof slug === 'string' ? slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : '';

    if (!trimmedAppName || !trimmedSlug) {
      return NextResponse.json({ flag: false, message: 'App Name and Slug are required' }, { status: 400 });
    }

    const slugExists = await AppPolicy.exists({ slug: trimmedSlug });
    if (slugExists) {
      return NextResponse.json({ flag: false, message: 'Slug already exists. Please choose another.' }, { status: 400 });
    }

    const appPolicy = await AppPolicy.create({
      appName: trimmedAppName,
      slug: trimmedSlug,
      contactEmail: typeof contactEmail === 'string' ? contactEmail.trim() : '',
      privacyPolicy: typeof privacyPolicy === 'string' ? privacyPolicy : '',
      termsConditions: typeof termsConditions === 'string' ? termsConditions : '',
      playStoreUrl: typeof playStoreUrl === 'string' ? playStoreUrl.trim() : '',
      appIcon: typeof appIcon === 'string' ? appIcon.trim() : '',
      shortDescription: typeof shortDescription === 'string' ? shortDescription.trim() : '',
      screenshots: Array.isArray(screenshots) ? screenshots.filter(s => typeof s === 'string' && s.trim()) : [],
      rating: typeof rating === 'string' ? rating.trim() : '',
      installs: typeof installs === 'string' ? installs.trim() : '',
      developerName: typeof developerName === 'string' ? developerName.trim() : '',
    });

    return NextResponse.json({ flag: true, message: 'App Policy created successfully', appPolicy });
  } catch (error) {
    console.error('[Admin AppPolicies] POST error:', error);
    return NextResponse.json({ flag: false, message: 'Server error' }, { status: 500 });
  }
}
