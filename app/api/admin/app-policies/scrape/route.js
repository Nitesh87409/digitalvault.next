import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth';

export async function POST(request) {
  try {
    const admin = verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ flag: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { url } = await request.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ flag: false, message: 'Play Store URL is required' }, { status: 400 });
    }

    // Extract package ID (e.g. ?id=com.example.app)
    let packageId = '';
    try {
      const parsedUrl = new URL(url.trim());
      packageId = parsedUrl.searchParams.get('id');
      if (!packageId && parsedUrl.pathname.includes('/store/apps/details')) {
        const idMatch = url.match(/[?&]id=([a-zA-Z0-9._]+)/);
        if (idMatch) packageId = idMatch[1];
      }
    } catch {
      const idMatch = url.match(/[?&]id=([a-zA-Z0-9._]+)/);
      if (idMatch) packageId = idMatch[1];
    }

    if (!packageId) {
      return NextResponse.json({
        flag: false,
        message: 'Could not find app ID in URL. Example: https://play.google.com/store/apps/details?id=com.example.app'
      }, { status: 400 });
    }

    const playStoreFetchUrl = `https://play.google.com/store/apps/details?id=${encodeURIComponent(packageId)}&hl=en&gl=US`;

    const response = await fetch(playStoreFetchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      return NextResponse.json({
        flag: false,
        message: `Failed to fetch from Google Play (Status: ${response.status}). Ensure the app is published and link is correct.`
      }, { status: 400 });
    }

    const html = await response.text();

    let appName = '';
    let appIcon = '';
    let shortDescription = '';
    let developerName = '';
    let contactEmail = '';
    let rating = '';
    let installs = '';
    const screenshots = [];

    // 1. Try parsing JSON-LD schema
    const jsonLdMatch = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
    if (jsonLdMatch && jsonLdMatch[1]) {
      try {
        const schema = JSON.parse(jsonLdMatch[1]);
        if (schema.name) appName = schema.name;
        if (schema.image) appIcon = schema.image;
        if (schema.description) shortDescription = schema.description;
        if (schema.aggregateRating?.ratingValue) {
          rating = String(Math.round(Number(schema.aggregateRating.ratingValue) * 10) / 10);
        }
        if (schema.author?.name) developerName = schema.author.name;
      } catch (err) {
        console.warn('JSON-LD parse error:', err.message);
      }
    }

    // 2. OpenGraph Fallbacks
    if (!appName) {
      const ogTitleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i);
      if (ogTitleMatch) {
        appName = ogTitleMatch[1].replace(/\s*-\s*Apps on Google Play$/i, '').trim();
      }
    }

    if (!appIcon) {
      const ogImageMatch = html.match(/<meta property="og:image" content="([^"]+)"/i);
      if (ogImageMatch) appIcon = ogImageMatch[1];
    }

    if (!shortDescription) {
      const ogDescMatch = html.match(/<meta property="og:description" content="([^"]+)"/i);
      if (ogDescMatch) shortDescription = ogDescMatch[1];
    }

    // 3. Fallback for meta description
    if (!shortDescription) {
      const metaDescMatch = html.match(/<meta name="description" content="([^"]+)"/i);
      if (metaDescMatch) shortDescription = metaDescMatch[1];
    }

    // Clean up description if too long
    if (shortDescription && shortDescription.length > 300) {
      shortDescription = shortDescription.substring(0, 297) + '...';
    }

    // 4. Developer Email fallback
    const emailMatch = html.match(/mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
    if (emailMatch) {
      contactEmail = emailMatch[1];
    }

    // 5. Installs / Downloads (e.g. 50K+, 1M+, 500+)
    const installsMatch = html.match(/([0-9]+(?:\.[0-9]+)?[KMBkmb]?\+?\s*(?:downloads|installs))/i);
    if (installsMatch) {
      installs = installsMatch[1].trim();
    }

    // 6. Rating fallback (e.g. "4.6 star")
    if (!rating) {
      const starMatch = html.match(/([1-5]\.[0-9])\s*★/);
      if (starMatch) rating = starMatch[1];
    }

    // 7. Extract Screenshots (Google user content URLs)
    const screenshotMatches = html.matchAll(/https:\/\/(?:play-lh|lh[0-9]+)\.googleusercontent\.com\/[a-zA-Z0-9_-]+/g);
    const seen = new Set();
    if (appIcon) {
      const iconBase = appIcon.split('=')[0];
      seen.add(iconBase);
    }

    for (const match of screenshotMatches) {
      const rawUrl = match[0];
      if (!seen.has(rawUrl)) {
        seen.add(rawUrl);
        screenshots.push(`${rawUrl}=w1080-h1920`);
        if (screenshots.length >= 6) break;
      }
    }

    // Slug recommendation
    const suggestedSlug = appName
      ? appName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
      : packageId.split('.').pop() || '';

    return NextResponse.json({
      flag: true,
      data: {
        appName,
        slug: suggestedSlug,
        playStoreUrl: `https://play.google.com/store/apps/details?id=${packageId}`,
        appIcon,
        shortDescription,
        developerName,
        contactEmail,
        rating,
        installs,
        screenshots,
      }
    });
  } catch (error) {
    console.error('[AppPolicy Scrape Error]:', error);
    return NextResponse.json({ flag: false, message: 'Error scraping Play Store details: ' + error.message }, { status: 500 });
  }
}
