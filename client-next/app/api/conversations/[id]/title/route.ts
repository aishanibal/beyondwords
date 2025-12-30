import { NextRequest, NextResponse } from 'next/server';
import { adminDb, getUserFromRequest } from '@/lib/firebase-admin';

const CONVERSATIONS_COLLECTION = 'conversations';

export async function PUT(
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
      title: body.title,
      updated_at: new Date().toISOString(),
    };

    // Also save synopsis if provided
    if (body.synopsis !== undefined) {
      updateData.synopsis = body.synopsis;
    }

    // Also save progress_data if provided
    if (body.progress_data !== undefined) {
      updateData.progress_data = body.progress_data;
    }

    await docRef.update(updateData);

    return NextResponse.json({ 
      id,
      title: body.title,
      synopsis: body.synopsis,
      message: 'Conversation updated' 
    });
  } catch (error: any) {
    console.error('[TITLE_API] PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update title', details: error.message },
      { status: 500 }
    );
  }
}
