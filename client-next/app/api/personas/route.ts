import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('[API] GET /api/personas called');
  
  try {
    console.log('[API] Authorization header:', request.headers.get('Authorization') ? 'Present' : 'Missing');
    
    // Proxy the request to the Express server
    const backendUrl = 'https://beyondwords-express.onrender.com';
    console.log('[API] Backend URL:', backendUrl);
    console.log('[API] Making request to:', `${backendUrl}/api/personas`);
    
    const response = await fetch(`${backendUrl}/api/personas`, {
      method: 'GET',
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Content-Type': 'application/json',
      },
    });

    console.log('[API] Backend response status:', response.status);
    console.log('[API] Backend response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('[API] Backend error response:', errorText);
      return NextResponse.json(
        { error: 'Backend service unavailable', status: response.status, details: errorText },
        { status: 500 }
      );
    }
    
    const data = await response.json();
    console.log('[API] Backend response data:', data);
    
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('[API] Get personas proxy error:', error);
    console.error('[API] Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json(
      { error: 'Personas service unavailable', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Proxy the request to the Express server
    const backendUrl = 'https://beyondwords-express.onrender.com';
    const response = await fetch(`${backendUrl}/api/personas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('[API] Backend error response:', errorText);
      return NextResponse.json(
        { error: 'Backend service unavailable', status: response.status, details: errorText },
        { status: 500 }
      );
    }
    
    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Create persona proxy error:', error);
    return NextResponse.json(
      { error: 'Persona creation service unavailable' },
      { status: 500 }
    );
  }
}
