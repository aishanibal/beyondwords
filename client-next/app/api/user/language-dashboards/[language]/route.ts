import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { language: string } }
) {
  try {
    const { language } = params;
    
    // Proxy the request to the Express server
    const backendUrl = process.env.BACKEND_URL || 'https://beyondwords-express.onrender.com';
    const response = await fetch(`${backendUrl}/api/user/language-dashboards/${language}`, {
      method: 'GET',
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
      },
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Get language dashboard proxy error:', error);
    return NextResponse.json(
      { error: 'Language dashboard service unavailable' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { language: string } }
) {
  try {
    const { language } = params;
    const body = await request.json();
    
    // Proxy the request to the Express server
    const backendUrl = process.env.BACKEND_URL || 'https://beyondwords-express.onrender.com';
    const response = await fetch(`${backendUrl}/api/user/language-dashboards/${language}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Update language dashboard proxy error:', error);
    return NextResponse.json(
      { error: 'Language dashboard update service unavailable' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { language: string } }
) {
  try {
    const { language } = params;
    
    // Proxy the request to the Express server
    const backendUrl = process.env.BACKEND_URL || 'https://beyondwords-express.onrender.com';
    const response = await fetch(`${backendUrl}/api/user/language-dashboards/${language}`, {
      method: 'DELETE',
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
      },
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Delete language dashboard proxy error:', error);
    return NextResponse.json(
      { error: 'Language dashboard deletion service unavailable' },
      { status: 500 }
    );
  }
}
