import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

// Google sign-in is handled by Firebase Auth on client-side
// This endpoint verifies the Firebase token and ensures user profile exists
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firebaseToken } = body;

    if (!firebaseToken) {
      return NextResponse.json(
        { error: 'Firebase token required' },
        { status: 400 }
      );
    }

    // Verify Firebase token
    const decodedToken = await adminAuth.verifyIdToken(firebaseToken);
    const uid = decodedToken.uid;

    // Get or create user profile
    const userDoc = await adminDb.collection('users').doc(uid).get();
    
    let userData;
    if (!userDoc.exists) {
      // Create user profile from Google auth data
      const now = new Date().toISOString();
      userData = {
        email: decodedToken.email,
        name: decodedToken.name || '',
        picture: decodedToken.picture || '',
        provider: 'google',
        created_at: now,
        updated_at: now,
      };
      await adminDb.collection('users').doc(uid).set(userData);
    } else {
      userData = userDoc.data();
    }

    return NextResponse.json({
      user: {
        id: uid,
        email: decodedToken.email,
        ...userData,
      },
      token: firebaseToken,
      success: true,
    });
  } catch (error: any) {
    console.error('[GOOGLE_TOKEN_API] Error:', error);
    return NextResponse.json(
      { error: 'Google sign-in failed', details: error.message },
      { status: 401 }
    );
  }
}
