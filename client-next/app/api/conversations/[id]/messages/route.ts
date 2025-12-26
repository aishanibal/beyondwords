import { NextRequest, NextResponse } from 'next/server';
import { adminDb, getUserFromRequest } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const CONVERSATIONS_COLLECTION = 'conversations';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    const user = await getUserFromRequest(authHeader);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const docRef = adminDb.collection(CONVERSATIONS_COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const data = doc.data();
    if (data?.user_id !== user.uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(data?.messages || []);
  } catch (error: any) {
    console.error('[MESSAGES_API] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const authHeader = request.headers.get('authorization');
    const user = await getUserFromRequest(authHeader);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const docRef = adminDb.collection(CONVERSATIONS_COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const data = doc.data();
    if (data?.user_id !== user.uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Add new message to messages array
    const newMessage = {
      id: `msg_${Date.now()}`,
      role: body.role || 'user',
      content: body.content,
      timestamp: new Date().toISOString(),
      ...body,
    };

    await docRef.update({
      messages: FieldValue.arrayUnion(newMessage),
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json(newMessage, { status: 201 });
  } catch (error: any) {
    console.error('[MESSAGES_API] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to add message', details: error.message },
      { status: 500 }
    );
  }
}
