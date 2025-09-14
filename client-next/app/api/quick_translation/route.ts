import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Proxy the request to the Express server
    const response = await fetch('http://localhost:4000/api/quick_translation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Quick translation proxy error:', error);
    return NextResponse.json(
      { error: 'Quick translation service unavailable' },
      { status: 500 }
    );
  }
} 