import { useState, useCallback } from 'react';
import axios from 'axios';
import { User, ChatMessage } from '../types/analyze';
import { formatScriptLanguageText } from '../utils/romanization';

const MESSAGES_PER_PAGE = 20;

export function useConversation(user: User | null) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [conversationDescription, setConversationDescription] = useState<string>('');
  const [isUsingPersona, setIsUsingPersona] = useState<boolean>(false);
  const [isNewPersona, setIsNewPersona] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);

  const getAuthHeaders = useCallback(async () => {
    const token = localStorage.getItem('jwt');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }, []);

  const fetchUserDashboardPreferences = useCallback(async (languageCode: string) => {
    if (!user) return null;
    
    try {
      const token = localStorage.getItem('jwt');
      const response = await axios.get(`/api/user/language-dashboards?language=${languageCode}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user dashboard preferences:', error);
      return null;
    }
  }, [user]);

  const validateConversationId = useCallback(async (
    urlConversationId: string | null,
    attempt = 1
  ): Promise<boolean> => {
    if (!urlConversationId || !user) return false;

    try {
      const response = await axios.get(`/api/conversations/${urlConversationId}`, { 
        headers: await getAuthHeaders() 
      });
      
      if (!response.data.conversation) {
        return false;
      }
      
      setConversationId(urlConversationId);
      return true;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        if (attempt < 3) {
          setTimeout(() => {
            validateConversationId(urlConversationId, attempt + 1);
          }, 300);
        } else {
          return false;
        }
      }
      return false;
    }
  }, [user, getAuthHeaders]);

  const loadExistingConversation = useCallback(async (
    convId: string | null,
    setChatHistory: (history: ChatMessage[]) => void,
    setLanguage: (lang: string) => void,
    setUserPreferences: (prefs: any) => void,
    language: string
  ) => {
    if (!user || !convId) return;
    
    console.log('[CONVERSATION_LOAD] Starting to load conversation:', convId);
    setIsLoadingConversation(true);
    
    try {
      const response = await axios.get(`/api/conversations/${convId}`, { 
        headers: await getAuthHeaders() 
      });
      
      const conversation = response.data.conversation;
      console.log('[CONVERSATION_LOAD] Conversation loaded successfully:', conversation.id);
      setConversationId(conversation.id);
      setLanguage(conversation.language || language);
      
      // Extract user preferences from conversation
      const formality = conversation.formality || 'friendly';
      const topics = conversation.topics ? 
        (typeof conversation.topics === 'string' ? JSON.parse(conversation.topics) : conversation.topics) : [];
      const feedbackLanguage = 'en'; // Default to English for now
      
      // Fetch user's dashboard preferences for this language
      const dashboardPrefs = await fetchUserDashboardPreferences(conversation.language || 'en');
      const userLevel = dashboardPrefs?.proficiency_level || user?.proficiency_level || 'beginner';
      
      // Use conversation's learning goals if available, otherwise fall back to dashboard preferences
      const conversationLearningGoals = conversation.learning_goals ? 
        (typeof conversation.learning_goals === 'string' ? JSON.parse(conversation.learning_goals) : conversation.learning_goals) : 
        null;
      
      let user_goals: string[] = [];
      
      // Priority: conversation learning goals > dashboard prefs > user learning goals
      if (conversationLearningGoals && conversationLearningGoals.length > 0) {
        user_goals = conversationLearningGoals;
      } else if (dashboardPrefs?.learning_goals && dashboardPrefs.learning_goals.length > 0) {
        user_goals = dashboardPrefs.learning_goals;
      } else if (user?.learning_goals) {
        user_goals = typeof user.learning_goals === 'string' ? JSON.parse(user.learning_goals) : user.learning_goals;
      }
      
      const romanizationDisplay = dashboardPrefs?.romanization_display || 'both';
      
      // Check if conversation uses a persona
      const usesPersona = conversation.uses_persona || false;
      const personaDescription = conversation.description || '';
      
      // Set persona flags
      setIsUsingPersona(usesPersona);
      setIsNewPersona(false); // Existing conversations are not new personas
      setConversationDescription(personaDescription);
      
      const messages = conversation.messages || [];
      console.log('[CONVERSATION_LOAD] Found messages:', messages.length);
      
      // Set pagination state
      setMessageCount(messages.length);
      const initialLoaded = Math.min(messages.length, MESSAGES_PER_PAGE);
      setHasMoreMessages(messages.length > initialLoaded);
      
      // Load only the most recent messages for performance
      const recentMessages = messages.slice(-MESSAGES_PER_PAGE);
      console.log('[CONVERSATION_LOAD] Loading recent messages:', recentMessages.length);
      
      const history = recentMessages.map((msg: any) => {
        // If the database already has romanized_text stored separately, use it
        if (msg.romanized_text) {
          return {
            sender: msg.sender,
            text: msg.text,
            romanizedText: msg.romanized_text,
            timestamp: new Date(msg.created_at),
            isFromOriginalConversation: true // Mark existing messages as old
          };
        } else {
          // Fallback to parsing the text for romanized content
          const formatted = formatScriptLanguageText(msg.text, conversation.language || 'en');
          return {
            sender: msg.sender,
            text: formatted.mainText,
            romanizedText: formatted.romanizedText,
            timestamp: new Date(msg.created_at),
            isFromOriginalConversation: true // Mark existing messages as old
          };
        }
      });

      setChatHistory(history);
      console.log('[CONVERSATION_LOAD] Set chat history:', history.length, 'messages');
      
      // Store user preferences for use in API calls
      setUserPreferences({ 
        formality, 
        topics, 
        user_goals, 
        userLevel, 
        feedbackLanguage, 
        romanizationDisplay 
      });
      console.log('[CONVERSATION_LOAD] Conversation loading completed successfully');
    } catch (error: any) {
      console.error('[CONVERSATION_LOAD] Error loading conversation:', error);
      // Reset conversation state on error
      setConversationId(null);
    } finally {
      setIsLoadingConversation(false);
    }
  }, [user, getAuthHeaders, fetchUserDashboardPreferences]);

  const saveSessionToBackend = useCallback(async (chatHistory: ChatMessage[], language: string, showAlert = true) => {
    try {
      // 1. Create a new conversation
      const token = localStorage.getItem('jwt');
      const conversationRes = await axios.post(
        '/api/conversations',
        {
          language,
          title: 'Saved Session',
          topics: [], // Optionally extract topics from chatHistory if needed
          formality: 'friendly'
        },
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );

      const newConversationId = conversationRes.data.conversation.id;

      // 2. Add each message in chatHistory as a message in the conversation, with correct order
      for (let i = 0; i < chatHistory.length; i++) {
        const msg = chatHistory[i];
        const headers = await getAuthHeaders();
        await axios.post(
          `/api/conversations/${newConversationId}/messages`,
          {
            sender: msg.sender,
            text: msg.text,
            messageType: 'text',
            message_order: i + 1,
          },
          { headers: headers as any }
        );
      }

      if (showAlert) {
        alert('Session saved to your account as a conversation!');
      }
      
      return newConversationId;
    } catch (e: any) {
      console.error('Save session error:', e);
      if (showAlert) {
        alert('Failed to save session.');
      }
      return null;
    }
  }, [getAuthHeaders]);

  const saveMessageToBackend = useCallback(async (
    sender: string, 
    text: string, 
    messageType = 'text', 
    audioFilePath = null, 
    targetConversationId = null, 
    romanizedText: string | null = null
  ) => {
    if (!user) return;

    const messageData = {
      sender,
      text,
      message_type: messageType,
      audio_file_path: audioFilePath,
      conversation_id: targetConversationId || conversationId,
      romanized_text: romanizedText,
    };

    try {
      const headers = await getAuthHeaders();
      const response = await axios.post('/api/messages', messageData, { 
        headers: headers as any 
      });

      if (response.data) {
        return response.data.message;
      }
    } catch (error) {
      console.error('Error saving message:', error);
    }
  }, [user, conversationId, getAuthHeaders]);

  const generateConversationSummary = useCallback(async (): Promise<string | null> => {
    if (!conversationId || !user) return null;

    try {
      const response = await axios.post('/api/conversation-summary', {
        conversation_id: conversationId,
      }, {
        headers: await getAuthHeaders()
      });

      if (response.data) {
        return response.data.summary;
      }
    } catch (error) {
      console.error('Error generating conversation summary:', error);
    }

    return null;
  }, [conversationId, user, getAuthHeaders]);

  const savePersona = useCallback(async (personaName: string, topics: string[], formality: string, language: string) => {
    if (!user || !conversationId) return null;

    const personaData = {
      name: personaName,
      description: conversationDescription || '',
      topics,
      formality,
      language,
      conversation_id: conversationId,
      user_id: user.id
    };

    try {
      const response = await axios.post('/api/personas', personaData, {
        headers: await getAuthHeaders()
      });

      if (response.data) {
        // Update the conversation to mark it as using a persona
        await axios.patch(`/api/conversations/${conversationId}`, {
          uses_persona: true,
          persona_id: response.data.persona.id
        }, {
          headers: await getAuthHeaders()
        });

        return response.data.persona;
      }
    } catch (error) {
      console.error('Error saving persona:', error);
    }

    return null;
  }, [user, conversationId, conversationDescription, getAuthHeaders]);

  const clearConversation = useCallback(() => {
    setConversationId(null);
    setConversationDescription('');
    setIsUsingPersona(false);
    setIsNewPersona(false);
    setMessageCount(0);
    setHasMoreMessages(false);
  }, []);

  return {
    conversationId,
    setConversationId,
    isLoadingConversation,
    conversationDescription,
    setConversationDescription,
    isUsingPersona,
    setIsUsingPersona,
    isNewPersona,
    setIsNewPersona,
    messageCount,
    hasMoreMessages,
    validateConversationId,
    loadExistingConversation,
    saveMessageToBackend,
    generateConversationSummary,
    savePersona,
    saveSessionToBackend,
    clearConversation,
    fetchUserDashboardPreferences,
  };
}
