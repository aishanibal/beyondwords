import { NextRequest, NextResponse } from 'next/server';

// Call Python API directly for TTS
const PYTHON_API_URL = (process.env.AI_BACKEND_URL || 'https://beyondwordsapi-759507959904.us-east1.run.app').replace(/\/$/, '');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Map 'language' to 'language_code' for Python API compatibility
    const pythonBody = {
      text: body.text,
      language_code: body.language || body.language_code || 'en',
      output_path: body.output_path,
      cacheKey: body.cacheKey,
    };

    console.log('[TTS_API] Sending to Python:', { text: pythonBody.text?.substring(0, 50), language_code: pythonBody.language_code });

    const response = await fetch(`${PYTHON_API_URL}/generate_tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pythonBody),
    });

    const data = await response.json();

    let ttsUrl: string | null = null;
    if (data.success && data.output_path) {
      // Python serves the file at /uploads/<filename>
      ttsUrl = `${PYTHON_API_URL}/uploads/${encodeURIComponent(data.output_path)}`;
    }
    return NextResponse.json({...data, ttsUrl, },  { status: response.status });
  } catch (error: any) {
    console.error('[TTS_API] Error:', error);
    return NextResponse.json(
      { error: 'TTS generation failed', details: error.message },
      { status: 500 }
    );
  }
}

