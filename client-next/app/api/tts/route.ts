import { NextRequest, NextResponse } from 'next/server';

// Call Python API directly for TTS
const PYTHON_API_URL = (process.env.AI_BACKEND_URL || 'https://beyondwords.onrender.com').replace(/\/$/, '');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${PYTHON_API_URL}/generate_tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('[TTS_API] Error:', error);
    return NextResponse.json(
      { error: 'TTS generation failed', details: error.message },
      { status: 500 }
    );
  }
}

