import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

// Token exchange - verifies Firebase token and ensures user exists in Firestore
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get('authorization') || '';
    
    // Get token from body or header
    const firebaseToken = body.firebaseToken || 
      (authHeader.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : null);

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
      // Create user profile
      const now = new Date().toISOString();
      userData = {
        email: body.email || decodedToken.email,
        name: body.name || '',
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
      token: firebaseToken, // Client uses Firebase token directly
      success: true,
    });
  } catch (error: any) {
    console.error('[EXCHANGE_API] Error:', error);
    return NextResponse.json(
      { error: 'Token exchange failed', details: error.message },
      { status: 401 }
    );
  }
}
