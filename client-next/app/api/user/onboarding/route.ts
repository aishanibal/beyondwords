import { NextRequest, NextResponse } from 'next/server';
import { adminDb, getUserFromRequest } from '@/lib/firebase-admin';

const USERS_COLLECTION = 'users';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get('authorization');
    const user = await getUserFromRequest(authHeader);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update user profile with onboarding data
    await adminDb.collection(USERS_COLLECTION).doc(user.uid).update({
      onboarding_completed: true,
      onboarding_data: body,
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({ 
      message: 'Onboarding completed',
      success: true,
    });
  } catch (error: any) {
    console.error('[ONBOARDING_API] Error:', error);
    return NextResponse.json(
      { error: 'Onboarding failed', details: error.message },
      { status: 500 }
    );
  }
}
