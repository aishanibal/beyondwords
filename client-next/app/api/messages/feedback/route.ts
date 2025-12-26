import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

const FEEDBACK_COLLECTION = 'message_feedback';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messageId, feedback } = body;

    if (!messageId || !feedback) {
      return NextResponse.json(
        { error: 'Missing messageId or feedback' },
        { status: 400 }
      );
    }

    // Store feedback in Firestore
    await adminDb.collection(FEEDBACK_COLLECTION).add({
      messageId,
      feedback,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ 
      message: 'Feedback stored',
      success: true,
    });
  } catch (error: any) {
    console.error('[MESSAGE_FEEDBACK_API] Error:', error);
    return NextResponse.json(
      { error: 'Error storing feedback', details: error.message },
      { status: 500 }
    );
  }
}
