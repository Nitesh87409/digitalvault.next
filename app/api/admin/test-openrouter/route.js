import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const admin = verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ flag: 0, message: 'Unauthorized session' }, { status: 401 });
    }

    const { apiKey, model } = await request.json();

    if (!apiKey) {
      return NextResponse.json({ flag: 0, message: 'API Key is empty. Please enter your API key first.' }, { status: 400 });
    }

    const targetModel = model || 'google/gemini-flash-1.5-exp:free';

    // Trigger a minimal validation request to OpenRouter chat completions
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://digitalvault.in',
        'X-Title': 'DigitalVault Connection Test'
      },
      body: JSON.stringify({
        model: targetModel,
        messages: [{ role: 'user', content: 'Say connected' }],
        max_tokens: 10
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      let parsedError = 'Unknown error';
      try {
        const errorJson = JSON.parse(errorText);
        parsedError = errorJson?.error?.message || errorJson?.error || errorText;
      } catch (e) {
        parsedError = errorText;
      }

      console.error('[OpenRouter Test Connection Failed]:', errorText);
      return NextResponse.json({ 
        flag: 0, 
        message: `Connection Failed: ${parsedError}` 
      });
    }

    const data = await response.json();
    const botReply = data?.choices?.[0]?.message?.content || 'ok';

    return NextResponse.json({
      flag: 1,
      message: 'Connection Successful! API is active.',
      reply: botReply
    });

  } catch (error) {
    console.error('[Test Connection Exception]:', error);
    return NextResponse.json({ flag: 0, message: 'Server connection exception occurred.' }, { status: 500 });
  }
}
