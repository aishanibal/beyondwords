import { NextRequest, NextResponse } from 'next/server';
import { adminDb, getUserFromRequest } from '@/lib/firebase-admin';

const CONVERSATIONS_COLLECTION = 'conversations';

// Get Python API URL - use environment variable or default to production
const PYTHON_API_URL = (process.env.AI_BACKEND_URL || 'https://beyondwordsapi-759507959904.us-east1.run.app').replace(/\/$/, '');
// AI API calls can take 20-60 seconds, especially for first call or complex prompts
const AI_API_TIMEOUT = parseInt(process.env.AI_API_TIMEOUT || '60000', 10); // Default 60 seconds

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const user = await getUserFromRequest(authHeader);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language');

    let query = adminDb.collection(CONVERSATIONS_COLLECTION)
      .where('user_id', '==', user.uid)
      .orderBy('updated_at', 'desc');

    if (language) {
      query = adminDb.collection(CONVERSATIONS_COLLECTION)
        .where('user_id', '==', user.uid)
        .where('language', '==', language)
        .orderBy('updated_at', 'desc');
    }

    const snapshot = await query.get();
    const conversations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(conversations);
  } catch (error: any) {
    console.error('[CONVERSATIONS_GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations', details: error.message },
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

    const language = body.language || 'en';
    
    // Check if language dashboard exists - language code is the document ID
    const dashboardDocRef = adminDb
      .collection('users')
      .doc(user.uid)
      .collection('language_dashboards')
      .doc(language);
    
    const dashboardDoc = await dashboardDocRef.get();
    
    if (!dashboardDoc.exists) {
      console.log(`[CONVERSATIONS_POST] Dashboard not found for language: ${language}, user: ${user.uid}`);
      return NextResponse.json(
        { error: 'Language dashboard not found. Please create a language dashboard first.' },
        { status: 404 }
      );
    }

    const dashboard = dashboardDoc.data();
    if (!dashboard) {
      console.log(`[CONVERSATIONS_POST] Dashboard data is empty for language: ${language}`);
      return NextResponse.json(
        { error: 'Language dashboard data is invalid.' },
        { status: 404 }
      );
    }
    
    const dashboardId = language; // Language code is the document ID
    
    // Generate initial AI message via Python API
    let aiMessage = '';
    let aiMessageError: string | null = null;
    
    try {
      console.log(`[CONVERSATIONS_POST] Calling Python API at ${PYTHON_API_URL}/ai_response`);
      
      const aiResponse = await fetch(`${PYTHON_API_URL}/ai_response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_input: '', // Empty for initial greeting
          chat_history: [],
          language: language,
          user_level: dashboard.proficiency_level || 'beginner',
          user_topics: body.topics || [],
          formality: body.formality || 'friendly',
          feedback_language: dashboard.feedback_language || 'en',
          user_goals: body.learningGoals || [],
          description: body.description || null
        }),
        // AI API calls can take 20-60 seconds, especially for first call or complex prompts
        signal: AbortSignal.timeout(AI_API_TIMEOUT)
      });
      
      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        aiMessage = aiData.response || '';
        console.log('[CONVERSATIONS_POST] Generated AI message:', aiMessage.substring(0, 50) + '...');
      } else {
        const errorText = await aiResponse.text();
        console.error(`[CONVERSATIONS_POST] Python API returned ${aiResponse.status}:`, errorText);
        aiMessageError = `Python API error: ${aiResponse.status}`;
      }
    } catch (error: any) {
      console.error('[CONVERSATIONS_POST] Error calling Python API:', error);
      console.error('[CONVERSATIONS_POST] Error details:', {
        message: error.message,
        name: error.name,
        cause: error.cause,
        pythonUrl: PYTHON_API_URL
      });
      aiMessageError = error.message;
      // Continue without AI message - it can be generated later
    }

    const now = new Date().toISOString();
    const conversationData = {
      user_id: user.uid,
      language_dashboard_id: dashboardId,
      title: body.title || 'New Conversation',
      language: language,
      topics: body.topics || [],
      formality: body.formality || 'friendly',
      description: body.description || null,
      learning_goals: body.learningGoals || [],
      selected_subgoals: body.selectedSubgoals || [],
      uses_persona: body.usesPersona || false,
      persona_id: body.personaId || null,
      message_count: 0,
      created_at: now,
      updated_at: now,
    };

    const docRef = await adminDb.collection(CONVERSATIONS_COLLECTION).add(conversationData);

    // Save initial AI message if generated
    if (aiMessage) {
      try {
        await adminDb
          .collection(CONVERSATIONS_COLLECTION)
          .doc(docRef.id)
          .collection('messages')
          .add({
            conversation_id: docRef.id,
            sender: 'AI',
            text: aiMessage,
            message_type: 'text',
            message_order: 1,
            created_at: now,
          });
        
        // Update message count
        await docRef.update({ message_count: 1 });
        console.log('[CONVERSATIONS_POST] Saved initial AI message');
      } catch (error) {
        console.error('[CONVERSATIONS_POST] Error saving AI message:', error);
      }
    } else {
      console.warn('[CONVERSATIONS_POST] No AI message generated', aiMessageError ? `(${aiMessageError})` : '');
    }

    // Return in the format the frontend expects
    return NextResponse.json({
      conversation: {
        id: docRef.id,
        ...conversationData,
      },
      aiMessage: aiMessage ? {
        text: aiMessage,
        sender: 'AI',
        timestamp: now
      } : null,
    }, { status: 201 });
  } catch (error: any) {
    console.error('[CONVERSATIONS_POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation', details: error.message },
      { status: 500 }
    );
  }
}