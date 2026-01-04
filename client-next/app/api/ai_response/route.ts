import { NextRequest, NextResponse } from 'next/server';
import { GoogleAuth } from 'google-auth-library';

// Call Python API directly for AI operations
const PYTHON_API_URL = (process.env.AI_BACKEND_URL || 'https://beyondwordsapi-759507959904.us-east1.run.app').replace(/\/$/, '');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Use Google Auth to get ID token for authenticated Cloud Run calls
    const auth = new GoogleAuth();
    const client = await auth.getIdTokenClient(PYTHON_API_URL);

    const response = await client.request({
      url: `${PYTHON_API_URL}/ai_response`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data: body,
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('[AI_RESPONSE_API] Error:', error);
    return NextResponse.json(
      { error: 'Proxy error', details: error.message },
      { status: 500 }
    );
  }
}

