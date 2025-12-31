import { NextRequest, NextResponse } from 'next/server';

// Call Python API directly for AI operations
const PYTHON_API_URL = (process.env.AI_BACKEND_URL || 'https://beyondwordsapi-759507959904.us-east1.run.app').replace(/\/$/, '');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${PYTHON_API_URL}/quick_translation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('[QUICK_TRANSLATION_API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get quick translation', details: error.message },
      { status: 500 }
    );
  }
}

