import { NextRequest, NextResponse } from 'next/server';
import { adminDb, getUserFromRequest } from '@/lib/firebase-admin';

const USERS_COLLECTION = 'users';
const DASHBOARDS_SUBCOLLECTION = 'language_dashboards';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const user = await getUserFromRequest(authHeader);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const snapshot = await adminDb
      .collection(USERS_COLLECTION)
      .doc(user.uid)
      .collection(DASHBOARDS_SUBCOLLECTION)
      .get();

    const dashboards = snapshot.docs.map(doc => ({
      language: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(dashboards);
  } catch (error: any) {
    console.error('[LANGUAGE_DASHBOARDS_API] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboards', details: error.message },
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

    const { language, proficiency, talkTopics, learningGoals, practicePreference, isPrimary } = body;

    if (!language || !proficiency || !talkTopics || !learningGoals || !practicePreference) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const dashboardData = {
      proficiency,
      talkTopics,
      learningGoals,
      practicePreference,
      isPrimary: isPrimary || false,
      created_at: now,
      updated_at: now,
    };

    await adminDb
      .collection(USERS_COLLECTION)
      .doc(user.uid)
      .collection(DASHBOARDS_SUBCOLLECTION)
      .doc(language)
      .set(dashboardData);

    return NextResponse.json({
      language,
      ...dashboardData,
      message: 'Dashboard created',
    }, { status: 201 });
  } catch (error: any) {
    console.error('[LANGUAGE_DASHBOARDS_API] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create dashboard', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get('authorization');
    const user = await getUserFromRequest(authHeader);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { language, updates } = body;

    if (!language || !updates) {
      return NextResponse.json(
        { error: 'Missing language or updates' },
        { status: 400 }
      );
    }

    const docRef = adminDb
      .collection(USERS_COLLECTION)
      .doc(user.uid)
      .collection(DASHBOARDS_SUBCOLLECTION)
      .doc(language);

    const doc = await docRef.get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 });
    }

    await docRef.update({
      ...updates,
      updated_at: new Date().toISOString(),
    });

    const updated = await docRef.get();
    return NextResponse.json({
      language,
      ...updated.data(),
    });
  } catch (error: any) {
    console.error('[LANGUAGE_DASHBOARDS_API] PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update dashboard', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get('authorization');
    const user = await getUserFromRequest(authHeader);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { language } = body;

    if (!language) {
      return NextResponse.json(
        { error: 'Missing language' },
        { status: 400 }
      );
    }

    await adminDb
      .collection(USERS_COLLECTION)
      .doc(user.uid)
      .collection(DASHBOARDS_SUBCOLLECTION)
      .doc(language)
      .delete();

    return NextResponse.json({ message: 'Dashboard deleted' });
  } catch (error: any) {
    console.error('[LANGUAGE_DASHBOARDS_API] DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete dashboard', details: error.message },
      { status: 500 }
    );
  }
}
