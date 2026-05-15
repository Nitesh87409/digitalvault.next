import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { verifyAdmin } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export async function POST(request) {
  try {
    const admin = verifyAdmin(request);
    if (!admin) return NextResponse.json({ flag: 0, message: 'Unauthorized' });

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

    // Create uploads directory
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products');
    await mkdir(uploadDir, { recursive: true });

    // Unique filename
    const ext = path.extname(file.name).toLowerCase() || '.jpg';
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    const filePath = path.join(uploadDir, uniqueName);

    await writeFile(filePath, buffer);

    return NextResponse.json({
      flag: 1,
      url: `/uploads/products/${uniqueName}`,
      message: 'File uploaded successfully'
    });
  } catch (e) {
    console.error('Upload error:', e.message);
    return NextResponse.json({ flag: 0, message: 'Upload failed' });
  }
}
