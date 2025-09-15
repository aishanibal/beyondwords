import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language');
    
    // Proxy the request to the Express server
    const backendUrl = process.env.BACKEND_URL || 'https://heirloom-express-backend.onrender.com';
    const url = language ? `${backendUrl}/api/conversations?language=${language}` : `${backendUrl}/api/conversations`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
      },
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Get conversations proxy error:', error);
    return NextResponse.json(
      { error: 'Conversations service unavailable' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Proxy the request to the Express server
    const backendUrl = process.env.BACKEND_URL || 'https://heirloom-express-backend.onrender.com';
    const response = await fetch(`${backendUrl}/api/conversations`, {
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
    console.error('Create conversation proxy error:', error);
    return NextResponse.json(
      { error: 'Conversation creation service unavailable' },
      { status: 500 }
    );
  }
}
