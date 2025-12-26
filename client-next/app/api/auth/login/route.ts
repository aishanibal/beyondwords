import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

// Login is handled by Firebase Auth on client-side
// This endpoint verifies Firebase token and returns user data
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

    // Get user profile from Firestore
    const userDoc = await adminDb.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found. Please sign up first.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: uid,
        email: decodedToken.email,
        ...userDoc.data(),
      },
      token: firebaseToken, // Client can use Firebase token directly
    });
  } catch (error: any) {
    console.error('[LOGIN_API] Error:', error);
    return NextResponse.json(
      { error: 'Login failed', details: error.message },
      { status: 401 }
    );
  }
}
