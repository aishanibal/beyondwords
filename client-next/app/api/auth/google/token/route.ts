import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Proxy the request to the Express server
    const backendUrl = process.env.BACKEND_URL || 'https://heirloom-express-backend.onrender.com';
    const response = await fetch(`${backendUrl}/auth/google/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Google auth proxy error:', error);
    return NextResponse.json(
      { error: 'Google authentication service unavailable' },
      { status: 500 }
    );
  }
}
