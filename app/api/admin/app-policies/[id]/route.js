import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AppPolicy from '@/models/AppPolicy';
import { verifyAdmin } from '@/lib/auth';
import cloudinary from '@/lib/cloudinary';

// Extract public ID from Cloudinary URL
function getCloudinaryPublicId(url) {
  if (!url || typeof url !== 'string' || !url.includes('res.cloudinary.com')) return null;
  try {
    const uploadIdx = url.indexOf('/upload/');
    if (uploadIdx === -1) return null;
    let path = url.substring(uploadIdx + 8); // skip '/upload/'
    
    // Strip version segment if exists (e.g. 'v12345678/')
    const firstSlash = path.indexOf('/');
    if (firstSlash !== -1) {
      const firstSegment = path.substring(0, firstSlash);
      if (/^v\d+$/.test(firstSegment)) {
        path = path.substring(firstSlash + 1);
      }
    }
    
    // Strip file extension
    const lastDot = path.lastIndexOf('.');
    if (lastDot !== -1) {
      path = path.substring(0, lastDot);
    }
    return path;
  } catch (e) {
    return null;
  }
}

// Delete media asset from Cloudinary
async function deleteFromCloudinary(url) {
  const publicId = getCloudinaryPublicId(url);
  if (!publicId) return false;
  try {
    const res = await cloudinary.uploader.destroy(publicId);
    return res.result === 'ok';
  } catch (e) {
    console.error('Failed to delete from Cloudinary:', e);
    return false;
  }
}

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

    // If updating screenshots, icon, or SEO content, clean up any removed Cloudinary images to save space
    if (body.screenshots !== undefined || body.appIcon !== undefined || body.landingPageContent !== undefined) {
      const existingDoc = await AppPolicy.findById(id).select('appIcon screenshots landingPageContent').lean();
      if (existingDoc) {
        if (body.appIcon !== undefined && existingDoc.appIcon && existingDoc.appIcon !== updateData.appIcon) {
          await deleteFromCloudinary(existingDoc.appIcon);
        }
        if (body.screenshots !== undefined && Array.isArray(existingDoc.screenshots)) {
          const newScreenshotsSet = new Set(updateData.screenshots || []);
          for (const oldShot of existingDoc.screenshots) {
            if (!newScreenshotsSet.has(oldShot)) {
              await deleteFromCloudinary(oldShot);
            }
          }
        }
        if (body.landingPageContent !== undefined && existingDoc.landingPageContent) {
          const oldMatches = existingDoc.landingPageContent.match(/https:\/\/res\.cloudinary\.com\/[^\s"'>)]+/g) || [];
          const newMatches = new Set((body.landingPageContent || '').match(/https:\/\/res\.cloudinary\.com\/[^\s"'>)]+/g) || []);
          for (const oldImg of oldMatches) {
            if (!newMatches.has(oldImg)) {
              await deleteFromCloudinary(oldImg);
            }
          }
        }
      }
    }

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

    const existingPolicy = await AppPolicy.findById(id);
    if (!existingPolicy) {
      return NextResponse.json({ flag: false, message: 'App Policy not found' }, { status: 404 });
    }

    // Clean up all Cloudinary assets (appIcon, screenshots, and SEO blog embedded images) to save storage space
    const imagesToDelete = [];
    if (existingPolicy.appIcon) imagesToDelete.push(existingPolicy.appIcon);
    if (Array.isArray(existingPolicy.screenshots)) {
      imagesToDelete.push(...existingPolicy.screenshots);
    }

    // Also scan landingPageContent (SEO Blog/Guide), privacyPolicy, and termsConditions for any embedded Cloudinary images
    const textToScan = `${existingPolicy.landingPageContent || ''} ${existingPolicy.privacyPolicy || ''} ${existingPolicy.termsConditions || ''}`;
    const cloudinaryRegex = /https:\/\/res\.cloudinary\.com\/[^\s"'>)]+/g;
    const matches = textToScan.match(cloudinaryRegex);
    if (matches && matches.length > 0) {
      imagesToDelete.push(...matches);
    }

    // Remove duplicates
    const uniqueImages = Array.from(new Set(imagesToDelete));
    for (const imgUrl of uniqueImages) {
      await deleteFromCloudinary(imgUrl);
    }

    // Delete record from MongoDB
    await AppPolicy.findByIdAndDelete(id);

    return NextResponse.json({ flag: true, message: 'App Policy and all associated storage assets deleted successfully' });
  } catch (error) {
    console.error('[Admin AppPolicies DELETE] error:', error);
    return NextResponse.json({ flag: false, message: 'Server error' }, { status: 500 });
  }
}
