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

    // Fetch messages from subcollection
    const messagesSnapshot = await docRef
      .collection('messages')
      .orderBy('message_order', 'asc')
      .get();
    
    const messages = messagesSnapshot.docs.map(msgDoc => ({
      id: msgDoc.id,
      ...msgDoc.data(),
    }));

    return NextResponse.json(messages);
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

    const now = new Date().toISOString();
    
    // Add new message to messages subcollection (consistent with conversation creation)
    const newMessage = {
      conversation_id: id,
      sender: body.sender || 'user',
      text: body.text || body.content || '',
      message_type: body.messageType || 'text',
      message_order: body.message_order || Date.now(),
      created_at: now,
    };

    const messageRef = await docRef.collection('messages').add(newMessage);

    // Update conversation's updated_at and increment message_count
    await docRef.update({
      updated_at: now,
      message_count: FieldValue.increment(1),
    });

    return NextResponse.json({ id: messageRef.id, ...newMessage }, { status: 201 });
  } catch (error: any) {
    console.error('[MESSAGES_API] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to add message', details: error.message },
      { status: 500 }
    );
  }
}
