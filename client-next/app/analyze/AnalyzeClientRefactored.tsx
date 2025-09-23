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
import ChatMessageItem from './ChatMessageItem';
import unidecode from 'unidecode';
import Kuroshiro from 'kuroshiro';
import KuromojiAnalyzer from 'kuroshiro-analyzer-kuromoji';
import pinyin from 'pinyin';
// pinyin-pro types don't include 'mark' in some versions; cast options as any to allow tone marks
import { pinyin as pinyinPro } from 'pinyin-pro';
import { transliterate } from 'transliteration';
import * as wanakana from 'wanakana';
import { convert as romanizeHangul } from 'hangul-romanization';
import Sanscript from '@indic-transliteration/sanscript';

// Import the new components
import AnalyzeLayout from './components/AnalyzeLayout';
import MainContentArea from './components/MainContentArea';
import ChatMessagesContainer from './components/ChatMessagesContainer';
import RecordingControls from './components/RecordingControls';
import SuggestionCarousel from './components/SuggestionCarousel';
import RightPanel from './components/RightPanel';

// Import hooks
import { usePersistentChatHistory } from './hooks/useChatHistory';
import { useAudioRecording } from './hooks/useAudioRecording';
import { useTTS } from './hooks/useTTS';
import { useTranslation } from './hooks/useTranslation';
import { useConversation } from './hooks/useConversation';
import { useAudioProcessing } from './hooks/useAudioProcessing';
import { useFeedback } from './hooks/useFeedback';

// Import types and utilities
import { 
  ChatMessage, 
  User, 
  SCRIPT_LANGUAGES, 
  getLanguageLabel, 
  isScriptLanguage, 
  formatScriptLanguageText, 
  fixRomanizationPunctuation 
} from './types/analyze';
import { cleanTextForTTS } from './utils/textFormatting';

// Kuroshiro singleton with explicit Kuromoji dict path served from /public
let kuroshiroSingleton: Kuroshiro | null = null;
let kuroshiroInitPromise: Promise<Kuroshiro> | null = null;

const getKuroshiroInstance = async (): Promise<Kuroshiro> => {
  if (kuroshiroSingleton) return kuroshiroSingleton;
  if (!kuroshiroInitPromise) {
    kuroshiroInitPromise = (async () => {
      const instance = new Kuroshiro();
      // Ensure the Kuromoji dictionary is fetched from the public path
      await instance.init(new KuromojiAnalyzer({ dictPath: '/kuromoji/dict' } as any));
      kuroshiroSingleton = instance;
      return instance;
    })();
  }
  return kuroshiroInitPromise;
};

const AnalyzeContent = () => {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading analyze page...</div>
      </div>
    );
  }
  
  return <AnalyzeContentInner />;
};

