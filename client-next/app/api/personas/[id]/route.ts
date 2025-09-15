import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Proxy the request to the Express server
    const backendUrl = process.env.BACKEND_URL || 'https://heirloom-express-backend.onrender.com';
    const response = await fetch(`${backendUrl}/api/personas/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
      },
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Delete persona proxy error:', error);
    return NextResponse.json(
      { error: 'Persona deletion service unavailable' },
      { status: 500 }
    );
  }
}
