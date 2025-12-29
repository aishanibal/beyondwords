import axios from 'axios';
import { getUserLanguageDashboards } from '../../../lib/api';
import { getIdToken } from '../../../lib/firebase';
import { ChatMessage } from '../types/analyze';
import { LEARNING_GOALS } from '../../../lib/preferences';

// Helper to get JWT token (Firebase)
export const getAuthHeaders = async () => {
  if (typeof window === 'undefined') return {};
  
  // Try stored JWT first (Firebase token)
  const storedJwt = localStorage.getItem('jwt');
  if (storedJwt) {
    return { Authorization: `Bearer ${storedJwt}` };
  }
  
  // Get fresh Firebase token
  try {
    const firebaseToken = await getIdToken();
    if (firebaseToken) {
      localStorage.setItem('jwt', firebaseToken);
      return { Authorization: `Bearer ${firebaseToken}` };
    }
  } catch (e) {
    console.error('Failed to get Firebase token:', e);
  }
  
  return {};
};

// Fetch user dashboard preferences
export const fetchUserDashboardPreferences = async (languageCode: string, userId: string) => {
  try {
    if (!userId) {
      return null;
    }

    const { success, data: dashboards } = await getUserLanguageDashboards(userId);
    
    if (!success) {
      console.error('Failed to fetch language dashboards');
      return null;
    }

    const dashboard = (dashboards || []).find((d: any) => d.language === languageCode);
    
    if (dashboard) {
      return {
        formality: dashboard.formality || 'friendly',
        topics: dashboard.talk_topics || [],
        user_goals: dashboard.learning_goals || [],
        userLevel: dashboard.proficiency_level || 'beginner',
        feedbackLanguage: dashboard.feedback_language || 'en',
        romanization_display: dashboard.romanization_display || 'both',
        proficiency_level: dashboard.proficiency_level || 'beginner',
        talk_topics: dashboard.talk_topics || [],
        learning_goals: dashboard.learning_goals || [],
        speak_speed: dashboard.speak_speed || 1.0
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching user dashboard preferences:', error);
    return null;
  }
};

// Save session to backend
export const saveSessionToBackend = async (
  messages: ChatMessage[], 
  description: string, 
  topics: string[], 
  formality: string,
  language: string,
  user: any,
  usesPersona: boolean = false,
  personaId: number | null = null
) => {
  if (!user) return null;

  try {
    const headers = await getAuthHeaders();
    const response = await axios.post(`/api/conversations`, {
      language, 
      title: description || 'New Conversation',
      topics,
      formality,
      usesPersona,
      personaId
    }, { headers });

    const newConversationId = response.data.conversation.id;
    
    // Add each message in chatHistory as a message in the conversation, with correct order
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const msgHeaders = await getAuthHeaders();
      await axios.post(
        `/api/conversations/${newConversationId}/messages`,
        {
          sender: msg.sender,
          text: msg.text,
          messageType: 'text',
          message_order: i + 1,
        },
        { headers: msgHeaders }
      );
    }
      
    // Update URL with conversation ID
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('conversation', newConversationId);
    window.history.replaceState({}, '', newUrl.toString());
    
    return newConversationId;
  } catch (error) {
    console.error('Error saving session to backend:', error);
  }
  return null;
};

// Load existing conversation
export const loadExistingConversation = async (conversationId: string) => {
  try {
    console.log('[CONVERSATION_SERVICE] Loading conversation:', {
      conversationId,
      conversationIdType: typeof conversationId,
      conversationIdLength: conversationId.length,
      conversationIdTruthy: !!conversationId
    });
    const headers = await getAuthHeaders();
    const url = `/api/conversations/${conversationId}`;
    console.log('[CONVERSATION_SERVICE] Request URL:', url);
    console.log('[CONVERSATION_SERVICE] Headers:', headers);
    const response = await axios.get(url, { headers });

    console.log('[CONVERSATION_SERVICE] Response status:', response.status);
    console.log('[CONVERSATION_SERVICE] Response data:', response.data);

    if (response.data.conversation) {
      const conversation = response.data.conversation;
      
      console.log('[CONVERSATION_SERVICE] Raw conversation data:', {
        id: conversation.id,
        title: conversation.title,
        uses_persona: conversation.uses_persona,
        persona_id: conversation.persona_id,
        description: conversation.description
      });
      
      // Parse messages from conversation and ensure proper structure
      const messages: ChatMessage[] = (conversation.messages || []).map((msg: any) => ({
        sender: msg.sender,
        text: msg.text,
        romanizedText: msg.romanized_text || '',
        timestamp: new Date(msg.created_at || msg.timestamp),
        isFromOriginalConversation: true,
        messageType: msg.message_type || 'text',
        audioFilePath: msg.audio_file_path,
        detailedFeedback: msg.detailed_feedback
      }));
      
      console.log('[CONVERSATION_SERVICE] Parsed messages:', messages.length);
      
      return {
        messages,
        conversationId,
        description: conversation.description || '',
        language: conversation.language || conversation.language_dashboards?.language,
        formality: conversation.formality,
        topics: conversation.topics || [],
        createdAt: conversation.created_at || conversation.createdAt,
        usesPersona: conversation.uses_persona === true || conversation.uses_persona === 'true',
        personaId: conversation.persona_id || null
      };
    } else {
      console.warn('[CONVERSATION_SERVICE] No conversation data in response');
      return null;
    }
  } catch (error: any) {
    console.error('[CONVERSATION_SERVICE] Error loading conversation:', error);
    if (error.response) {
      console.error('[CONVERSATION_SERVICE] Error response:', error.response.status, error.response.data);
    }
    return null;
  }
};

// Save message to backend
export const saveMessageToBackend = async (message: ChatMessage, conversationId: string, chatHistoryLength?: number) => {
  if (!conversationId) return;

  try {
    const headers = await getAuthHeaders();
    // Calculate message order based on current chat history length, similar to saveSessionToBackend
    const messageOrder = chatHistoryLength ? chatHistoryLength : Date.now();
    
    await axios.post(`/api/conversations/${conversationId}/messages`, {
      sender: message.sender,
      text: message.text,
      messageType: 'text',
      message_order: messageOrder
    }, { headers });
  } catch (error) {
    console.error('Error saving message to backend:', error);
  }
};

// Generate conversation summary
export const generateConversationSummary = async (
  sessionMessages: ChatMessage[],
  language: string,
  topics: string[],
  formality: string,
  conversationId: string
) => {
  console.log('🔍 [CONVERSATION_SERVICE] generateConversationSummary function called!');
  if (!conversationId) return;

  try {
    console.log('🔍 [CONVERSATION_SERVICE] About to call getAuthHeaders()');
    const headers = await getAuthHeaders();
    console.log('🔍 [CONVERSATION_SERVICE] getAuthHeaders() completed successfully');
    
    // Get user learning goals to build subgoal instructions
    let subgoalInstructions = '';
    try {
      // Get user ID from stored token or current context
      const dashboards = await getUserLanguageDashboards('current');
      const success = (dashboards as any)?.success;
      const data = (dashboards as any)?.data;
      const dashboard = success ? (data || []).find((d: any) => d.language === language) : null;
      const userLearningGoals: string[] = dashboard?.learning_goals || dashboard?.learningGoals || [];
      
      // Build subgoal instructions from user's learning goals
      if (userLearningGoals.length > 0) {
        const subgoalInstructionsList: string[] = [];
        userLearningGoals.forEach((goalId: string) => {
          const goal = LEARNING_GOALS.find(g => g.id === goalId);
          if (goal?.subgoals) {
            goal.subgoals.forEach((subgoal, index) => {
              subgoalInstructionsList.push(`${index + 1}: ${subgoal.description}`);
            });
          }
        });
        subgoalInstructions = subgoalInstructionsList.join('\n');
      }
    } catch (e) {
      console.warn('[CONVERSATION_SERVICE] Failed to fetch user learning goals:', e);
    }
    
    const response = await axios.post(`/api/conversation-summary`, {
      chat_history: sessionMessages,
      subgoal_instructions: subgoalInstructions,
      user_topics: topics,
      target_language: language,
      feedback_language: 'en',
      is_continued_conversation: false,
      conversation_id: conversationId
    }, { headers });

    if (response.data.success) {
      const summary = {
        title: response.data.title,
        synopsis: response.data.synopsis,
        learningGoals: response.data.progress_percentages || []
      };
      
      // Build progress data expected by dashboard
      let subgoalIds: string[] = [];
      let subgoalNames: string[] = [];

      try {
        const dashboards = await getUserLanguageDashboards('current');
        const success = (dashboards as any)?.success;
        const data = (dashboards as any)?.data;
        const dashboard = success ? (data || []).find((d: any) => d.language === language) : null;
        const userLearningGoals: string[] = dashboard?.learning_goals || dashboard?.learningGoals || [];

        // Map goalIds to subgoalIds/subgoalNames in deterministic order
        userLearningGoals.forEach((goalId: string) => {
          const goal = LEARNING_GOALS.find(g => g.id === goalId);
          if (goal?.subgoals) {
            goal.subgoals.forEach(sub => {
              subgoalIds.push(sub.id);
              subgoalNames.push(goal.goal);
            });
          }
        });
      } catch (e) {
        console.warn('[CONVERSATION_SERVICE] Failed to fetch user dashboard for learning goals:', e);
      }

      const progressData = {
        subgoalIds,
        subgoalNames,
        percentages: summary.learningGoals as number[]
      };
      
      // Try to update conversation title
      try {
        await axios.put(`/api/conversations/${conversationId}/title`, {
          title: summary.title,
          synopsis: summary.synopsis,
          progress_data: progressData
        }, { headers });
      } catch (updateError) {
        console.warn('[CONVERSATION_SERVICE] Failed to update conversation:', updateError);
      }

      return {
        title: summary.title,
        synopsis: summary.synopsis,
        learningGoals: summary.learningGoals as number[],
        subgoalIds,
        subgoalNames
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('🔍 [CONVERSATION_SERVICE] Error generating conversation summary:', error);
    console.error('🔍 [CONVERSATION_SERVICE] Error details:', error.response?.data || error.message);
    return null;
  }
};