const AnalyzeContentInner = () => {
  const router = useRouter();
  const { isDarkMode } = useDarkMode();
  const user = useUser();

  // Helper to get JWT token - using the more robust version from original
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

  // Move searchParams usage to state to avoid SSR issues
  const [urlParams, setUrlParams] = useState({
    conversationId: '',
    lang: '',
    topics: '',
    formality: '',
    usePersona: false
  });

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

  const urlConversationId = urlParams.conversationId;
  const urlLang = urlParams.lang;
  const urlTopics = urlParams.topics;
  const urlFormality = urlParams.formality;
  const usePersona = urlParams.usePersona;

  // Core application state - all from original
  const [language, setLanguage] = useState('en');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [enableShortFeedback, setEnableShortFeedback] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationDescription, setConversationDescription] = useState('');
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [isSavingPersona, setIsSavingPersona] = useState(false);
  
  // Additional state variables from original
  const [skipValidation, setSkipValidation] = useState(false);
  const [isUsingPersona, setIsUsingPersona] = useState<boolean>(false);
  const [isNewPersona, setIsNewPersona] = useState(false);
  
  // Recording state variables from original
  const [wasInterrupted, setWasInterrupted] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [manualRecording, setManualRecording] = useState(false);
  
  // TTS state variables from original
  const [isAnyTTSPlaying, setIsAnyTTSPlaying] = useState(false);
  const [aiTTSQueued, setAiTTSQueued] = useState<{ text: string; language: string; cacheKey: string } | null>(null);

  // Suggestions state
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showSuggestionCarousel, setShowSuggestionCarousel] = useState(false);
  const [suggestionMessages, setSuggestionMessages] = useState<ChatMessage[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestionExplanations, setShowSuggestionExplanations] = useState(false);
  const [explainButtonPressed, setExplainButtonPressed] = useState(false);

  // Translation state
  const [showTranslations, setShowTranslations] = useState<Record<number, boolean>>({});
  const [isTranslating, setIsTranslating] = useState<Record<number, boolean>>({});
  const [translations, setTranslations] = useState<Record<number, { translation?: string; breakdown?: string; has_breakdown?: boolean }>>({});
  const [suggestionTranslations, setSuggestionTranslations] = useState<Record<number, { translation?: string; breakdown?: string; has_breakdown?: boolean }>>({});
  const [isTranslatingSuggestion, setIsTranslatingSuggestion] = useState<Record<number, boolean>>({});
  const [showSuggestionTranslations, setShowSuggestionTranslations] = useState<Record<number, boolean>>({});

  // UI panels state
  const [showShortFeedbackPanel, setShowShortFeedbackPanel] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(300);
  const [rightPanelWidth, setRightPanelWidth] = useState(300);
  
  // Left panel content state - all from original
  const [shortFeedback, setShortFeedback] = useState<string>('');
  const [shortFeedbacks, setShortFeedbacks] = useState<Record<number, string>>({});
  const [showQuickTranslation, setShowQuickTranslation] = useState<boolean>(true);
  const [llmBreakdown, setLlmBreakdown] = useState<string>('');
  const [showLlmBreakdown, setShowLlmBreakdown] = useState<boolean>(false);

  // Modals state
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [showPersonaModal, setShowPersonaModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressData, setProgressData] = useState<{
    percentages: number[];
    subgoalNames: string[];
    levelUpEvents?: LevelUpEvent[];
  } | null>(null);

  // Audio/TTS state
  const [isGeneratingTTS, setIsGeneratingTTS] = useState<{[key: string]: boolean}>({});
  const [isPlayingTTS, setIsPlayingTTS] = useState<{[key: string]: boolean}>({});
  const [currentPlayingText, setCurrentPlayingText] = useState('');
  const [ttsCache, setTtsCache] = useState<Map<string, { url: string; timestamp: number }>>(new Map());
  const [ttsDebugInfo, setTtsDebugInfo] = useState<string>('');
  const [romanizationDebugInfo, setRomanizationDebugInfo] = useState<string>('');

  // Progress tracking state
  const [userProgress, setUserProgress] = useState<{ [goalId: string]: SubgoalProgress }>({});
  const [learningGoals, setLearningGoals] = useState<LearningGoal[]>([]);

  // Detailed feedback state
  const [showDetailedBreakdown, setShowDetailedBreakdown] = useState<{[key: number]: boolean}>({});
  const [parsedBreakdown, setParsedBreakdown] = useState<any[]>([]);
  const [feedbackExplanations, setFeedbackExplanations] = useState<Record<number, Record<string, string>>>({});
  const [activePopup, setActivePopup] = useState<{ messageIndex: number; wordKey: string; position: { x: number; y: number } } | null>(null);
  const [showCorrectedVersions, setShowCorrectedVersions] = useState<Record<number, boolean>>({});
  const [isLoadingMessageFeedback, setIsLoadingMessageFeedback] = useState<Record<number, boolean>>({});

  // Quick translations state
  const [quickTranslations, setQuickTranslations] = useState<Record<number, any>>({});
  const [showQuickTranslations, setShowQuickTranslations] = useState<Record<number, boolean>>({});

  // User preferences state
  const [userPreferences, setUserPreferences] = useState<{
    language?: string;
    formality?: string;
    topics?: string[];
    romanizationDisplay?: string;
    [key: string]: any;
  } | null>(null);

  // Pagination state
  const [messageCount, setMessageCount] = useState(0);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingMoreMessages, setIsLoadingMoreMessages] = useState(false);
  const MESSAGES_PER_PAGE = 50;

  // Refs - all from original
  const recognitionRef = useRef<any>(null);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const autoSpeakRef = useRef<boolean>(true);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const interruptedRef = useRef<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  
  // Additional refs from original
  const MediaRecorderClassRef = useRef<typeof MediaRecorder | null>(null);
  const SpeechRecognitionClassRef = useRef<any>(null);

  // Use the custom hooks
  const [chatHistory, setChatHistory] = usePersistentChatHistory(user as any);
  const audioRecording = useAudioRecording();
  const tts = useTTS();
  const translation = useTranslation();
  const conversation = useConversation(user as any);
  const audioProcessing = useAudioProcessing();
  const feedback = useFeedback();

  // URL parameter handling - from original
  useEffect(() => {
    if (urlParams.lang && urlParams.lang !== language) {
      setLanguage(urlParams.lang);
    }
  }, [urlParams.lang, language]);

  // Handle URL topics parameter - from original
  useEffect(() => {
    if (urlTopics) {
      const topics = urlTopics.split(',').filter((topic: string) => topic.trim());
      // Topics are now handled through userPreferences
    }
  }, [urlTopics]);

  // Handle persona data when using a persona - from original
  useEffect(() => {
    if (usePersona && user) {
      const personaData = localStorage.getItem('selectedPersona');
      if (personaData) {
        try {
          const persona = JSON.parse(personaData);
          console.log('[PERSONA] Loading persona data:', persona);
          // Set persona-related state if needed
        } catch (error) {
          console.error('[PERSONA] Error parsing persona data:', error);
        }
      }
    }
  }, [usePersona, user]);

  // Authentication protection - from original
  useEffect(() => {
    if (user === null) {
      router.push('/login');
    }
  }, [user, router]);

  // Body scroll prevention - from original
  useEffect(() => {
    if (showTopicModal || showPersonaModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showTopicModal, showPersonaModal]);

  // Hide suggestions when processing starts - from original
  useEffect(() => {
    if (isProcessing) {
      setShowSuggestions(false);
    }
  }, [isProcessing]);

  // Sync recognitionRef.current.lang with language state - from original
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language;
    }
  }, [language]);

  // Auto-scroll to bottom of messages - from original
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Show topic modal if no conversation ID - from original
  useEffect(() => {
    if (!urlConversationId && !conversationId && user && chatHistory.length === 0 && !isLoadingConversation) {
      console.log('[TOPIC_MODAL] Showing topic modal - no existing conversation');
      setShowTopicModal(true);
    } else if (conversationId && chatHistory.length > 0) {
      // If we have a conversation ID and chat history, ensure topic modal is closed
      console.log('[TOPIC_MODAL] Hiding topic modal - conversation loaded with messages');
      setShowTopicModal(false);
    }
  }, [urlConversationId, conversationId, user, chatHistory.length, isLoadingConversation]);

  // Show save prompt if localStorage has chat history - from original
  useEffect(() => {
    if (user && typeof window !== 'undefined') {
      const savedHistory = localStorage.getItem('chatHistory');
      if (savedHistory) {
        try {
          const parsed = JSON.parse(savedHistory);
          if (parsed.length > 0) {
            // Show save prompt or auto-save
            console.log('Found saved chat history, consider saving to backend');
          }
        } catch (e) {
          console.error('Error parsing saved chat history:', e);
        }
      }
    }
  }, [user]);

  // Set language from user if not already set - from original
  useEffect(() => {
    if ((user as any)?.selectedLanguage && !language) {
      setLanguage((user as any).selectedLanguage);
    }
  }, [(user as any)?.selectedLanguage, language]);

  // Fetch user dashboard preferences - from original
  const fetchUserDashboardPreferences = async (languageCode: string) => {
    try {
      if (!(user as any)?.id) {
        return null;
      }

      const { success, data: dashboards } = await getUserLanguageDashboards((user as any).id);
      
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

  // Load preferences for current language - from original
  const loadPreferencesForLanguage = async () => {
    if (!(user as any)?.id || !language) return;
    
    console.log('[DEBUG] Language changed to:', language, '- reloading preferences');
    
    try {
      const dashboardPrefs = await fetchUserDashboardPreferences(language);
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
  };

  // Save session to backend - from original
  const saveSessionToBackend = async (messages: ChatMessage[], description: string, topics: string[], formality: string) => {
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
      setConversationId(newConversationId);
      
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

  // Load existing conversation - from original
  const loadExistingConversation = async (conversationId: string) => {
    if (!user) return;

    setIsLoadingConversation(true);
    try {
      const headers = await getAuthHeaders();
      const response = await axios.get(`/api/conversations/${conversationId}`, { headers });

      if (response.data.success) {
        const conversation = response.data.conversation;
        
        // Parse messages from conversation
        const messages: ChatMessage[] = conversation.messages || [];
        setChatHistory(messages);
        
        // Set conversation metadata
        setConversationId(conversationId);
        setConversationDescription(conversation.description || '');
        
        // Set language, formality, topics from conversation
        if (conversation.language) {
          setLanguage(conversation.language);
        }
        if (conversation.formality) {
          setUserPreferences(prev => ({ ...prev, formality: conversation.formality }));
        }
        if (conversation.topics) {
          setUserPreferences(prev => ({ ...prev, topics: conversation.topics }));
        }
        
        // Set session start time
        setSessionStartTime(new Date(conversation.createdAt));
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    } finally {
      setIsLoadingConversation(false);
    }
  };

  // Fetch suggestions - from original
  const fetchSuggestions = async () => {
    if (!user || !language) return;

    setIsLoadingSuggestions(true);
    try {
      const headers = await getAuthHeaders();
      const response = await axios.post(`/api/suggestions`, {
        userId: (user as any).id,
        language: language,
        conversationHistory: chatHistory.slice(-10), // Last 10 messages for context
        topics: userPreferences?.topics || [],
        formality: userPreferences?.formality || 'neutral'
      }, { headers });

      if (response.data.success) {
        const suggestions = response.data.suggestions;
        setSuggestions(suggestions);
        
        // Also set suggestionMessages for the carousel
        if (suggestions.length > 0) {
          // Reset explanation state for a fresh set
          setSuggestionTranslations({});
          setShowSuggestionTranslations({});
          setIsTranslatingSuggestion({});
          
          const tempMessages: ChatMessage[] = suggestions.map((suggestion: string, index: number) => ({
            sender: 'ai',
            text: suggestion,
            timestamp: new Date()
          }));
          
          setSuggestionMessages(tempMessages);
          setCurrentSuggestionIndex(0);
          setShowSuggestionCarousel(true);
        }
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Handle suggestion button click - from original
  const handleSuggestionButtonClick = async () => {
    if (!user || !language) return;

    setIsLoadingSuggestions(true);
    try {
      const headers = await getAuthHeaders();
      const response = await axios.post(`/api/suggestions`, {
        userId: (user as any).id,
        language: language,
        conversationHistory: chatHistory.slice(-10),
        topics: userPreferences?.topics || [],
        formality: userPreferences?.formality || 'neutral'
      }, { headers });

      if (response.data.success) {
        const suggestions = response.data.suggestions;
        setSuggestions(suggestions);
        setCurrentSuggestionIndex(0);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Navigate suggestion carousel - from original
  const navigateSuggestion = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentSuggestionIndex(prev => prev > 0 ? prev - 1 : suggestions.length - 1);
    } else {
      setCurrentSuggestionIndex(prev => prev < suggestions.length - 1 ? prev + 1 : 0);
    }
  };

  // Clear suggestion carousel - from original
  const clearSuggestionCarousel = () => {
    setCurrentSuggestionIndex(0);
    setSuggestions([]);
    setSuggestionMessages([]);
    setShowSuggestionCarousel(false);
    // Fully clear explanation state when suggestions are cleared
    setSuggestionTranslations({});
    setShowSuggestionTranslations({});
    setIsTranslatingSuggestion({});
    setShowSuggestionExplanations(false);
  };

  // Handle suggestion click - from original
  const handleSuggestionClick = () => {
    setShowSuggestions(true);
  };

  // Get session messages - from original
  const getSessionMessages = () => {
    if (!sessionStartTime) return chatHistory;
    return chatHistory.filter(message => new Date(message.timestamp) >= sessionStartTime);
  };

  // Generate conversation summary - from original
  const generateConversationSummary = async () => {
    if (!user || !conversationId) return;

    try {
      const sessionMessages = getSessionMessages();
      const headers = await getAuthHeaders();
      
      const response = await axios.post(`/api/conversation-summary`, {
        messages: sessionMessages,
        language: language,
        topics: userPreferences?.topics || [],
        formality: userPreferences?.formality || 'neutral'
      }, { headers });

      if (response.data.success) {
        const summary = response.data.summary;
        
        // Update conversation title and synopsis
        await axios.put(`/api/conversations/${conversationId}/title`, {
          title: summary.title,
          synopsis: summary.synopsis
        }, { headers });

        // Process learning goals and track progress
        if (summary.learningGoals && summary.learningGoals.length > 0) {
          const currentProgressArray = Object.values(userProgress);
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
          
          // Show progress modal if there are level up events
          if (levelUpEvents.length > 0) {
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
      }
    } catch (error) {
      console.error('Error generating conversation summary:', error);
    }
  };

  // Handle modal conversation start - from original
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
        
        try {
          const headResponse = await fetch(audioUrl, { method: 'HEAD' });
          if (headResponse.ok) {
            const audio = new window.Audio(audioUrl);
            ttsAudioRef.current = audio;
            
            audio.onended = () => {
              ttsAudioRef.current = null;
              console.log('[DEBUG] Initial AI TTS finished playing');
            };
            
            audio.play().catch(error => {
              console.error('Failed to play initial TTS audio:', error);
              ttsAudioRef.current = null;
            });
          }
        } catch (fetchError: unknown) {
          console.error('[DEBUG] Error checking TTS file availability:', fetchError);
        }
      }
    } else {
      console.log('[DEBUG] No AI message or empty text, setting default message');
      // Fallback: set a default AI message if none provided
      setChatHistory([{ sender: 'AI', text: 'Hello! What would you like to talk about today?', timestamp: new Date(), isFromOriginalConversation: false }]);
    }
  };

  // Save message to backend - from original
  const saveMessageToBackend = async (message: ChatMessage) => {
    if (!user || !conversationId) return;

    try {
      const headers = await getAuthHeaders();
      await axios.post(`/api/conversations/${conversationId}/messages`, {
        message: message
      }, { headers });
    } catch (error) {
      console.error('Error saving message to backend:', error);
    }
  };

  // Event handlers - placeholder implementations for now
  const handleMessageClick = (index: number, text: string) => {
    // Handle message click
  };

  const handleTranslateMessage = async (messageIndex: number, text: string, breakdown?: boolean) => {
    setIsTranslating(prev => ({
      ...prev,
      [messageIndex]: true
    }));
    try {
      const headers = await getAuthHeaders();
      const response = await axios.post(`/api/translate`, {
        text: text,
        fromLanguage: language,
        toLanguage: 'en'
      }, { headers });

      if (response.data.success) {
        setTranslations(prev => ({
          ...prev,
          [messageIndex]: { translation: response.data.translation }
        }));
        setShowTranslations(prev => ({
          ...prev,
          [messageIndex]: true
        }));
      }
    } catch (error) {
      console.error('Error translating message:', error);
    } finally {
      setIsTranslating(prev => ({
        ...prev,
        [messageIndex]: false
      }));
    }
  };

  const handleRequestDetailedFeedback = async (messageIndex: number) => {
    // Handle detailed feedback request
  };

  const handleRequestShortFeedback = async (messageIndex: number) => {
    // Handle short feedback request
  };

  const handleRequestDetailedBreakdown = async (messageIndex: number) => {
    // Handle detailed breakdown request
  };

  const handleToggleDetailedFeedback = (messageIndex: number) => {
    // Handle toggle detailed feedback
  };

  const handleToggleShortFeedback = (messageIndex: number) => {
    // Handle toggle short feedback
  };

  const handleQuickTranslation = async (messageIndex: number, text: string) => {
    // Handle quick translation
  };

  const handleExplainLLMResponse = async (messageIndex: number, text: string) => {
    // Handle explain LLM response
  };

  const handlePlayTTS = async (text: string, language: string) => {
    try {
      const cleanText = cleanTextForTTS(text);
      // TODO: Implement TTS playback using the TTS hook
      console.log('TTS playback requested:', cleanText, language);
    } catch (error) {
      console.error('Error playing TTS:', error);
    }
  };

  const handlePlayExistingTTS = (ttsUrl: string) => {
    // Handle play existing TTS
  };

  // Missing functions from original - placeholders for now
  const generateRomanizedText = async (text: string, language: string): Promise<string> => {
    // TODO: Implement romanization logic
    return '';
  };

  const fetchAndShowShortFeedback = async (transcription: string, language: string) => {
    // TODO: Implement short feedback logic
    console.log('Short feedback requested for:', transcription);
  };

  const getTTSText = (message: ChatMessage, romanizationDisplay: string, language: string): string => {
    // TODO: Implement TTS text logic
    return message.text;
  };

  const playTTSAudio = async (text: string, language: string, cacheKey: string): Promise<void> => {
    // TODO: Implement TTS audio playback
    console.log('TTS audio playback requested:', text);
  };

  // Initialize MediaRecorder and SpeechRecognition classes - from original
  useEffect(() => {
    if (typeof window !== 'undefined') {
      MediaRecorderClassRef.current = window.MediaRecorder;
      SpeechRecognitionClassRef.current = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!MediaRecorderClassRef.current) {
        console.warn('MediaRecorder API not supported in this browser.');
      }
      if (!SpeechRecognitionClassRef.current) {
        console.warn('SpeechRecognition API not supported in this browser.');
      }
      
      // Check for HTTPS in production
      if (process.env.NODE_ENV === 'production' && window.location.protocol !== 'https:') {
        console.warn('getUserMedia requires HTTPS in production. Audio recording may not work.');
      }
    }
  }, []);

  const handleStartRecording = async () => {
    setWasInterrupted(false);
    
    // Prevent recording when TTS is playing
    if (isAnyTTSPlaying) {
      console.log('[DEBUG] Cannot start recording - TTS is playing:', { isAnyTTSPlaying });
      return;
    }
    
    if (!MediaRecorderClassRef.current) {
      alert('MediaRecorder API not supported in this browser.');
      return;
    }
    
    // Check if mediaDevices is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Microphone access is not available in this browser. Please use a modern browser with microphone support.');
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMediaStream(stream);
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorderClassRef.current(stream);
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      mediaRecorder.onstop = () => {
        if (interruptedRef.current) {
          interruptedRef.current = false;
          setWasInterrupted(true);
          stream.getTracks().forEach(track => track.stop());
          setMediaStream(null);
          setIsRecording(false);
          setManualRecording(false);
          return;
        }
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        sendAudioToBackend(audioBlob);
        stream.getTracks().forEach(track => track.stop());
        setMediaStream(null);
        setIsRecording(false);
        setManualRecording(false);
      };
      mediaRecorder.start();
      setIsRecording(true);
      if (autoSpeakRef.current) {
        // Use SpeechRecognition for silence detection in autospeak mode only
        if (!SpeechRecognitionClassRef.current) {
          alert('SpeechRecognition API not supported in this browser.');
          return;
        }
        const recognition = new SpeechRecognitionClassRef.current();
        recognitionRef.current = recognition;
        recognition.lang = language || 'en-US';
        recognition.interimResults = false;
        recognition.continuous = false;
        
        // Set longer timeout for autospeak mode to give users more time to speak
        if (autoSpeakRef.current) {
          recognition.maxAlternatives = 1;
          setTimeout(() => {
            if (recognitionRef.current) {
              console.log('[DEBUG] Autospeak: Speech recognition timeout reached, stopping recording');
              recognitionRef.current.stop();
            }
          }, 10000); // 10 seconds timeout for autospeak mode
        }
        recognition.onresult = (event: unknown) => {
          setIsRecording(false);
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
          }
        };
        recognition.onerror = (event: unknown) => {
          setIsRecording(false);
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
          }
          alert('Speech recognition error: ' + (event as any).error);
        };
        recognition.onend = () => {
          setIsRecording(false);
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
          }
        };
        recognition.start();
        setManualRecording(false);
      } else {
        // Manual mode: no speech recognition, just record until user stops
        setManualRecording(true);
      }
    } catch (err: unknown) {
      console.error('Error starting recording:', err);
      alert('Failed to access microphone. Please check permissions.');
    }
  };

  const handleStopRecording = (isManualStop: boolean = true) => {
    if (isManualStop) {
      interruptedRef.current = true;
    }
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
    
    setIsRecording(false);
    setManualRecording(false);
  };

  const handleAudioRecorded = async (audioBlob: Blob) => {
    // This will be handled by sendAudioToBackend
  };

  // sendAudioToBackend function from original
  const sendAudioToBackend = async (audioBlob: Blob) => {
    if (!(audioBlob instanceof Blob)) return;
    try {
      setIsProcessing(true);
      
      // Add user message immediately with a placeholder
      const placeholderMessage = { 
        sender: 'User', 
        text: '🎤 Processing your message...', 
        romanizedText: '',
        timestamp: new Date(),
        isFromOriginalConversation: false,
        isProcessing: true
      };
      
      // Add placeholder message immediately
      setChatHistory(prev => [...prev, placeholderMessage]);
      
      // Step 1: Get transcription first with language detection
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('language', language);
      
      // Add JWT token to headers
      const token = localStorage.getItem('jwt');
      const transcriptionResponse = await axios.post('/api/transcribe_only', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      
      const transcription = transcriptionResponse.data.transcription || 'Speech recorded';
      const detectedLanguage = language; // Persist session language; ignore detection
      
      // Generate romanized text for user messages in script languages
      let userRomanizedText = '';
      if (isScriptLanguage(language) && transcription !== 'Speech recorded') {
        userRomanizedText = await generateRomanizedText(transcription, language);
      }
      
      // Replace the placeholder message with the actual transcript
      setChatHistory(prev => {
        const updated = prev.map((msg, index) => {
          if (msg.isProcessing && msg.sender === 'User') {
            return {
              ...msg,
              text: transcription,
              romanizedText: userRomanizedText,
              isProcessing: false
            };
          }
          return msg;
        });
        return updated;
      });
      
      // Save user message to backend
      if (conversationId) {
        console.log('[MESSAGE_SAVE] Saving user message to conversation:', conversationId);
        const userMessage: ChatMessage = {
          sender: 'User',
          text: transcription,
          romanizedText: userRomanizedText,
          timestamp: new Date(),
          isFromOriginalConversation: false
        };
        await saveMessageToBackend(userMessage);
      } else {
        console.warn('[MESSAGE_SAVE] No conversation ID available for user message');
      }
      
      // Step 1.5: Get short feedback first for autospeak mode
      if (autoSpeak && enableShortFeedback && transcription !== 'Speech recorded') {
        console.log('[DEBUG] Step 1.5: Getting short feedback for autospeak mode...');
        await fetchAndShowShortFeedback(transcription, language);
        console.log('[DEBUG] Short feedback completed, now starting AI processing...');
      }
      
      // Step 2: Get AI response after short feedback is done
      console.log('[DEBUG] Step 2: Getting AI response after short feedback...');
      
      // Add AI processing message after short feedback is complete
      const aiProcessingMessage = { 
        sender: 'AI', 
        text: '🤖 Processing AI response...', 
        romanizedText: '',
        timestamp: new Date(),
        isFromOriginalConversation: false,
        isProcessing: true
      };
      setChatHistory(prev => [...prev, aiProcessingMessage]);
      
      // Create updated chat history that includes the user's transcription
      const updatedChatHistory = [...chatHistory, {
        sender: 'User',
        text: transcription,
        romanizedText: userRomanizedText,
        timestamp: new Date(),
        isFromOriginalConversation: false
      }];
      
      const aiResponseData = {
        transcription: transcription,
        chat_history: updatedChatHistory,
        language: language,
        user_level: userPreferences?.userLevel || 'beginner',
        user_topics: userPreferences?.topics || [],
        user_goals: (user as any)?.learning_goals ? (typeof (user as any).learning_goals === 'string' ? JSON.parse((user as any).learning_goals) : (user as any).learning_goals) : [],
        formality: userPreferences?.formality || 'neutral',
        feedback_language: userPreferences?.feedbackLanguage || 'en'
      };

      console.log('🔍 [FRONTEND] sessionLanguage before AI call:', language);
      console.log('🔍 [FRONTEND] Calling AI response API with data:', aiResponseData);
      
      // Use internal Next.js API route to proxy to backend
      const aiResponseResponse = await axios.post('/api/ai_response', aiResponseData, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      
      console.log('🔍 [FRONTEND] AI response API response:', {
        status: aiResponseResponse.status,
        data: aiResponseResponse.data
      });
      
      const aiResponse = aiResponseResponse.data?.response || aiResponseResponse.data?.ai_response || aiResponseResponse.data?.message;
      console.log('🔍 [FRONTEND] Extracted AI response:', aiResponse);
      
      // Add AI response if present
      if (aiResponse) {
        const formattedResponse = formatScriptLanguageText(aiResponse, language);
        setChatHistory(prev => {
          const updated = prev.map((msg, index) => {
            // Find the last processing AI message and replace it
            if (msg.isProcessing && msg.sender === 'AI') {
              return {
                ...msg,
                text: formattedResponse.mainText,
                romanizedText: formattedResponse.romanizedText,
                ttsUrl: null,
                isProcessing: false
              };
            }
            return msg;
          });
          return updated;
        });
        if (conversationId) {
          console.log('[MESSAGE_SAVE] Saving AI message to conversation:', conversationId);
          const aiMessage: ChatMessage = {
            sender: 'AI',
            text: formattedResponse.mainText,
            romanizedText: formattedResponse.romanizedText,
            timestamp: new Date(),
            isFromOriginalConversation: false
          };
          await saveMessageToBackend(aiMessage);
        } else {
          console.warn('[MESSAGE_SAVE] No conversation ID available for AI message');
        }
        
        // Play TTS for AI response immediately
        console.log('[DEBUG] Playing TTS for AI response immediately');
        const ttsMessage: ChatMessage = {
          text: formattedResponse.mainText,
          romanizedText: formattedResponse.romanizedText,
          sender: 'AI',
          timestamp: new Date(),
          isFromOriginalConversation: false
        };
        const ttsText = getTTSText(ttsMessage, userPreferences?.romanizationDisplay || 'both', language);
        const cacheKey = `ai_message_auto_${Date.now()}`;
        
        // Play audio immediately for all AI messages
        playTTSAudio(ttsText, language, cacheKey).catch(error => {
          console.error('[DEBUG] Error playing AI TTS:', error);
        });
        
        // Also queue for autospeak mode if enabled
        if (autoSpeak) {
          console.log('[DEBUG] Adding AI response TTS to queue for autospeak mode');
          setAiTTSQueued({ text: ttsText, language, cacheKey });
        }
      }
      
    } catch (error: unknown) {
      console.error('Error processing audio:', error);
      const errorMessage = {
        sender: 'System',
        text: '❌ Error processing audio. Please try again.',
        timestamp: new Date(),
        isFromOriginalConversation: false
      };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Suggestion-specific handlers
  const explainSuggestion = async (index: number, text: string) => {
    setIsTranslatingSuggestion(prev => ({
      ...prev,
      [index]: true
    }));

    try {
      const headers = await getAuthHeaders();
      const response = await axios.post(`/api/explain_suggestion`, {
        text: text,
        language: language
      }, { headers });

      if (response.data.success) {
        setSuggestionTranslations(prev => ({
          ...prev,
          [index]: {
            translation: response.data.translation,
            breakdown: response.data.explanation
          }
        }));
        setShowSuggestionTranslations(prev => ({
          ...prev,
          [index]: true
        }));
      }
    } catch (error) {
      console.error('Error explaining suggestion:', error);
    } finally {
      setIsTranslatingSuggestion(prev => ({
        ...prev,
        [index]: false
      }));
    }
  };

  const playSuggestionTTS = async (suggestion: ChatMessage, index: number) => {
    try {
      const ttsText = suggestion.text;
      if (!ttsText || ttsText.trim().length === 0) {
        console.error('Empty TTS text generated');
        return;
      }
      
      const cacheKey = `suggestion_${index}`;
      console.log('Playing suggestion TTS:', ttsText, cacheKey);
      
      // TODO: Implement actual TTS playback
      console.log('TTS playback requested for suggestion:', ttsText);
    } catch (error) {
      console.error('Error playing suggestion TTS:', error);
    }
  };

  // Load existing conversation if conversation ID is provided - from original
  useEffect(() => {
    if (urlConversationId && urlConversationId !== conversationId) {
      loadExistingConversation(urlConversationId);
    }
  }, [urlConversationId, conversationId]);

  // Add this useEffect to load chat history from backend if conversationIdParam is present and chatHistory is empty
  useEffect(() => {
    if (user && urlConversationId && chatHistory.length === 0) {
      console.log('[CONVERSATION_LOAD] Loading existing conversation:', urlConversationId);
      loadExistingConversation(urlConversationId);
    }
  }, [user, urlConversationId, chatHistory.length]);

  // Load user preferences on mount - from original
  useEffect(() => {
    if (user && language) {
      loadPreferencesForLanguage();
    }
  }, [user, language]);

  // Load preferences when language changes - from original
  useEffect(() => {
    loadPreferencesForLanguage();
  }, [language]);

  // Placeholder functions for left panel - need to implement from original
  const explainLLMResponse = (messageIndex: number, text: string) => {
    console.log('explainLLMResponse called:', messageIndex, text);
    // TODO: Implement from original
  };

  const renderClickableMessage = (message: any, messageIndex: number, translation: any) => {
    console.log('renderClickableMessage called:', message, messageIndex, translation);
    // TODO: Implement from original
    return <div>Clickable message placeholder</div>;
  };

  return (
    <>
      <AnalyzeLayout
        isDarkMode={isDarkMode}
        leftPanelWidth={leftPanelWidth}
        rightPanelWidth={rightPanelWidth}
        showShortFeedbackPanel={showShortFeedbackPanel}
        setShowShortFeedbackPanel={setShowShortFeedbackPanel}
        showRightPanel={showRightPanel}
        setShowRightPanel={setShowRightPanel}
        setRightPanelWidth={setRightPanelWidth}
        ttsDebugInfo={ttsDebugInfo}
        setTtsDebugInfo={setTtsDebugInfo}
        romanizationDebugInfo={romanizationDebugInfo}
        setRomanizationDebugInfo={setRomanizationDebugInfo}
        translations={translations}
        showTranslations={showTranslations}
        feedbackExplanations={feedbackExplanations}
        showDetailedBreakdown={showDetailedBreakdown}
        parsedBreakdown={parsedBreakdown}
        activePopup={activePopup}
        // Left panel content props
        shortFeedback={shortFeedback}
        quickTranslations={quickTranslations}
        showQuickTranslation={showQuickTranslation}
        setShowQuickTranslation={setShowQuickTranslation}
        llmBreakdown={llmBreakdown}
        showLlmBreakdown={showLlmBreakdown}
        setShowLlmBreakdown={setShowLlmBreakdown}
        chatHistory={chatHistory}
        isLoadingMessageFeedback={isLoadingMessageFeedback}
        explainLLMResponse={explainLLMResponse}
        renderClickableMessage={renderClickableMessage}
      >
        <MainContentArea isDarkMode={isDarkMode}>
          <ChatMessagesContainer
            chatHistory={chatHistory}
            isDarkMode={isDarkMode}
              onMessageClick={handleMessageClick}
              onTranslateMessage={handleTranslateMessage}
              onRequestDetailedFeedback={handleRequestDetailedFeedback}
              onRequestShortFeedback={handleRequestShortFeedback}
              onRequestDetailedBreakdown={handleRequestDetailedBreakdown}
              onToggleDetailedFeedback={handleToggleDetailedFeedback}
              onToggleShortFeedback={handleToggleShortFeedback}
              onQuickTranslation={handleQuickTranslation}
              onExplainLLMResponse={handleExplainLLMResponse}
              onPlayTTS={handlePlayTTS}
              onPlayExistingTTS={handlePlayExistingTTS}
            translations={translations}
            isTranslating={isTranslating}
            showTranslations={showTranslations}
            showDetailedBreakdown={showDetailedBreakdown}
            showSuggestionExplanations={{}}
            explainButtonPressed={explainButtonPressed}
            parsedBreakdown={parsedBreakdown}
            feedbackExplanations={feedbackExplanations}
            activePopup={activePopup}
            showCorrectedVersions={showCorrectedVersions}
            quickTranslations={quickTranslations}
            showQuickTranslations={showQuickTranslations}
            ttsCache={ttsCache}
            isGeneratingTTS={isGeneratingTTS}
            isPlayingTTS={isPlayingTTS}
            romanizationDisplay={userPreferences?.romanizationDisplay || 'both'}
            language={language}
            messageCount={messageCount}
            hasMoreMessages={hasMoreMessages}
            isLoadingMoreMessages={isLoadingMoreMessages}
            loadMoreMessages={() => {/* TODO: Implement */}}
            userPreferences={userPreferences}
          />
          
          {/* Suggestion Carousel */}
          {!isProcessing && showSuggestionCarousel && suggestionMessages.length > 0 && (
            <SuggestionCarousel
                  isDarkMode={isDarkMode}
              suggestionMessages={suggestionMessages}
              currentSuggestionIndex={currentSuggestionIndex}
              onNavigateSuggestion={navigateSuggestion}
              onExplainSuggestion={explainSuggestion}
              onPlaySuggestionTTS={playSuggestionTTS}
              isTranslatingSuggestion={isTranslatingSuggestion}
              showSuggestionTranslations={showSuggestionTranslations}
              suggestionTranslations={suggestionTranslations}
              isGeneratingTTS={isGeneratingTTS}
              isPlayingTTS={isPlayingTTS}
              userPreferences={userPreferences}
              language={language}
            />
          )}
          
        <RecordingControls
                  isDarkMode={isDarkMode}
            isRecording={isRecording}
            isProcessing={isProcessing}
                    onStartRecording={handleStartRecording}
                    onStopRecording={handleStopRecording}
            autoSpeak={autoSpeak}
            setAutoSpeak={setAutoSpeak}
            enableShortFeedback={enableShortFeedback}
            setEnableShortFeedback={setEnableShortFeedback}
          />
        </MainContentArea>
      </AnalyzeLayout>

      {/* Modals */}
      {showTopicModal && (
        <TopicSelectionModal
          isOpen={showTopicModal}
          onClose={() => setShowTopicModal(false)}
          onStartConversation={handleModalConversationStart}
          currentLanguage={language}
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
    </>
  );
};

export default AnalyzeContent;
