import { NextRequest, NextResponse } from 'next/server';
import { adminDb, getUserFromRequest } from '@/lib/firebase-admin';

const PERSONAS_COLLECTION = 'personas';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const user = await getUserFromRequest(authHeader);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const snapshot = await adminDb.collection(PERSONAS_COLLECTION)
      .where('user_id', '==', user.uid)
      .orderBy('created_at', 'desc')
      .get();

    const personas = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(personas);
  } catch (error: any) {
    console.error('[PERSONAS_GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch personas', details: error.message },
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
    const personaData = {
      user_id: user.uid,
      name: body.name || 'New Persona',
      description: body.description || '',
      personality: body.personality || '',
      language: body.language || 'en',
      created_at: now,
      updated_at: now,
    };

    const docRef = await adminDb.collection(PERSONAS_COLLECTION).add(personaData);

    return NextResponse.json({
      id: docRef.id,
      ...personaData,
    }, { status: 201 });
  } catch (error: any) {
    console.error('[PERSONAS_POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create persona', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const authHeader = request.headers.get('authorization');
    const user = await getUserFromRequest(authHeader);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ error: 'Persona ID required' }, { status: 400 });
    }

    const docRef = adminDb.collection(PERSONAS_COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 });
    }

    const data = doc.data();
    if (data?.user_id !== user.uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await docRef.delete();

    return NextResponse.json({ message: 'Persona deleted' });
  } catch (error: any) {
    console.error('[PERSONAS_DELETE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete persona', details: error.message },
      { status: 500 }
    );
  }
}
