import axios from 'axios';
import { supabase } from '../../../lib/supabase';
import { getUserLanguageDashboards } from '../../../lib/api';
import { ChatMessage } from '../types/analyze';
import { LEARNING_GOALS } from '../../../lib/preferences';

// Helper to get JWT token
export const getAuthHeaders = async () => {
  if (typeof window === 'undefined') return {};
  
  // Try custom JWT first
  const customJwt = localStorage.getItem('jwt');
  if (customJwt) {
    return { Authorization: `Bearer ${customJwt}` };
  }
  
  // Get Supabase session token
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      return { Authorization: `Bearer ${session.access_token}` };
    }
  } catch (e) {
    console.error('Failed to get Supabase session:', e);
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
  user: any
) => {
  if (!user) return null;

  try {
    const headers = await getAuthHeaders();
    const response = await axios.post(`/api/conversations`, {
      language, 
      title: description || 'New Conversation',
      topics,
      formality
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
    console.log('[CONVERSATION_SERVICE] Loading conversation:', conversationId);
    const headers = await getAuthHeaders();
    const url = `/api/conversations/${conversationId}`;
    console.log('[CONVERSATION_SERVICE] Request URL:', url);
    console.log('[CONVERSATION_SERVICE] Headers:', headers);
    const response = await axios.get(url, { headers });

    console.log('[CONVERSATION_SERVICE] Response status:', response.status);
    console.log('[CONVERSATION_SERVICE] Response data:', response.data);

    if (response.data.conversation) {
      const conversation = response.data.conversation;
      
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
        createdAt: conversation.created_at || conversation.createdAt
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
export const saveMessageToBackend = async (message: ChatMessage, conversationId: string) => {
  if (!conversationId) return;

  try {
    const headers = await getAuthHeaders();
    await axios.post(`/api/conversations/${conversationId}/messages`, {
      message: message
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
  if (!conversationId) return;

  try {
    const headers = await getAuthHeaders();
    
    const response = await axios.post(`/api/conversation-summary`, {
      chat_history: sessionMessages,
      subgoal_instructions: '',
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
      
      // Build progress data expected by dashboard (subgoalIds aligned to percentages)
      let subgoalIds: string[] = [];
      let subgoalNames: string[] = [];

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        if (userId) {
          const dashboards = await getUserLanguageDashboards(userId);
          const success = (dashboards as any)?.success;
          const data = (dashboards as any)?.data;
          const dashboard = success ? (data || []).find((d: any) => d.language === language) : null;
          const userLearningGoals: string[] = dashboard?.learning_goals || [];

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
        }
      } catch (e) {
        console.warn('[CONVERSATION_SERVICE] Failed to fetch user dashboard for learning goals, saving percentages only');
      }

      const progressData = {
        subgoalIds,
        subgoalNames,
        percentages: summary.learningGoals as number[]
      };
      
      console.log('🔍 [CONVERSATION_SERVICE] Updating conversation with:', {
        conversationId,
        title: summary.title,
        synopsis: summary.synopsis,
        progress_data: progressData
      });
      
      await axios.put(`/api/conversations/${conversationId}/title`, {
        title: summary.title,
        synopsis: summary.synopsis,
        progress_data: progressData
      }, { headers });
      
      console.log('🔍 [CONVERSATION_SERVICE] Conversation updated successfully');

      return summary;
    }
  } catch (error) {
    console.error('Error generating conversation summary:', error);
  }
  return null;
};


