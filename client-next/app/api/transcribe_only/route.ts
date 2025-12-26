import { NextRequest, NextResponse } from 'next/server';

// Call Python API directly for transcription
const PYTHON_API_URL = (process.env.AI_BACKEND_URL || 'https://beyondwords.onrender.com').replace(/\/$/, '');

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File | null;
    const language = formData.get('language') as string || 'en';

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Convert file to buffer and base64
    const arrayBuffer = await audioFile.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);
    const audioBase64 = audioBuffer.toString('base64');

    console.log(`[TRANSCRIBE_API] Received audio file: ${audioFile.name}, size: ${audioBuffer.length} bytes`);

    // Send audio data as base64 to Python API
    const response = await fetch(`${PYTHON_API_URL}/transcribe_only`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio_data: audioBase64,
        audio_filename: audioFile.name || 'recording.webm',
        language: language,
      }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('[TRANSCRIBE_API] Error:', error);
    return NextResponse.json(
      { error: 'Proxy error', details: error.message },
      { status: 500 }
    );
  }
}

