import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Proxy the request to the Express server
    const backendUrl = process.env.BACKEND_URL || 'https://heirloom-express-backend.onrender.com';
    const response = await fetch(`${backendUrl}/api/user/language-dashboards`, {
      method: 'GET',
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
      },
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Get language dashboards proxy error:', error);
    return NextResponse.json(
      { error: 'Language dashboards service unavailable' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Proxy the request to the Express server
    const backendUrl = process.env.BACKEND_URL || 'https://heirloom-express-backend.onrender.com';
    const response = await fetch(`${backendUrl}/api/user/language-dashboards`, {
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
    console.error('Create language dashboard proxy error:', error);
    return NextResponse.json(
      { error: 'Language dashboard creation service unavailable' },
      { status: 500 }
    );
  }
}
