import { NextRequest, NextResponse } from 'next/server';
import { adminDb, getUserFromRequest } from '@/lib/firebase-admin';

const USERS_COLLECTION = 'users';
const DASHBOARDS_SUBCOLLECTION = 'language_dashboards';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    console.log('[LANGUAGE_DASHBOARDS_API] GET - Auth header present:', !!authHeader);
    
    const user = await getUserFromRequest(authHeader);
    
    if (!user) {
      console.log('[LANGUAGE_DASHBOARDS_API] GET - No user from token');
      return NextResponse.json({ error: 'Unauthorized', details: 'Token verification failed' }, { status: 401 });
    }

    console.log('[LANGUAGE_DASHBOARDS_API] GET - Fetching dashboards for user:', user.uid);
    
    const snapshot = await adminDb
      .collection(USERS_COLLECTION)
      .doc(user.uid)
      .collection(DASHBOARDS_SUBCOLLECTION)
      .get();

    console.log('[LANGUAGE_DASHBOARDS_API] GET - Found', snapshot.docs.length, 'dashboards');

    // Map Firestore field names to expected dashboard format
    const dashboards = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        language: doc.id,
        proficiency_level: data.proficiency || data.proficiency_level,
        talk_topics: data.talkTopics || data.talk_topics || [],
        learning_goals: data.learningGoals || data.learning_goals || [],
        practice_preference: data.practicePreference || data.practice_preference,
        feedback_language: data.feedbackLanguage || data.feedback_language,
        is_primary: data.isPrimary || data.is_primary || false,
        speak_speed: data.speak_speed || 1.0,
        romanization_display: data.romanization_display || 'both',
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    });

    return NextResponse.json({ dashboards });
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

    // Accept both camelCase and snake_case field names
    const language = body.language;
    const proficiency = body.proficiency || body.proficiency_level;
    const talkTopics = body.talkTopics || body.talk_topics || [];
    const learningGoals = body.learningGoals || body.learning_goals || [];
    const practicePreference = body.practicePreference || body.practice_preference;
    const feedbackLanguage = body.feedbackLanguage || body.feedback_language || 'en';
    const isPrimary = body.isPrimary || body.is_primary || false;

    if (!language || !proficiency || !talkTopics || !learningGoals || !practicePreference) {
      return NextResponse.json(
        { error: 'Missing required fields', received: { language, proficiency, talkTopics, learningGoals, practicePreference } },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    // Store in snake_case format for consistency
    const dashboardData = {
      proficiency_level: proficiency,
      talk_topics: talkTopics,
      learning_goals: learningGoals,
      practice_preference: practicePreference,
      feedback_language: feedbackLanguage,
      is_primary: isPrimary,
      speak_speed: 1.0,
      romanization_display: 'both',
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
      dashboard: {
        language,
        ...dashboardData,
      },
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

    // Normalize updates to snake_case
    const normalizedUpdates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    
    if (updates.proficiency || updates.proficiency_level) {
      normalizedUpdates.proficiency_level = updates.proficiency || updates.proficiency_level;
    }
    if (updates.talkTopics || updates.talk_topics) {
      normalizedUpdates.talk_topics = updates.talkTopics || updates.talk_topics;
    }
    if (updates.learningGoals || updates.learning_goals) {
      normalizedUpdates.learning_goals = updates.learningGoals || updates.learning_goals;
    }
    if (updates.practicePreference || updates.practice_preference) {
      normalizedUpdates.practice_preference = updates.practicePreference || updates.practice_preference;
    }
    if (updates.feedbackLanguage || updates.feedback_language) {
      normalizedUpdates.feedback_language = updates.feedbackLanguage || updates.feedback_language;
    }
    if (updates.isPrimary !== undefined || updates.is_primary !== undefined) {
      normalizedUpdates.is_primary = updates.isPrimary ?? updates.is_primary;
    }
    if (updates.speak_speed !== undefined) {
      normalizedUpdates.speak_speed = updates.speak_speed;
    }
    if (updates.romanization_display !== undefined) {
      normalizedUpdates.romanization_display = updates.romanization_display;
    }

    await docRef.update(normalizedUpdates);

    const updated = await docRef.get();
    const data = updated.data();
    
    return NextResponse.json({
      dashboard: {
        language,
        proficiency_level: data?.proficiency_level,
        talk_topics: data?.talk_topics || [],
        learning_goals: data?.learning_goals || [],
        practice_preference: data?.practice_preference,
        feedback_language: data?.feedback_language,
        is_primary: data?.is_primary || false,
        speak_speed: data?.speak_speed || 1.0,
        romanization_display: data?.romanization_display || 'both',
        created_at: data?.created_at,
        updated_at: data?.updated_at,
      },
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
