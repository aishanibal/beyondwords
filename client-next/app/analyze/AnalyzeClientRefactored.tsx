"use client";
export const dynamic = "force-dynamic";

import React, { useState, useRef, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useUser } from '../ClientLayout';
import { useDarkMode } from '../contexts/DarkModeContext';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { motion } from 'framer-motion';
import TopicSelectionModal from './TopicSelectionModal';
import PersonaModal from './PersonaModal';
import LoadingScreen from '../components/LoadingScreen';
import { LEARNING_GOALS, LearningGoal, getProgressiveSubgoalDescription, getSubgoalLevel, updateSubgoalProgress, SubgoalProgress, LevelUpEvent } from '../../lib/preferences';
import { getUserLanguageDashboards, getAuthHeaders } from '../../lib/api';

// Import our new modular components and hooks
import { usePersistentChatHistory } from './hooks/useChatHistory';
import { useAudioRecording } from './hooks/useAudioRecording';
import { useTTS } from './hooks/useTTS';
import { useTranslation } from './hooks/useTranslation';
import { useConversation } from './hooks/useConversation';
import { useAudioProcessing } from './hooks/useAudioProcessing';
import { useFeedback } from './hooks/useFeedback';
import MessageList from './components/MessageList';
import AudioControls from './components/AudioControls';
import TTSControls from './components/TTSControls';
import TranslationPanel from './components/TranslationPanel';

// Import types and utilities
import { ChatMessage, User, FormattedText, SuggestionData } from './types/analyze';
import { generateRomanizedText, formatScriptLanguageText, isScriptLanguage } from './utils/romanization';
import { cleanTextForTTS, getLanguageLabel } from './utils/textFormatting';

const AnalyzeContent = () => {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading analyze page...</div>
      </div>
    );
  }
  
  return <AnalyzeContentInner />;
};

