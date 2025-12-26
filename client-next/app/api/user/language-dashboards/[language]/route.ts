import { NextRequest, NextResponse } from 'next/server';
import { adminDb, getUserFromRequest } from '@/lib/firebase-admin';

const USERS_COLLECTION = 'users';
const DASHBOARDS_SUBCOLLECTION = 'language_dashboards';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ language: string }> }
) {
  try {
    const { language } = await params;
    const authHeader = request.headers.get('authorization');
    const user = await getUserFromRequest(authHeader);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const docRef = adminDb
      .collection(USERS_COLLECTION)
      .doc(user.uid)
      .collection(DASHBOARDS_SUBCOLLECTION)
      .doc(language);

    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ dashboard: null }, { status: 200 });
    }

    return NextResponse.json({
      dashboard: {
        language,
        ...doc.data(),
      },
    });
  } catch (error: any) {
    console.error('[LANGUAGE_DASHBOARD_API] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch language dashboard', details: error.message },
      { status: 500 }
    );
  }
}
