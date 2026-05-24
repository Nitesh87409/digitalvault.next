import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth';
import cloudinary from '@/lib/cloudinary';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export async function POST(request) {
  try {
    const admin = verifyAdmin(request);
    if (!admin) return NextResponse.json({ flag: 0, message: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) return NextResponse.json({ flag: 0, message: 'No file provided' });
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ flag: 0, message: 'Only JPG, PNG, WEBP and GIF images are allowed' });
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ flag: 0, message: 'Image must be 5MB or smaller' });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'digitalvault/products' },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
      uploadStream.end(buffer);
    });

    return NextResponse.json({
      flag: 1,
      url: uploadResult.secure_url,
      message: 'File uploaded successfully'
    });
  } catch (e) {
    console.error('Upload error:', e.message);
    return NextResponse.json({ flag: 0, message: 'Upload failed' });
  }
}