const AnalyzeContentInner = () => {
  const { user } = useUser();
  const { isDarkMode } = useDarkMode();
  const router = useRouter();

  // Use our custom hooks
  const [chatHistory, setChatHistory] = usePersistentChatHistory(user as any);
  const audioRecording = useAudioRecording();
  const tts = useTTS();
  const translation = useTranslation();
  const conversation = useConversation(user as any);
  const audioProcessing = useAudioProcessing();
  const feedback = useFeedback();

  // URL params state
  const [urlParams, setUrlParams] = useState({
    conversationId: '',
    lang: '',
    topics: '',
    formality: '',
    usePersona: false
  });

  // Core state
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [language, setLanguage] = useState<string>(user?.target_language || 'en');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoadingConversation, setIsLoadingConversation] = useState<boolean>(false);
  const [skipValidation, setSkipValidation] = useState(false);
  const [showSavePrompt, setShowSavePrompt] = useState<boolean>(false);

  // Suggestions state
  const [suggestions, setSuggestions] = useState<unknown[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState<boolean>(false);
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState<number>(0);
  const [showSuggestionCarousel, setShowSuggestionCarousel] = useState<boolean>(false);
  const [suggestionMessages, setSuggestionMessages] = useState<ChatMessage[]>([]);

  // Translation state
  const [translations, setTranslations] = useState<Record<number, { translation?: string; breakdown?: string; has_breakdown?: boolean }>>({});
  const [isTranslating, setIsTranslating] = useState<Record<number, boolean>>({});
  const [showTranslations, setShowTranslations] = useState<Record<number, boolean>>({});
  const [suggestionTranslations, setSuggestionTranslations] = useState<Record<number, { translation?: string; breakdown?: string; has_breakdown?: boolean }>>({});
  const [isTranslatingSuggestion, setIsTranslatingSuggestion] = useState<Record<number, boolean>>({});
  const [showSuggestionTranslations, setShowSuggestionTranslations] = useState<Record<number, boolean>>({});
  const [isLoadingMessageFeedback, setIsLoadingMessageFeedback] = useState<Record<number, boolean>>({});

  // Panel state
  const [leftPanelWidth, setLeftPanelWidth] = useState(0.2);
  const [rightPanelWidth, setRightPanelWidth] = useState(0.2);
  const [isResizing, setIsResizing] = useState(false);
  const [resizingPanel, setResizingPanel] = useState<'left' | 'right' | null>(null);

  // Modal state
  const [showPersonaModal, setShowPersonaModal] = useState(false);
  const [isSavingPersona, setIsSavingPersona] = useState(false);
  const [showTopicModal, setShowTopicModal] = useState<boolean>(false);
  const [conversationDescription, setConversationDescription] = useState<string>('');
  const [isUsingPersona, setIsUsingPersona] = useState<boolean>(false);
  const [isNewPersona, setIsNewPersona] = useState(false);

  // Audio and TTS state
  const [autoSpeak, setAutoSpeak] = useState<boolean>(false);
  const [enableShortFeedback, setEnableShortFeedback] = useState<boolean>(true);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [wasInterrupted, setWasInterrupted] = useState<boolean>(false);
  const [shortFeedbacks, setShortFeedbacks] = useState<Record<number, string>>({});
  const [isProcessingShortFeedback, setIsProcessingShortFeedback] = useState<boolean>(false);
  const [isLoadingInitialAI, setIsLoadingInitialAI] = useState<boolean>(false);
  const [pendingTTSCount, setPendingTTSCount] = useState<number>(0);
  const [isPlayingAnyTTS, setIsPlayingAnyTTS] = useState<boolean>(false);

  // Progress and feedback state
  const [showProgressModal, setShowProgressModal] = useState<boolean>(false);
  const [progressData, setProgressData] = useState<{
    percentages: number[];
    subgoalNames: string[];
    subgoalIds: string[];
    levelUpEvents?: LevelUpEvent[];
    progressTransitions?: Array<{
      subgoalId: string;
      previousProgress: number;
      currentProgress: number;
    }>;
  } | null>(null);
  const [manualRecording, setManualRecording] = useState(false);
  const [showShortFeedbackPanel, setShowShortFeedbackPanel] = useState<boolean>(true);
  const [shortFeedback, setShortFeedback] = useState<string>('');

  // Detailed feedback state
  const [showDetailedBreakdown, setShowDetailedBreakdown] = useState<{[key: number]: boolean}>({});
  const [showSuggestionExplanations, setShowSuggestionExplanations] = useState<{[key: number]: boolean}>({});
  const [explainButtonPressed, setExplainButtonPressed] = useState<boolean>(false);
  const [parsedBreakdown, setParsedBreakdown] = useState<{
    sentence: string;
    overview: string;
    details: string;
  }[]>([]);
  const [feedbackExplanations, setFeedbackExplanations] = useState<Record<number, Record<string, string>>>({});
  const [activePopup, setActivePopup] = useState<{ messageIndex: number; wordKey: string; position: { x: number; y: number } } | null>(null);
  const [showCorrectedVersions, setShowCorrectedVersions] = useState<Record<number, boolean>>({});

  // Quick translation state
  const [quickTranslations, setQuickTranslations] = useState<Record<number, { fullTranslation: string; wordTranslations: Record<string, string>; romanized: string; error: boolean; generatedWords?: string[]; generatedScriptWords?: string[] }>>({});
  const [showQuickTranslations, setShowQuickTranslations] = useState<Record<number, boolean>>({});
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);

  // TTS caching state
  const [ttsCache, setTtsCache] = useState<Map<string, { url: string; timestamp: number }>>(new Map());
  const [isGeneratingTTS, setIsGeneratingTTS] = useState<{[key: string]: boolean}>({});
  const [isPlayingTTS, setIsPlayingTTS] = useState<{[key: string]: boolean}>({});

  // Debug information states
  const [ttsDebugInfo, setTtsDebugInfo] = useState<{
    serviceUsed: string;
    fallbackReason: string;
    costEstimate: string;
    adminSettings: any;
    lastUpdate: Date | null;
  } | null>(null);

  const [romanizationDebugInfo, setRomanizationDebugInfo] = useState<{
    method: string;
    language: string;
    originalText: string;
    romanizedText: string;
    fallbackUsed: boolean;
    fallbackReason: string;
    textAnalysis: {
      hasKanji: boolean;
      hasHiragana: boolean;
      hasKatakana: boolean;
      isPureKana: boolean;
    };
    processingTime: number;
    lastUpdate: Date | null;
  } | null>(null);

  // TTS Queue for autospeak mode
  const [ttsQueue, setTtsQueue] = useState<Array<{ text: string; language: string; cacheKey: string }>>([]);
  const [isProcessingTtsQueue, setIsProcessingTtsQueue] = useState(false);

  // New autospeak pipeline state
  const [isPlayingShortFeedbackTTS, setIsPlayingShortFeedbackTTS] = useState(false);
  const [isPlayingAITTS, setIsPlayingAITTS] = useState(false);
  const [aiTTSQueued, setAiTTSQueued] = useState<{ text: string; language: string; cacheKey: string } | null>(null);

  // User preferences
  const [userPreferences, setUserPreferences] = useState<{
    formality: string;
    topics: string[];
    user_goals: string[];
    userLevel: string;
    feedbackLanguage: string;
    romanizationDisplay?: string;
  }>({
    formality: 'friendly',
    topics: [],
    user_goals: [],
    userLevel: 'beginner',
    feedbackLanguage: 'en',
    romanizationDisplay: 'both'
  });

  // Additional state variables needed for conversation loading
  const [messageCount, setMessageCount] = useState(0);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const MESSAGES_PER_PAGE = 20;

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<{ lang: string; stop: () => void } | null>(null);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const autoSpeakRef = useRef<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const interruptedRef = useRef<boolean>(false);

  // URL params
  const urlConversationId = urlParams.conversationId;
  const urlLang = urlParams.lang;
  const urlTopics = urlParams.topics;
  const urlFormality = urlParams.formality;
  const usePersona = urlParams.usePersona;

  // Get search params in useEffect to avoid SSR issues
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      setUrlParams({
        conversationId: searchParams.get('conversation') || '',
        lang: searchParams.get('language') || '',
        topics: searchParams.get('topics') || '',
        formality: searchParams.get('formality') || '',
        usePersona: searchParams.get('usePersona') === 'true'
      });
    }
  }, []);

  // Update language when urlLang becomes available
  React.useEffect(() => {
    if (urlLang) {
      setLanguage(urlLang);
    }
  }, [urlLang]);

  // Auth headers helper
  const getAuthHeaders = async () => {
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

  // Message handlers
  const handleMessageClick = (index: number, text: string) => {
    translation.handleMessageClick(index);
  };

  const handleTranslateMessage = async (messageIndex: number, text: string, breakdown = false) => {
    await translation.translateMessage(
      messageIndex, 
      text, 
      breakdown, 
      chatHistory, 
      language, 
      userPreferences, 
      user
    );
  };

  const handleRequestDetailedFeedback = async (messageIndex: number) => {
    await feedback.requestDetailedFeedbackForMessage(
      messageIndex,
      conversation.conversationId,
      chatHistory,
      language,
      userPreferences,
      conversation.fetchUserDashboardPreferences,
      setUserPreferences
    );
  };

  const handleRequestShortFeedback = async (messageIndex: number) => {
    await feedback.requestShortFeedbackForMessage(
      messageIndex,
      conversation.conversationId,
      chatHistory,
      language,
      userPreferences
    );
  };

  const handleRequestDetailedBreakdown = async (messageIndex: number) => {
    const message = chatHistory[messageIndex];
    if (message) {
      await translation.translateMessage(
        messageIndex,
        message.text,
        true, // breakdown = true
        chatHistory,
        language,
        userPreferences,
        user
      );
    }
  };

  const handleToggleDetailedFeedback = (messageIndex: number) => {
    // Implementation for toggling detailed feedback
    console.log('Toggle detailed feedback for message:', messageIndex);
  };

  const handleToggleShortFeedback = (messageIndex: number) => {
    // Implementation for toggling short feedback
    console.log('Toggle short feedback for message:', messageIndex);
  };

  const handleQuickTranslation = async (messageIndex: number, text: string) => {
    await translation.translateMessage(
      messageIndex,
      text,
      false, // breakdown = false
      chatHistory,
      language,
      userPreferences,
      user
    );
  };

  const handleExplainLLMResponse = async (messageIndex: number, text: string) => {
    await translation.explainSuggestion(
      messageIndex,
      text,
      chatHistory,
      language,
      userPreferences,
      user
    );
  };

  const handleAudioRecorded = async (audioBlob: Blob) => {
    await audioProcessing.sendAudioToBackend(
      audioBlob,
      language,
      conversation.conversationId,
      chatHistory,
      setChatHistory,
      conversation.saveMessageToBackend,
      autoSpeak,
      enableShortFeedback,
      (transcription: string, detectedLanguage?: string) => 
        feedback.fetchAndShowShortFeedback(
          transcription,
          detectedLanguage || language,
          language,
          chatHistory,
          userPreferences,
          autoSpeak,
          enableShortFeedback,
          setChatHistory,
          tts.playTTSAudio
        )
    );
  };

  const handlePlayTTS = (text: string, language: string) => {
    const cacheKey = `${language}_${text.substring(0, 50)}`;
    tts.playTTSAudio(text, language, cacheKey);
  };

  const handlePlayExistingTTS = (ttsUrl: string) => {
    tts.playExistingTTS(ttsUrl, 'existing');
  };

  const handleStartRecording = async () => {
    const success = await audioRecording.startRecording(language, autoSpeak);
    if (success) {
      console.log('Recording started');
    }
  };

  const handleStopRecording = () => {
    audioRecording.stopRecording();
    const audioBlob = audioRecording.getAudioBlob();
    if (audioBlob) {
      handleAudioRecorded(audioBlob);
    }
  };

  // Save session to backend
  const saveSessionToBackend = async (showAlert = true) => {
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

      setShowSavePrompt(false);
      localStorage.removeItem('chatHistory');
      if (showAlert) {
        alert('Session saved to your account as a conversation!');
      }
    } catch (e: unknown) {
      console.error('Save session error:', e);
      if (showAlert) {
        alert('Failed to save session.');
      }
    }
  };

  const loadExistingConversation = async (convId: string | null) => {
    if (!user || !convId) {
      return;
    }
    console.log('[CONVERSATION_LOAD] Starting to load conversation:', convId);
    setIsLoadingConversation(true);
    // Ensure topic modal is closed while loading
    setShowTopicModal(false);
    
    try {
      const response = await axios.get(`/api/conversations/${convId}`, { headers: await getAuthHeaders() });
      
      const conversation = response.data.conversation;
      console.log('[CONVERSATION_LOAD] Conversation loaded successfully:', conversation.id);
      setConversationId(conversation.id);
      // Preserve the user's current session language if already chosen
      setLanguage((prev) => prev || conversation.language);
      
      // Extract user preferences from conversation
      const formality = conversation.formality || 'friendly';
      const topics = conversation.topics ? (typeof conversation.topics === 'string' ? JSON.parse(conversation.topics) : conversation.topics) : [];
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
      console.log('[CONVERSATION_LOAD] Messages data:', messages);
      
      // Set pagination state (only enable banner when there's actually more to load)
      setMessageCount(messages.length);
      const initialLoaded = Math.min(messages.length, MESSAGES_PER_PAGE);
      setHasMoreMessages(messages.length > initialLoaded);
      
      // Load only the most recent messages for performance
      const recentMessages = messages.slice(-MESSAGES_PER_PAGE);
      console.log('[CONVERSATION_LOAD] Loading recent messages:', recentMessages.length);
      const history = recentMessages.map((msg: unknown) => {
        // If the database already has romanized_text stored separately, use it
        if ((msg as any).romanized_text) {
          return {
            sender: (msg as any).sender,
            text: (msg as any).text,
            romanizedText: (msg as any).romanized_text,
            timestamp: new Date((msg as any).created_at),
            isFromOriginalConversation: true // Mark existing messages as old
          };
        } else {
          // Fallback to parsing the text for romanized content
          const formatted = formatScriptLanguageText((msg as any).text, conversation.language || 'en');
          return {
            sender: (msg as any).sender,
            text: formatted.mainText,
            romanizedText: formatted.romanizedText,
            timestamp: new Date((msg as any).created_at),
            isFromOriginalConversation: true // Mark existing messages as old
          };
        }
      });

      setChatHistory(history);
      console.log('[CONVERSATION_LOAD] Set chat history:', history.length, 'messages');
      
      // Store user preferences for use in API calls
      setUserPreferences({ formality, topics, user_goals, userLevel, feedbackLanguage, romanizationDisplay });
      console.log('[CONVERSATION_LOAD] Conversation loading completed successfully');
    } catch (error: unknown) {
      console.error('[CONVERSATION_LOAD] Error loading conversation:', error);
      console.error('[CONVERSATION_LOAD] Error details:', (error as any).response?.data || (error as any).message);
      // Reset conversation state on error
      setConversationId(null);
      // Don't show error to user, just log it
    } finally {
      setIsLoadingConversation(false);
    }
  };

  const fetchSuggestions = async () => {
    if (!user) return;
    
    setIsLoadingSuggestions(true);
    try {
      const token = localStorage.getItem('jwt');
      // Prepare chat history for suggestions - include all messages including the most recent user message
      const chatHistoryForSuggestions = chatHistory.map(msg => ({
        sender: msg.sender,
        text: msg.text,
        timestamp: msg.timestamp
      }));
      
      console.log('🔍 [FRONTEND] Sending chat history to suggestions:', chatHistoryForSuggestions.length, 'messages');
      console.log('🔍 [FRONTEND] Chat history details:', chatHistoryForSuggestions);
      
      const response = await axios.post(
        '/api/suggestions',
        {
          conversationId: conversationId,
          chat_history: chatHistoryForSuggestions, // Send chat history directly
          language: language,
          user_level: userPreferences.userLevel,
          user_topics: userPreferences.topics,
          formality: userPreferences.formality,
          feedback_language: userPreferences.feedbackLanguage
        },
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );
      
      const suggestions = response.data.suggestions || [];
      setSuggestions(suggestions);
      
      // Also set suggestionMessages for the carousel
      if (suggestions.length > 0) {
        // Reset explanation state for a fresh set
        setSuggestionTranslations({});
        setShowSuggestionTranslations({});
        setIsTranslatingSuggestion({});
        setShowSuggestionExplanations({});
        setExplainButtonPressed(false);
        console.log('Setting suggestions:', suggestions);
        const tempMessages = suggestions.map((suggestion: any, index: number) => {
          const formattedText = formatScriptLanguageText(suggestion.text?.replace(/\*\*/g, '') || '', language);
          return {
            sender: 'User',
            text: formattedText.mainText,
            romanizedText: formattedText.romanizedText || suggestion.romanized || '',
            timestamp: new Date(),
            messageType: 'text',
            isSuggestion: true,
            suggestionIndex: index,
            totalSuggestions: suggestions.length,
            explanation: suggestion.explanation || '',
            translation: suggestion.translation || '',
            romanized: suggestion.romanized || ''
          };
        });
        
        console.log('Setting suggestionMessages:', tempMessages);
        setSuggestionMessages(tempMessages);
        setCurrentSuggestionIndex(0);
        setShowSuggestionCarousel(true);
        console.log('Set showSuggestionCarousel to true');
      }
    } catch (error: unknown) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleSuggestionButtonClick = async () => {
    if (!user || isProcessing) return;
    
    setIsLoadingSuggestions(true);
    try {
      const token = localStorage.getItem('jwt');
      console.log('[DEBUG] Suggestions request - language:', language);
      console.log('[DEBUG] Suggestions request - userPreferences:', userPreferences);
      
      // Prepare chat history for suggestions - include all messages including the most recent user message
      const chatHistoryForSuggestions = chatHistory.map(msg => ({
        sender: msg.sender,
        text: msg.text,
        timestamp: msg.timestamp
      }));
      
      console.log('🔍 [FRONTEND] Sending chat history to suggestions (button click):', chatHistoryForSuggestions.length, 'messages');
      console.log('🔍 [FRONTEND] Chat history details (button click):', chatHistoryForSuggestions);
      
      const response = await axios.post(
        '/api/suggestions',
        {
          conversationId: conversationId,
          chat_history: chatHistoryForSuggestions, // Send chat history directly
          language: language,
          user_level: userPreferences.userLevel,
          user_topics: userPreferences.topics,
          formality: userPreferences.formality,
          feedback_language: userPreferences.feedbackLanguage
        },
        {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        }
      );
      
      const suggestions = response.data.suggestions || [];
      if (suggestions.length > 0) {
        // Create temporary suggestion messages with all data from the API
        // Reset explanation-related state so previous clicks don't persist
        setSuggestionTranslations({});
        setShowSuggestionTranslations({});
        setIsTranslatingSuggestion({});
        setShowSuggestionExplanations({});
        setExplainButtonPressed(false);
        const tempMessages = suggestions.map((suggestion: any, index: number) => {
          const formattedText = formatScriptLanguageText(suggestion.text?.replace(/\*\*/g, '') || '', language);
          return {
            sender: 'User',
            text: formattedText.mainText,
            romanizedText: formattedText.romanizedText || suggestion.romanized || '',
            timestamp: new Date(),
            messageType: 'text',
            isSuggestion: true,
            suggestionIndex: index,
            totalSuggestions: suggestions.length,
            explanation: suggestion.explanation || '',
            translation: suggestion.translation || '',
            romanized: suggestion.romanized || ''
          };
        });
        
        setSuggestionMessages(tempMessages);
        setCurrentSuggestionIndex(0);
        setShowSuggestionCarousel(true);
        console.log('Set showSuggestionCarousel to true (button click)');
      }
    } catch (error: unknown) {
      console.error('Error fetching suggestions (button click):', error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const navigateSuggestion = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentSuggestionIndex(prev => prev > 0 ? prev - 1 : suggestionMessages.length - 1);
    } else {
      setCurrentSuggestionIndex(prev => prev < suggestionMessages.length - 1 ? prev + 1 : 0);
    }
  };

  const clearSuggestionCarousel = () => {
    setShowSuggestionCarousel(false);
    setSuggestionMessages([]);
    setCurrentSuggestionIndex(0);
    setSuggestions([]);
  };

  const getSessionMessages = () => {
    if (!sessionStartTime) {
      return chatHistory; // If no session start time, return all messages
    }
    
    // For continued conversations, only include messages that are NOT from the original conversation
    // (i.e., messages added after clicking "Continue")
    const sessionMessages = chatHistory.filter(message => !message.isFromOriginalConversation);
    
    return sessionMessages;
  };

  const generateConversationSummary = async () => {
    try {
      const sessionMessages = getSessionMessages();
      
      if (sessionMessages.length === 0) {
        router.push('/dashboard');
        return;
      }
      
      const userSessionMessages = sessionMessages.filter(msg => msg.sender === 'User');
      
      if (userSessionMessages.length === 0) {
        router.push('/dashboard');
        return;
      }
      
      // For continued conversations, only show progress popup if there are new messages
      const hasContinuedConversation = sessionStartTime !== null;
      const hasNewMessages = userSessionMessages.length > 0;
      
      // Try to get learning goals from multiple sources
      let user_goals = userPreferences.user_goals?.length > 0 
        ? userPreferences.user_goals 
        : (user?.learning_goals ? (typeof user.learning_goals === 'string' ? JSON.parse(user.learning_goals) : user.learning_goals) : []);
      
      // If still empty, try to get from the conversation object directly
      if (!user_goals || user_goals.length === 0) {
        try {
          const token = localStorage.getItem('jwt');
          const response = await axios.get(`/api/conversations/${conversationId}`, {
            headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
          });
          const conversation = response.data.conversation;
          if (conversation?.learning_goals) {
            const conversationLearningGoals = typeof conversation.learning_goals === 'string' 
              ? JSON.parse(conversation.learning_goals) 
              : conversation.learning_goals;
            user_goals = conversationLearningGoals;
          }
        } catch (error) {
          // Error handling removed for performance
        }
      }
      
      // Get user's current subgoal progress
      const storedProgress = localStorage.getItem(`subgoal_progress_${user?.id}_${language}`);
      let userSubgoalProgress: SubgoalProgress[] = [];
      if (storedProgress) {
        try {
          userSubgoalProgress = JSON.parse(storedProgress);
        } catch (error) {
          // Error handling removed for performance
        }
      }
      
      let subgoalInstructions = '';
      
      if (user_goals.length > 0) {
        subgoalInstructions = user_goals.map((goalId: string) => {
          const goal = LEARNING_GOALS.find((g: LearningGoal) => g.id === goalId);
          
          if (goal?.subgoals) {
            const instructions = goal.subgoals
              .filter(subgoal => subgoal.description)
              .map(subgoal => {
                const userLevel = getSubgoalLevel(subgoal.id, userSubgoalProgress);
                const progressiveDescription = getProgressiveSubgoalDescription(subgoal.id, userLevel);
                return progressiveDescription;
              });
            return instructions.join('\n');
          }
          return '';
        }).filter(instructions => instructions.length > 0).join('\n');
      } else {
        const defaultGoal = LEARNING_GOALS[0];
        if (defaultGoal?.subgoals) {
          subgoalInstructions = defaultGoal.subgoals
            .filter(subgoal => subgoal.description)
            .map(subgoal => {
              const userLevel = getSubgoalLevel(subgoal.id, userSubgoalProgress);
              const progressiveDescription = getProgressiveSubgoalDescription(subgoal.id, userLevel);
              return progressiveDescription;
            })
            .join('\n');
        }
      }
      
      const isContinuedConversation = sessionStartTime !== null;
      
      const requestPayload = {
        chat_history: sessionMessages,
        subgoal_instructions: subgoalInstructions,
        target_language: language,
        feedback_language: userPreferences?.feedbackLanguage || 'en',
        is_continued_conversation: isContinuedConversation
      };

      const token = localStorage.getItem('jwt');
      const response = await axios.post('/api/conversation-summary', requestPayload, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      // Update conversation with summary data
      if (conversationId) {
        try {
          if (response.data.title && response.data.title.trim() !== '' && response.data.title !== '[No Title]') {
            await axios.put(`/api/conversations/${conversationId}/title`, {
              title: response.data.title
            }, {
              headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {})
              }
            });
          }
          
          const progressDataToSave = response.data.progress_percentages && 
            response.data.progress_percentages.length > 0 && 
            response.data.progress_percentages.some((p: number) => p > 0) 
            ? JSON.stringify({
                goals: user_goals,
                percentages: response.data.progress_percentages
              })
            : null;
          
          const conversationUpdateData: any = {
            synopsis: response.data.synopsis,
            progress_data: progressDataToSave
          };
          
          if (isUsingPersona && conversationDescription) {
            conversationUpdateData.usesPersona = true;
            conversationUpdateData.description = conversationDescription;
          }
          
          await axios.patch(`/api/conversations/${conversationId}`, conversationUpdateData, {
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {})
            }
          });
          
          // Handle progress data and level-ups
          const progressPercentages = response.data.progress_percentages || [];
          
          if ((progressPercentages && progressPercentages.length > 0) || 
              (hasContinuedConversation && hasNewMessages)) {
            
            const levelUpEvents: LevelUpEvent[] = [];
            const updatedSubgoalProgress = [...userSubgoalProgress];
            
            const subgoalIds: string[] = [];
            user_goals?.forEach((goalId: string) => {
              const goal = LEARNING_GOALS.find((g: LearningGoal) => g.id === goalId);
              if (goal?.subgoals) {
                goal.subgoals.forEach(subgoal => {
                  if (subgoal.description) {
                    subgoalIds.push(subgoal.id);
                  }
                });
              }
            });
            
            if (progressPercentages && Array.isArray(progressPercentages)) {
              progressPercentages.forEach((percentage: number, index: number) => {
                if (index < subgoalIds.length) {
                  const subgoalId = subgoalIds[index];
                  
                  const { updatedProgress, levelUpEvent } = updateSubgoalProgress(
                    subgoalId,
                    percentage,
                    updatedSubgoalProgress
                  );
                  
                  if (levelUpEvent) {
                    levelUpEvents.push(levelUpEvent);
                  }
                  
                  updatedSubgoalProgress.splice(0, updatedSubgoalProgress.length, ...updatedProgress);
                }
              });
            }
            
            localStorage.setItem(`subgoal_progress_${user?.id}_${language}`, JSON.stringify(updatedSubgoalProgress));
            
            window.dispatchEvent(new CustomEvent('subgoalProgressUpdated', {
              detail: { levelUpEvents, updatedProgress: updatedSubgoalProgress }
            }));
            
            const subgoalNames = user_goals?.map((goalId: string) => {
              const goal = LEARNING_GOALS.find((g: LearningGoal) => g.id === goalId);
              return goal?.subgoals?.map(subgoal => {
                const userLevel = getSubgoalLevel(subgoal.id, updatedSubgoalProgress);
                const levelUpEvent = levelUpEvents.find(event => event.subgoalId === subgoal.id);
                const descriptionLevel = levelUpEvent ? levelUpEvent.oldLevel : userLevel;
                return getProgressiveSubgoalDescription(subgoal.id, descriptionLevel);
              }) || [];
            }).flat().slice(0, 3) || [];
            
            const progressTransitions = response.data.progress_percentages && Array.isArray(response.data.progress_percentages) 
              ? response.data.progress_percentages.map((percentage: number, index: number) => {
                const subgoalId = subgoalIds[index];
                const previousProgress = userSubgoalProgress?.find(p => p.subgoalId === subgoalId)?.percentage || 0;
                return {
                  subgoalId,
                  previousProgress,
                  currentProgress: percentage
                };
              })
              : [];
            
            const finalProgressData = {
              percentages: response.data.progress_percentages && Array.isArray(response.data.progress_percentages) 
                ? response.data.progress_percentages 
                : [],
              subgoalNames: subgoalNames,
              subgoalIds: subgoalIds,
              levelUpEvents: levelUpEvents,
              progressTransitions: progressTransitions
            };
            
            if (chatHistory.length >= 30) {
              router.push('/dashboard');
            } else {
              setProgressData(finalProgressData);
              setShowProgressModal(true);
            }
          } else {
            router.push('/dashboard');
          }
        } catch (updateError) {
          console.error('Error updating conversation with summary:', updateError);
          router.push('/dashboard');
        }
      }
      
      return response.data;
    } catch (error: unknown) {
      console.error('Error generating conversation summary:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response status:', error.response?.status);
        console.error('Response data:', error.response?.data);
      }
      throw error;
    }
  };

  const handleModalConversationStart = async (newConversationId: string, topics: string[], aiMessage: unknown, formality: string, learningGoals: string[], description?: string, isUsingExistingPersona?: boolean) => {
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
    setShowTopicModal(false);
    setSkipValidation(true);
    setTimeout(() => setSkipValidation(false), 2000); // Skip validation for 2 seconds
    
    // For new conversations, sessionStartTime should be null initially
    setSessionStartTime(null);
    
    // Set the conversation description
    setConversationDescription(description || '');
    
    // Check if this is a persona-based conversation (has a description)
    const isPersonaConversation = !!(description && description.trim());
    setIsUsingPersona(isPersonaConversation);
    
    // Mark this as a new persona only if it's not using an existing persona
    setIsNewPersona(!isUsingExistingPersona);
    
    // Fetch user's dashboard preferences for this language
    const dashboardPrefs = await fetchUserDashboardPreferences(language);
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
      const formattedMessage = formatScriptLanguageText((aiMessage as any).text, language);
      setChatHistory([{ 
        sender: 'AI', 
        text: formattedMessage.mainText, 
        romanizedText: formattedMessage.romanizedText,
        ttsUrl: (aiMessage as any).ttsUrl || null,
        timestamp: new Date(),
        isFromOriginalConversation: false // New conversation message
      }]);
      
      // Play TTS for the initial AI message if available
      if ((aiMessage as any).ttsUrl && (aiMessage as any).ttsUrl !== null) {
        console.log('[DEBUG] Playing initial AI message TTS:', (aiMessage as any).ttsUrl);
        // Handle both relative and absolute URLs from backend
        const ttsUrl = (aiMessage as any).ttsUrl;
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://beyondwords-express.onrender.com';
        const audioUrl = ttsUrl.startsWith('http') ? ttsUrl : `${backendUrl}${ttsUrl}`;
        
        console.log('[DEBUG] TTS URL details:', {
          originalTtsUrl: ttsUrl,
          backendUrl: backendUrl,
          finalAudioUrl: audioUrl
        });
        
        try {
          console.log('[DEBUG] Checking audio file availability:', audioUrl);
          const headResponse = await fetch(audioUrl, { method: 'HEAD' });
          console.log('[DEBUG] HEAD response status:', headResponse.status);
          console.log('[DEBUG] HEAD response headers:', Object.fromEntries(headResponse.headers.entries()));
          
          if (headResponse.ok) {
            console.log('[DEBUG] Audio file is accessible, creating Audio object');
            const audio = new window.Audio(audioUrl);
            ttsAudioRef.current = audio;
            
            audio.addEventListener('loadstart', () => console.log('[DEBUG] Audio loading started'));
            audio.addEventListener('canplay', () => console.log('[DEBUG] Audio can play'));
            audio.addEventListener('error', (e) => console.error('[DEBUG] Audio error event:', e));
            
            audio.onended = () => {
              ttsAudioRef.current = null;
              console.log('[DEBUG] Initial AI TTS finished playing');
            };
            
            console.log('[DEBUG] Attempting to play audio');
            audio.play().catch(error => {
              console.error('Failed to play initial TTS audio:', error);
              ttsAudioRef.current = null;
            });
          } else {
            console.log('[DEBUG] Initial TTS file not found (status:', headResponse.status, '), skipping TTS playback');
          }
        } catch (fetchError: unknown) {
          console.error('Error checking initial TTS audio file:', fetchError);
        }
      } else {
        console.log('[DEBUG] No TTS URL provided for initial AI message, skipping TTS playback');
        // Don't try to auto-generate TTS if backend TTS failed
        // This prevents TTS playing states from being set incorrectly
      }
    } else {
      const fallbackMessage = 'Hello! What would you like to talk about today?';
      setChatHistory([{ sender: 'AI', text: fallbackMessage, timestamp: new Date(), isFromOriginalConversation: false }]);
      
      // Auto-generate and play TTS for fallback AI message
      const aiMessageObj: ChatMessage = {
        text: fallbackMessage,
        sender: 'AI',
        timestamp: new Date(),
        isFromOriginalConversation: false
      };
      const ttsText = cleanTextForTTS(aiMessageObj.text);
      const cacheKey = `ai_message_fallback_${Date.now()}`;
      await tts.playTTSAudio(ttsText, language, cacheKey);
      
      // Note: TTS will handle autospeak restart in its onended event
      // No need to manually restart recording here
    }
  };

  const handleSuggestionClick = () => {
    setShowSuggestionCarousel(true);
  };

  const saveMessageToBackend = async (sender: string, text: string, messageType = 'text', audioFilePath = null, targetConversationId = null, romanizedText: string | null = null) => {
    const useConversationId = targetConversationId || conversationId;
    if (!useConversationId) {
      console.warn('[SAVE_MESSAGE] No conversation ID available, skipping message save');
      return;
    }
    try {
      const authHeaders = await getAuthHeaders();
      if (!authHeaders || !(authHeaders as any).Authorization) {
        console.warn('[SAVE_MESSAGE] Missing Authorization, skipping backend save');
        return;
      }
      console.log(`[SAVE_MESSAGE] Saving ${sender} message to conversation ${useConversationId}`);
      const response = await axios.post(
        `/api/conversations/${useConversationId}/messages`,
        {
          sender,
          text,
          messageType,
          audioFilePath,
          romanized_text: romanizedText,
          // Ensure backend receives a valid NOT NULL order
          message_order: Math.max(1, (chatHistory?.length || 0))
        },
        { headers: authHeaders as any }
      );
      console.log(`[SAVE_MESSAGE] Successfully saved ${sender} message to conversation ${useConversationId}`);
    } catch (error: unknown) {
      console.error('[SAVE_MESSAGE] Failed to save message to backend:', error);
      // Don't throw - we don't want to break the UI if message saving fails
      // The message is still in the local chat history
    }
  };

  // Authentication protection
  useEffect(() => {
    if (user === null) {
      router.push('/login');
      return;
    }
  }, [user, router]);

  // Show loading while checking authentication
  if (user === null) {
    return <LoadingScreen message="Loading..." />;
  }

  // Prevent body scrolling on analyze page
  React.useEffect(() => {
    document.body.classList.add('analyze-page-active');
    return () => {
      document.body.classList.remove('analyze-page-active');
    };
  }, []);

  // Hide suggestions when processing starts and prevent re-showing
  React.useEffect(() => {
    if (isProcessing) {
      setShowSuggestionCarousel(false);
      setSuggestionMessages([]);
      // Reset suggestion explanation state when processing starts
      setSuggestionTranslations({});
      setShowSuggestionTranslations({});
      setIsTranslatingSuggestion({});
      setShowSuggestionExplanations({});
      setExplainButtonPressed(false);
    }
  }, [isProcessing]);

  // Keep refs in sync with state
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language || 'en-US';
    }
  }, [language]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Show topic modal automatically when accessing analyze page without conversation ID
  useEffect(() => {
    // Only show topic modal if:
    // 1. User is logged in
    // 2. No conversation ID in URL
    // 3. No conversation ID in state
    // 4. Chat history is empty
    // 5. Not currently loading a conversation
    // 6. Not in the middle of loading an existing conversation
    if (user && !urlConversationId && !conversationId && chatHistory.length === 0 && !isLoadingConversation) {
      console.log('[TOPIC_MODAL] Showing topic modal - no existing conversation');
      setShowTopicModal(true);
    } else if (conversationId && chatHistory.length > 0) {
      // If we have a conversation ID and chat history, ensure topic modal is closed
      console.log('[TOPIC_MODAL] Hiding topic modal - conversation loaded with messages');
      setShowTopicModal(false);
    }
  }, [user, urlConversationId, conversationId, chatHistory.length, isLoadingConversation]);

  useEffect(() => {
    if (user && localStorage.getItem('chatHistory')) {
      setShowSavePrompt(true);
    }
  }, [user]);

  useEffect(() => {
    if (user?.language && !language) {
      setLanguage(user.language);
    }
  }, [user, language]);

  // Function to fetch user's dashboard preferences
  const fetchUserDashboardPreferences = async (languageCode: string) => {
    try {
      if (!user?.id) {
        return null;
      }

      const { success, data: dashboards } = await getUserLanguageDashboards(user.id);
      
      if (!success) {
        console.error('Failed to fetch language dashboards');
        return null;
      }

      const dashboard = (dashboards || []).find((d: any) => d.language === languageCode);
      
      if (dashboard) {
        return {
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

  // Load preferences for the current language
  const loadPreferencesForLanguage = async () => {
    if (!language) return;
    
    const preferences = await fetchUserDashboardPreferences(language);
    if (preferences) {
      setUserPreferences({
        formality: 'friendly',
        topics: preferences.talk_topics || [],
        user_goals: preferences.learning_goals || [],
        userLevel: preferences.proficiency_level || 'beginner',
        feedbackLanguage: 'en',
        romanizationDisplay: preferences.romanization_display || 'both'
      });
    }
  };

  // Load preferences when language changes
  useEffect(() => {
    loadPreferencesForLanguage();
  }, [language]);

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="flex h-screen">
        {/* Left Panel */}
        <div 
          ref={leftPanelRef}
          className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} border-r border-gray-300`}
          style={{ width: `${leftPanelWidth * 100}%` }}
        >
          <div className="p-4">
            <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Chat History
            </h2>
            <MessageList
              messages={chatHistory}
              onMessageClick={handleMessageClick}
              onTranslateMessage={handleTranslateMessage}
              onRequestDetailedFeedback={handleRequestDetailedFeedback}
              onRequestShortFeedback={handleRequestShortFeedback}
              onRequestDetailedBreakdown={handleRequestDetailedBreakdown}
              onToggleDetailedFeedback={handleToggleDetailedFeedback}
              onToggleShortFeedback={handleToggleShortFeedback}
              onQuickTranslation={handleQuickTranslation}
              onExplainLLMResponse={handleExplainLLMResponse}
              translations={translation.translations}
              isTranslating={translation.isTranslating}
              showTranslations={translation.showTranslations}
              suggestionTranslations={translation.suggestionTranslations}
              isTranslatingSuggestion={translation.isTranslatingSuggestion}
              showSuggestionTranslations={translation.showSuggestionTranslations}
              isLoadingMessageFeedback={isLoadingMessageFeedback}
              shortFeedbacks={shortFeedbacks}
              romanizationDisplay={userPreferences.romanizationDisplay || 'both'}
              language={language}
              isDarkMode={isDarkMode}
              onPlayTTS={handlePlayTTS}
              onPlayExistingTTS={handlePlayExistingTTS}
              isPlayingTTS={tts.isPlaying}
              currentPlayingText={tts.currentPlayingText}
            />
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-hidden">
            <div className="h-full flex flex-col">
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4">
                <MessageList
                  messages={chatHistory}
                  onMessageClick={handleMessageClick}
                  onTranslateMessage={handleTranslateMessage}
                  onRequestDetailedFeedback={handleRequestDetailedFeedback}
                  onRequestShortFeedback={handleRequestShortFeedback}
                  onRequestDetailedBreakdown={handleRequestDetailedBreakdown}
                  onToggleDetailedFeedback={handleToggleDetailedFeedback}
                  onToggleShortFeedback={handleToggleShortFeedback}
                  onQuickTranslation={handleQuickTranslation}
                  onExplainLLMResponse={handleExplainLLMResponse}
                  translations={translation.translations}
                  isTranslating={translation.isTranslating}
                  showTranslations={translation.showTranslations}
                  suggestionTranslations={translation.suggestionTranslations}
                  isTranslatingSuggestion={translation.isTranslatingSuggestion}
                  showSuggestionTranslations={translation.showSuggestionTranslations}
                  isLoadingMessageFeedback={feedback.isLoadingMessageFeedback}
                  shortFeedbacks={feedback.shortFeedbacks}
                  romanizationDisplay={userPreferences.romanizationDisplay || 'both'}
                  language={language}
                  isDarkMode={isDarkMode}
                  onPlayTTS={handlePlayTTS}
                  onPlayExistingTTS={handlePlayExistingTTS}
                  isPlayingTTS={tts.isPlaying}
                  currentPlayingText={tts.currentPlayingText}
                  isPlayingAnyTTS={tts.isPlayingAnyTTS}
                  isGeneratingTTS={tts.isGeneratingTTS}
                />
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className={`border-t p-4 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}>
                <div className="flex items-center space-x-2">
                  <AudioControls
                    onStartRecording={handleStartRecording}
                    onStopRecording={handleStopRecording}
                    onAudioRecorded={handleAudioRecorded}
                    isRecording={audioRecording.isRecording}
                    isPaused={audioRecording.isPaused}
                    wasInterrupted={audioRecording.wasInterrupted}
                    isDarkMode={isDarkMode}
                  />
                  
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Type your message..."
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDarkMode
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>
                  
                  <button
                    className={`px-4 py-2 rounded-lg font-medium ${
                      isDarkMode
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div 
          ref={rightPanelRef}
          className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} border-l border-gray-300`}
          style={{ width: `${rightPanelWidth * 100}%` }}
        >
          <div className="p-4">
            <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Translation & Feedback
            </h2>
            {/* Translation panel content would go here */}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showTopicModal && (
        <TopicSelectionModal
          isOpen={showTopicModal}
          onClose={() => setShowTopicModal(false)}
          onStartConversation={handleModalConversationStart}
        />
      )}

      {showPersonaModal && (
        <PersonaModal
          isOpen={showPersonaModal}
          onClose={() => setShowPersonaModal(false)}
          onSave={async (personaName) => {
            console.log('Save persona:', personaName);
            setShowPersonaModal(false);
          }}
          isSaving={isSavingPersona}
          currentTopics={userPreferences?.topics || []}
          currentDescription={conversationDescription}
          currentFormality={userPreferences?.formality || 'neutral'}
        />
      )}

      {/* Progress Modal */}
      {showProgressModal && progressData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'var(--background)',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
          }}>
            <h2 style={{
              color: 'var(--foreground)',
              fontSize: '1.5rem',
              fontWeight: 700,
              marginBottom: '1.5rem',
              textAlign: 'center',
              fontFamily: 'Montserrat, Arial, sans-serif'
            }}>
              🎉 Progress Update!
            </h2>
            
            <div style={{ marginBottom: '1.5rem' }}>
              {progressData.percentages.map((percentage, index) => (
                <div key={index} style={{ marginBottom: '1rem' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.5rem'
                  }}>
                    <span style={{
                      color: 'var(--foreground)',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      fontFamily: 'AR One Sans, Arial, sans-serif'
                    }}>
                      {progressData.subgoalNames[index] || `Goal ${index + 1}`}
                    </span>
                    <span style={{
                      color: 'var(--rose-primary)',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      fontFamily: 'Montserrat, Arial, sans-serif'
                    }}>
                      {Math.round(percentage)}%
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: 'var(--muted)',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${percentage}%`,
                      height: '100%',
                      backgroundColor: 'var(--rose-primary)',
                      borderRadius: '4px',
                      transition: 'width 0.8s ease-in-out'
                    }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Level Up Events */}
            {progressData.levelUpEvents && progressData.levelUpEvents.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{
                  color: 'var(--foreground)',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  marginBottom: '1rem',
                  textAlign: 'center',
                  fontFamily: 'Montserrat, Arial, sans-serif'
                }}>
                  🚀 Level Up!
                </h3>
                {progressData.levelUpEvents.map((levelUpEvent, index) => (
                  <div key={index} style={{
                    backgroundColor: 'var(--muted)',
                    borderRadius: '8px',
                    padding: '1rem',
                    marginBottom: '0.5rem',
                    border: '1px solid rgba(126,90,117,0.1)'
                  }}>
                    <div style={{
                      color: 'var(--muted-foreground)',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      marginBottom: '0.3rem',
                      fontFamily: 'Montserrat, Arial, sans-serif'
                    }}>
                      New Challenge:
                    </div>
                    <div style={{
                      color: 'var(--foreground)',
                      fontSize: '0.75rem',
                      lineHeight: '1.2',
                      fontFamily: 'AR One Sans, Arial, sans-serif'
                    }}>
                      {levelUpEvent.newDescription}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div style={{
              display: 'flex',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => {
                  setShowProgressModal(false);
                  setProgressData(null);
                  router.push('/dashboard');
                }}
                style={{
                  padding: '0.6rem 1.5rem',
                  border: 'none',
                  borderRadius: '8px',
                  background: 'var(--rose-primary)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  fontFamily: 'Montserrat, Arial, sans-serif',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, var(--rose-primary) 0%, #8a6a7a 100%)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--rose-primary)';
                }}
              >
                Continue to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyzeContent;
