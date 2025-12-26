import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

// Registration is handled by Firebase Auth on client-side
// This endpoint creates the user profile in Firestore after Firebase Auth signup
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firebaseToken, name, email } = body;

    if (!firebaseToken) {
      return NextResponse.json(
        { error: 'Firebase token required' },
        { status: 400 }
      );
    }

    // Verify Firebase token
    const decodedToken = await adminAuth.verifyIdToken(firebaseToken);
    const uid = decodedToken.uid;

    // Check if user already exists
    const existingUser = await adminDb.collection('users').doc(uid).get();
    if (existingUser.exists) {
      return NextResponse.json({
        user: {
          id: uid,
          ...existingUser.data(),
        },
        message: 'User already exists',
      });
    }

    // Create user profile in Firestore
    const now = new Date().toISOString();
    const userData = {
      email: email || decodedToken.email,
      name: name || '',
      created_at: now,
      updated_at: now,
    };

    await adminDb.collection('users').doc(uid).set(userData);

    return NextResponse.json({
      user: {
        id: uid,
        ...userData,
      },
      token: firebaseToken,
      message: 'Registration successful',
    }, { status: 201 });
  } catch (error: any) {
    console.error('[REGISTER_API] Error:', error);
    return NextResponse.json(
      { error: 'Registration failed', details: error.message },
      { status: 500 }
    );
  }
}
