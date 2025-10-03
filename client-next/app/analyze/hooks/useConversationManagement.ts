import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  fetchUserDashboardPreferences, 
  loadExistingConversation, 
  saveSessionToBackend,
  generateConversationSummary 
} from '../services/conversationService';
import { ChatMessage } from '../types/analyze';
import { LEARNING_GOALS, updateSubgoalProgress, SubgoalProgress, LevelUpEvent } from '../../../lib/preferences';

export const useConversationManagement = (
  user: any,
  language: string,
  urlConversationId: string | null,
  chatHistory: ChatMessage[],
  setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  setConversationId: React.Dispatch<React.SetStateAction<string | null>>,
  setConversationDescription: React.Dispatch<React.SetStateAction<string>>,
  setSessionStartTime: React.Dispatch<React.SetStateAction<Date | null>>,
  setUserPreferences: React.Dispatch<React.SetStateAction<any>>,
  setShowProgressModal: React.Dispatch<React.SetStateAction<boolean>>,
  setProgressData: React.Dispatch<React.SetStateAction<{
    percentages: number[];
    subgoalNames: string[];
    levelUpEvents?: LevelUpEvent[];
  } | null>>,
  setUserProgress: React.Dispatch<React.SetStateAction<{ [goalId: string]: SubgoalProgress }>>,
  userProgress: { [goalId: string]: SubgoalProgress }
) => {
  const router = useRouter();
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);

  // Load preferences for current language
  const loadPreferencesForLanguage = useCallback(async () => {
    if (!(user as any)?.id || !language) return;
    
    console.log('[DEBUG] Language changed to:', language, '- reloading preferences');
    
    try {
      const dashboardPrefs = await fetchUserDashboardPreferences(language, (user as any).id);
      if (dashboardPrefs) {
        console.log('[DEBUG] Loaded preferences for', language, ':', dashboardPrefs);
        setUserPreferences(prev => ({
          ...prev,
          userLevel: dashboardPrefs.proficiency_level,
          topics: dashboardPrefs.talk_topics,
          user_goals: dashboardPrefs.learning_goals,
          romanizationDisplay: dashboardPrefs.romanization_display,
          // Keep existing formality and feedbackLanguage unless we want to change them
          formality: prev?.formality || 'friendly',
          feedbackLanguage: prev?.feedbackLanguage || 'en'
        }));
      } else {
        console.log('[DEBUG] No dashboard found for language:', language, '- using defaults');
        // Reset to defaults if no dashboard exists for this language
        setUserPreferences(prev => ({
          ...prev,
          userLevel: 'beginner',
          topics: [],
          user_goals: [],
          romanizationDisplay: 'both'
        }));
      }
    } catch (error) {
      console.error('[DEBUG] Error loading preferences for language:', language, error);
    }
  }, [user, language, setUserPreferences]);

  // Load existing conversation
  const loadConversation = useCallback(async (conversationId: string) => {
    if (!user) return;

    setIsLoadingConversation(true);
    try {
      const result = await loadExistingConversation(conversationId);
      
      if (result) {
        // Set conversation data
        setChatHistory(result.messages);
        setConversationId(conversationId);
        setConversationDescription(result.description);
        
        // Set language, formality, topics from conversation
        if (result.language) {
          // Language will be handled by parent component
        }
        if (result.formality) {
          setUserPreferences(prev => ({ ...prev, formality: result.formality }));
        }
        if (result.topics) {
          setUserPreferences(prev => ({ ...prev, topics: result.topics }));
        }
        
        // Set session start time
        setSessionStartTime(new Date(result.createdAt));
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    } finally {
      setIsLoadingConversation(false);
    }
  }, [user, setChatHistory, setConversationId, setConversationDescription, setUserPreferences, setSessionStartTime]);

  // Save session to backend
  const saveSession = useCallback(async (
    messages: ChatMessage[], 
    description: string, 
    topics: string[], 
    formality: string
  ) => {
    if (!user) return null;

    const newConversationId = await saveSessionToBackend(
      messages, 
      description, 
      topics, 
      formality, 
      language, 
      user
    );
    
    if (newConversationId) {
      setConversationId(newConversationId);
    }
    
    return newConversationId;
  }, [user, language, setConversationId]);

  // Generate conversation summary
  const generateSummary = useCallback(async (
    sessionMessages: ChatMessage[],
    topics: string[],
    formality: string,
    conversationId: string
  ) => {
    if (!user || !conversationId) return;

    try {
      const summary = await generateConversationSummary(
        sessionMessages,
        language,
        topics,
        formality,
        conversationId
      );

      if (summary && summary.learningGoals && summary.learningGoals.length > 0) {
        // Process learning goals and track progress
        const currentProgressArray = Object.values(userProgress); // Get from userProgress state
        const levelUpEvents: LevelUpEvent[] = [];

        for (const goal of summary.learningGoals) {
          const result = updateSubgoalProgress(goal.id, goal.progress, currentProgressArray);
          
          if (result.levelUpEvent) {
            levelUpEvents.push(result.levelUpEvent);
          }
          
          // Update the current progress array for next iteration
          currentProgressArray.splice(0, currentProgressArray.length, ...result.updatedProgress);
        }

        // Convert array back to object
        const updatedProgressObj = currentProgressArray.reduce((acc, progress) => {
          acc[progress.subgoalId] = progress;
          return acc;
        }, {} as { [goalId: string]: SubgoalProgress });

        setUserProgress(updatedProgressObj);
        
        // Show progress modal if there are learning goals (regardless of level up events)
        if (summary.learningGoals && summary.learningGoals.length > 0) {
          const percentages = currentProgressArray.map(p => p.percentage);
          const subgoalNames = currentProgressArray.map(progress => {
            const goal = LEARNING_GOALS.find(g => g.subgoals?.some(sg => sg.id === progress.subgoalId));
            return goal ? goal.goal : progress.subgoalId;
          });
          
          setProgressData({
            percentages,
            subgoalNames,
            levelUpEvents
          });
          setShowProgressModal(true);
        }
      }
    } catch (error) {
      console.error('Error generating conversation summary:', error);
    }
  }, [user, language, setUserProgress, setProgressData, setShowProgressModal]);

  // Handle modal conversation start
  const handleModalConversationStart = useCallback(async (
    newConversationId: string, 
    topics: string[], 
    aiMessage: unknown, 
    formality: string, 
    learningGoals: string[], 
    description?: string, 
    isUsingExistingPersona?: boolean
  ) => {
    console.log('[CONVERSATION_START] Starting new conversation:', {
      conversationId: newConversationId,
      topics,
      formality,
      learningGoals,
      description,
      isUsingExistingPersona
    });
    
    setConversationId(newConversationId);
    setChatHistory([]);
    
    // For new conversations, sessionStartTime should be null initially
    setSessionStartTime(null);
    
    // Set the conversation description
    setConversationDescription(description || '');
    
    // Check if this is a persona-based conversation (has a description)
    const isPersonaConversation = !!(description && description.trim());
    
    // Fetch user's dashboard preferences for this language
    const dashboardPrefs = await fetchUserDashboardPreferences(language, (user as any).id);
    const romanizationDisplay = dashboardPrefs?.romanization_display || 'both';
    
    // Update user preferences with the selected formality, topics, and learning goals
    setUserPreferences(prev => ({
      ...prev,
      formality,
      topics,
      user_goals: learningGoals,
      romanizationDisplay
    }));
    
    // Use Next.js router to update the URL
    router.replace(`/analyze?conversation=${newConversationId}&topics=${encodeURIComponent(topics.join(','))}`);
    
    // Set the initial AI message from the backend response
    if (aiMessage && (aiMessage as any).text && (aiMessage as any).text.trim()) {
      const formattedMessage = { mainText: (aiMessage as any).text, romanizedText: '' }; // Simplified for now
      const initialMessage = { 
        sender: 'AI', 
        text: formattedMessage.mainText, 
        romanizedText: formattedMessage.romanizedText,
        ttsUrl: (aiMessage as any).ttsUrl || null,
        timestamp: new Date(),
        isFromOriginalConversation: false // New conversation message
      };
      setChatHistory([initialMessage]);
      
      // Play TTS for the initial AI message automatically
      if ((aiMessage as any).ttsUrl && (aiMessage as any).ttsUrl !== null) {
        console.log('🔍 [INITIAL_TTS] Playing initial AI message TTS:', (aiMessage as any).ttsUrl);
        // The TTS will be handled by the existing TTS system when the message is rendered
      } else {
        console.log('🔍 [INITIAL_TTS] No TTS URL provided for initial message, will generate TTS on demand');
      }
    } else {
      console.log('🔍 [DEBUG] No AI message or empty text, setting default message');
      // Fallback: set a default AI message if none provided
      setChatHistory([{ sender: 'AI', text: 'Hello! What would you like to talk about today?', timestamp: new Date(), isFromOriginalConversation: false }]);
    }
  }, [language, user, setConversationId, setChatHistory, setSessionStartTime, setConversationDescription, setUserPreferences, router]);

  // Load existing conversation if conversation ID is provided
  useEffect(() => {
    if (urlConversationId && !isLoadingConversation) {
      loadConversation(urlConversationId);
    }
  }, [urlConversationId, loadConversation, isLoadingConversation]);

  // Load user preferences on mount
  useEffect(() => {
    if (user && language) {
      loadPreferencesForLanguage();
    }
  }, [user, language, loadPreferencesForLanguage]);

  return {
    isLoadingConversation,
    loadConversation,
    saveSession,
    generateSummary,
    handleModalConversationStart,
    loadPreferencesForLanguage
  };
};
