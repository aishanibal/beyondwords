import { NextRequest, NextResponse } from 'next/server';

// Call Python API directly for analysis
const PYTHON_API_URL = (process.env.AI_BACKEND_URL || 'https://beyondwords.onrender.com').replace(/\/$/, '');

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Forward the form data to Python API
    const response = await fetch(`${PYTHON_API_URL}/analyze`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('[ANALYZE_API] Error:', error);
    return NextResponse.json(
      { error: 'Proxy error', details: error.message },
      { status: 500 }
    );
  }
}

