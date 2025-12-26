import { NextRequest, NextResponse } from 'next/server';
import { adminDb, getUserFromRequest } from '@/lib/firebase-admin';

const CONVERSATIONS_COLLECTION = 'conversations';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const user = await getUserFromRequest(authHeader);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language');

    let query = adminDb.collection(CONVERSATIONS_COLLECTION)
      .where('user_id', '==', user.uid)
      .orderBy('updated_at', 'desc');

    if (language) {
      query = adminDb.collection(CONVERSATIONS_COLLECTION)
        .where('user_id', '==', user.uid)
        .where('language', '==', language)
        .orderBy('updated_at', 'desc');
    }

    const snapshot = await query.get();
    const conversations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(conversations);
  } catch (error: any) {
    console.error('[CONVERSATIONS_GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get('authorization');
    const user = await getUserFromRequest(authHeader);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date().toISOString();
    const conversationData = {
      user_id: user.uid,
      title: body.title || 'New Conversation',
      language: body.language || 'en',
      messages: body.messages || [],
      persona: body.persona || null,
      created_at: now,
      updated_at: now,
    };

    const docRef = await adminDb.collection(CONVERSATIONS_COLLECTION).add(conversationData);

    return NextResponse.json({
      id: docRef.id,
      ...conversationData,
    }, { status: 201 });
  } catch (error: any) {
    console.error('[CONVERSATIONS_POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation', details: error.message },
      { status: 500 }
    );
  }
}
