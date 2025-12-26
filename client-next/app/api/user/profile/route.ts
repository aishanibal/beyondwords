import { NextRequest, NextResponse } from 'next/server';
import { adminDb, getUserFromRequest } from '@/lib/firebase-admin';

// User profiles stored directly in Firestore
const USERS_COLLECTION = 'users';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const user = await getUserFromRequest(authHeader);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userDoc = await adminDb.collection(USERS_COLLECTION).doc(user.uid).get();
    
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    return NextResponse.json({
      id: user.uid,
      ...userData,
    });
  } catch (error: any) {
    console.error('[USER_PROFILE_GET] Error:', error);
    return NextResponse.json(
      { error: 'Profile fetch failed', details: error.message },
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

    // Check if user already exists
    const existingUser = await adminDb.collection(USERS_COLLECTION).doc(user.uid).get();
    if (existingUser.exists) {
      return NextResponse.json({
        id: user.uid,
        ...existingUser.data(),
        message: 'User already exists',
      });
    }

    // Create new user profile
    const now = new Date().toISOString();
    const userData = {
      email: body.email || user.email,
      name: body.name || '',
      first_name: body.first_name || '',
      last_name: body.last_name || '',
      preferences: body.preferences || {},
      created_at: now,
      updated_at: now,
    };

    await adminDb.collection(USERS_COLLECTION).doc(user.uid).set(userData);

    return NextResponse.json({
      id: user.uid,
      ...userData,
      message: 'User profile created',
    }, { status: 201 });
  } catch (error: any) {
    console.error('[USER_PROFILE_POST] Error:', error);
    return NextResponse.json(
      { error: 'Profile creation failed', details: error.message },
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

    // Build update data
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.first_name !== undefined) updateData.first_name = body.first_name;
    if (body.last_name !== undefined) updateData.last_name = body.last_name;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.preferences !== undefined) updateData.preferences = body.preferences;

    await adminDb.collection(USERS_COLLECTION).doc(user.uid).update(updateData);

    // Fetch updated user
    const updatedDoc = await adminDb.collection(USERS_COLLECTION).doc(user.uid).get();

    return NextResponse.json({
      id: user.uid,
      ...updatedDoc.data(),
      message: 'Profile updated',
    });
  } catch (error: any) {
    console.error('[USER_PROFILE_PUT] Error:', error);
    return NextResponse.json(
      { error: 'Profile update failed', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const user = await getUserFromRequest(authHeader);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete user profile from Firestore
    await adminDb.collection(USERS_COLLECTION).doc(user.uid).delete();

    return NextResponse.json({ message: 'Account deleted' });
  } catch (error: any) {
    console.error('[USER_PROFILE_DELETE] Error:', error);
    return NextResponse.json(
      { error: 'Account deletion failed', details: error.message },
      { status: 500 }
    );
  }
}
