import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const admin = verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ flag: 0, message: 'Unauthorized' }, { status: 401 });
    }

    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[OpenRouter Fetch Error]:', errorText);
      return NextResponse.json({ flag: 0, message: 'Failed to fetch models from OpenRouter' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ 
      flag: 1, 
      data: data.data || [] 
    });

  } catch (error) {
    console.error('[OpenRouter Models API Route Error]:', error);
    return NextResponse.json({ flag: 0, message: 'Internal Server Error' }, { status: 500 });
  }
}
