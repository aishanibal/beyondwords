import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { conversationId, language } = body;
  const authHeader = req.headers.get('authorization') || '';

  if (!conversationId) {
    return NextResponse.json({ error: 'No conversation ID provided' }, { status: 400 });
  }

  try {
    const backendRes = await fetch('http://localhost:4000/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({ conversationId, language }),
    });

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error: any) {
    return NextResponse.json({ error: 'Proxy error', details: error?.message }, { status: 500 });
  }
} 