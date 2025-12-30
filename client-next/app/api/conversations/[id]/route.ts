import { NextRequest, NextResponse } from 'next/server';
import { adminDb, getUserFromRequest } from '@/lib/firebase-admin';

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
    
    // Verify ownership
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

    return NextResponse.json({
      conversation: {
        id: doc.id,
        ...data,
        messages,
      }
    });
  } catch (error: any) {
    console.error('[CONVERSATION_API] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation', details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (body.title !== undefined) updateData.title = body.title;
    if (body.messages !== undefined) updateData.messages = body.messages;
    if (body.persona !== undefined) updateData.persona = body.persona;

    await docRef.update(updateData);

    const updated = await docRef.get();
    return NextResponse.json({
      id: updated.id,
      ...updated.data(),
    });
  } catch (error: any) {
    console.error('[CONVERSATION_API] PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update conversation', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    await docRef.delete();

    return NextResponse.json({ message: 'Conversation deleted' });
  } catch (error: any) {
    console.error('[CONVERSATION_API] DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete conversation', details: error.message },
      { status: 500 }
    );
  }
}
