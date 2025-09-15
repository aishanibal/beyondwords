import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('🔍 [QUICK_TRANSLATION_API] Request received:', {
      method: 'POST',
      body: body,
      headers: Object.fromEntries(request.headers.entries())
    });

    // Proxy the request to the Express server
    const backendUrl = process.env.BACKEND_URL || 'https://beyondwords-express.onrender.com';
    
    console.log('🔍 [QUICK_TRANSLATION_API] Calling backend:', {
      url: `${backendUrl}/api/quick_translation`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      }
    });
    
    const response = await fetch(`${backendUrl}/api/quick_translation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    console.log('🔍 [QUICK_TRANSLATION_API] Backend response:', {
      status: response.status,
      data: data
    });
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('🔍 [QUICK_TRANSLATION_API] Error:', error);
    return NextResponse.json(
      { error: 'Quick translation service unavailable' },
      { status: 500 }
    );
  }
} 