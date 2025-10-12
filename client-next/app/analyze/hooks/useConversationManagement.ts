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
    subgoalIds?: string[];
    levelUpEvents?: LevelUpEvent[];
  } | null>>,
  setUserProgress: React.Dispatch<React.SetStateAction<{ [goalId: string]: SubgoalProgress }>>,
  userProgress: { [goalId: string]: SubgoalProgress },
  setIsUsingPersona: React.Dispatch<React.SetStateAction<boolean>>
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
    if (!user) {
      console.warn('[CONVERSATION_LOAD] No user available, cannot load conversation');
      return;
    }

    // Prevent multiple simultaneous loads
    if (isLoadingConversation) {
      console.log('[CONVERSATION_LOAD] Already loading conversation, skipping');
      return;
    }

    console.log('[CONVERSATION_LOAD] Starting to load conversation:', conversationId);
    setIsLoadingConversation(true);
    
    try {
      const result = await loadExistingConversation(conversationId);
      
      if (result) {
        console.log('[CONVERSATION_LOAD] Successfully loaded conversation with', result.messages?.length || 0, 'messages');
        
        // Set conversation data
        setChatHistory(result.messages || []);
        console.log('[CONVERSATION_LOAD] Setting conversation ID from result:', result.conversationId, 'Type:', typeof result.conversationId);
        setConversationId(String(result.conversationId));
        setConversationDescription(result.description || '');
        
        console.log('[CONVERSATION_LOAD] Conversation loaded successfully, ready for continuation');
        
        // Set persona information if conversation uses a persona
        console.log('[CONVERSATION_LOAD] Processing persona information:', {
          usesPersona: result.usesPersona,
          personaId: result.personaId,
          usesPersonaType: typeof result.usesPersona,
          usesPersonaTruthy: !!result.usesPersona
        });
        
        // Always respect the conversation's persona status from the database
        // This overrides any URL parameter logic since the conversation data is authoritative
        if (result.usesPersona === true) {
          setIsUsingPersona(true);
          console.log('[CONVERSATION_LOAD] Conversation uses persona, setting isUsingPersona to true');
        } else {
          setIsUsingPersona(false);
          console.log('[CONVERSATION_LOAD] Conversation does not use persona, setting isUsingPersona to false');
        }
        
        // Set language, formality, topics from conversation
        if (result.language) {
          // Language will be handled by parent component
          console.log('[CONVERSATION_LOAD] Conversation language:', result.language);
        }
        if (result.formality) {
          setUserPreferences(prev => ({ ...prev, formality: result.formality }));
          console.log('[CONVERSATION_LOAD] Set formality:', result.formality);
        }
        if (result.topics) {
          setUserPreferences(prev => ({ ...prev, topics: result.topics }));
          console.log('[CONVERSATION_LOAD] Set topics:', result.topics);
        }
        
        // Set session start time
        if (result.createdAt) {
          setSessionStartTime(new Date(result.createdAt));
          console.log('[CONVERSATION_LOAD] Set session start time:', result.createdAt);
        }
      } else {
        console.warn('[CONVERSATION_LOAD] No conversation data returned for ID:', conversationId);
        // Clear any existing conversation state if loading failed
        setChatHistory([]);
        setConversationId(null);
        setConversationDescription('');
        setSessionStartTime(null);
        setIsUsingPersona(false);
        
        // Show user-friendly error message
        const errorMessage = {
          sender: 'System',
          text: `❌ Conversation not found. The conversation with ID ${conversationId} may have been deleted or you may not have access to it.`,
          timestamp: new Date(),
          isFromOriginalConversation: false
        };
        setChatHistory([errorMessage]);
      }
    } catch (error) {
      console.error('[CONVERSATION_LOAD] Error loading conversation:', error);
      // Clear conversation state on error
      setChatHistory([]);
      setConversationId(null);
      setConversationDescription('');
      setSessionStartTime(null);
      setIsUsingPersona(false);
      
      // Show user-friendly error message
      const errorMessage = {
        sender: 'System',
        text: `❌ Error loading conversation. Please try refreshing the page or contact support if the problem persists.`,
        timestamp: new Date(),
        isFromOriginalConversation: false
      };
      setChatHistory([errorMessage]);
    } finally {
      setIsLoadingConversation(false);
    }
  }, [user, setChatHistory, setConversationId, setConversationDescription, setUserPreferences, setSessionStartTime, setIsUsingPersona]);

  // Save session to backend
  const saveSession = useCallback(async (
    messages: ChatMessage[], 
    description: string, 
    topics: string[], 
    formality: string,
    usesPersona: boolean = false,
    personaId: number | null = null
  ) => {
    if (!user) return null;

    const newConversationId = await saveSessionToBackend(
      messages, 
      description, 
      topics, 
      formality, 
      language, 
      user,
      usesPersona,
      personaId
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
  ): Promise<boolean> => {
    if (!user || !conversationId) return false;

    try {
      console.log('🔍 [CONVERSATION_MANAGEMENT] Calling generateConversationSummary with:', {
        sessionMessages: sessionMessages.length,
        language,
        topics,
        formality,
        conversationId
      });
      const summary = await generateConversationSummary(
        sessionMessages,
        language,
        topics,
        formality,
        conversationId
      );
      console.log('🔍 [CONVERSATION_MANAGEMENT] generateConversationSummary returned:', summary);

      if (summary) {
        console.log('🔍 [CONVERSATION_MANAGEMENT] Summary received:', summary);
        // summary.learningGoals is actually an array of progress percentages from the API
        const progressPercentages = summary.learningGoals as number[] || [];
        console.log('🔍 [CONVERSATION_MANAGEMENT] Progress percentages:', progressPercentages);
        console.log('🔍 [CONVERSATION_MANAGEMENT] Progress percentages length:', progressPercentages.length);
        console.log('🔍 [CONVERSATION_MANAGEMENT] Progress percentages type:', typeof progressPercentages);
        console.log('🔍 [CONVERSATION_MANAGEMENT] Progress percentages is array:', Array.isArray(progressPercentages));
        
        // Get the current user's learning goals to map progress to subgoals
        const currentProgressArray = Object.values(userProgress);
        const levelUpEvents: LevelUpEvent[] = [];
        
        // Map progress percentages to subgoal IDs
        // We need to get the subgoal IDs from the user's current learning goals
        console.log('🔍 [CONVERSATION_MANAGEMENT] User object:', user);
        console.log('🔍 [CONVERSATION_MANAGEMENT] User learning_goals raw:', user?.learning_goals);
        const userLearningGoals = user?.learning_goals ? 
          (typeof user.learning_goals === 'string' ? JSON.parse(user.learning_goals) : user.learning_goals) : [];
        console.log('🔍 [CONVERSATION_MANAGEMENT] User learning goals parsed:', userLearningGoals);
        
        const subgoalIds: string[] = [];
        const subgoalNames: string[] = [];
        
        // Extract subgoal IDs from user's learning goals
        userLearningGoals.forEach((goalId: string) => {
          const goal = LEARNING_GOALS.find(g => g.id === goalId);
          if (goal?.subgoals) {
            goal.subgoals.forEach(subgoal => {
              subgoalIds.push(subgoal.id);
              subgoalNames.push(goal.goal);
            });
          }
        });
        
        // Process each progress percentage
        for (let i = 0; i < Math.min(progressPercentages.length, subgoalIds.length); i++) {
          const subgoalId = subgoalIds[i];
          const progress = progressPercentages[i];
          
          const result = updateSubgoalProgress(subgoalId, progress, currentProgressArray);
          
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
        
        // Show progress modal if there are user learning goals OR if we have progress percentages
        if (userLearningGoals.length > 0 || progressPercentages.length > 0) {
          console.log('🔍 [CONVERSATION_MANAGEMENT] Showing progress modal with data:', {
            percentages: progressPercentages,
            subgoalNames: subgoalNames.slice(0, Math.max(progressPercentages.length, userLearningGoals.length)),
            levelUpEvents,
            hasUserGoals: userLearningGoals.length > 0,
            hasProgressData: progressPercentages.length > 0
          });
          setProgressData({
            percentages: progressPercentages,
            subgoalNames: subgoalNames.length > 0 ? subgoalNames.slice(0, Math.max(progressPercentages.length, userLearningGoals.length)) : ['Goal 1', 'Goal 2', 'Goal 3'].slice(0, progressPercentages.length),
            subgoalIds: subgoalIds.slice(0, Math.max(progressPercentages.length, userLearningGoals.length)),
            levelUpEvents
          });
          setShowProgressModal(true);
          return true; // Progress modal was shown
        } else {
          console.log('🔍 [CONVERSATION_MANAGEMENT] No user learning goals or progress data found, not showing progress modal');
        }
      }
      return false; // No progress modal shown
    } catch (error) {
      console.error('Error generating conversation summary:', error);
      return false;
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
    
    // Set persona flag based on whether we're using an existing persona
    if (isUsingExistingPersona) {
      setIsUsingPersona(true);
      console.log('[CONVERSATION_START] Using existing persona, setting isUsingPersona to true');
    } else {
      setIsUsingPersona(false);
      console.log('[CONVERSATION_START] Not using existing persona, setting isUsingPersona to false');
    }
    
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
  }, [language, user, setConversationId, setChatHistory, setSessionStartTime, setConversationDescription, setUserPreferences, setIsUsingPersona, router]);

  // Load existing conversation if conversation ID is provided
  // This is now handled by the main component to avoid duplicate loading

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


