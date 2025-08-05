/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/no-unescaped-entities */
"use client";
import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '../ClientLayout';
import { useDarkMode } from '../contexts/DarkModeContext';
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import TopicSelectionModal from './TopicSelectionModal';
import PersonaModal from './PersonaModal';
import LoadingScreen from '../components/LoadingScreen';
import { LEARNING_GOALS, LearningGoal, getProgressiveSubgoalDescription, getSubgoalLevel, updateSubgoalProgress, SubgoalProgress, LevelUpEvent } from '../../lib/preferences';

// TypeScript: Add type declarations for browser APIs
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
    MediaRecorder: typeof MediaRecorder;
  }
}

// Add types for getLanguageLabel
const getLanguageLabel = (code: string): string => {
  // Add index signature to fix TS error
  const languages: { [key: string]: string } = {
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'zh': 'Mandarin',
    'ja': 'Japanese',
    'ko': 'Korean',
    'tl': 'Tagalog',
    'hi': 'Hindi',
    'ml': 'Malayalam',
    'ta': 'Tamil',
    'or': 'Odia',
  };
  return languages[code] || 'English';
};

// Script languages that need romanization
const SCRIPT_LANGUAGES = {
  'hi': 'Devanagari',
  'ja': 'Japanese',
  'zh': 'Chinese',
  'ko': 'Korean',
  'ar': 'Arabic',
  'ta': 'Tamil',
  'ml': 'Malayalam',
  'or': 'Odia'
};

const isScriptLanguage = (languageCode: string): boolean => {
  return languageCode in SCRIPT_LANGUAGES;
};

const formatScriptLanguageText = (text: string, languageCode: string): { mainText: string; romanizedText?: string } => {
  if (!isScriptLanguage(languageCode)) {
    return { mainText: text };
  }
  
  // Check if the text already contains romanized format (text) or (romanized)
  if (text.includes('(') && text.includes(')')) {
    // Try different patterns to extract main text and romanized text
    // Pattern 1: text (romanized) at the end
    let match = text.match(/^(.+?)\s*\(([^)]+)\)$/);
    if (match) {
      return { mainText: match[1].trim(), romanizedText: match[2].trim() };
    }
    
    // Pattern 2: text (romanized) anywhere in the text
    match = text.match(/^(.+?)\s*\(([^)]+)\)/);
    if (match) {
      return { mainText: match[1].trim(), romanizedText: match[2].trim() };
    }
    
    // Pattern 3: (romanized) text - romanized at the beginning
    match = text.match(/^\(([^)]+)\)\s*(.+)$/);
    if (match) {
      return { mainText: match[2].trim(), romanizedText: match[1].trim() };
    }
  }
  
  // If it's a script language but doesn't have romanization, return as is
  // The AI should handle the formatting, but this is a fallback
  return { mainText: text };
};

// Add index signature to CLOSENESS_LEVELS for string indexing
const CLOSENESS_LEVELS: { [key: string]: string } = {
  intimate: '👫 Intimate: Close friends, family, or partners',
  friendly: '😊 Friendly: Peers, classmates, or casual acquaintances',
  respectful: '🙏 Respectful: Teachers, elders, or professionals',
  formal: '🎩 Formal: Strangers, officials, or business contacts',
  distant: '🧑‍💼 Distant: Large groups, public speaking, or unknown audience',
};

interface ChatMessage {
  id?: string;
  sender: string;
  text: string;
  romanizedText?: string;
  timestamp: Date;
  messageType?: string;
  audioFilePath?: string | null;
  ttsUrl?: string | null;
  translation?: string;
  breakdown?: string;
  detailedFeedback?: string;
  shortFeedback?: string;
  showDetailedFeedback?: boolean;
  showShortFeedback?: boolean;
  showDetailedBreakdown?: boolean;
  isSuggestion?: boolean;
  suggestionIndex?: number;
  totalSuggestions?: number;
  isFromOriginalConversation?: boolean; // Track if message is from original conversation
  isProcessing?: boolean; // Track if message is being processed
}

interface User {
  id: string;
  email: string;
  name?: string;
  selectedLanguage?: string;
  target_language?: string;
  language?: string;
  proficiency_level?: string;
  learning_goals?: string[];
  talk_topics?: string[];
  [key: string]: unknown;
}

function usePersistentChatHistory(user: User | null): [ChatMessage[], React.Dispatch<React.SetStateAction<ChatMessage[]>>] {
  const [chatHistory, setChatHistory] = React.useState<ChatMessage[]>(() => {
    if (!user) {
      const saved = localStorage.getItem('chatHistory');
      return saved ? (JSON.parse(saved) as ChatMessage[]) : [];
    }
    return [];
  });

  React.useEffect(() => {
    if (!user) {
      localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
    } else {
      localStorage.removeItem('chatHistory');
    }
  }, [chatHistory, user]);

  return [chatHistory, setChatHistory];
}

function Analyze() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isDarkMode } = useDarkMode();

  // Helper to get JWT token
  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('jwt') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const urlConversationId = searchParams?.get('conversation');
  const urlLang = searchParams?.get('language');
  const urlTopics = searchParams?.get('topics');
  const urlFormality = searchParams?.get('formality');
  const usePersona = searchParams?.get('usePersona') === 'true';

  // Flag to skip validation right after creating a conversation
  const [skipValidation, setSkipValidation] = useState(false);

  // Prevent body scrolling on analyze page
  React.useEffect(() => {
    document.body.classList.add('analyze-page-active');
    return () => {
      document.body.classList.remove('analyze-page-active');
    };
  }, []);

  // Add CSS keyframe animation for message appearance
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes messageAppear {
        0% {
          opacity: 0;
          transform: translateY(10px) scale(0.95);
        }
        100% {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      @keyframes pulse {
        0% {
          box-shadow: 0 0 0 0 rgba(195,141,148,0.25);
        }
        70% {
          box-shadow: 0 0 0 12px rgba(195,141,148,0);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(195,141,148,0);
        }
      }
      @keyframes pulse-autospeak {
        0% {
          box-shadow: 0 0 0 0 rgba(60,76,115,0.25), 0 0 0 0 rgba(195,141,148,0.25);
        }
        50% {
          box-shadow: 0 0 0 8px rgba(60,76,115,0.18), 0 0 0 16px rgba(195,141,148,0.12);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(60,76,115,0.25), 0 0 0 0 rgba(195,141,148,0.25);
        }
      }
      @keyframes pulse-silence {
        0% { box-shadow: 0 0 0 0 #e67e2255; }
        70% { box-shadow: 0 0 0 8px #e67e2200; }
        100% { box-shadow: 0 0 0 0 #e67e2255; }
      }
      @keyframes slideDown {
        0% {
          opacity: 0;
          transform: translateY(-10px);
          max-height: 0;
        }
        100% {
          opacity: 1;
          transform: translateY(0);
          max-height: 200px;
        }
      }
      @keyframes bounce {
        0%, 20%, 53%, 80%, 100% {
          transform: translate3d(0,0,0);
        }
        40%, 43% {
          transform: translate3d(0, -8px, 0);
        }
        70% {
          transform: translate3d(0, -4px, 0);
        }
        90% {
          transform: translate3d(0, -2px, 0);
        }
      }
      @keyframes slideInUp {
        0% {
          opacity: 0;
          transform: translateY(20px);
        }
        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }
              @keyframes progressFill {
          0% {
            width: 0%;
          }
          100% {
            width: var(--target-width, 100%);
          }
        }
        
        @keyframes progressFillFromTo {
          0% {
            width: var(--start-width);
          }
          100% {
            width: var(--end-width);
          }
        }
        
        /* Hover effects for buttons */
        .hover-lift:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(60,60,60,0.15);
        }
        
        /* Smooth transitions for all interactive elements */
        * {
          transition: all 0.3s ease;
        }
        
        /* Button hover effects */
        button:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.15);
        }
        
        /* Panel hover effects */
        .panel-hover:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 32px rgba(60,60,60,0.12);
        }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  const { user } = useUser() as { user: User | null };
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Authentication protection
  useEffect(() => {
    if (user === null) {
      router.push('/login');
      return;
    }
  }, [user, router]);

  // Show loading while checking authentication
  if (user === null) {
    return <LoadingScreen message="Checking authentication..." />;
  }


  const recognitionRef = useRef<{ lang: string; stop: () => void } | null>(null);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const autoSpeakRef = useRef<boolean>(false);
  const [showSavePrompt, setShowSavePrompt] = useState<boolean>(false);
  const [chatHistory, setChatHistory] = usePersistentChatHistory(user);
  const [language, setLanguage] = useState<string>(urlLang || user?.target_language || 'en');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoadingConversation, setIsLoadingConversation] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<unknown[]>([]); // TODO: type this
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState<boolean>(false);
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState<number>(0);
  const [showSuggestionCarousel, setShowSuggestionCarousel] = useState<boolean>(false);
  const [suggestionMessages, setSuggestionMessages] = useState<ChatMessage[]>([]);
  const [translations, setTranslations] = useState<Record<number, { translation?: string; breakdown?: string; has_breakdown?: boolean }>>({});
  const [isTranslating, setIsTranslating] = useState<Record<number, boolean>>({});
  const [showTranslations, setShowTranslations] = useState<Record<number, boolean>>({});
  const [suggestionTranslations, setSuggestionTranslations] = useState<Record<number, { translation?: string; breakdown?: string; has_breakdown?: boolean }>>({});
  const [isTranslatingSuggestion, setIsTranslatingSuggestion] = useState<Record<number, boolean>>({});
  const [showSuggestionTranslations, setShowSuggestionTranslations] = useState<Record<number, boolean>>({});
  const [isLoadingMessageFeedback, setIsLoadingMessageFeedback] = useState<Record<number, boolean>>({});
  const [leftPanelWidth, setLeftPanelWidth] = useState(0.2); // 20% of screen width
  const [rightPanelWidth, setRightPanelWidth] = useState(0.2); // 20% of screen width
  const [isResizing, setIsResizing] = useState(false);
  const [resizingPanel, setResizingPanel] = useState<'left' | 'right' | null>(null);
  const [showPersonaModal, setShowPersonaModal] = useState(false);
  const [isSavingPersona, setIsSavingPersona] = useState(false);
  const [conversationDescription, setConversationDescription] = useState<string>('');
  const [isUsingPersona, setIsUsingPersona] = useState<boolean>(false);
  const [isNewPersona, setIsNewPersona] = useState<boolean>(false);

  // Calculate actual panel widths based on visibility
  const getPanelWidths = () => {
    const visiblePanels = [showShortFeedbackPanel, true].filter(Boolean).length;
    
    if (visiblePanels === 1) {
      // Only middle panel visible
      return { left: 0, center: 1, right: 0 };
    } else {
      // Left and middle panels visible - allow resizing between them
      const centerWidth = Math.max(0.4, 1 - leftPanelWidth); // Ensure center is at least 40%
      return { left: 1 - centerWidth, center: centerWidth, right: 0 };
    }
  };
  const [showTopicModal, setShowTopicModal] = useState<boolean>(false);
  const [autoSpeak, setAutoSpeak] = useState<boolean>(false);
  const [enableShortFeedback, setEnableShortFeedback] = useState<boolean>(true);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [wasInterrupted, setWasInterrupted] = useState<boolean>(false);
  const interruptedRef = useRef<boolean>(false);
  const [shortFeedbacks, setShortFeedbacks] = useState<Record<number, string>>({});
  const [isProcessingShortFeedback, setIsProcessingShortFeedback] = useState<boolean>(false);
  const [isLoadingInitialAI, setIsLoadingInitialAI] = useState<boolean>(false);
  const [pendingTTSCount, setPendingTTSCount] = useState<number>(0);
  const [isPlayingAnyTTS, setIsPlayingAnyTTS] = useState<boolean>(false);
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
  const [quickTranslations, setQuickTranslations] = useState<Record<number, { fullTranslation: string; wordTranslations: Record<string, string>; romanized: string; error: boolean; generatedWords?: string[]; generatedScriptWords?: string[] }>>({});
  const [showQuickTranslations, setShowQuickTranslations] = useState<Record<number, boolean>>({});
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  
  // TTS caching state
  const [ttsCache, setTtsCache] = useState<Map<string, { url: string; timestamp: number }>>(new Map());
  const [isGeneratingTTS, setIsGeneratingTTS] = useState<{[key: string]: boolean}>({});
  const [isPlayingTTS, setIsPlayingTTS] = useState<{[key: string]: boolean}>({});
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
  
  // Keep refs in sync with state
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language || 'en-US';
    }
  }, [language]);

  // Add global click handler for word clicks
  useEffect(() => {
    // Add global click handler
    (window as any).handleWordClick = (wordKey: string, messageIndex: number, event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      
      const explanations = feedbackExplanations[messageIndex] || {};
      const explanation = explanations[wordKey];
      
      if (explanation) {
        const rect = (event.target as HTMLElement).getBoundingClientRect();
        setActivePopup({
          messageIndex,
          wordKey,
          position: {
            x: rect.left + rect.width / 2,
            y: rect.top
          }
        });
      }
    };

    // Add click handler to close popup when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      console.log('Click outside handler triggered, target:', target);
      
      if (target && target.closest('[data-popup="true"]')) {
        console.log('Click was on popup, not hiding');
        return; // Don't hide if clicking on popup
      }
      
      if (target && target.closest('[data-clickable-word="true"]')) {
        console.log('Click was on clickable word, not hiding');
        return; // Don't hide if clicking on a word
      }
      
      console.log('Click was outside popup, hiding popup');
      setActivePopup(null);
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      delete (window as any).handleWordClick;
      document.removeEventListener('mousedown', handleClickOutside);
    };
      }, [feedbackExplanations, quickTranslations]);

  // Clean up TTS cache periodically (every 10 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const newCache = new Map();
      
      ttsCache.forEach((value, key) => {
        // Keep cache entries for 5 minutes
        if (now - value.timestamp < 5 * 60 * 1000) {
          newCache.set(key, value);
        }
      });
      
      setTtsCache(newCache);
    }, 10 * 60 * 1000); // Run every 10 minutes
    
    return () => clearInterval(interval);
  }, [ttsCache]);

  // On unmount: stop recording and save session if needed
  useEffect(() => {
    return () => {
      // Stop any ongoing recording
      stopRecording();
      // Save session if there is unsaved chat history
      if (user && chatHistory.length > 0) {
        saveSessionToBackend(false); // Don't show alert on navigation
      }
    };
  }, []);

  // Show topic modal automatically when accessing analyze page without conversation ID
  useEffect(() => {
    if (user && !urlConversationId && !conversationId && chatHistory.length === 0) {
      setShowTopicModal(true);
    }
  }, [user, urlConversationId, conversationId, chatHistory.length]);

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

  useEffect(() => {
    if (urlTopics) {
      const topics = urlTopics.split(',').filter((topic: string) => topic.trim());
      // setSelectedTopics(topics); // This setter is no longer used
    }
  }, [urlTopics]);

  // Debug chat history changes
  useEffect(() => {
    console.log('Chat history changed:', chatHistory);
  }, [chatHistory]);

  // Function to fetch user's dashboard preferences
  const fetchUserDashboardPreferences = async (languageCode: string) => {
    try {
      const response = await axios.get(`/api/user/language-dashboards`, { headers: getAuthHeaders() });
      const dashboards = response.data.dashboards || [];
      const dashboard = dashboards.find((d: any) => d.language === languageCode);
      
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
      console.error('Error fetching dashboard preferences:', error);
      return null;
    }
  };

  const loadExistingConversation = async (convId: string | null) => {
    if (!user || !convId) {
      console.log('[DEBUG] No user or conversation ID, skipping load');
      return;
    }
    console.log('[DEBUG] Loading existing conversation:', convId);
    setIsLoadingConversation(true);
    try {
      const response = await axios.get(`/api/conversations/${convId}`, { headers: getAuthHeaders() });
      console.log('[DEBUG] Conversation load response:', response.data);
      const conversation = response.data.conversation;
      setConversationId(conversation.id);
      setLanguage(conversation.language);
      
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
      
      console.log('[DEBUG] Learning goals extraction:', {
        conversationLearningGoalsRaw: conversation.learning_goals,
        conversationLearningGoalsParsed: conversationLearningGoals,
        dashboardPrefsLearningGoals: dashboardPrefs?.learning_goals,
        userLearningGoals: user?.learning_goals,
        finalUserGoals: user_goals
      });
      
      const romanizationDisplay = dashboardPrefs?.romanization_display || 'both';
      

      
      // Check if conversation uses a persona
      const usesPersona = conversation.uses_persona || false;
      const personaDescription = conversation.description || '';
      

      
      // Set persona flags
      setIsUsingPersona(usesPersona);
      setIsNewPersona(false); // Existing conversations are not new personas
      setConversationDescription(personaDescription);
      
      const messages = conversation.messages || [];
      const history = messages.map((msg: unknown) => {
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
      
      // Don't set session start time here - it will be set when the conversation is actually continued
      // Session start time should be set when user clicks "Continue" button, not when conversation is loaded
      
      // Store user preferences for use in API calls
      setUserPreferences({ formality, topics, user_goals, userLevel, feedbackLanguage, romanizationDisplay });
    } catch (error: unknown) {
      console.error('[DEBUG] Error loading conversation:', error);
      console.error('[DEBUG] Error details:', (error as any).response?.data || (error as any).message);
      // Don't show error to user, just log it
    } finally {
      setIsLoadingConversation(false);
    }
  };
  

  // Remove auto-fetch - suggestions will be fetched on-demand only

  // Handle conversation loading and creation
  useEffect(() => {
    console.log('[DEBUG] useEffect for conversation loading:', {
      user,
      conversationId,
      isLoadingConversation,
      urlConversationId
    });
    
  
  
   
    
    // Show save prompt for localStorage data
    if (user && localStorage.getItem('chatHistory')) {
      setShowSavePrompt(true);
    }
  }, [user, conversationId, isLoadingConversation, urlConversationId, loadExistingConversation]);

  // Move validateConversationId outside useEffect
  const validateConversationId = async (
    user: User | null,
    urlConversationId: string | null,
    setConversationId: React.Dispatch<React.SetStateAction<string | null>>,
    attempt = 1
  ) => {
    if (user && urlConversationId) {
      try {
        const response = await axios.get(`/api/conversations/${urlConversationId}`, { headers: getAuthHeaders() });
        if (!response.data.conversation) {
          removeConversationParam();
        }
      } catch (error: unknown) {
        if (error && typeof error === 'object' && 'response' in error && (error as any).response && typeof (error as any).response === 'object' && 'status' in (error as any).response && (error as any).response.status === 404) {
          if (attempt < 3) {
            setTimeout(() => {
              validateConversationId(user, urlConversationId, setConversationId, attempt + 1);
            }, 300);
          } else {
            removeConversationParam();
          }
        }
      }
    }
  };

  function removeConversationParam() {
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('conversation');
    window.history.replaceState({}, '', newUrl);
    setConversationId(null);
  }

  useEffect(() => {
    // On login, check if urlConversationId is present and valid
    if (!skipValidation) {
      validateConversationId(user, urlConversationId || null, setConversationId);
    }
  }, [user, urlConversationId, skipValidation]);


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
        await axios.post(
          `/api/conversations/${newConversationId}/messages`,
          {
            sender: msg.sender,
            text: msg.text,
            messageType: 'text',
            message_order: i + 1, // Ensure correct order
          },
          token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
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

  // Auto-save session after conversation exchanges
  // const autoSaveSession = async () => {
  //   if (user?.id && chatHistory.length > 0) {
  //     await saveSessionToBackend(false);
  //   }
  // };

  // Store the classes, not instances
  const SpeechRecognitionClassRef = useRef<any>(null);
  const MediaRecorderClassRef = useRef<typeof window.MediaRecorder | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      SpeechRecognitionClassRef.current = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      MediaRecorderClassRef.current = window.MediaRecorder;
      
      // Check browser compatibility
      if (!window.MediaRecorder) {
        console.warn('MediaRecorder API not supported in this browser');
      }
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('MediaDevices API not supported in this browser');
      }
      if (!SpeechRecognitionClassRef.current) {
        console.warn('SpeechRecognition API not supported in this browser');
      }
      
      // Check if running on HTTPS (required for getUserMedia)
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        console.warn('getUserMedia requires HTTPS in production. Audio recording may not work.');
      }
    }
  }, []);

  // Replace startRecording and stopRecording with MediaRecorder + SpeechRecognition logic
  const startRecording = async () => {
    setWasInterrupted(false);
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
          setManualRecording(false); // Only reset manualRecording if we were in manual mode
          return;
        }
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        sendAudioToBackend(audioBlob);
        stream.getTracks().forEach(track => track.stop());
        setMediaStream(null);
        setIsRecording(false);
        setManualRecording(false); // Only reset manualRecording if we were in manual mode
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
        setManualRecording(false); // Not manual mode
      } else {
        // Manual mode: no speech recognition, just record until user stops
        setManualRecording(true);
      }
    } catch (err: unknown) {
      console.error('Audio recording error:', err);
      let errorMessage = 'Could not start audio recording: ' + (err as any).message;
      
      // Provide more specific error messages
      if ((err as any).name === 'NotAllowedError') {
        errorMessage = 'Microphone access denied. Please allow microphone permissions and try again.';
      } else if ((err as any).name === 'NotFoundError') {
        errorMessage = 'No microphone found. Please connect a microphone and try again.';
      } else if ((err as any).name === 'NotSupportedError') {
        errorMessage = 'Audio recording is not supported in this browser. Please use a modern browser.';
      } else if ((err as any).name === 'SecurityError') {
        errorMessage = 'Microphone access blocked for security reasons. Please check your browser settings.';
      }
      
      alert(errorMessage);
      setIsRecording(false);
      setManualRecording(false);
      setMediaStream(null);
    }
  };

  // Fix: Only reset manualRecording if we were in manual mode
  const stopRecording = (interrupted = false) => {
    if (interrupted) {
      interruptedRef.current = true;
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
    // Only reset manualRecording if we were in manual mode
    if (manualRecording) {
      setManualRecording(false);
    }
  };

  // New: Separate function to fetch and show short feedback
  const fetchAndShowShortFeedback = async (transcription: string) => {
    console.log('[DEBUG] fetchAndShowShortFeedback called', { autoSpeak, enableShortFeedback, chatHistory: [...chatHistory] });
    if (!autoSpeak || !enableShortFeedback) return;
    
    // Prevent duplicate calls while processing
    if (isProcessingShortFeedback) {
      console.log('[DEBUG] Already processing short feedback, skipping duplicate call');
      return;
    }
    
    // Check if we already have a short feedback for this transcription to prevent duplicates
    const existingFeedback = chatHistory.find(msg => 
      msg.sender === 'System' && 
      msg.text && 
      msg.timestamp && 
      Date.now() - msg.timestamp.getTime() < 5000 // Within last 5 seconds
    );
    
    if (existingFeedback) {
      console.log('[DEBUG] Short feedback already exists, skipping duplicate call');
      return;
    }
    
    setIsProcessingShortFeedback(true);
    
    // Prepare context (last 4 messages)
    const context = chatHistory.slice(-4).map(msg => `${msg.sender}: ${msg.text}`).join('\n');
    try {
      console.log('[DEBUG] (fetchAndShowShortFeedback) Calling /short_feedback API with:', { transcription, context, language, user_level: userPreferences.userLevel, user_topics: userPreferences.topics, formality: userPreferences.formality, feedback_language: userPreferences.feedbackLanguage });
      // Call the Express proxy endpoint instead of Python directly
      const token = localStorage.getItem('jwt');
      const shortFeedbackRes = await axios.post(
        '/api/short_feedback',
        {
          user_input: transcription,
          context,
          language,
          user_level: userPreferences.userLevel,
          user_topics: userPreferences.topics,
          formality: userPreferences.formality,
          feedback_language: userPreferences.feedbackLanguage
        },
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );
      console.log('[DEBUG] /short_feedback response', shortFeedbackRes);
      const shortFeedback = shortFeedbackRes.data.short_feedback;
      console.log('[DEBUG] shortFeedback value:', shortFeedback);
      
      if (shortFeedback !== undefined && shortFeedback !== null && shortFeedback !== '') {
        console.log('[DEBUG] Adding System feedback to chatHistory', { shortFeedback, chatHistory: [...chatHistory] });
        
        // Use a more reliable approach to set the short feedback key
        setChatHistory(prev => {
          const currentLength = prev.length;
          const updated = [...prev, { sender: 'System', text: shortFeedback, timestamp: new Date() }];
          console.log('[DEBUG] (fetchAndShowShortFeedback) Updated chatHistory after System message:', updated);
          
          // Set short feedback with the correct index
          setShortFeedbacks(shortFeedbacks => ({ ...shortFeedbacks, [currentLength]: shortFeedback }));
          
          return updated;
        });
        
        // Play short feedback TTS (if autospeak and feedback exists)
        const cacheKey = `short_feedback_${Date.now()}`;
        await playTTSAudio(shortFeedback, language, cacheKey);
      } else {
        console.warn('[DEBUG] (fetchAndShowShortFeedback) shortFeedback is empty or undefined:', shortFeedback);
      }
    } catch (e: unknown) {
      console.error('[DEBUG] (fetchAndShowShortFeedback) Error calling /short_feedback API:', e);
    } finally {
      setIsProcessingShortFeedback(false);
    }
  };

  // TTS functions with caching - now integrated with admin-controlled backend
  const generateTTSForText = async (text: string, language: string, cacheKey: string): Promise<string | null> => {
    // Check cache first (cache for 5 minutes)
    const cached = ttsCache.get(cacheKey);
    const now = Date.now();
    if (cached && (now - cached.timestamp) < 5 * 60 * 1000) {
      console.log('Using cached TTS for:', cacheKey);
      return cached.url;
    }
    
    // Set generating state
    setIsGeneratingTTS(prev => ({ ...prev, [cacheKey]: true }));
    
    try {
      const token = localStorage.getItem('jwt');
      
      // Call the Node.js server which will route to Python API with admin controls
      const response = await axios.post('http://localhost:4000/api/tts', {
        text,
        language
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const ttsUrl = response.data.ttsUrl;
      if (ttsUrl) {
        // Cache the result
        setTtsCache(prev => new Map(prev).set(cacheKey, { url: ttsUrl, timestamp: now }));
        return ttsUrl;
      }
      return null;
    } catch (error) {
      console.error('Error generating TTS:', error);
      return null;
    } finally {
      setIsGeneratingTTS(prev => ({ ...prev, [cacheKey]: false }));
    }
  };

  const playTTSAudio = async (text: string, language: string, cacheKey: string) => {
    // Stop any currently playing audio
    if (ttsAudioRef.current) {
      ttsAudioRef.current.pause();
      ttsAudioRef.current = null;
    }
    
    // Set playing state
    setIsPlayingTTS(prev => ({ ...prev, [cacheKey]: true }));
    setIsPlayingAnyTTS(true);
    
    try {
      const ttsUrl = await generateTTSForText(text, language, cacheKey);
      if (ttsUrl) {
        // Handle both relative and absolute URLs from backend
        const audioUrl = ttsUrl.startsWith('http') ? ttsUrl : `http://localhost:4000${ttsUrl}`;
        const audio = new window.Audio(audioUrl);
        ttsAudioRef.current = audio;
        
        audio.onended = () => {
          ttsAudioRef.current = null;
          setIsPlayingTTS(prev => ({ ...prev, [cacheKey]: false }));
          setIsPlayingAnyTTS(false);
          
          // For autospeak mode, restart recording after TTS finishes
          if (autoSpeakRef.current) {
            setTimeout(() => {
              if (autoSpeakRef.current) startRecording();
            }, 300);
          }
        };
        
        audio.onerror = () => {
          console.error('Error playing TTS audio');
          ttsAudioRef.current = null;
          setIsPlayingTTS(prev => ({ ...prev, [cacheKey]: false }));
          setIsPlayingAnyTTS(false);
          
          // For autospeak mode, restart recording even if TTS fails
          if (autoSpeakRef.current) {
            setTimeout(() => {
              if (autoSpeakRef.current) startRecording();
            }, 300);
          }
        };
        
        await audio.play();
      }
    } catch (error) {
      console.error('Error playing TTS:', error);
      setIsPlayingTTS(prev => ({ ...prev, [cacheKey]: false }));
      setIsPlayingAnyTTS(false);
      
      // For autospeak mode, restart recording even if TTS fails
      if (autoSpeakRef.current) {
        setTimeout(() => {
          if (autoSpeakRef.current) startRecording();
        }, 300);
      }
    }
  };

  const playExistingTTS = async (ttsUrl: string, cacheKey: string) => {
    // Stop any currently playing audio
    if (ttsAudioRef.current) {
      ttsAudioRef.current.pause();
      ttsAudioRef.current = null;
    }
    
    // Set playing state
    setIsPlayingTTS(prev => ({ ...prev, [cacheKey]: true }));
    setIsPlayingAnyTTS(true);
    
    try {
      // Handle both relative and absolute URLs from backend
      const audioUrl = ttsUrl.startsWith('http') ? ttsUrl : `http://localhost:4000${ttsUrl}`;
      const audio = new window.Audio(audioUrl);
      ttsAudioRef.current = audio;
      
      audio.onended = () => {
        ttsAudioRef.current = null;
        setIsPlayingTTS(prev => ({ ...prev, [cacheKey]: false }));
        setIsPlayingAnyTTS(false);
        
        // For autospeak mode, restart recording after TTS finishes
        if (autoSpeakRef.current) {
          setTimeout(() => {
            if (autoSpeakRef.current) startRecording();
          }, 300);
        }
      };
      
      audio.onerror = () => {
        console.error('Error playing existing TTS audio');
        ttsAudioRef.current = null;
        setIsPlayingTTS(prev => ({ ...prev, [cacheKey]: false }));
        setIsPlayingAnyTTS(false);
        
        // For autospeak mode, restart recording even if TTS fails
        if (autoSpeakRef.current) {
          setTimeout(() => {
            if (autoSpeakRef.current) startRecording();
          }, 300);
        }
      };
      
      await audio.play();
    } catch (error) {
      console.error('Error playing existing TTS:', error);
      setIsPlayingTTS(prev => ({ ...prev, [cacheKey]: false }));
      setIsPlayingAnyTTS(false);
    }
  };

  const getTTSUrl = async (text: string, language: string) => null;
  const playTTS = async (url: string) => {};

  const generateRomanizedText = async (text: string, languageCode: string): Promise<string> => {
    if (!isScriptLanguage(languageCode)) {
      return '';
    }
    
    try {
      const token = localStorage.getItem('jwt');
      const response = await axios.post(
        '/api/translate',
        {
          text: text,
          source_language: languageCode,
          target_language: 'en',
          breakdown: false
        },
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );
      
      // For romanization, we want the transliteration, not translation
      // This is a simplified approach - in a real implementation, you'd want a dedicated romanization service
      return response.data.romanized || '';
    } catch (error) {
      console.error('Error generating romanized text:', error);
      return '';
    }
  };

  // Update sendAudioToBackend to handle short feedback in autospeak mode
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
        isProcessing: true // Add flag to identify processing messages
      };
      
      // Clear suggestion carousel when user sends a message
      clearSuggestionCarousel();
      
      // Add placeholder message immediately
      console.log('[DEBUG] Adding placeholder message:', placeholderMessage);
      setChatHistory(prev => [...prev, placeholderMessage]);
      
      // Step 1: Get transcription first
      console.log('[DEBUG] Step 1: Getting transcription...');
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('language', language);
      
      // Add JWT token to headers
      const token = localStorage.getItem('jwt');
      console.log('[DEBUG] Sending transcription request to /api/transcribe_only');
      const transcriptionResponse = await axios.post('/api/transcribe_only', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      
      console.log('[DEBUG] Transcription response:', transcriptionResponse.data);
      console.log('[DEBUG] Full transcription response:', transcriptionResponse.data);
      console.log('[DEBUG] Response status:', transcriptionResponse.status);
      console.log('[DEBUG] Response headers:', transcriptionResponse.headers);
      
      const transcription = transcriptionResponse.data.transcription || 'Speech recorded';
      console.log('[DEBUG] Transcription received:', transcription);
      console.log('[DEBUG] Transcription length:', transcription.length);
      console.log('[DEBUG] Transcription is empty or fallback:', !transcription || transcription === 'Speech recorded');
      
      // Generate romanized text for user messages in script languages
      let userRomanizedText = '';
      if (isScriptLanguage(language) && transcription !== 'Speech recorded') {
        userRomanizedText = await generateRomanizedText(transcription, language);
      }
      
      // Replace the placeholder message with the actual transcript
      console.log('[DEBUG] Replacing placeholder with transcript:', transcription);
      setChatHistory(prev => {
        const updated = prev.map((msg, index) => {
          // Find the last processing message and replace it
          if (msg.isProcessing && msg.sender === 'User') {
            console.log('[DEBUG] Found processing message to replace:', msg);
            return {
              ...msg,
              text: transcription,
              romanizedText: userRomanizedText,
              isProcessing: false
            };
          }
          return msg;
        });
        console.log('[DEBUG] Updated chat history after transcript replacement:', updated);
        return updated;
      });
      
      // Save user message to backend
      if (conversationId) {
        await saveMessageToBackend('User', transcription, 'text', null, null, userRomanizedText);
      }
      
      // Step 2: Get AI response separately
      console.log('[DEBUG] Step 2: Getting AI response...');
      
      // Add AI processing message after transcript is displayed
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
        user_level: userPreferences.userLevel,
        user_topics: userPreferences.topics,
        user_goals: user?.learning_goals ? (typeof user.learning_goals === 'string' ? JSON.parse(user.learning_goals) : user.learning_goals) : [],
        formality: userPreferences.formality,
        feedback_language: userPreferences.feedbackLanguage
      };
      
      console.log('[DEBUG] Sending AI response request to /api/ai_response with data:', aiResponseData);
      const aiResponseResponse = await axios.post('/api/ai_response', aiResponseData, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      
      console.log('[DEBUG] AI response response:', aiResponseResponse.data);
      const aiResponse = aiResponseResponse.data.ai_response;
      console.log('[DEBUG] AI response received:', aiResponse);
      
      // Add AI response if present
      if (aiResponse) {
        console.log('[DEBUG] Adding AI response:', aiResponse);
        const formattedResponse = formatScriptLanguageText(aiResponse, language);
        setChatHistory(prev => {
          const updated = prev.map((msg, index) => {
            // Find the last processing AI message and replace it
            if (msg.isProcessing && msg.sender === 'AI') {
              console.log('[DEBUG] Found AI processing message to replace:', msg);
              return {
                ...msg,
                text: formattedResponse.mainText,
                romanizedText: formattedResponse.romanizedText,
                ttsUrl: null, // We'll handle TTS separately if needed
                isProcessing: false
              };
            }
            return msg;
          });
          console.log('[DEBUG] Chat history after replacing AI processing message:', updated);
          return updated;
        });
        if (conversationId) {
          await saveMessageToBackend('AI', formattedResponse.mainText, 'text', null, null, formattedResponse.romanizedText);
        }
      }
      
      // Note: TTS is handled separately if needed
      console.log('[DEBUG] Audio processing complete');
    } catch (error: unknown) {
      console.error('[DEBUG] Error in sendAudioToBackend:', error);
      if (axios.isAxiosError(error)) {
        console.error('[DEBUG] Axios error details:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
      }
      const errorMessage = {
        sender: 'System',
        text: '❌ Error processing audio. Please try again.',
        timestamp: new Date(),
        isFromOriginalConversation: false // New message added after Continue
      };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      console.log('[DEBUG] Clearing processing state');
      setIsProcessing(false);
    }
  };

  const requestDetailedFeedback = async () => {
    // Get the last 3 messages as context
    const contextMessages = chatHistory.slice(-3);
    const context = contextMessages.map(msg => `${msg.sender}: ${msg.text}`).join('\n');

    // Get the latest user message
    const lastUserMessage = [...chatHistory].reverse().find(msg => msg.sender === 'User');
    if (!lastUserMessage || !lastUserMessage.text || lastUserMessage.text === 'Speech recorded') {
      // Show error in console only
      console.error('No valid user speech found for feedback. Please record a message first.');
      return;
    }

    try {
      const token = localStorage.getItem('jwt');
      const payload = {
        user_input: lastUserMessage.text,
        context,
        language,
        user_level: user?.proficiency_level || 'beginner',
        user_topics: user?.talk_topics || []
      };
      console.log('Detailed feedback payload:', payload);
      const response = await axios.post(
        '/api/feedback',
        payload,
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );
      setShortFeedback(response.data.feedback);
      // Optionally, add to chatHistory
              setChatHistory(prev => [...prev, { sender: 'System', text: response.data.feedback, timestamp: new Date(), isFromOriginalConversation: false }]);
      // Feedback is applied to the message, no need to add to chat
    } catch (error: unknown) {
      console.error('Error getting detailed feedback:', error);
      console.error('[DEBUG] Error response:', (error as any).response?.data);
      console.error('[DEBUG] Error status:', (error as any).response?.status);
      console.error('[DEBUG] Error message:', (error as any).message);
      // Show error in console only
      console.error('Error getting detailed feedback. Please try again.');
    }
  };

  const fetchSuggestions = async () => {
    if (!user) return;
    
    setIsLoadingSuggestions(true);
    try {
      const token = localStorage.getItem('jwt');
      const response = await axios.post(
        '/api/suggestions',
        {
          conversationId: conversationId,
          language: language,
          user_level: userPreferences.userLevel,
          user_topics: userPreferences.topics,
          formality: userPreferences.formality,
          feedback_language: userPreferences.feedbackLanguage
        },
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );
      setSuggestions(response.data.suggestions || []);
    } catch (error: unknown) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleSuggestionButtonClick = async () => {
    if (!user) return;
    
    setIsLoadingSuggestions(true);
    try {
      const token = localStorage.getItem('jwt');
      const response = await axios.post(
        '/api/suggestions',
        {
          conversationId: conversationId,
          language: language,
          user_level: userPreferences.userLevel,
          user_topics: userPreferences.topics,
          formality: userPreferences.formality,
          feedback_language: userPreferences.feedbackLanguage
        },
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );
      
      const suggestions = response.data.suggestions || [];
      if (suggestions.length > 0) {
        // Create temporary suggestion messages with all data from the API
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
            // Preserve the explanation and translation from the API response
            explanation: suggestion.explanation || '',
            translation: suggestion.translation || '',
            romanized: suggestion.romanized || ''
          };
        });
        
        setSuggestionMessages(tempMessages);
        setCurrentSuggestionIndex(0);
        setShowSuggestionCarousel(true);
      }
    } catch (error: unknown) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const navigateSuggestion = (direction: 'prev' | 'next') => {
    if (suggestionMessages.length === 0) return;
    
    if (direction === 'prev') {
      setCurrentSuggestionIndex(prev => 
        prev === 0 ? suggestionMessages.length - 1 : prev - 1
      );
    } else {
      setCurrentSuggestionIndex(prev => 
        prev === suggestionMessages.length - 1 ? 0 : prev + 1
      );
    }
  };

  const clearSuggestionCarousel = () => {
    setCurrentSuggestionIndex(0);
    setSuggestions([]);
  };

  const generateConversationSummary = async () => {
    try {
      const sessionMessages = getSessionMessages();
      
      // Debug logging for conversation history
      console.log('[DEBUG] Total chat history length:', chatHistory.length);
      console.log('[DEBUG] Session messages (new only):', sessionMessages.length);
      console.log('[DEBUG] Session messages details:', sessionMessages.map(msg => ({
        sender: msg.sender,
        text: msg.text.substring(0, 50) + '...',
        timestamp: msg.timestamp,
        isFromOriginalConversation: msg.isFromOriginalConversation
      })));
      
      if (sessionMessages.length === 0) {
        console.log('No session messages found for evaluation');
        router.push('/dashboard');
        return;
      }
      
      const userSessionMessages = sessionMessages.filter(msg => msg.sender === 'User');
      console.log('[DEBUG] User session messages:', userSessionMessages.length);
      
      if (userSessionMessages.length === 0) {
        console.log('No user messages in session, skipping evaluation');
        router.push('/dashboard');
        return;
      }
      
      // For continued conversations, only show progress popup if there are new messages
      const hasContinuedConversation = sessionStartTime !== null;
      const hasNewMessages = userSessionMessages.length > 0;
      
      console.log('[DEBUG] Is continued conversation:', hasContinuedConversation);
      console.log('[DEBUG] Has new messages:', hasNewMessages);
      
      // If continued conversation but no new messages, just navigate to dashboard
      // But only if we don't have any progress data to show
      if (hasContinuedConversation && !hasNewMessages) {
        console.log('Continued conversation with no new messages, navigating to dashboard');
        // Don't navigate immediately - let the progress modal logic handle it
        // router.push('/dashboard');
        // return;
      }
      
      // Use the learning goals from the current conversation (userPreferences.user_goals)
      // Also try to get from user object if not available in preferences
      console.log('[DEBUG] userPreferences in generateConversationSummary:', userPreferences);
      console.log('[DEBUG] userPreferences.user_goals:', userPreferences.user_goals);
      
      // Try to get learning goals from multiple sources
      let user_goals = userPreferences.user_goals?.length > 0 
        ? userPreferences.user_goals 
        : (user?.learning_goals ? (typeof user.learning_goals === 'string' ? JSON.parse(user.learning_goals) : user.learning_goals) : []);
      
      // If still empty, try to get from the conversation object directly
      if (!user_goals || user_goals.length === 0) {
        console.log('[DEBUG] user_goals is empty, trying to get from conversation object');
        // Try to fetch the conversation again to get the learning goals
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
            console.log('[DEBUG] Retrieved learning goals from conversation:', conversationLearningGoals);
            user_goals = conversationLearningGoals;
          }
        } catch (error) {
          console.log('[DEBUG] Error fetching conversation for learning goals:', error);
        }
      }
      
      // Get user's current subgoal progress to determine the appropriate level for each subgoal
      const storedProgress = localStorage.getItem(`subgoal_progress_${user?.id}_${language}`);
      let userSubgoalProgress: SubgoalProgress[] = [];
      if (storedProgress) {
        try {
          userSubgoalProgress = JSON.parse(storedProgress);
          console.log('[DEBUG] Loaded user subgoal progress for evaluation:', userSubgoalProgress);
        } catch (error) {
          console.error('[DEBUG] Error parsing stored subgoal progress:', error);
        }
      }
      
      let subgoalInstructions = '';
      
      if (user_goals.length > 0) {
        // User has specific learning goals for this conversation
        console.log('[DEBUG] Building subgoal instructions from goals:', user_goals);
        subgoalInstructions = user_goals.map((goalId: string) => {
          const goal = LEARNING_GOALS.find((g: LearningGoal) => g.id === goalId);
          console.log(`[DEBUG] Processing goal ${goalId} for instructions:`, goal);
          
          if (goal?.subgoals) {
            const instructions = goal.subgoals
              .filter(subgoal => subgoal.description)
              .map(subgoal => {
                // Get the user's current level for this subgoal
                const userLevel = getSubgoalLevel(subgoal.id, userSubgoalProgress);
                // Use progressive description based on current level
                const progressiveDescription = getProgressiveSubgoalDescription(subgoal.id, userLevel);
                console.log(`[DEBUG] Subgoal ${subgoal.id}: level=${userLevel}, progressive description:`, progressiveDescription);
                return progressiveDescription;
              });
            console.log(`[DEBUG] Instructions for goal ${goalId}:`, instructions);
            return instructions.join('\n');
          }
          return '';
        }).filter(instructions => instructions.length > 0).join('\n');
      } else {
        // Fallback: use the first learning goal as default
        const defaultGoal = LEARNING_GOALS[0]; // Use the first goal as default
        if (defaultGoal?.subgoals) {
          subgoalInstructions = defaultGoal.subgoals
            .filter(subgoal => subgoal.description)
            .map(subgoal => {
              // Get the user's current level for this subgoal
              const userLevel = getSubgoalLevel(subgoal.id, userSubgoalProgress);
              // Use progressive description based on current level
              const progressiveDescription = getProgressiveSubgoalDescription(subgoal.id, userLevel);
              console.log(`[DEBUG] Default subgoal ${subgoal.id}: level=${userLevel}, progressive description:`, progressiveDescription);
              return progressiveDescription;
            })
            .join('\n');
        } else {
          subgoalInstructions = '';
        }
      }
      
      console.log('[DEBUG] Final subgoal instructions:', subgoalInstructions);

      // Check if this is a continued conversation (has existing title)
      const isContinuedConversation = sessionStartTime !== null;
      console.log('[DEBUG] Is continued conversation:', isContinuedConversation);
      
      // If continued conversation, we should preserve the existing title
      // and only evaluate new messages for progress
      const requestPayload = {
        chat_history: sessionMessages,
        subgoal_instructions: subgoalInstructions,
        target_language: language,
        feedback_language: userPreferences?.feedbackLanguage || 'en',
        is_continued_conversation: isContinuedConversation
      };
      
      console.log('[DEBUG] Request payload:', requestPayload);

      const token = localStorage.getItem('jwt');
      const response = await axios.post('/api/conversation-summary', requestPayload, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      console.log('Summary response:', response.data);
      
      // Update the existing conversation with the Gemini-generated title and synopsis
      if (conversationId) {
        try {
          // Check if the conversation already has a title before updating
          let shouldUpdateTitle = true;
          
          // Check if the conversation already has a title
          try {
            const conversationResponse = await axios.get(`/api/conversations/${conversationId}`, {
              headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {})
              }
            });
            
            const existingTitle = conversationResponse.data?.conversation?.title;
            console.log('[DEBUG] Existing conversation title:', existingTitle);
            
            // Always update title when a new one is generated, regardless of existing title
            // This ensures that the most relevant title (based on actual conversation content) is used
            console.log('[DEBUG] Will update title with new generated title:', response.data.title);
          } catch (error) {
            console.error('[DEBUG] Error fetching conversation data:', error);
            // If we can't fetch the conversation data, proceed with updating the title
          }
          
          // Only update the title if we should and if we have a valid title
          // console.log('[DEBUG] Title update decision:', {
          //   shouldUpdateTitle,
          //   responseTitle: response.data.title,
          //   responseTitleTrimmed: response.data.title?.trim(),
          //   isContinuedConversation,
          //   hasValidTitle: response.data.title && response.data.title.trim() !== '' && response.data.title !== '[No Title]'
          // });
          
          if (shouldUpdateTitle && response.data.title && response.data.title.trim() !== '' && response.data.title !== '[No Title]') {
            console.log('[DEBUG] Updating conversation title:', response.data.title);
            await axios.put(`/api/conversations/${conversationId}/title`, {
              title: response.data.title
            }, {
              headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {})
              }
            });
          } else {
            // console.log('[DEBUG] Skipping title update - preserving existing title or no valid title generated');
          }
          
          // Update the conversation with the synopsis and progress data
          console.log('Saving synopsis and progress data:', {
            synopsis: response.data.synopsis,
            progress_data: response.data.progress_percentages ? JSON.stringify({
              goals: user_goals,
              percentages: response.data.progress_percentages
            }) : null
          });
          
          // Only save progress data if it's valid and not empty
          const progressDataToSave = response.data.progress_percentages && 
            response.data.progress_percentages.length > 0 && 
            response.data.progress_percentages.some((p: number) => p > 0) 
            ? JSON.stringify({
                goals: user_goals,
                percentages: response.data.progress_percentages
              })
            : null;
          
                      // console.log('Progress data to save:', progressDataToSave);
          
          await axios.patch(`/api/conversations/${conversationId}`, {
            synopsis: response.data.synopsis,
            progress_data: progressDataToSave
          }, {
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {})
            }
          });
          
          // console.log('Successfully saved synopsis and progress data');
          
          // console.log('Conversation updated with synopsis');
          // console.log('Title handling:', isContinuedConversation ? 'Preserved original title' : `Updated to: ${response.data.title}`);
          // console.log('Synopsis:', response.data.synopsis.substring(0, 100) + '...');
          
          // Show progress popup if we have progress percentages
          console.log('[DEBUG] Progress data received:', response.data.progress_percentages);
          // console.log('Progress data check:', response.data.progress_percentages);
          // console.log('Full response data:', response.data);
          // console.log('Response data type:', typeof response.data.progress_percentages);
          // console.log('Response data length:', response.data.progress_percentages?.length);
          
          // Always show progress modal if we have progress data, regardless of whether percentages changed
          // Also show if it's a continued conversation with new messages
          if ((response.data.progress_percentages && response.data.progress_percentages.length > 0) || 
              (hasContinuedConversation && hasNewMessages)) {
            // console.log('Setting progress modal with data:', response.data.progress_percentages);
            // console.log('userPreferences:', userPreferences);
            // console.log('userPreferences.user_goals:', userPreferences?.user_goals);
            
            // Get current user subgoal progress from localStorage
            const storedProgress = localStorage.getItem(`subgoal_progress_${user?.id}_${language}`);
            let userSubgoalProgress: SubgoalProgress[] = [];
            if (storedProgress) {
              try {
                userSubgoalProgress = JSON.parse(storedProgress);
              } catch (error) {
                console.error('Error parsing stored subgoal progress:', error);
              }
            }
            
            // Process level-ups for each subgoal
            const levelUpEvents: LevelUpEvent[] = [];
            const updatedSubgoalProgress = [...userSubgoalProgress];
            
            // Get subgoal IDs for the current goals in the same order as they appear in subgoal_instructions
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
            
            // Update progress for each subgoal
            // console.log('[DEBUG] Progress percentages from LLM:', response.data.progress_percentages);
            // console.log('[DEBUG] Subgoal IDs in order:', subgoalIds);
            
            // Check if progress_percentages exists and is an array
            if (response.data.progress_percentages && Array.isArray(response.data.progress_percentages)) {
              response.data.progress_percentages.forEach((percentage: number, index: number) => {
              if (index < subgoalIds.length) {
                const subgoalId = subgoalIds[index];
                // console.log(`[DEBUG] Processing index ${index}: subgoalId=${subgoalId}, percentage=${percentage}`);
                
                const { updatedProgress, levelUpEvent } = updateSubgoalProgress(
                  subgoalId,
                  percentage,
                  updatedSubgoalProgress
                );
                
                if (levelUpEvent) {
                  console.log(`[DEBUG] Level up detected for ${subgoalId} with ${percentage}%`);
                  console.log(`[DEBUG] Level up event:`, levelUpEvent);
                  levelUpEvents.push(levelUpEvent);
                } else {
                  console.log(`[DEBUG] No level up for ${subgoalId} with ${percentage}%`);
                }
                
                // Update the progress array
                updatedSubgoalProgress.splice(0, updatedSubgoalProgress.length, ...updatedProgress);
              }
            });
            } else {
              // console.log('[DEBUG] No progress_percentages found in response or not an array');
            }
            
            // Save updated progress to localStorage
            localStorage.setItem(`subgoal_progress_${user?.id}_${language}`, JSON.stringify(updatedSubgoalProgress));
            
            // Dispatch custom event to notify dashboard of level-up
            window.dispatchEvent(new CustomEvent('subgoalProgressUpdated', {
              detail: { levelUpEvents, updatedProgress: updatedSubgoalProgress }
            }));
            
            const subgoalNames = user_goals?.map((goalId: string) => {
              const goal = LEARNING_GOALS.find((g: LearningGoal) => g.id === goalId);
              console.log('Found goal for ID', goalId, ':', goal);
              return goal?.subgoals?.map(subgoal => {
                const userLevel = getSubgoalLevel(subgoal.id, updatedSubgoalProgress);
                
                // Check if there's a level-up event for this subgoal
                const levelUpEvent = levelUpEvents.find(event => event.subgoalId === subgoal.id);
                
                // If there's a level-up event, use the previous level (oldLevel) for the description
                // Otherwise, use the current level
                const descriptionLevel = levelUpEvent ? levelUpEvent.oldLevel : userLevel;
                
                console.log(`[DEBUG] Subgoal ${subgoal.id}:`, {
                  userLevel,
                  levelUpEvent: levelUpEvent ? { oldLevel: levelUpEvent.oldLevel, newLevel: levelUpEvent.newLevel } : null,
                  descriptionLevel,
                  description: getProgressiveSubgoalDescription(subgoal.id, descriptionLevel)
                });
                
                return getProgressiveSubgoalDescription(subgoal.id, descriptionLevel);
              }) || [];
            }).flat().slice(0, 3) || []; // Take first 3 subgoals
            
            console.log('Subgoal names:', subgoalNames);
            console.log('Level up events:', levelUpEvents);
            console.log('[DEBUG] Response data:', response.data);
            console.log('[DEBUG] Progress percentages from response:', response.data.progress_percentages);
            console.log('[DEBUG] Progress percentages type:', typeof response.data.progress_percentages);
            console.log('[DEBUG] Progress percentages is array:', Array.isArray(response.data.progress_percentages));
            console.log('Setting progress data:', {
              percentages: response.data.progress_percentages,
              subgoalNames: subgoalNames,
              levelUpEvents: levelUpEvents
            });
            
            // Create progress transition data
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
            
            // console.log('[DEBUG] Setting progress data:', {
            //   rawProgressPercentages: response.data.progress_percentages,
            //   rawProgressPercentagesType: typeof response.data.progress_percentages,
            //   isArray: Array.isArray(response.data.progress_percentages),
            //   processedPercentages: response.data.progress_percentages && Array.isArray(response.data.progress_percentages) 
            //     ? response.data.progress_percentages 
            //     : [],
            //   processedPercentagesType: typeof (response.data.progress_percentages && Array.isArray(response.data.progress_percentages) 
            //     ? response.data.progress_percentages 
            //     : []),
            //   subgoalNames: subgoalNames,
            //   subgoalIds: subgoalIds,
            //   levelUpEvents: levelUpEvents,
            //   levelUpEventsLength: levelUpEvents.length,
            //   subgoalNamesLength: subgoalNames.length,
            //   responseDataKeys: Object.keys(response.data),
            //   responseDataProgressType: typeof response.data.progress_percentages
            // });
            
            const finalProgressData = {
              percentages: response.data.progress_percentages && Array.isArray(response.data.progress_percentages) 
                ? response.data.progress_percentages 
                : [],
              subgoalNames: subgoalNames,
              subgoalIds: subgoalIds,
              levelUpEvents: levelUpEvents,
              progressTransitions: progressTransitions
            };
            
            console.log('[DEBUG] Final progress data percentages:', finalProgressData.percentages);
            console.log('[DEBUG] Final progress data being set:', {
              percentages: finalProgressData.percentages,
              percentagesType: typeof finalProgressData.percentages,
              percentagesLength: finalProgressData.percentages?.length,
              percentagesValues: finalProgressData.percentages,
              subgoalNames: finalProgressData.subgoalNames,
              subgoalIds: finalProgressData.subgoalIds,
              levelUpEvents: finalProgressData.levelUpEvents
            });
            
            // console.log('[DEBUG] Final progress data being set:', {
            //   ...finalProgressData,
            //   percentagesType: typeof finalProgressData.percentages,
            //   percentagesLength: finalProgressData.percentages?.length,
            //   percentagesValues: finalProgressData.percentages,
            //   percentagesMap: finalProgressData.percentages?.map((p, i) => ({ index: i, value: p, type: typeof p }))
            // });
            
            console.log('[DEBUG] About to set progress data:', finalProgressData);
            setProgressData(finalProgressData);
            setShowProgressModal(true);
            console.log('[DEBUG] Progress modal state after setting:', { showProgressModal: true, progressData: finalProgressData });
            // console.log('Progress modal should be visible now');
            // console.log('showProgressModal state:', true);
                      } else {
              // console.log('No progress data and not a continued conversation with new messages, navigating to dashboard');
              // If no progress data, navigate directly to dashboard
              router.push('/dashboard');
            }
        } catch (updateError) {
          console.error('Error updating conversation with summary:', updateError);
          // If there's an error updating, still navigate to dashboard
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

  const fetchInitialAIMessage = async (convId: string, topics: string[]) => {
    setIsLoadingInitialAI(true);
    try {
      // Compose a fake empty user message to trigger AI opening
      const token = localStorage.getItem('jwt');
      const response = await axios.post(
        '/api/conversations/' + convId + '/messages',
        {
          sender: 'User',
          text: '', // Empty input to signal "AI, start the conversation"
          messageType: 'text',
          topics: topics,
        },
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );
      console.log('[DEBUG] POST /api/conversations/:id/messages response:', response.data);
      // Use the AI message from the POST response if present
      if (response.data && response.data.aiMessage) {
        console.log('[DEBUG] AI message from POST response:', response.data.aiMessage);
        const formattedMessage = formatScriptLanguageText((response.data.aiMessage as any).text, language);
        setChatHistory([{ 
          sender: 'AI', 
          text: formattedMessage.mainText, 
          romanizedText: formattedMessage.romanizedText,
          timestamp: new Date(),
          isFromOriginalConversation: false // New conversation message
        }]);
      } else {
        console.log('[DEBUG] No aiMessage in POST response, falling back to GET');
        // Fallback: fetch the updated conversation to get the AI's reply
        const token = localStorage.getItem('jwt');
        const convRes = await axios.get(
          `/api/conversations/${convId}`,
          token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
        );
        const messages = convRes.data.conversation.messages || [];
        // Find the first AI message
        const aiMsg = messages.find((m: unknown) => (m as any).sender === 'AI');
        if (aiMsg) {
          console.log('[DEBUG] AI message from GET:', aiMsg);
          const formattedMessage = formatScriptLanguageText((aiMsg as any).text, language);
          setChatHistory([{ 
            sender: 'AI', 
            text: formattedMessage.mainText, 
            romanizedText: formattedMessage.romanizedText,
            timestamp: new Date((aiMsg as any).created_at),
            isFromOriginalConversation: false // New conversation message
          }]);
        } else {
          console.log('[DEBUG] No AI message found in conversation after GET');
        }
      }
    } catch (err: unknown) {
      console.error('[DEBUG] Error in fetchInitialAIMessage:', err);
      // Fallback: just add a generic AI greeting
      setChatHistory([{ sender: 'AI', text: 'Hello! What would you like to talk about today?', timestamp: new Date(), isFromOriginalConversation: false }]);
    } finally {
      setIsLoadingInitialAI(false);
    }
  };

  const handleModalConversationStart = async (newConversationId: string, topics: string[], aiMessage: unknown, formality: string, learningGoals: string[], description?: string, isUsingExistingPersona?: boolean) => {
    setConversationId(newConversationId);
    setChatHistory([]);
    setShowTopicModal(false);
    setSkipValidation(true);
    setTimeout(() => setSkipValidation(false), 2000); // Skip validation for 2 seconds
    
    // For new conversations, sessionStartTime should be null initially
    setSessionStartTime(null);
    console.log('[DEBUG] Set session start time for new conversation: null');
    
    // Set the conversation description
    setConversationDescription(description || '');
    
    // Check if this is a persona-based conversation (has a description)
    const isPersonaConversation = !!(description && description.trim());
    setIsUsingPersona(isPersonaConversation);
    
    // Mark this as a new persona only if it's not using an existing persona
    setIsNewPersona(!isUsingExistingPersona);
    
    console.log('[DEBUG] Starting conversation with persona:', { 
      description, 
      isPersonaConversation, 
      formality, 
      topics 
    });
    
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
      if ((aiMessage as any).ttsUrl) {
        // Handle both relative and absolute URLs from backend
        const ttsUrl = (aiMessage as any).ttsUrl;
        const audioUrl = ttsUrl.startsWith('http') ? ttsUrl : `http://localhost:4000${ttsUrl}`;
        try {
          const headResponse = await fetch(audioUrl, { method: 'HEAD' });
          if (headResponse.ok) {
            const audio = new window.Audio(audioUrl);
            ttsAudioRef.current = audio;
            audio.onended = () => {
              ttsAudioRef.current = null;
            };
            audio.play().catch(error => {
              console.error('Failed to play initial TTS audio:', error);
            });
          }
        } catch (fetchError: unknown) {
          console.error('Error checking initial TTS audio file:', fetchError);
        }
      }
    } else {
      setChatHistory([{ sender: 'AI', text: 'Hello! What would you like to talk about today?', timestamp: new Date(), isFromOriginalConversation: false }]);
    }
  };

  const handleSuggestionClick = () => {
    // Just scroll to recording button to encourage user to record
    const recordingSection = document.querySelector('[data-recording-section]');
    if (recordingSection) {
      recordingSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const saveMessageToBackend = async (sender: string, text: string, messageType = 'text', audioFilePath = null, targetConversationId = null, romanizedText: string | null = null) => {
    const useConversationId = targetConversationId || conversationId;
    if (!useConversationId) {
      console.error('[DEBUG] No conversation ID available');
      return;
    }
    console.log('[DEBUG] Saving message to backend:', { sender, text, messageType, audioFilePath, romanizedText, conversationId: useConversationId });
    try {
      const token = localStorage.getItem('jwt');
      const response = await axios.post(
        `/api/conversations/${useConversationId}/messages`,
        {
          sender,
          text,
          messageType,
          audioFilePath,
          romanized_text: romanizedText
        },
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );
      console.log('[DEBUG] Message saved to backend successfully:', response.data);
    } catch (error: unknown) {
      console.error('[DEBUG] Error saving message to backend:', error);
      console.error('[DEBUG] Error details:', (error as any).response?.data || (error as any).message);
    }
  };

  const translateMessage = async (messageIndex: number, text: string, breakdown = false) => {
    if (isTranslating[messageIndex]) return;
    
    setIsTranslating(prev => ({ ...prev, [messageIndex]: true }));
    
    try {
      const token = localStorage.getItem('jwt');
      
      if (breakdown) {
        // Call detailed breakdown API
        const response = await axios.post(
          '/api/detailed_breakdown',
          {
            llm_response: text,
            user_input: '', // We don't have the user input for this message
            context: chatHistory.slice(-4).map(msg => `${msg.sender}: ${msg.text}`).join('\n'),
            language: language,
            user_level: userPreferences.userLevel,
            user_topics: userPreferences.topics,
            user_goals: userPreferences.user_goals,
            formality: userPreferences.formality,
            feedback_language: userPreferences.feedbackLanguage
          },
          token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
        );
        
        setTranslations(prev => ({ 
          ...prev, 
          [messageIndex]: { 
            translation: text, // Show original text as translation
            breakdown: response.data.breakdown,
            has_breakdown: true
          } 
        }));
      } else {
        // Call regular translation API
        const response = await axios.post(
          '/api/translate',
          {
            text,
            source_language: 'auto',
            target_language: 'en',
            breakdown
          },
          token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
        );
        
        setTranslations(prev => ({ 
          ...prev, 
          [messageIndex]: response.data 
        }));
      }
      
      setShowTranslations(prev => ({ 
        ...prev, 
        [messageIndex]: true 
      }));
    } catch (error: unknown) {
      console.error('Translation/breakdown error:', error);
      setTranslations(prev => ({ 
        ...prev, 
        [messageIndex]: { 
          translation: breakdown ? 'Detailed breakdown failed' : 'Translation failed', 
          error: true 
        } 
      }));
    } finally {
      setIsTranslating(prev => ({ ...prev, [messageIndex]: false }));
    }
  };

  const explainSuggestion = async (suggestionIndex: number, text: string) => {
    if (isTranslatingSuggestion[suggestionIndex]) return;
    
    setIsTranslatingSuggestion(prev => ({ ...prev, [suggestionIndex]: true }));
    
    try {
      // Call the new API endpoint to get explanation and translation
      const token = localStorage.getItem('jwt');
      const requestData = {
        suggestion_text: text,
        chatHistory: chatHistory,
        language: language,
        user_level: userPreferences.userLevel,
        user_topics: userPreferences.topics,
        formality: userPreferences.formality,
        feedback_language: userPreferences.feedbackLanguage,
        user_goals: userPreferences.user_goals
      };
      
      console.log('[DEBUG] explainSuggestion() calling /api/explain_suggestion with:', requestData);
      
      const response = await axios.post(
        '/api/explain_suggestion',
        requestData,
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );
      
      const result = response.data;
      console.log('[DEBUG] explainSuggestion() received response:', result);
      
      setSuggestionTranslations(prev => ({ 
        ...prev, 
        [suggestionIndex]: { 
          translation: result.translation || '',
          breakdown: result.explanation || '',
          has_breakdown: true
        } 
      }));
      
      setShowSuggestionTranslations(prev => ({ 
        ...prev, 
        [suggestionIndex]: true 
      }));
    } catch (error: unknown) {
      console.error('Suggestion explanation error:', error);
      setSuggestionTranslations(prev => ({ 
        ...prev, 
        [suggestionIndex]: { 
          translation: 'Explanation failed', 
          error: true 
        } 
      }));
    } finally {
      setIsTranslatingSuggestion(prev => ({ ...prev, [suggestionIndex]: false }));
    }
  };

  const handleMessageClick = (index: number, text: string) => {
    if (showTranslations[index]) {
      // Hide translation
      setShowTranslations(prev => ({ ...prev, [index]: false }));
    } else {
      // Show existing translation if available, otherwise do nothing
      // (Let the user use the Detailed Breakdown button for new translations)
      if (translations[index]) {
        setShowTranslations(prev => ({ ...prev, [index]: true }));
      }
      // Removed the automatic translation call to avoid interfering with detailed breakdown
    }
  };

  const requestDetailedFeedbackForMessage = async (messageIndex: number) => {
    console.log('[DEBUG] requestDetailedFeedbackForMessage called with index:', messageIndex);
    console.log('[DEBUG] conversationId:', conversationId);
    
    if (!conversationId) {
      console.log('[DEBUG] No conversationId, returning early');
      return;
    }
    
    console.log('[DEBUG] Setting loading state for message:', messageIndex);
    setIsLoadingMessageFeedback(prev => ({ ...prev, [messageIndex]: true }));
    
    try {
      const token = localStorage.getItem('jwt');
      
      // Get the message text and context
      const message = chatHistory[messageIndex];
      const user_input = message?.text || '';
      const context = chatHistory.slice(-4).map(msg => `${msg.sender}: ${msg.text}`).join('\n');
      
      // Ensure user preferences are loaded for the current language
      if (!userPreferences.romanizationDisplay || userPreferences.romanizationDisplay === 'both') {
        console.log('[DEBUG] Loading user dashboard preferences for language:', language);
        const dashboardPrefs = await fetchUserDashboardPreferences(language || 'en');
        if (dashboardPrefs) {
          setUserPreferences(prev => ({
            ...prev,
            romanizationDisplay: dashboardPrefs.romanization_display || 'both'
          }));
          console.log('[DEBUG] Updated user preferences with dashboard settings:', dashboardPrefs);
        }
      }
      
      const requestData = {
        user_input,
        context,
        language,
        user_level: userPreferences.userLevel,
        user_topics: userPreferences.topics,
        romanization_display: userPreferences.romanizationDisplay
      };
      
      console.log('[DEBUG] Request data for feedback:', requestData);
      console.log('[DEBUG] Current language:', language);
      console.log('[DEBUG] User preferences:', userPreferences);
      
      console.log('[DEBUG] Sending to /api/feedback:', requestData);
      console.log('[DEBUG] Request data details:', {
        user_input: user_input,
        context_length: context.length,
        language: language,
        user_level: userPreferences.userLevel,
        user_topics: userPreferences.topics
      });
      
      // Test server connectivity first
      try {
        const healthCheck = await axios.get('/api/health');
        console.log('[DEBUG] Server health check:', healthCheck.status);
      } catch (healthError: unknown) {
        console.error('[DEBUG] Server health check failed:', (healthError as any).message);
      }
      
      console.log('[DEBUG] JWT token exists:', !!token);
      console.log('[DEBUG] JWT token length:', token ? token.length : 0);
      
      console.log('[DEBUG] Making API call to /api/feedback...');
      const response = await axios.post(
        '/api/feedback',
        requestData,
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );
      
      console.log('[DEBUG] API response received:', response.status);
      console.log('[DEBUG] Response data:', response.data);
      
      const detailedFeedback = response.data.feedback;
      console.log('[DEBUG] Detailed feedback extracted:', detailedFeedback);
      console.log('[DEBUG] Detailed feedback type:', typeof detailedFeedback);
      console.log('[DEBUG] Detailed feedback length:', detailedFeedback?.length);
      console.log('[DEBUG] Detailed feedback first 200 chars:', detailedFeedback?.substring(0, 200));
      console.log('[DEBUG] Detailed feedback contains formatting markers:', {
        hasDoubleUnderscore: detailedFeedback?.includes('__'),
        hasDoubleTilde: detailedFeedback?.includes('~~'),
        hasDoubleEquals: detailedFeedback?.includes('=='),
        hasDoubleAngle: detailedFeedback?.includes('<<')
      });
      
      // Extract formatted sentence from feedback and update chat history
      console.log('[DEBUG] User preferences before extraction:', userPreferences);
      const formattedSentence = extractFormattedSentence(detailedFeedback, userPreferences.romanizationDisplay || 'both');
      console.log('[DEBUG] Extracted formatted sentence:', formattedSentence);
      console.log('[DEBUG] Romanization display setting:', userPreferences.romanizationDisplay);
      
      // Parse explanations for each highlighted word
      const explanations = parseFeedbackExplanations(detailedFeedback);
      console.log('[DEBUG] Parsed explanations:', explanations);
      
      // Extract corrected version
      const correctedVersion = extractCorrectedVersion(detailedFeedback);
      console.log('[DEBUG] Extracted corrected version:', correctedVersion);
      
      // Store explanations for this message
      setFeedbackExplanations(prev => ({
        ...prev,
        [messageIndex]: explanations
      }));
      
      // Show corrected version automatically when feedback is generated
      setShowCorrectedVersions(prev => ({
        ...prev,
        [messageIndex]: true
      }));
      
      // Update the message in chat history with the feedback and formatted text
      console.log('[DEBUG] Updating message with formatted sentence:', formattedSentence);
      setChatHistory(prev => {
        console.log('[DEBUG] Previous chat history length:', prev.length);
        console.log('[DEBUG] Message index:', messageIndex);
        console.log('[DEBUG] Current message:', prev[messageIndex]);
        console.log('[DEBUG] About to set detailedFeedback:', detailedFeedback);
        
        const updated = prev.map((msg, idx) => {
          if (idx === messageIndex) {
            const updatedMsg = { 
              ...msg, 
              detailedFeedback: detailedFeedback,
              // Update the message text with formatted version if available
              ...(formattedSentence && {
                text: formattedSentence.mainText,
                romanizedText: formattedSentence.romanizedText
              })
            };
            console.log('[DEBUG] Updated message object:', updatedMsg);
            console.log('[DEBUG] Updated message detailedFeedback:', updatedMsg.detailedFeedback);
            return updatedMsg;
          }
          return msg;
        });
        
        console.log('[DEBUG] Final updated message:', updated[messageIndex]);
        console.log('[DEBUG] Message has detailedFeedback:', !!updated[messageIndex].detailedFeedback);
        console.log('[DEBUG] Message detailedFeedback value:', updated[messageIndex].detailedFeedback);
        console.log('[DEBUG] Message text:', updated[messageIndex].text);
        console.log('[DEBUG] Message romanizedText:', updated[messageIndex].romanizedText);
        return updated;
      });
      
      // Store feedback in the database for the specific message (if it has an ID)
      console.log('[DEBUG] Message ID:', message?.id);
      if (message && message.id) {
        const token = localStorage.getItem('jwt');
        console.log('[DEBUG] Storing feedback in database for message ID:', message.id);
        try {
          await axios.post(
            '/api/messages/feedback',
            {
              messageId: message.id,
              feedback: detailedFeedback
            },
            token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
          );
          console.log('[DEBUG] Feedback stored in database successfully');
        } catch (dbError) {
          console.error('[DEBUG] Failed to store feedback in database:', dbError);
        }
      } else {
        console.log('[DEBUG] No message ID, skipping database storage');
      }
      

    } catch (error: unknown) {
      console.error('Error getting detailed feedback:', error);
      console.error('[DEBUG] Error response:', (error as any).response?.data);
      console.error('[DEBUG] Error status:', (error as any).response?.status);
      console.error('[DEBUG] Error status text:', (error as any).response?.statusText);
      console.error('[DEBUG] Full error object:', error);
      // Show error in console only
      console.error('Error getting detailed feedback. Please try again.');
    } finally {
      setIsLoadingMessageFeedback(prev => ({ ...prev, [messageIndex]: false }));
    }
  };

  const toggleDetailedFeedback = (messageIndex: number) => {
    console.log('[DEBUG] toggleDetailedFeedback called with index:', messageIndex);
    const message = chatHistory[messageIndex];
    console.log('[DEBUG] Message:', message);
    console.log('[DEBUG] Message has detailedFeedback:', !!message?.detailedFeedback);
    
    if (message && message.detailedFeedback) {
      console.log('[DEBUG] Feedback already exists for this message');
      // Feedback already applied to the message, no action needed
    } else {
      console.log('[DEBUG] Generating new feedback');
      // Generate new feedback
      requestDetailedFeedbackForMessage(messageIndex);
    }
  };

  const requestShortFeedbackForMessage = async (messageIndex: number) => {
    const message = chatHistory[messageIndex];
    if (!message || (message as any).sender !== 'AI') return;

    console.log('[DEBUG] Starting requestShortFeedbackForMessage for messageIndex:', messageIndex);
    console.log('[DEBUG] Message:', message);
    console.log('[DEBUG] User preferences:', userPreferences);
    console.log('[DEBUG] Language:', language);

    setIsLoadingMessageFeedback(prev => ({ ...prev, [messageIndex]: true }));

    try {
      const token = localStorage.getItem('jwt');
      const requestData = {
        text: message.text,
        user_level: userPreferences.userLevel,
        user_topics: userPreferences.topics,
        user_goals: userPreferences.user_goals,
        feedback_language: userPreferences.feedbackLanguage,
        language: language
      };

      console.log('[DEBUG] Request data for short feedback:', requestData);
      console.log('[DEBUG] Making request to /api/short_feedback');

      // Call Gemini client directly through Python API
      const response = await axios.post(
        '/api/short_feedback',
        requestData,
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );

      console.log('[DEBUG] Short feedback response received:', response);
      console.log('[DEBUG] Response data:', response.data);
      console.log('[DEBUG] Response status:', response.status);

      const shortFeedback = response.data.short_feedback;
      console.log('[DEBUG] Extracted short feedback:', shortFeedback);
      
      // Store short feedback in state
      setShortFeedbacks(prev => ({ ...prev, [messageIndex]: shortFeedback }));
      console.log('[DEBUG] Updated shortFeedbacks state for messageIndex:', messageIndex);
      
      // Update the short feedback display in left panel
      setShortFeedback(shortFeedback);
      
      // Clear parsed breakdown since this is short feedback, not detailed breakdown
      setParsedBreakdown([]);
      setShowDetailedBreakdown({});
      console.log('[DEBUG] Set shortFeedback state to:', shortFeedback);
    } catch (error: unknown) {
      console.error('[DEBUG] Error getting short feedback:', error);
      console.error('[DEBUG] Error response:', (error as any).response?.data);
      console.error('[DEBUG] Error status:', (error as any).response?.status);
      setShortFeedback('Error getting short feedback. Please try again.');
    } finally {
      setIsLoadingMessageFeedback(prev => ({ ...prev, [messageIndex]: false }));
      console.log('[DEBUG] Finished requestShortFeedbackForMessage');
    }
  };

  const parseBreakdownResponse = (breakdownText: string) => {
    console.log('[DEBUG] Parsing breakdown response:', breakdownText);
    
    // Split by double newlines to separate sections
    const sections = breakdownText.split('\n\n').filter(section => section.trim());
    console.log('[DEBUG] Split sections:', sections);
    
    // Parse each sentence section
    const sentences: Array<{ sentence: string; overview: string; details: string }> = [];
    let currentSentence: string | null = null;
    let currentOverview = '';
    let currentDetails: string[] = [];
    
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const trimmedSection = section.trim();
      
      // Check if this section contains a sentence (the first line is usually the sentence)
      // The backend doesn't use asterisks, so we need to identify sentences differently
      const lines = trimmedSection.split('\n');
      const firstLine = lines[0]?.trim();
      
      // If this looks like a sentence (contains the target language text), treat it as a new sentence
      if (firstLine && firstLine.length > 0 && !firstLine.startsWith('•') && 
          !firstLine.includes('Literal translation') && 
          !firstLine.includes('Sentence structure pattern')) {
        
        // If we have a previous sentence, save it
        if (currentSentence) {
          sentences.push({
            sentence: currentSentence,
            overview: currentOverview,
            details: currentDetails.join('\n\n').trim()
          });
        }
        
        // Start new sentence - the first line is the sentence, rest is overview/details
        currentSentence = firstLine;
        currentOverview = lines.slice(1).join('\n').trim();
        currentDetails = [];
      } else {
        // This is a details section for the current sentence
        if (currentSentence && (trimmedSection.startsWith('•') || 
            trimmedSection.includes('Literal translation') || 
            trimmedSection.includes('Sentence structure pattern'))) {
          currentDetails.push(trimmedSection);
        }
      }
    }
    
    // Add the last sentence
    if (currentSentence) {
      sentences.push({
        sentence: currentSentence,
        overview: currentOverview,
        details: currentDetails.join('\n\n').trim()
      });
    }
    
    console.log('[DEBUG] Parsed sentences:', sentences);
    
    return sentences;
  };

  const requestDetailedBreakdownForMessage = async (messageIndex: number) => {
    const message = chatHistory[messageIndex];
    if (!message || (message as any).sender !== 'AI') return;

    console.log('[DEBUG] Starting requestDetailedBreakdownForMessage for messageIndex:', messageIndex);
    console.log('[DEBUG] Message:', message);
    console.log('[DEBUG] User preferences:', userPreferences);
    console.log('[DEBUG] Language:', language);

    setIsLoadingMessageFeedback(prev => ({ ...prev, [messageIndex]: true }));

    try {
      const token = localStorage.getItem('jwt');
      const requestData = {
        llm_response: message.text,
        user_input: "", // AI message doesn't have user input
        context: "",
        language: language,
        user_level: userPreferences.userLevel,
        user_topics: userPreferences.topics,
        user_goals: userPreferences.user_goals,
        formality: userPreferences.formality,
        feedback_language: userPreferences.feedbackLanguage
      };

      console.log('[DEBUG] Request data for detailed breakdown:', requestData);
      console.log('[DEBUG] Making request to /api/detailed_breakdown');

      // Call Gemini client's get_detailed_breakdown function through Python API
      const response = await axios.post(
        '/api/detailed_breakdown',
        requestData,
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );

      console.log('[DEBUG] Detailed breakdown response received:', response);
      console.log('[DEBUG] Response data:', response.data);
      console.log('[DEBUG] Response status:', response.status);
      console.log('[DEBUG] Response data keys:', Object.keys(response.data));
      console.log('[DEBUG] Response data type:', typeof response.data);

      const detailedBreakdown = response.data.breakdown || response.data.feedback;
      console.log('[DEBUG] Extracted detailed breakdown:', detailedBreakdown);
      console.log('[DEBUG] Detailed breakdown type:', typeof detailedBreakdown);
      console.log('[DEBUG] Detailed breakdown length:', detailedBreakdown?.length);
      
      if (!detailedBreakdown) {
        console.error('[DEBUG] No detailed breakdown received from API');
        setShortFeedback('Error: No detailed breakdown received from API');
        return;
      }
      
      // Parse the breakdown response
      console.log('[DEBUG] Raw LLM response:', detailedBreakdown);
      const parsed = parseBreakdownResponse(detailedBreakdown);
      console.log('[DEBUG] Parsed breakdown structure:', parsed);
      console.log('[DEBUG] Parsed breakdown length:', parsed.length);
      
      if (parsed.length === 0) {
        console.error('[DEBUG] Failed to parse breakdown response');
        setShortFeedback('Error: Failed to parse breakdown response');
        return;
      }
      
      // Show initial part (first sentence + overview) in left panel
      const initialDisplay = parsed.length > 0 && parsed[0].sentence 
        ? `${parsed[0].sentence}\n\n${parsed[0].overview}` 
        : parsed.length > 0 ? parsed[0].overview : '';
      console.log('[DEBUG] Setting initial display:', initialDisplay);
      
      // Update all states in the correct order
      setShortFeedback(initialDisplay);
      setParsedBreakdown(parsed);
      setShowDetailedBreakdown({}); // Start collapsed
      
      // Store the parsed breakdown in shortFeedbacks state for consistency
      console.log('[DEBUG] About to update shortFeedbacks state');
      setShortFeedbacks(prev => {
        const newState = { ...prev, [messageIndex]: initialDisplay };
        console.log('[DEBUG] New shortFeedbacks state:', newState);
        return newState;
      });
      console.log('[DEBUG] Updated shortFeedbacks state for messageIndex:', messageIndex);
      
      // Also store in message for consistency
      setChatHistory(prev => 
        prev.map((msg, idx) => 
          idx === messageIndex 
            ? { ...msg, detailedFeedback: detailedBreakdown }
            : msg
        )
      );
      console.log('[DEBUG] Updated chatHistory with detailed feedback');
    } catch (error: unknown) {
      console.error('[DEBUG] Error getting detailed breakdown:', error);
      console.error('[DEBUG] Error response:', (error as any).response?.data);
      console.error('[DEBUG] Error status:', (error as any).response?.status);
      setShortFeedback('Error getting detailed breakdown. Please try again.');
    } finally {
      setIsLoadingMessageFeedback(prev => ({ ...prev, [messageIndex]: false }));
      console.log('[DEBUG] Finished requestDetailedBreakdownForMessage');
    }
  };

  const toggleShortFeedback = (messageIndex: number) => {
    const message = chatHistory[messageIndex];
    
    console.log('[DEBUG] toggleShortFeedback called for messageIndex:', messageIndex);
    console.log('[DEBUG] Message:', message);
    console.log('[DEBUG] Existing shortFeedbacks:', shortFeedbacks);
    console.log('[DEBUG] shortFeedbacks[messageIndex]:', shortFeedbacks[messageIndex]);
    
    // Set explain button as pressed
    setExplainButtonPressed(true);
    
    if (message && shortFeedbacks[messageIndex]) {
      // Show existing short feedback in left panel
      console.log('[DEBUG] Showing existing short feedback:', shortFeedbacks[messageIndex]);
      setShortFeedback(shortFeedbacks[messageIndex]);
      
      // If we have detailed feedback stored, parse it to show the collapsible details
      if (message.detailedFeedback) {
        const parsed = parseBreakdownResponse(message.detailedFeedback);
        setParsedBreakdown(parsed);
        setShowDetailedBreakdown({}); // Start collapsed
      }
    } else {
      // Generate new short feedback
      console.log('[DEBUG] Generating new short feedback');
      requestShortFeedbackForMessage(messageIndex);
    }
  };

  // Panel resize handlers
  const handleLeftResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    setResizingPanel('left');
  };



  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing || !resizingPanel) return;
    
    const containerWidth = window.innerWidth;
          const minPanelRatio = 0.2; // Minimum 20% of screen width
      const maxPanelRatio = 0.3; // Maximum 30% of screen width
          const minCenterRatio = 0.4; // Middle panel should never be smaller than 40%
    
    const visiblePanels = [showShortFeedbackPanel, true].filter(Boolean).length;
    
    if (visiblePanels === 2) {
      // Left and middle panels visible - handle resizing between them
      if (resizingPanel === 'left') {
        // Resizing left panel (which affects center panel)
        const newLeftRatio = Math.max(minPanelRatio, Math.min(1 - minCenterRatio, e.clientX / containerWidth));
        setLeftPanelWidth(newLeftRatio);
      }
    } else {
      // Only middle panel visible - no resizing needed
      return;
    }
  };

  const handleMouseUp = () => {
    setIsResizing(false);
    setResizingPanel(null);
  };

  // Persona-related functions
  const handleEndChat = async () => {
    console.log('handleEndChat called, isNewPersona:', isNewPersona);
    
    // Check if there are any session messages before proceeding
    const sessionMessages = getSessionMessages();
    const userSessionMessages = sessionMessages.filter(msg => msg.sender === 'User');
    
    
    
    // If no user messages in session, just navigate to dashboard without evaluation
    if (userSessionMessages.length === 0) {
      console.log('No user messages in session, navigating to dashboard without evaluation');
      router.push('/dashboard');
      return;
    }
    
    // Only show persona modal if this is a new persona (not using an existing one)
    if (isNewPersona) {
      console.log('Showing persona modal');
      setShowPersonaModal(true);
    } else {
      console.log('Skipping persona modal, generating summary directly');
      // Generate conversation summary (progress modal will handle navigation if needed)
      try {
        if (chatHistory.length > 0) {
          await generateConversationSummary();
        } else {
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Error generating conversation summary:', error);
        router.push('/dashboard');
      }
    }
  };



  const savePersona = async (personaName: string) => {
    setIsSavingPersona(true);
    try {
      const personaData = {
        name: personaName,
        description: conversationDescription || '',
        topics: userPreferences?.topics || [],
        formality: userPreferences?.formality || 'neutral',
        language: language,
        conversationId: conversationId,
        userId: user?.id
      };

      // Save persona to database
      const response = await axios.post('/api/personas', personaData, {
        headers: getAuthHeaders()
      });

      if (response.status === 201) {
        // Update the conversation to mark it as using a persona
        if (conversationId) {
          try {
            await axios.patch(`/api/conversations/${conversationId}`, {
              usesPersona: true,
              personaId: response.data.persona.id
            }, {
              headers: getAuthHeaders()
            });
          } catch (error) {
            console.error('Error updating conversation with persona info:', error);
          }
        }
        
        // Close modal
        setShowPersonaModal(false);
        
        // Generate conversation summary after saving persona
        try {
          // Check if there are any session messages before proceeding
          const sessionMessages = getSessionMessages();
          const userSessionMessages = sessionMessages.filter(msg => msg.sender === 'User');
          
          console.log('Session messages in savePersona:', sessionMessages.length);
          console.log('User session messages in savePersona:', userSessionMessages.length);
          
          // If no user messages in session, just navigate to dashboard without evaluation
          if (userSessionMessages.length === 0) {
            console.log('No user messages in session, navigating to dashboard without evaluation');
            router.push('/dashboard');
            return;
          }
          
          if (chatHistory.length > 0) {
            await generateConversationSummary();
          } else {
            router.push('/dashboard');
          }
        } catch (error) {
          console.error('Error generating conversation summary:', error);
          // If summary generation fails, still navigate to dashboard
          router.push('/dashboard');
        }
      } else {
        throw new Error('Failed to save persona');
      }
    } catch (error) {
      console.error('Error saving persona:', error);
      alert('Error saving persona. Please try again.');
    } finally {
      setIsSavingPersona(false);
    }
  };

  const cancelPersona = async () => {
    setShowPersonaModal(false);
    
    // Generate conversation summary after canceling persona
    try {
      // Check if there are any session messages before proceeding
      const sessionMessages = getSessionMessages();
      const userSessionMessages = sessionMessages.filter(msg => msg.sender === 'User');
      
      console.log('Session messages in cancelPersona:', sessionMessages.length);
      console.log('User session messages in cancelPersona:', userSessionMessages.length);
      
      // If no user messages in session, just navigate to dashboard without evaluation
      if (userSessionMessages.length === 0) {
        console.log('No user messages in session, navigating to dashboard without evaluation');
        router.push('/dashboard');
        return;
      }
      
      if (chatHistory.length > 0) {
        await generateConversationSummary();
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error generating conversation summary:', error);
      // If summary generation fails, still navigate to dashboard
      router.push('/dashboard');
    }
  };

  // Add/remove event listeners
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, resizingPanel]);

  useEffect(() => {
    console.log('[DEBUG] Chat history changed:', chatHistory);
  }, [chatHistory]);

  useEffect(() => {
    console.log('[DEBUG] shortFeedback state changed:', shortFeedback);
  }, [shortFeedback]);

  useEffect(() => {
    console.log('[DEBUG] shortFeedbacks state changed:', shortFeedbacks);
  }, [shortFeedbacks]);



  useEffect(() => {
    autoSpeakRef.current = autoSpeak;
    // When Autospeak is turned ON, start recording if not already recording
    if (autoSpeak && !isRecording && !isProcessing) {
      startRecording();
    }
    // When Autospeak is turned OFF, stop any ongoing recording
    if (!autoSpeak) {
      stopRecording();
      // Stop any playing TTS audio
      if (ttsAudioRef.current) {
        ttsAudioRef.current.pause();
        ttsAudioRef.current.currentTime = 0;
        ttsAudioRef.current = null;
      }
    }
    // Only run this effect when autoSpeak changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSpeak]);

  // Add this useEffect to load chat history from backend if conversationIdParam is present and chatHistory is empty
  useEffect(() => {
    if (user && urlConversationId && chatHistory.length === 0) {
      loadExistingConversation(urlConversationId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, urlConversationId]);

  // Handle persona data when using a persona
  useEffect(() => {
    if (usePersona && user) {
      const personaData = localStorage.getItem('selectedPersona');
      if (personaData) {
        try {
          const persona = JSON.parse(personaData);
          
          // Auto-fill formality and topics from persona
          if (persona.formality || persona.topics) {
            // Update user preferences with persona data (romanization will be set in startConversationWithPersona)
            setUserPreferences(prev => ({
              ...prev,
              formality: persona.formality || prev.formality,
              topics: persona.topics || prev.topics
            }));
          }
          
          // Auto-start conversation with persona data
          const startConversationWithPersona = async () => {
            try {
              // Fetch user's dashboard preferences for this language
              const dashboardPrefs = await fetchUserDashboardPreferences(language);
              const romanizationDisplay = dashboardPrefs?.romanization_display || 'both';
              
              // Update user preferences with romanization display
              setUserPreferences(prev => ({
                ...prev,
                romanizationDisplay
              }));
              
              // Create a new conversation with persona data
              const topics = persona.topics || [];
              const formality = persona.formality || 'neutral';
              
              // Set the persona flag - this is an existing persona, not a new one
              setIsUsingPersona(true);
              setIsNewPersona(false);
              
              // Create conversation with persona information
              const token = localStorage.getItem('jwt');
              const response = await axios.post('/api/conversations', {
                language: language,
                title: topics.length === 1 ? `${topics[0]} Discussion` : 'Multi-topic Discussion',
                topics: topics,
                formality: formality,
                description: persona.description,
                usesPersona: true,
                personaId: null, // This is a new persona, not a saved one
                learningGoals: [] // Personas don't have specific learning goals
              }, {
                headers: { Authorization: `Bearer ${token}` }
              });
              
              const { conversation, aiMessage } = response.data;
              if (conversation && conversation.id) {
                // Start the conversation immediately
                await handleModalConversationStart(conversation.id, topics, aiMessage, formality, [], persona.description, true);
              }
              
              // Clear the persona data from localStorage
              localStorage.removeItem('selectedPersona');
            } catch (error) {
              console.error('Error starting conversation with persona:', error);
            }
          };
          
          startConversationWithPersona();
        } catch (error) {
          console.error('Error parsing persona data:', error);
          localStorage.removeItem('selectedPersona');
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usePersona, user]);

  const formatMessageForDisplay = (message: ChatMessage, romanizationDisplay: string | undefined): { mainText: string; romanizedText?: string } => {
  // For non-script languages or undefined preference, just show the text
  if (!romanizationDisplay || romanizationDisplay === 'both') {
    return { mainText: message.text, romanizedText: message.romanizedText };
  } else if (romanizationDisplay === 'script_only') {
    return { mainText: message.text };
  } else if (romanizationDisplay === 'romanized_only') {
    return { mainText: message.romanizedText || message.text };
  } else {
    // Default to showing both
    return { mainText: message.text, romanizedText: message.romanizedText };
  }
};

  // Helper function to get the appropriate text for TTS based on romanization display preference
  const getTTSText = (message: ChatMessage, romanizationDisplay: string | undefined, language: string): string => {
    // For non-script languages, always use the main text
    if (!isScriptLanguage(language)) {
      return message.text;
    }
    
    // For script languages, choose based on romanization display preference
    if (romanizationDisplay === 'romanized_only') {
      return message.romanizedText || message.text;
    } else {
      // For 'script_only' or 'both', use the script text (main text)
      // But first check if the main text already contains both script and romanized text
      const formatted = formatScriptLanguageText(message.text, language);
      return formatted.mainText;
    }
  };

  // Helper function to render formatted text with color-coded underlines and clickable popups
  const renderFormattedText = (text: string, messageIndex: number) => {
    console.log('[DEBUG] renderFormattedText called with:', text);
    if (!text) return text;
    
    // Test if the text contains any formatting markers
    const hasFormatting = text.includes('__') || text.includes('~~') || text.includes('==') || text.includes('<<');
    console.log('[DEBUG] Text has formatting markers:', hasFormatting);
    if (!hasFormatting) {
      console.log('[DEBUG] No formatting markers found, returning original text');
      return text;
    }
    
    // Get explanations for this message
    const explanations = feedbackExplanations[messageIndex] || {};
    
    // Simple approach: replace each formatting pattern with styled spans
    let result = text;
    let elementIndex = 0;
    
    // Replace grammar mistakes (red) - __word__
    result = result.replace(/__([^_]+)__/g, (match, word) => {
      const wordKey = match;
      const hasExplanation = explanations[wordKey];
      const cursorStyle = hasExplanation ? 'cursor: pointer;' : '';
      return `<span class="grammar-${elementIndex++}" data-word-key="${wordKey}" data-message-index="${messageIndex}" style="text-decoration: underline; text-decoration-color: ${isDarkMode ? '#dc2626' : '#dc2626'}; text-decoration-thickness: 2px; color: ${isDarkMode ? '#dc2626' : '#dc2626'}; font-weight: 600; ${cursorStyle}" onclick="window.handleWordClick('${wordKey}', ${messageIndex}, event)">${word}</span>`;
    });
    
    // Replace unnatural phrasing (yellow) - ~~word~~
    result = result.replace(/~~([^~]+)~~/g, (match, word) => {
      const wordKey = match;
      const hasExplanation = explanations[wordKey];
      const cursorStyle = hasExplanation ? 'cursor: pointer;' : '';
      return `<span class="unnatural-${elementIndex++}" data-word-key="${wordKey}" data-message-index="${messageIndex}" style="text-decoration: underline; text-decoration-color: ${isDarkMode ? '#d97706' : '#d97706'}; text-decoration-thickness: 2px; color: ${isDarkMode ? '#d97706' : '#d97706'}; font-weight: 600; ${cursorStyle}" onclick="window.handleWordClick('${wordKey}', ${messageIndex}, event)">${word}</span>`;
    });
    
    // Replace English words (blue) - ==word==
    result = result.replace(/==([^=]+)==/g, (match, word) => {
      const wordKey = match;
      const hasExplanation = explanations[wordKey];
      const cursorStyle = hasExplanation ? 'cursor: pointer;' : '';
      return `<span class="english-${elementIndex++}" data-word-key="${wordKey}" data-message-index="${messageIndex}" style="text-decoration: underline; text-decoration-color: ${isDarkMode ? '#2563eb' : '#2563eb'}; text-decoration-thickness: 2px; color: ${isDarkMode ? '#2563eb' : '#2563eb'}; font-weight: 600; ${cursorStyle}" onclick="window.handleWordClick('${wordKey}', ${messageIndex}, event)">${word}</span>`;
    });
    
    // Replace correct alternatives (green) - <<word>>
    result = result.replace(/<<([^>]+)>>/g, (match, word) => {
      const wordKey = match;
      const hasExplanation = explanations[wordKey];
      const cursorStyle = hasExplanation ? 'cursor: pointer;' : '';
      return `<span class="correct-${elementIndex++}" data-word-key="${wordKey}" data-message-index="${messageIndex}" style="background-color: ${isDarkMode ? '#10b981' : '#10b981'}; color: #ffffff; padding: 2px 4px; border-radius: 4px; font-weight: 700; font-size: 0.95em; box-shadow: 0 1px 2px rgba(0,0,0,0.1); ${cursorStyle}" onclick="window.handleWordClick('${wordKey}', ${messageIndex}, event)">${word}</span>`;
    });
    
    // Convert HTML string to React elements with proper text color
    return <span 
      style={{ color: 'inherit' }}
      dangerouslySetInnerHTML={{ __html: result }} 
    />;
  };

  // Helper function to extract corrected version from feedback
  const extractCorrectedVersion = (feedback: string): { mainText: string; romanizedText?: string } | null => {
    if (!feedback) return null;
    
    // Find the corrected version section
    const correctedMatch = feedback.match(/\*\*Corrected Version\*\*\s*\n([\s\S]*?)(?=\n\n|$)/);
    if (!correctedMatch) return null;
    
    const correctedText = correctedMatch[1].trim();
    const lines = correctedText.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) return null;
    
    // For script languages, we expect both script and romanized lines
    if (isScriptLanguage(language)) {
      if (lines.length >= 2) {
        const scriptLine = lines[0].trim();
        const romanizedLine = lines[1].trim();
        return { mainText: scriptLine, romanizedText: romanizedLine };
      } else {
        return { mainText: lines[0].trim() };
      }
    } else {
      return { mainText: lines[0].trim() };
    }
  };

  // Helper function to parse feedback and extract explanations for each highlighted word
  const parseFeedbackExplanations = (feedback: string): Record<string, string> => {
    const explanations: Record<string, string> = {};
    
    if (!feedback) return explanations;
    
    // Find the explanation section
    const explanationMatch = feedback.match(/\*\*Explanation\*\*\s*\n([\s\S]*?)(?=\*\*Corrected Version\*\*|$)/);
    if (!explanationMatch) return explanations;
    
    const explanationText = explanationMatch[1];
    
    // Parse each explanation line
    const lines = explanationText.split('\n').filter(line => line.trim());
    
    lines.forEach(line => {
      // Look for patterns like: ==word== / ==word== - explanation
      const match = line.match(/(__[^_]+__|~~[^~]+~~|==[^=]+==|<<[^>]+>>)\s*\/?\s*(__[^_]+__|~~[^~]+~~|==[^=]+==|<<[^>]+>>)?\s*-\s*(.+)/);
      if (match) {
        const word1 = match[1];
        const word2 = match[2];
        const explanation = match[3].trim();
        
        // Create keys for both words if they exist
        if (word1) {
          explanations[word1] = explanation;
        }
        if (word2) {
          explanations[word2] = explanation;
        }
      }
    });
    
    return explanations;
  };

  // Helper function to extract formatted sentence from detailed feedback
  const extractFormattedSentence = (feedback: string, romanizationDisplay: string): { mainText: string; romanizedText?: string } | null => {
    if (!feedback) return null;
    
    const lines = feedback.split('\n');
    let sentenceSection = '';
    let inSentenceSection = false;
    
    for (const line of lines) {
      if (line.includes('**Your Sentence**')) {
        inSentenceSection = true;
        continue;
      }
      if (inSentenceSection && line.startsWith('**')) {
        break; // End of sentence section
      }
      if (inSentenceSection && line.trim()) {
        sentenceSection += line + '\n';
      }
    }
    
    if (!sentenceSection.trim()) return null;
    
    const sentenceLines = sentenceSection.trim().split('\n').filter(line => line.trim());
    
    if (sentenceLines.length === 0) return null;
    
    // For script languages, we expect both script and romanized lines
    if (isScriptLanguage(language)) {
      if (sentenceLines.length >= 2) {
        const scriptLine = sentenceLines[0].trim();
        const romanizedLine = sentenceLines[1].trim();
        
        // Apply romanization display preference
        if (romanizationDisplay === 'script_only') {
          return { mainText: scriptLine };
        } else if (romanizationDisplay === 'romanized_only') {
          return { mainText: romanizedLine };
        } else {
          // 'both' or default
          return { mainText: scriptLine, romanizedText: romanizedLine };
        }
      } else {
        // Only one line available
        return { mainText: sentenceLines[0].trim() };
      }
    } else {
      // Non-script language
      return { mainText: sentenceLines[0].trim() };
    }
  };

  // Simple parsing function for quick translation
  const parseQuickTranslation = (translationText: string) => {
    const result = {
      fullTranslation: '',
      wordTranslations: {} as Record<string, string>,
      romanized: '',
      error: false,
      generatedWords: [] as string[], // Store the romanized words in order
      generatedScriptWords: [] as string[] // Store the script words in order
    };
    
    if (!translationText) return result;
    
    console.log('=== PARSING QUICK TRANSLATION ===');
    console.log('Raw text:', translationText);
    console.log('Text length:', translationText.length);
    
    try {
      const lines = translationText.split('\n');
      console.log('Total lines:', lines.length);
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        console.log('Processing line:', `"${trimmedLine}"`);
        
        if (trimmedLine.includes('**Full Translation:**')) {
          console.log('Found Full Translation section');
          continue;
        } else if (trimmedLine.includes('**Word-by-Word Breakdown:**')) {
          console.log('Found Word-by-Word Breakdown section');
          continue;
        } else if (trimmedLine.includes('**Romanized Version:**')) {
          console.log('Found Romanized Version section');
          continue;
        }
        
        // Simple parsing: look for "script / romanized -- translation" format
        if (trimmedLine.includes(' / ') && trimmedLine.includes(' -- ')) {
          console.log('Found script/romanized format:', trimmedLine);
          const parts = trimmedLine.split(' -- ');
          if (parts.length === 2) {
            const leftSide = parts[0].trim();
            const translation = parts[1].trim();
            
            // Split left side on " / " to get script and romanized
            const scriptRomanized = leftSide.split(' / ');
            if (scriptRomanized.length === 2) {
              const script = scriptRomanized[0].trim();
              const romanized = scriptRomanized[1].trim();
              
              // Store both script and romanized as keys (with punctuation included)
              result.wordTranslations[script] = translation;
              result.wordTranslations[romanized] = translation;
              
              // Add to generated words lists (with punctuation included)
              result.generatedScriptWords.push(script);
              result.generatedWords.push(romanized);
              
              console.log(`✅ Parsed: script="${script}", romanized="${romanized}", translation="${translation}"`);
            }
          }
        }
        // Also handle simple "word -- translation" format
        else if (trimmedLine.includes(' -- ') && !trimmedLine.includes(' / ')) {
          console.log('Found simple word format:', trimmedLine);
          const parts = trimmedLine.split(' -- ');
          if (parts.length === 2) {
            const word = parts[0].trim();
            const translation = parts[1].trim();
            
            // Store the word as-is (with punctuation included)
            result.wordTranslations[word] = translation;
            result.generatedWords.push(word);
            result.generatedScriptWords.push(word); // For non-script languages, same as romanized
            
            console.log(`✅ Parsed: word="${word}", translation="${translation}"`);
          }
        }
        // Handle full translation line
        else if (trimmedLine && !trimmedLine.startsWith('**') && !result.fullTranslation) {
          console.log('Found full translation:', trimmedLine);
          result.fullTranslation = trimmedLine;
        }
      }
      
      console.log('=== FINAL PARSED RESULT ===');
      console.log('Full translation:', result.fullTranslation);
      console.log('Word translations count:', Object.keys(result.wordTranslations).length);
      console.log('All word translations:', result.wordTranslations);
      console.log('Generated script words in order:', result.generatedScriptWords);
      console.log('Generated romanized words in order:', result.generatedWords);
      
    } catch (error) {
      console.error('Error parsing quick translation:', error);
      result.error = true;
    }
    
    return result;
  };

  // Helper function to render feedback text with formatting and headers
  const renderFeedbackText = (text: string) => {
    if (!text) return null;
    
    // Helper function to process a single line with formatting
    const processLineWithFormatting = (line: string, lineIndex: number) => {
      let result = line;
      let elementIndex = 0;
      
      // Replace grammar mistakes (red) - __word__
      result = result.replace(/__([^_]+)__/g, (match, word) => {
        return `<span class="grammar-${lineIndex}-${elementIndex++}" style="text-decoration: underline; text-decoration-color: ${isDarkMode ? '#ef4444' : '#dc2626'}; text-decoration-thickness: 2px; color: ${isDarkMode ? '#ef4444' : '#dc2626'}; font-weight: 600;">${word}</span>`;
      });
      
      // Replace unnatural phrasing (yellow) - ~~word~~
      result = result.replace(/~~([^~]+)~~/g, (match, word) => {
        return `<span class="unnatural-${lineIndex}-${elementIndex++}" style="text-decoration: underline; text-decoration-color: ${isDarkMode ? '#fbbf24' : '#f59e0b'}; text-decoration-thickness: 2px; color: ${isDarkMode ? '#fbbf24' : '#f59e0b'}; font-weight: 600;">${word}</span>`;
      });
      
      // Replace English words (blue) - ==word==
      result = result.replace(/==([^=]+)==/g, (match, word) => {
        return `<span class="english-${lineIndex}-${elementIndex++}" style="text-decoration: underline; text-decoration-color: ${isDarkMode ? '#60a5fa' : '#2563eb'}; text-decoration-thickness: 2px; color: ${isDarkMode ? '#60a5fa' : '#2563eb'}; font-weight: 600;">${word}</span>`;
      });
      
      // Replace correct alternatives (green) - <<word>>
      result = result.replace(/<<([^>]+)>>/g, (match, word) => {
        return `<span class="correct-${lineIndex}-${elementIndex++}" style="background-color: ${isDarkMode ? '#10b981' : '#10b981'}; color: #ffffff; padding: 2px 4px; border-radius: 4px; font-weight: 700; font-size: 0.95em; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">${word}</span>`;
      });
      
             return <span 
         style={{ color: 'inherit' }}
         dangerouslySetInnerHTML={{ __html: result }} 
       />;
    };

    // Split the text into lines to handle different sections
    const lines = text.split('\n');
    const renderedLines = lines.map((line, index) => {
      // Handle bold headers (e.g., **Your Sentence**, **Corrected Version**)
      if (line.trim().startsWith('**') && line.trim().endsWith('**')) {
        const headerText = line.trim().slice(2, -2);
        const isMainHeader = headerText === 'Your Sentence' || headerText === 'Corrected Version';
        
        return (
          <div key={index} style={{ 
            fontWeight: 700, 
            fontSize: isMainHeader ? '1.1rem' : '1rem', 
            marginTop: index > 0 ? '1.5rem' : '0',
            marginBottom: '0.75rem',
            color: isDarkMode ? '#e8b3c3' : '#c38d94',
            borderBottom: isMainHeader ? `2px solid ${isDarkMode ? '#e8b3c3' : '#c38d94'}` : 'none',
            paddingBottom: isMainHeader ? '0.5rem' : '0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            {isMainHeader && (
              <span style={{ fontSize: '1.2rem' }}>
                {headerText === 'Your Sentence' ? '💬' : '✅'}
              </span>
            )}
            {headerText}
          </div>
        );
      }
      
      // Fallback for any line that contains ** and these specific headers
      if (line.includes('**') && (line.includes('Your Sentence') || line.includes('Corrected Version'))) {
        const headerText = line.replace(/\*\*/g, '').trim();
        const isMainHeader = headerText === 'Your Sentence' || headerText === 'Corrected Version';
        
        return (
          <div key={index} style={{ 
            fontWeight: 700, 
            fontSize: isMainHeader ? '1.1rem' : '1rem', 
            marginTop: index > 0 ? '1.5rem' : '0',
            marginBottom: '0.75rem',
            color: isDarkMode ? '#e8b3c3' : '#c38d94',
            borderBottom: isMainHeader ? `2px solid ${isDarkMode ? '#e8b3c3' : '#c38d94'}` : 'none',
            paddingBottom: isMainHeader ? '0.5rem' : '0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            {isMainHeader && (
              <span style={{ fontSize: '1.2rem' }}>
                {headerText === 'Your Sentence' ? '💬' : '✅'}
              </span>
            )}
            {headerText}
          </div>
        );
      }
      
      // Process line with formatting
      const processedLine = processLineWithFormatting(line, index);
      
      // Return the processed line
      return (
        <div key={index} style={{ marginBottom: '0.5rem' }}>
          {processedLine}
        </div>
      );
    });
    
    return renderedLines;
  };

  // Quick translation function
  const quickTranslation = async (messageIndex: number, text: string) => {
    console.log('[DEBUG] quickTranslation() called with messageIndex:', messageIndex, 'text:', text);
    
    if (isLoadingMessageFeedback[messageIndex]) {
      console.log('[DEBUG] Already loading, returning early');
      return;
    }
    
    setIsLoadingMessageFeedback(prev => ({ ...prev, [messageIndex]: true }));
    
    // Clear all previous translations when starting a new one
    setQuickTranslations({});
    
    try {
      const token = localStorage.getItem('jwt');
      const requestData = {
        ai_message: text,
        language: language,
        user_level: userPreferences.userLevel,
        user_topics: userPreferences.topics,
        formality: userPreferences.formality,
        feedback_language: userPreferences.feedbackLanguage,
        user_goals: userPreferences.user_goals,
        description: conversationDescription
      };

      console.log('[DEBUG] quickTranslation() calling /api/quick_translation with:', requestData);
      
      const response = await axios.post(
        '/api/quick_translation',
        requestData,
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );
      
      const result = response.data;
      console.log('[DEBUG] quickTranslation() received response:', result);
      
      const translationText = result.translation;
      console.log('[DEBUG] Raw Gemini translation text:', translationText);
      
      const parsedTranslation = parseQuickTranslation(translationText);
      console.log('[DEBUG] Parsed translation:', parsedTranslation);
      
      // Test with sample data if no translation received
      if (!translationText || Object.keys(parsedTranslation.wordTranslations).length === 0) {
        console.log('[DEBUG] No translation received, using test data');
        const testResponse = `**Full Translation:**
Yes, the current serials don't have the same quality as the old ones, right?

**Word-by-Word Breakdown:**
जी / ji -- Sir/Yes (respectful term)
बिल्कुल / bilkul -- Absolutely/Exactly
आजकल / aajkal -- Nowadays/These days
तो / to -- then/so
एक / ek -- one/a/single
ही / hi -- only/same
बात / baat -- point/matter/thing
को / ko -- to/object marker
बहुत / bahut -- very/much/a lot
लंबा / lamba -- long
खींच / kheench -- drag/stretch/prolong
देते / dete -- give/they give (present continuous tense)
हैं / hain -- are/they are (present continuous tense)`;
        
        const testParsedTranslation = parseQuickTranslation(testResponse);
        console.log('[DEBUG] Test parsed translation:', testParsedTranslation);
        setQuickTranslations(prev => ({ ...prev, [messageIndex]: testParsedTranslation }));
      } else {
        setQuickTranslations(prev => ({ ...prev, [messageIndex]: parsedTranslation }));
      }
      
    } catch (error: unknown) {
      console.error('Quick translation error:', error);
      setQuickTranslations(prev => ({ 
        ...prev, 
        [messageIndex]: { 
          fullTranslation: 'Translation failed', 
          wordTranslations: {},
          romanized: '',
          error: true,
          generatedWords: [],
          generatedScriptWords: []
        } 
      }));
    } finally {
      setIsLoadingMessageFeedback(prev => ({ ...prev, [messageIndex]: false }));
    }
  };

  // State for LLM response breakdown in sidebar
  const [llmBreakdown, setLlmBreakdown] = useState<string>('');
  const [showLlmBreakdown, setShowLlmBreakdown] = useState<boolean>(false);
  const [showQuickTranslation, setShowQuickTranslation] = useState<boolean>(true);

  // Function to get detailed breakdown of LLM response
  const explainLLMResponse = async (messageIndex: number, text: string) => {
    console.log('[DEBUG] explainLLMResponse() called with messageIndex:', messageIndex, 'text:', text);
    
    if (isLoadingMessageFeedback[messageIndex]) {
      console.log('[DEBUG] Already loading, returning early');
      return;
    }
    
    setIsLoadingMessageFeedback(prev => ({ ...prev, [messageIndex]: true }));
    
    try {
      const token = localStorage.getItem('jwt');
      const requestData = {
        llm_response: text,
        user_input: "",
        context: "",
        language: language,
        user_level: userPreferences.userLevel,
        user_topics: userPreferences.topics,
        formality: userPreferences.formality,
        feedback_language: userPreferences.feedbackLanguage,
        user_goals: userPreferences.user_goals,
        description: conversationDescription
      };

      console.log('[DEBUG] explainLLMResponse() calling /api/detailed_breakdown with:', requestData);
      
      const response = await axios.post(
        '/api/detailed_breakdown',
        requestData,
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );
      
      const result = response.data;
      console.log('[DEBUG] explainLLMResponse() received response:', result);
      
      const breakdownText = result.breakdown;
      console.log('[DEBUG] Raw breakdown text:', breakdownText);
      
      if (!breakdownText) {
        console.log('[DEBUG] No breakdown received');
        return;
      }
      
      // Set the breakdown in sidebar state
      setLlmBreakdown(breakdownText);
      setShowLlmBreakdown(true);
      setShowQuickTranslation(false); // Collapse quick translation when LLM breakdown is shown
      
    } catch (error: unknown) {
      console.error('Explain LLM response error:', error);
    } finally {
      setIsLoadingMessageFeedback(prev => ({ ...prev, [messageIndex]: false }));
    }
  };

  // Render clickable message with word translations
  const renderClickableMessage = (message: ChatMessage, messageIndex: number, translation: any) => {
    if (!translation || !translation.wordTranslations) {
      return message.text;
    }
    
    console.log('renderClickableMessage:', {
      messageText: message.text,
      generatedWords: translation.generatedWords,
      generatedScriptWords: translation.generatedScriptWords,
      wordTranslations: translation.wordTranslations,
      availableKeys: Object.keys(translation.wordTranslations)
    });
    
    // Use the generated words from the AI response to guarantee keys exist
    if (translation.generatedWords && translation.generatedWords.length > 0) {
      // Check if this is a script language (has both script and romanized words)
      const isScriptLanguage = translation.generatedScriptWords && 
                              translation.generatedScriptWords.length > 0 && 
                              translation.generatedScriptWords.some(word => /[\u0900-\u097F\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F\u0D80-\u0DFF\u0E00-\u0E7F\u0E80-\u0EFF\u0F00-\u0FFF\u1000-\u109F\u1100-\u11FF\u1200-\u137F\u1380-\u139F\u13A0-\u13FF\u1400-\u167F\u1680-\u169F\u16A0-\u16FF\u1700-\u171F\u1720-\u173F\u1740-\u175F\u1760-\u177F\u1780-\u17FF\u1800-\u18AF\u1900-\u194F\u1950-\u197F\u1980-\u19DF\u19E0-\u19FF\u1A00-\u1A1F\u1A20-\u1AAF\u1AB0-\u1AFF\u1B00-\u1B7F\u1B80-\u1BBF\u1BC0-\u1BFF\u1C00-\u1C4F\u1C50-\u1C7F\u1C80-\u1CDF\u1CD0-\u1CFF\u1D00-\u1D7F\u1D80-\u1DBF\u1DC0-\u1DFF\u1E00-\u1EFF\u1F00-\u1FFF]/.test(word));
      
      if (isScriptLanguage && translation.generatedScriptWords.length > 0) {
        return (
          <div>
            {/* Script words */}
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>Script:</strong>
              <div style={{ 
                                  marginTop: '0.25rem',
                  fontSize: '1rem',
                  lineHeight: '1.8',
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.25rem'
              }}>
                {renderClickableWordsFromGenerated(translation.generatedScriptWords, translation, messageIndex)}
              </div>
            </div>
            {/* Romanized words */}
            <div>
              <strong>Romanized:</strong>
              <div style={{ 
                                  marginTop: '0.25rem',
                  fontSize: '0.9rem',
                  lineHeight: '1.6',
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                color: isDarkMode ? '#cbd5e1' : '#6c757d',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.25rem'
              }}>
                {renderClickableWordsFromGenerated(translation.generatedWords, translation, messageIndex)}
              </div>
            </div>
          </div>
        );
      } else {
        // Non-script language - just show romanized words
        return (
          <div>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>Words:</strong>
              <div style={{ 
                                  marginTop: '0.25rem',
                  fontSize: '0.9rem',
                  lineHeight: '1.6',
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.25rem'
              }}>
                {renderClickableWordsFromGenerated(translation.generatedWords, translation, messageIndex)}
              </div>
            </div>
          </div>
        );
      }
    } else {
      // Fallback to original message text
      const displayText = formatMessageForDisplay(message, userPreferences.romanizationDisplay);
      const textToRender = displayText.romanizedText || displayText.mainText;
      return renderClickableWords(textToRender, translation, messageIndex);
    }
  };

  // Helper function to render clickable words from generated word list
  const renderClickableWordsFromGenerated = (generatedWords: string[], translation: any, messageIndex: number) => {
    console.log('=== RENDERING FROM GENERATED WORDS ===');
    console.log('Generated words:', generatedWords);
    console.log('Available translations:', Object.keys(translation.wordTranslations));
    
    return generatedWords.map((word, index) => {
      const trimmedWord = word.trim();
      
      // Try exact match first, then try without punctuation
      const hasTranslation = translation.wordTranslations[trimmedWord] || 
                            translation.wordTranslations[trimmedWord.replace(/[.,!?;:'"()\[\]{}]/g, '').trim()];
      
      console.log(`Generated word "${trimmedWord}": hasTranslation=${hasTranslation}`);
      
      if (hasTranslation && trimmedWord) {
        return (
          <span
            key={index}
            data-clickable-word="true"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              console.log('Word clicked:', trimmedWord, 'Translation:', hasTranslation);
              const rect = e.currentTarget.getBoundingClientRect();
              const popupPosition = {
                x: rect.left + rect.width / 2,
                y: rect.top
              };
              console.log('Setting popup with:', { messageIndex, wordKey: trimmedWord, position: popupPosition });
              setActivePopup({
                messageIndex,
                wordKey: trimmedWord,
                position: popupPosition
              });
            }}
            style={{
              cursor: 'pointer',
              textDecoration: 'underline',
              textDecorationColor: '#4a90e2',
              textDecorationThickness: '2px',
              color: '#4a90e2',
              fontWeight: 400,
              transition: 'all 0.2s ease',
              marginRight: '0.25rem',
              whiteSpace: 'nowrap',
              display: 'inline-block'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(74,144,226,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {word}
          </span>
        );
      }
      
      return <span key={index} style={{ marginRight: '0.25rem', whiteSpace: 'nowrap', display: 'inline-block' }}>{word}</span>;
    });
  };

  // Helper function to render clickable words
  const renderClickableWords = (text: string, translation: any, messageIndex: number) => {
    console.log('=== RENDERING CLICKABLE WORDS ===');
    console.log('Text to render:', text);
    console.log('Available translations:', Object.keys(translation.wordTranslations));
    
    const words = text.split(/(\s+)/);
    console.log('Split words:', words);
    
    return words.map((word, index) => {
      const trimmedWord = word.trim();
      
      // Simple matching - try exact match first
      let hasTranslation = translation.wordTranslations[trimmedWord];
      let translationKey = trimmedWord;
      
      console.log(`Checking word "${trimmedWord}": exact match = ${hasTranslation}`);
      
      // If no exact match, try case-insensitive
      if (!hasTranslation) {
        const lowerTrimmedWord = trimmedWord.toLowerCase();
        const availableKeys = Object.keys(translation.wordTranslations);
        const matchingKey = availableKeys.find(key => key.toLowerCase() === lowerTrimmedWord);
        if (matchingKey) {
          hasTranslation = translation.wordTranslations[matchingKey];
          translationKey = matchingKey;
          console.log(`Found case-insensitive match: "${trimmedWord}" → "${matchingKey}"`);
        }
      }
      
      // If still no match, try partial matching
      if (!hasTranslation && trimmedWord) {
        const availableKeys = Object.keys(translation.wordTranslations);
        const partialMatches = availableKeys.filter(key => 
          key.includes(trimmedWord) || trimmedWord.includes(key)
        );
        if (partialMatches.length > 0) {
          console.log(`Partial matches for "${trimmedWord}":`, partialMatches);
        }
      }
      
      console.log(`Final result for "${trimmedWord}": hasTranslation=${hasTranslation}, translationKey="${translationKey}"`);
      
      if (hasTranslation && trimmedWord) {
        return (
          <span
            key={index}
            data-clickable-word="true"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              console.log('Word clicked:', trimmedWord, 'Translation:', hasTranslation);
              const rect = e.currentTarget.getBoundingClientRect();
              const popupPosition = {
                x: rect.left + rect.width / 2,
                y: rect.top
              };
              setActivePopup({
                messageIndex,
                wordKey: translationKey,
                position: popupPosition
              });
            }}
            style={{
              cursor: 'pointer',
              textDecoration: 'underline',
              textDecorationColor: '#4a90e2',
              textDecorationThickness: '2px',
              color: '#4a90e2',
              fontWeight: 400,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(74,144,226,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {word}
          </span>
        );
      }
      
      return word;
    });
  };

  // Debug progress modal state
  console.log('Progress modal state:', { showProgressModal, progressData });
  
  // Monitor progressData changes
  useEffect(() => {
    if (progressData) {
      console.log('[DEBUG] ProgressData changed:', {
        percentages: progressData.percentages,
        percentagesType: typeof progressData.percentages,
        percentagesLength: progressData.percentages?.length,
        subgoalNames: progressData.subgoalNames,
        subgoalIds: progressData.subgoalIds,
        levelUpEvents: progressData.levelUpEvents
      });
    }
  }, [progressData]);
  
  const getSummaryPreview = (synopsis: string) => {
    // Extract the first sentence or first 100 characters as preview
    const firstSentence = synopsis.split('.')[0];
    if (firstSentence.length > 100) {
      return firstSentence.substring(0, 100) + '...';
    }
    return firstSentence + (synopsis.includes('.') ? '.' : '');
  };

  // Helper function to get messages from the current session only
  const getSessionMessages = () => {
    if (!sessionStartTime) {
      return chatHistory; // If no session start time, return all messages
    }
    
    // For continued conversations, only include messages that are NOT from the original conversation
    // (i.e., messages added after clicking "Continue")
    const sessionMessages = chatHistory.filter(message => !message.isFromOriginalConversation);
    
    return sessionMessages;
  };
  
  // Set session start time when conversation is loaded from URL (user clicked "Continue")
  useEffect(() => {
    // Only set session start time if this is a continued conversation (has messages from original conversation)
    const hasOriginalMessages = chatHistory.some(msg => msg.isFromOriginalConversation);
    if (user && urlConversationId && chatHistory.length > 0 && hasOriginalMessages && !sessionStartTime) {
      // This is when user clicked "Continue" - set session start time to track new messages
      const lastMessageTime = new Date(Math.max(...chatHistory.map(msg => msg.timestamp.getTime())));
      const newSessionStartTime = new Date(lastMessageTime.getTime() + 1000); // 1 second after the last message
      setSessionStartTime(newSessionStartTime);
      console.log('[DEBUG] Set session start time for continued conversation:', newSessionStartTime);
      console.log('[DEBUG] Last message time:', lastMessageTime);
      console.log('[DEBUG] Has original messages:', hasOriginalMessages);
    }
  }, [user, urlConversationId, chatHistory, sessionStartTime]);
  
  return (
    <div className="analyze-page" style={{ 
      display: 'flex', 
      flexDirection: 'column',
      height: '100vh', 
      width: '100%',
      background: isDarkMode 
        ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)'
        : 'linear-gradient(135deg, #f9f6f4 0%, #f5f1ec 50%, #e8e0d8 100%)',
      padding: '6rem 0.5rem 2rem 0.5rem',
      gap: '0.5rem',
      transition: 'all 0.15s ease',
      fontFamily: 'Montserrat, Arial, sans-serif',
      position: 'relative',
      overflow: 'hidden',
      boxSizing: 'border-box'
    }}>
      {/* Background decorative elements */}
      <div style={{
        position: 'absolute',
        top: '-25%',
        right: '-10%',
        width: '50%',
        height: '150%',
        background: isDarkMode 
          ? 'radial-gradient(circle, rgba(195,141,148,0.03) 0%, transparent 70%)'
          : 'radial-gradient(circle, rgba(195,141,148,0.05) 0%, transparent 70%)',
        borderRadius: '50%',
        zIndex: 0,
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-15%',
        left: '-5%',
        width: '30%',
        height: '130%',
        background: isDarkMode 
          ? 'radial-gradient(circle, rgba(60,76,115,0.03) 0%, transparent 70%)'
          : 'radial-gradient(circle, rgba(60,76,115,0.05) 0%, transparent 70%)',
        borderRadius: '50%',
        zIndex: 0,
        pointerEvents: 'none'
      }} />
      {/* Panels Container */}
      <div style={{
        display: 'flex',
        flex: 1,
        gap: '0.5rem',
        minHeight: 0
      }}>
      {/* Short Feedback Panel - Left */}
      {showShortFeedbackPanel && (
        <div className="panel-hover" style={{ 
          width: `${getPanelWidths().left * 100}%`, 
          background: isDarkMode 
            ? 'linear-gradient(135deg, var(--card) 0%, rgba(255,255,255,0.02) 100%)' 
            : 'linear-gradient(135deg, #ffffff 0%, rgba(195,141,148,0.02) 100%)', 
          borderRadius: 24,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: isDarkMode 
            ? '0 8px 40px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2)' 
            : '0 8px 40px rgba(60,60,60,0.12), 0 2px 8px rgba(195,141,148,0.08)',
          position: 'relative',
          transition: 'all 0.15s ease',
          border: isDarkMode ? '1px solid var(--blue-secondary)' : '1px solid var(--blue-secondary)',
          backdropFilter: 'blur(20px)',
          zIndex: 1,
          overflow: 'hidden',
          height: '100%'
        }}>
          {/* AI Explanations Header */}
          <div style={{ 
            background: isDarkMode 
              ? 'linear-gradient(135deg, var(--blue-secondary) 0%, #6b7a9a 100%)' 
              : 'linear-gradient(135deg, var(--blue-secondary) 0%, #5a6b8a 100%)', 
            color: '#fff', 
            padding: '0.75rem 1.25rem', 
            borderRadius: '24px 24px 0 0',
            textAlign: 'center',
            borderBottom: isDarkMode ? '1px solid var(--border)' : '1px solid rgba(195,141,148,0.1)',
            fontFamily: 'Gabriela, Arial, sans-serif',
            fontWeight: 700,
            fontSize: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 8px rgba(60,76,115,0.2)'
          }}>
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingLeft: '1.5rem',
              paddingRight: '0.75rem',
              paddingTop: '0.25rem',
              paddingBottom: '0.25rem',
              width: '100%'
            }}>
              <div style={{ 
                color: isDarkMode ? '#e8b3c3' : '#fff', 
                fontWeight: 700, 
                fontSize: '1rem', 
                fontFamily: 'Gabriela, Arial, sans-serif',
                transition: 'color 0.3s ease',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}>
                💡 AI Explanations
              </div>
              <button
                onClick={() => setShowShortFeedbackPanel(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  fontSize: '1.1rem',
                  cursor: 'pointer',
                  padding: '0.2rem',
                  borderRadius: '4px',
                  transition: 'all 0.2s'
                }}
                title="Hide panel"
              >
                ◀
              </button>
            </div>
          </div>
          {/* Resize Handle */}
          <div
            onMouseDown={handleLeftResizeStart}
            style={{
              position: 'absolute',
              right: -4,
              top: 0,
              bottom: 0,
              width: 8,
              cursor: 'col-resize',
              background: 'transparent',
              zIndex: 10
            }}
          />
          {/* Short Feedback Content */}
          <div style={{ 
            flex: 1, 
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0
          }}>
            

            
            {/* Quick Translation Section */}
            {Object.keys(quickTranslations).length > 0 && (
              <div style={{
                background: isDarkMode ? '#1e293b' : '#fff',
                color: isDarkMode ? '#f8fafc' : '#000',
                padding: '1rem',
                borderBottom: isDarkMode ? '1px solid #334155' : '1px solid #ececec',
                                  fontSize: '0.9rem',
                  lineHeight: 1.5,
                fontFamily: 'AR One Sans, Arial, sans-serif',
                fontWeight: 400,
                transition: 'background 0.3s ease, color 0.3s ease'
              }}>
                <div style={{
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  marginBottom: showQuickTranslation ? '1rem' : '0',
                  color: isDarkMode ? '#f8fafc' : '#000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    🌐 Quick Translation
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {showLlmBreakdown && (
                      <button
                        onClick={() => setShowQuickTranslation(!showQuickTranslation)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: 4,
                          border: '1px solid #666',
                          background: 'rgba(102,102,102,0.1)',
                          color: '#666',
                          fontSize: '0.7rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        title={showQuickTranslation ? 'Collapse' : 'Expand'}
                      >
                        {showQuickTranslation ? '▼' : '▶'}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        // Find the AI message that has the quick translation
                        const messageIndex = Object.keys(quickTranslations)[0];
                        if (messageIndex) {
                          const message = chatHistory[parseInt(messageIndex)];
                          if (message) {
                            explainLLMResponse(parseInt(messageIndex), message.text);
                          }
                        }
                      }}
                      disabled={isLoadingMessageFeedback[Object.keys(quickTranslations)[0] || '0']}
                      style={{
                        padding: '0.35rem 0.9rem',
                        borderRadius: 6,
                        border: '1px solid #9c27b0',
                        background: 'rgba(156,39,176,0.08)',
                        color: '#9c27b0',
                        fontSize: '0.8rem',
                        cursor: isLoadingMessageFeedback[Object.keys(quickTranslations)[0] || '0'] ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        opacity: isLoadingMessageFeedback[Object.keys(quickTranslations)[0] || '0'] ? 0.6 : 1,
                        fontWeight: 500,
                        boxShadow: '0 1px 3px rgba(156,39,176,0.10)'
                      }}
                      title="Get detailed LLM breakdown"
                    >
                      {isLoadingMessageFeedback[Object.keys(quickTranslations)[0] || '0'] ? '🔄' : '📝 Explain LLM'}
                    </button>
                  </div>
                </div>
                {showQuickTranslation && (
                  <div style={{
                    maxHeight: showLlmBreakdown ? '200px' : 'none',
                    overflowY: showLlmBreakdown ? 'auto' : 'visible'
                  }}>
                    {Object.entries(quickTranslations).map(([messageIndex, translation]) => (
                      <div key={messageIndex} style={{ marginBottom: '1rem' }}>
                        {translation.error ? (
                          <div style={{ color: '#dc3545', fontStyle: 'italic' }}>
                            {translation.fullTranslation}
                          </div>
                        ) : (
                          <div>
                            {/* Original sentence with clickable words */}
                            <div style={{ marginBottom: '0.5rem' }}>
                              <strong>Original:</strong>
                              <div style={{
                                background: isDarkMode ? '#334155' : '#f8f9fa',
                                padding: '0.75rem',
                                borderRadius: 8,
                                marginTop: '0.5rem',
                                fontSize: '0.95rem',
                                lineHeight: '1.6',
                                maxHeight: showLlmBreakdown ? '120px' : 'none',
                                overflowY: showLlmBreakdown ? 'auto' : 'visible'
                              }}>
                                {renderClickableMessage(chatHistory[parseInt(messageIndex)], parseInt(messageIndex), translation)}
                              </div>
                            </div>
                            
                            {/* Full translation */}
                            {translation.fullTranslation && (
                              <div style={{ marginBottom: '0.5rem' }}>
                                <strong>Translation:</strong>
                                <div style={{
                                  background: isDarkMode ? '#334155' : '#f8f9fa',
                                  padding: '0.75rem',
                                  borderRadius: 8,
                                  marginTop: '0.5rem',
                                  fontSize: '0.95rem',
                                  lineHeight: '1.6'
                                }}>
                                  {translation.fullTranslation}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* LLM Response Breakdown Section */}
            {showLlmBreakdown && llmBreakdown && (
              <div style={{
                background: isDarkMode ? '#1e293b' : '#fff',
                color: isDarkMode ? '#f8fafc' : '#000',
                padding: '1rem',
                borderBottom: isDarkMode ? '1px solid #334155' : '1px solid #ececec',
                fontSize: '1rem',
                lineHeight: 1.5,
                fontFamily: 'AR One Sans, Arial, sans-serif',
                fontWeight: 400,
                transition: 'background 0.3s ease, color 0.3s ease'
              }}>
                <div style={{
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  marginBottom: '1rem',
                  color: isDarkMode ? '#f8fafc' : '#000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    📝 LLM Response Breakdown
                  </span>
                  <button
                    onClick={() => setShowLlmBreakdown(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: isDarkMode ? '#94a3b8' : '#666',
                      cursor: 'pointer',
                      fontSize: '1.2rem',
                      padding: '0.2rem',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease'
                    }}
                    title="Close breakdown"
                  >
                    ×
                  </button>
                </div>
                <div style={{
                  background: isDarkMode ? '#334155' : '#f8f9fa',
                  padding: '0.75rem',
                  borderRadius: 8,
                  fontSize: '0.95rem',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '400px',
                  overflowY: 'auto'
                }}>
                  {llmBreakdown}
                </div>
              </div>
            )}
            
            {shortFeedback && (
              <div style={{
                background: isDarkMode ? '#1e293b' : '#fff',
                color: isDarkMode ? '#f8fafc' : '#000',
                                  padding: '0.75rem',
                  flex: 1,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  fontSize: '0.9rem',
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
                fontFamily: 'AR One Sans, Arial, sans-serif',
                fontWeight: 400,
                minHeight: 0,
                transition: 'background 0.3s ease, color 0.3s ease'
              }}>
                {parsedBreakdown.length > 0 ? (
                  <div>
                    {/* TTS button for detailed breakdown */}
                    <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => {
                          const cacheKey = `detailed_breakdown_panel`;
                          playTTSAudio(shortFeedback, language, cacheKey);
                        }}
                        disabled={isGeneratingTTS['detailed_breakdown_panel'] || isPlayingTTS['detailed_breakdown_panel']}
                        style={{
                          padding: '0.4rem 0.8rem',
                          borderRadius: 6,
                          border: isPlayingTTS['detailed_breakdown_panel'] ? 'none' : '1px solid #28a745',
                          background: isPlayingTTS['detailed_breakdown_panel'] ? 'linear-gradient(135deg, #28a745 0%, #1e7e34 100%)' : 'rgba(40,167,69,0.08)',
                          color: isPlayingTTS['detailed_breakdown_panel'] ? '#fff' : '#28a745',
                          fontSize: '0.8rem',
                          cursor: (isGeneratingTTS['detailed_breakdown_panel'] || isPlayingTTS['detailed_breakdown_panel']) ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease',
                          opacity: (isGeneratingTTS['detailed_breakdown_panel'] || isPlayingTTS['detailed_breakdown_panel']) ? 0.6 : 1,
                          fontWeight: 500,
                          boxShadow: isPlayingTTS['detailed_breakdown_panel'] ? '0 2px 6px rgba(40,167,69,0.18)' : '0 1px 3px rgba(40,167,69,0.10)'
                        }}
                        title={isPlayingTTS['detailed_breakdown_panel'] ? 'Playing audio...' : 'Listen to this breakdown'}
                      >
                        {isGeneratingTTS['detailed_breakdown_panel'] ? '🔄' : isPlayingTTS['detailed_breakdown_panel'] ? '🔊 Playing' : '🔊 Listen'}
                      </button>
                    </div>
                                          {parsedBreakdown.map((sentenceData, index) => (
                        <div key={index} style={{ marginBottom: index < parsedBreakdown.length - 1 ? '1rem' : '0' }}>
                          <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column',
                            width: '100%'
                          }}>
                            <div style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'flex-start',
                              marginBottom: '0.4rem'
                            }}>
                              <div style={{ 
                                fontWeight: 600, 
                                fontSize: '0.95rem', 
                                flex: 1,
                                color: isDarkMode ? '#f8fafc' : '#000'
                              }}>
                                {sentenceData.sentence}
                              </div>
                              {sentenceData.details && sentenceData.details.trim() && (
                                <button
                                  onClick={() => {
                                    const newExpanded = { ...showDetailedBreakdown };
                                    newExpanded[index] = !newExpanded[index];
                                    setShowDetailedBreakdown(newExpanded);
                                  }}
                                  style={{
                                    background: showDetailedBreakdown[index] ? '#4a90e2' : 'rgba(74,144,226,0.08)',
                                    border: '1px solid #4a90e2',
                                    color: showDetailedBreakdown[index] ? '#fff' : '#4a90e2',
                                    padding: '0.4rem 0.8rem',
                                    borderRadius: 6,
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.3rem',
                                    transition: 'all 0.2s ease',
                                    boxShadow: showDetailedBreakdown[index] ? '0 2px 6px rgba(74,144,226,0.2)' : '0 1px 3px rgba(74,144,226,0.1)',
                                    minWidth: 'fit-content',
                                    height: 'fit-content',
                                    marginLeft: '0.5rem'
                                  }}
                                >
                                  {showDetailedBreakdown[index] ? '▼' : '▶'} 
                                  {showDetailedBreakdown[index] ? 'Hide' : 'Details'}
                                </button>
                              )}
                            </div>
                            <div style={{ 
                              color: isDarkMode ? '#94a3b8' : '#666', 
                              fontSize: '0.85rem', 
                              width: '100%', 
                              lineHeight: '1.4' 
                            }}>
                              {sentenceData.overview}
                            </div>
                          </div>
                        {showDetailedBreakdown[index] && sentenceData.details && sentenceData.details.trim() && (
                          <div style={{
                            marginTop: '0.75rem',
                            padding: '1rem',
                            background: isDarkMode 
                              ? 'linear-gradient(135deg, #334155 0%, #475569 100%)'
                              : 'linear-gradient(135deg, #f8f9fa 0%, #f0f4f8 100%)',
                            borderRadius: 8,
                            border: isDarkMode ? '1px solid #475569' : '1px solid #e1e8ed',
                            fontSize: '0.8rem',
                            lineHeight: 1.5,
                            whiteSpace: 'pre-wrap',
                            boxShadow: isDarkMode 
                              ? 'inset 0 1px 3px rgba(0,0,0,0.2)' 
                              : 'inset 0 1px 3px rgba(0,0,0,0.05)',
                            color: isDarkMode ? '#f8fafc' : '#2c3e50',
                            transition: 'background 0.3s ease, border-color 0.3s ease, color 0.3s ease'
                          }}>
                            {sentenceData.details}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>
                    <div style={{ marginBottom: '0.5rem' }}>{shortFeedback}</div>
                    {/* TTS button for short feedback */}
                    <button
                      onClick={() => {
                        const cacheKey = `short_feedback_panel`;
                        playTTSAudio(shortFeedback, language, cacheKey);
                      }}
                      disabled={isGeneratingTTS['short_feedback_panel'] || isPlayingTTS['short_feedback_panel']}
                      style={{
                        padding: '0.4rem 0.8rem',
                        borderRadius: 6,
                        border: isPlayingTTS['short_feedback_panel'] ? 'none' : '1px solid #28a745',
                        background: isPlayingTTS['short_feedback_panel'] ? 'linear-gradient(135deg, #28a745 0%, #1e7e34 100%)' : 'rgba(40,167,69,0.08)',
                        color: isPlayingTTS['short_feedback_panel'] ? '#fff' : '#28a745',
                        fontSize: '0.8rem',
                        cursor: (isGeneratingTTS['short_feedback_panel'] || isPlayingTTS['short_feedback_panel']) ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        opacity: (isGeneratingTTS['short_feedback_panel'] || isPlayingTTS['short_feedback_panel']) ? 0.6 : 1,
                        fontWeight: 500,
                        boxShadow: isPlayingTTS['short_feedback_panel'] ? '0 2px 6px rgba(40,167,69,0.18)' : '0 1px 3px rgba(40,167,69,0.10)'
                      }}
                      title={isPlayingTTS['short_feedback_panel'] ? 'Playing audio...' : 'Listen to this feedback'}
                    >
                      {isGeneratingTTS['short_feedback_panel'] ? '🔄' : isPlayingTTS['short_feedback_panel'] ? '🔊 Playing' : '🔊 Listen'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {!shortFeedback && Object.keys(quickTranslations).length === 0 && (
              <div style={{
                background: isDarkMode ? '#1e293b' : '#fff',
                color: isDarkMode ? '#94a3b8' : '#666',
                                  padding: '0.75rem',
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.85rem',
                fontStyle: 'italic',
                transition: 'background 0.3s ease, color 0.3s ease'
              }}>
                Click "💡 Explain" on any AI message to see short feedback here
              </div>
            )}
            {explainButtonPressed && (
              <button
                onClick={() => {
                  console.log('[DEBUG] "Get Detailed Explanation" button clicked');
                  console.log('[DEBUG] Current shortFeedback:', shortFeedback);
                  console.log('[DEBUG] Current chatHistory:', chatHistory);
                  console.log('[DEBUG] Current shortFeedbacks:', shortFeedbacks);
                  
                  // Find the current AI message that has short feedback
                  const currentMessageIndex = chatHistory.findIndex((msg, index) => 
                    msg.sender === 'AI' && shortFeedbacks[index] === shortFeedback
                  );
                  
                  console.log('[DEBUG] Found messageIndex:', currentMessageIndex);
                  
                  if (currentMessageIndex !== -1) {
                    console.log('[DEBUG] Calling requestDetailedBreakdownForMessage with index:', currentMessageIndex);
                    requestDetailedBreakdownForMessage(currentMessageIndex);
                  } else {
                    console.log('[DEBUG] Could not find matching AI message for shortFeedback');
                    // Fallback: try to find any AI message with short feedback
                    const fallbackIndex = chatHistory.findIndex((msg, index) => 
                      msg.sender === 'AI' && shortFeedbacks[index]
                    );
                                      if (fallbackIndex !== -1) {
                    console.log('[DEBUG] Using fallback messageIndex:', fallbackIndex);
                    requestDetailedFeedbackForMessage(fallbackIndex);
                  }
                  }
                }}
                disabled={!shortFeedback}
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  background: shortFeedback ? 'var(--rose-primary)' : '#ccc',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  boxShadow: 'inset 0 2px 8px #c38d9422',
                  cursor: !shortFeedback ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  transition: 'all 0.2s',
                  marginTop: 'auto'
                }}
              >
                🎯 Get Detailed Explanation
              </button>
            )}
        </div>
        </div>
      )}
      {/* Chat Panel - Center */}
              <div className="panel-hover" style={{ 
          width: `${getPanelWidths().center * 100}%`,
          background: isDarkMode 
            ? 'linear-gradient(135deg, var(--card) 0%, rgba(255,255,255,0.02) 100%)' 
            : 'linear-gradient(135deg, #ffffff 0%, rgba(195,141,148,0.02) 100%)', 
          borderRadius: 24, 
          display: 'flex', 
          flexDirection: 'column', 
          boxShadow: isDarkMode 
            ? '0 8px 40px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2)' 
            : '0 8px 40px rgba(60,60,60,0.12), 0 2px 8px rgba(195,141,148,0.08)',
          position: 'relative',
          transition: 'all 0.3s ease',
          border: isDarkMode ? '1px solid var(--rose-primary)' : '1px solid var(--rose-primary)',
          backdropFilter: 'blur(20px)',
          zIndex: 1,
          minHeight: 0,
          height: '100%'
        }}>
        {/* Header Bar */}
        <div style={{ 
          padding: '0.75rem 1.25rem', 
          background: isDarkMode 
            ? 'linear-gradient(135deg, var(--muted) 0%, rgba(255,255,255,0.02) 100%)' 
            : 'linear-gradient(135deg, rgba(195,141,148,0.08) 0%, rgba(195,141,148,0.03) 100%)', 
          borderBottom: isDarkMode ? '1px solid var(--border)' : '1px solid rgba(195,141,148,0.15)', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          borderTopLeftRadius: 24, 
          borderTopRightRadius: 24,
          transition: 'all 0.3s ease',
          boxShadow: '0 2px 8px rgba(195,141,148,0.1)'
        }}>
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingLeft: '1.5rem',
            paddingRight: '0.75rem',
            paddingTop: '0.25rem',
            paddingBottom: '0.25rem',
            width: '100%'
          }}>
            {/* Main Title */}
            <div style={{ 
              color: isDarkMode ? '#e8b3c3' : 'var(--rose-primary)', 
              fontWeight: 700, 
              fontSize: '1rem', 
              fontFamily: 'Gabriela, Arial, sans-serif',
              transition: 'color 0.3s ease',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}>
              {getLanguageLabel(language)} Practice Session
            </div>
            
            {/* Conversation Details Tags - Right Aligned */}
            {chatHistory.length > 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                flexWrap: 'nowrap',
                justifyContent: 'flex-end',
                flex: 1,
                marginLeft: 'auto',
                overflowX: 'auto',
                overflowY: 'hidden',
                minWidth: 0
              }}>
                {/* Topics Tags (Scenario) - First */}
                {userPreferences?.topics?.map((topic, index) => (
                  <motion.span 
                    key={index} 
                    style={{
                      background: isDarkMode ? 'rgba(196,181,253,0.15)' : 'rgba(132,84,109,0.1)',
                      color: isDarkMode ? 'var(--light-purple)' : 'var(--rose-primary)',
                      padding: '0.2rem 0.4rem',
                      borderRadius: '16px',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      border: isDarkMode ? '1px solid rgba(196,181,253,0.3)' : '1px solid rgba(132,84,109,0.2)',
                      whiteSpace: 'nowrap',
                      fontFamily: 'Montserrat, Arial, sans-serif',
                      boxShadow: isDarkMode ? '0 2px 8px rgba(196,181,253,0.1)' : '0 2px 8px rgba(132,84,109,0.08)',
                      backdropFilter: 'blur(10px)',
                      display: 'inline-block',
                      flexShrink: 0,
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ 
                      duration: 1.2, 
                      delay: index * 0.25,
                      ease: "easeOut"
                    }}
                    whileHover={{ 
                      scale: 1.05, 
                      y: -2,
                      boxShadow: isDarkMode ? '0 4px 15px rgba(196,181,253,0.2)' : '0 4px 15px rgba(132,84,109,0.15)',
                      transition: { duration: 0.4 }
                    }}
                    whileTap={{ scale: 0.95 }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.padding = '0.2rem 0.6rem';
                      e.currentTarget.innerHTML = `💬 ${topic}`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.padding = '0.2rem 0.4rem';
                      e.currentTarget.innerHTML = '💬';
                    }}
                  >
                    💬
                  </motion.span>
                ))}
                
                {/* Formality Tag (Intimacy) - Second */}
                {userPreferences?.formality && (
                  <motion.span 
                    style={{
                      background: isDarkMode ? 'rgba(139,163,217,0.15)' : 'rgba(59,83,119,0.1)',
                      color: isDarkMode ? 'var(--blue-secondary)' : 'var(--blue-secondary)',
                      padding: '0.2rem 0.4rem',
                      borderRadius: '16px',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      border: isDarkMode ? '1px solid rgba(139,163,217,0.3)' : '1px solid rgba(59,83,119,0.2)',
                      whiteSpace: 'nowrap',
                      fontFamily: 'Montserrat, Arial, sans-serif',
                      boxShadow: isDarkMode ? '0 2px 8px rgba(139,163,217,0.1)' : '0 2px 8px rgba(59,83,119,0.08)',
                      backdropFilter: 'blur(10px)',
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ 
                      duration: 1.2, 
                      delay: (userPreferences?.topics?.length || 0) * 0.25 + 0.3,
                      ease: "easeOut"
                    }}
                    whileHover={{ 
                      scale: 1.05, 
                      y: -2,
                      boxShadow: isDarkMode ? '0 4px 15px rgba(139,163,217,0.2)' : '0 4px 15px rgba(59,83,119,0.15)',
                      transition: { duration: 0.4 }
                    }}
                    whileTap={{ scale: 0.95 }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.padding = '0.2rem 0.6rem';
                      e.currentTarget.innerHTML = `🎭 ${userPreferences.formality}`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.padding = '0.2rem 0.4rem';
                      e.currentTarget.innerHTML = '🎭';
                    }}
                  >
                    🎭
                  </motion.span>
                )}
                
                {/* Learning Goals Tags (Learning Goal) - Third */}
                {(() => { console.log('[DEBUG] Learning goals rendering:', { userGoals: userPreferences?.user_goals, userPreferences }); return null; })()}
                {userPreferences?.user_goals?.map((goalId, index) => {
                  const goal = LEARNING_GOALS.find((g: LearningGoal) => g.id === goalId);
                  return goal ? (
                    <motion.span 
                      key={index} 
                      style={{
                        background: isDarkMode ? 'rgba(240,200,208,0.15)' : 'rgba(214,182,182,0.1)',
                        color: isDarkMode ? 'var(--rose-accent)' : 'var(--rose-accent)',
                        padding: '0.2rem 0.4rem',
                        borderRadius: '16px',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        border: isDarkMode ? '1px solid rgba(240,200,208,0.3)' : '1px solid rgba(214,182,182,0.2)',
                        whiteSpace: 'nowrap',
                        fontFamily: 'Montserrat, Arial, sans-serif',
                        boxShadow: isDarkMode ? '0 2px 8px rgba(240,200,208,0.1)' : '0 2px 8px rgba(214,182,182,0.08)',
                        backdropFilter: 'blur(10px)',
                                              display: 'inline-block',
                      flexShrink: 0,
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ 
                        duration: 1.2, 
                        delay: ((userPreferences?.topics?.length || 0) + (userPreferences?.formality ? 1 : 0)) * 0.25 + index * 0.25 + 0.5,
                        ease: "easeOut"
                      }}
                      whileHover={{ 
                        scale: 1.05, 
                        y: -2,
                        boxShadow: isDarkMode ? '0 4px 15px rgba(240,200,208,0.2)' : '0 4px 15px rgba(214,182,182,0.15)',
                        transition: { duration: 0.4 }
                      }}
                      whileTap={{ scale: 0.95 }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.padding = '0.2rem 0.6rem';
                        e.currentTarget.innerHTML = `${goal.icon} ${goal.goal}`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.padding = '0.2rem 0.4rem';
                        e.currentTarget.innerHTML = goal.icon;
                      }}
                    >
                      {goal.icon}
                    </motion.span>
                  ) : null;
                })}
                
                {/* User Level Tag - Additional Info */}
                {userPreferences?.userLevel && (
                  <motion.span 
                    style={{
                      background: isDarkMode ? 'rgba(232,179,195,0.15)' : 'rgba(132,84,109,0.1)',
                      color: isDarkMode ? 'var(--rose-primary)' : 'var(--rose-primary)',
                      padding: '0.2rem 0.4rem',
                      borderRadius: '16px',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      border: isDarkMode ? '1px solid rgba(232,179,195,0.3)' : '1px solid rgba(132,84,109,0.2)',
                      whiteSpace: 'nowrap',
                      fontFamily: 'Montserrat, Arial, sans-serif',
                      boxShadow: isDarkMode ? '0 2px 8px rgba(232,179,195,0.1)' : '0 2px 8px rgba(132,84,109,0.08)',
                      backdropFilter: 'blur(10px)',
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ 
                      duration: 1.2, 
                      delay: ((userPreferences?.topics?.length || 0) + (userPreferences?.formality ? 1 : 0) + (userPreferences?.user_goals?.length || 0)) * 0.25 + 0.8,
                      ease: "easeOut"
                    }}
                    whileHover={{ 
                      scale: 1.05, 
                      y: -2,
                      boxShadow: isDarkMode ? '0 4px 15px rgba(232,179,195,0.2)' : '0 4px 15px rgba(132,84,109,0.15)',
                      transition: { duration: 0.4 }
                    }}
                    whileTap={{ scale: 0.95 }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.padding = '0.2rem 0.6rem';
                      e.currentTarget.innerHTML = `📊 ${userPreferences.userLevel}`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.padding = '0.2rem 0.4rem';
                      e.currentTarget.innerHTML = '📊';
                    }}
                  >
                    📊
                  </motion.span>
                )}
                
                {/* Feedback Language Tag - Additional Info (if needed) */}
                {userPreferences?.feedbackLanguage && userPreferences.feedbackLanguage !== 'en' && (
                  <motion.span 
                    style={{
                      background: isDarkMode ? 'rgba(196,181,253,0.15)' : 'rgba(132,84,109,0.1)',
                      color: isDarkMode ? 'var(--light-purple)' : 'var(--rose-primary)',
                      padding: '0.2rem 0.4rem',
                      borderRadius: '16px',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      border: isDarkMode ? '1px solid rgba(196,181,253,0.3)' : '1px solid rgba(132,84,109,0.2)',
                      whiteSpace: 'nowrap',
                      fontFamily: 'Montserrat, Arial, sans-serif',
                      boxShadow: isDarkMode ? '0 2px 8px rgba(196,181,253,0.1)' : '0 2px 8px rgba(132,84,109,0.08)',
                      backdropFilter: 'blur(10px)',
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ 
                      duration: 1.2, 
                      delay: ((userPreferences?.topics?.length || 0) + (userPreferences?.formality ? 1 : 0) + (userPreferences?.user_goals?.length || 0) + (userPreferences?.userLevel ? 1 : 0)) * 0.25 + 1.0,
                      ease: "easeOut"
                    }}
                    whileHover={{ 
                      scale: 1.05, 
                      y: -2,
                      boxShadow: isDarkMode ? '0 4px 15px rgba(196,181,253,0.2)' : '0 4px 15px rgba(132,84,109,0.15)',
                      transition: { duration: 0.4 }
                    }}
                    whileTap={{ scale: 0.95 }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.padding = '0.2rem 0.6rem';
                      e.currentTarget.innerHTML = `💬 ${userPreferences.feedbackLanguage.toUpperCase()}`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.padding = '0.2rem 0.4rem';
                      e.currentTarget.innerHTML = '💬';
                    }}
                  >
                    💬
                  </motion.span>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Chat Messages */}
        <div style={{ 
          flex: 1, 
          padding: '0.75rem', 
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          background: isDarkMode 
            ? 'linear-gradient(135deg, var(--background) 0%, rgba(255,255,255,0.01) 100%)' 
            : 'linear-gradient(135deg, #f9f6f4 0%, rgba(195,141,148,0.02) 100%)',
          borderRadius: '0 0 24px 24px',
          transition: 'all 0.3s ease',
          position: 'relative',
          minHeight: 0,
          maxHeight: 'calc(100vh - 6rem - 100px)'
        }}>
          {isLoadingConversation && (
            <div style={{
              alignSelf: 'center',
              padding: '0.5rem 1rem',
              background: '#f5f1ec',
              borderRadius: 8,
              color: 'var(--rose-primary)',
              fontSize: '0.95rem',
              fontWeight: 500
            }}>
              📂 Loading conversation...
            </div>
          )}
          {chatHistory.map((message: ChatMessage, index) => (
            <div key={index} style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: message.sender === 'User' ? 'flex-end' : 'flex-start',
              marginBottom: '0.5rem'
            }}>
              <div 
                onClick={message.isProcessing ? undefined : () => handleMessageClick(index, message.text)}
                style={{
                  flex: 1,
                  padding: '1rem 1.25rem',
                  borderRadius: message.sender === 'User' ? '24px 24px 8px 24px' : message.sender === 'AI' ? '24px 24px 24px 8px' : '16px',
                  background: message.isProcessing 
                    ? isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
                    : message.sender === 'User' 
                      ? 'linear-gradient(135deg, var(--rose-primary) 0%, #8a6a7a 100%)' 
                      : message.sender === 'AI' 
                        ? isDarkMode 
                          ? 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)' 
                          : 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)' 
                        : isDarkMode ? 'var(--muted)' : 'rgba(230,126,34,0.1)',
                  color: message.isProcessing
                    ? isDarkMode ? 'var(--muted-foreground)' : 'var(--muted-foreground)'
                    : message.sender === 'User' 
                      ? '#fff'
                      : message.sender === 'System' 
                        ? '#e67e22' 
                        : 'var(--foreground)',
                  border: message.sender === 'AI' 
                    ? isDarkMode ? '1px solid var(--border)' : '1px solid rgba(195,141,148,0.2)' 
                    : message.sender === 'System' 
                      ? '1px solid #e67e22' 
                      : 'none',
                  fontSize: '0.9rem',
                  cursor: message.isProcessing ? 'default' : 'pointer',
                  transition: 'all 0.3s ease',
                  opacity: isTranslating[index] ? 0.7 : 1,
                  position: 'relative',
                  boxShadow: message.sender === 'User' 
                    ? '0 8px 32px rgba(195,141,148,0.3), 0 2px 8px rgba(195,141,148,0.2)' 
                    : message.sender === 'AI' 
                      ? '0 8px 32px rgba(60,76,115,0.12), 0 2px 8px rgba(60,76,115,0.08)' 
                      : '0 4px 16px rgba(230,126,34,0.15)',
                  maxWidth: '70%',
                  wordWrap: 'break-word',
                  fontWeight: message.sender === 'User' ? 600 : message.sender === 'System' ? 600 : 400,
                  animation: 'messageAppear 0.3s ease-out',
                  fontFamily: 'AR One Sans, Arial, sans-serif',
                  backdropFilter: 'blur(20px)',
                  transform: 'translateZ(0)'
                }}
                              >
                  {(() => {
                    const formatted = formatMessageForDisplay(message, userPreferences.romanizationDisplay);
                    console.log('[DEBUG] Message rendering:', {
                      index,
                      hasDetailedFeedback: !!message.detailedFeedback,
                      detailedFeedback: message.detailedFeedback,
                      mainText: formatted.mainText,
                      romanizedText: formatted.romanizedText,
                      romanizationDisplay: userPreferences.romanizationDisplay
                    });
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ color: message.sender === 'User' ? '#fff' : 'inherit' }}>
                          {message.detailedFeedback ? renderFormattedText(formatted.mainText, index) : formatted.mainText}
                        </span>
                        {formatted.romanizedText && (
                          <span style={{
                            fontSize: '0.82em',
                            color: message.detailedFeedback ? (isDarkMode ? '#94a3b8' : '#555') : (isDarkMode ? '#94a3b8' : '#555'),
                            opacity: message.detailedFeedback ? 1 : 0.65,
                            marginTop: 2,
                            fontWeight: 400,
                            lineHeight: 1.2,
                            letterSpacing: '0.01em',
                          }}>
                            {message.detailedFeedback ? renderFormattedText(formatted.romanizedText, index) : formatted.romanizedText}
                          </span>
                        )}
                      </div>
                    );
                  })()}
                  {isTranslating[index] && (
                  <span style={{ marginLeft: '0.5rem', fontSize: '0.85rem' }}>
                    🔄 Translating...
                  </span>
                )}
              </div>
              
              {/* Corrected Version - Slides down from under the message */}
              {message.detailedFeedback && showCorrectedVersions[index] && (
                <div
                  style={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: message.sender === 'User' ? 'flex-end' : 'flex-start',
                    marginTop: '0.5rem',
                    animation: 'slideDown 0.5s ease-out forwards',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      padding: '0.5rem 0.8rem',
                      borderRadius: message.sender === 'User' ? '8px 8px 2px 8px' : '8px 8px 8px 2px',
                      background: isDarkMode 
                        ? 'rgba(16, 185, 129, 0.1)' 
                        : 'rgba(16, 185, 129, 0.08)',
                      color: isDarkMode ? '#10b981' : '#059669',
                      fontSize: '0.85rem',
                      fontWeight: 400,
                      maxWidth: '70%',
                      wordWrap: 'break-word',
                      border: `1px solid ${isDarkMode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.15)'}`,
                      position: 'relative'
                    }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.3rem', 
                      marginBottom: '0.2rem',
                      fontSize: '0.75rem',
                      opacity: 0.7,
                      fontWeight: 500
                    }}>
                      <span>✓</span>
                      <span>Corrected</span>
                    </div>
                    {(() => {
                      const correctedVersion = extractCorrectedVersion(message.detailedFeedback);
                      
                      if (!correctedVersion) {
                        // Message is correct - show "Correct!"
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 500, lineHeight: 1.3 }}>
                              Correct!
                            </span>
                          </div>
                        );
                      }
                      
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 500, lineHeight: 1.3 }}>
                            {correctedVersion.mainText}
                          </span>
                          {correctedVersion.romanizedText && (
                            <span style={{
                              fontSize: '0.8em',
                              opacity: 0.8,
                              marginTop: '0.15rem',
                              fontWeight: 400,
                              lineHeight: 1.2,
                            }}>
                              {correctedVersion.romanizedText}
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
              
              {/* Feedback Buttons */}
              {message.sender === 'User' && !message.detailedFeedback && (
                <button
                  onClick={() => toggleDetailedFeedback(index)}
                  disabled={isLoadingMessageFeedback[index]}
                  style={{
                    padding: '0.3rem 0.8rem',
                    borderRadius: 6,
                    border: '1px solid var(--rose-primary)',
                    background: isDarkMode ? 'rgba(232,179,195,0.15)' : 'rgba(132,84,109,0.1)',
                    color: 'var(--rose-primary)',
                    fontSize: '0.8rem',
                    cursor: isLoadingMessageFeedback[index] ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    opacity: isLoadingMessageFeedback[index] ? 0.6 : 1,
                    minWidth: '80px',
                    fontWeight: 600,
                    fontFamily: 'Montserrat, Arial, sans-serif',
                    marginTop: 4,
                    boxShadow: isDarkMode ? '0 2px 8px rgba(232,179,195,0.1)' : '0 2px 8px rgba(132,84,109,0.08)',
                    backdropFilter: 'blur(10px)'
                  }}
                  title="Check for errors"
                >
                  {isLoadingMessageFeedback[index] ? '🔄' : '🎯 Check'}
                </button>
              )}
              {message.sender === 'AI' && (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 4 }}>
                  <button
                    onClick={() => quickTranslation(index, message.text)}
                    disabled={isLoadingMessageFeedback[index]}
                    style={{
                      padding: '0.35rem 0.9rem',
                      borderRadius: 6,
                      border: '1px solid #4a90e2',
                      background: 'rgba(74,144,226,0.08)',
                      color: '#4a90e2',
                      fontSize: '0.8rem',
                      cursor: isLoadingMessageFeedback[index] ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      opacity: isLoadingMessageFeedback[index] ? 0.6 : 1,
                      minWidth: '70px',
                      fontWeight: 500,
                      boxShadow: '0 1px 3px rgba(74,144,226,0.10)'
                    }}
                    title="Get translation"
                  >
                    {isLoadingMessageFeedback[index] ? '🔄' : '💡 Explain'}
                  </button>
                  

                  
                  {/* TTS button for AI messages */}
                  <button
                    onClick={() => {
                      const cacheKey = `ai_message_${index}`;
                      if (message.ttsUrl) {
                        // Use existing TTS URL if available
                        playExistingTTS(message.ttsUrl, cacheKey);
                      } else {
                        // Generate new TTS using appropriate text based on romanization preference
                        const ttsText = getTTSText(message, userPreferences.romanizationDisplay, language);
                        playTTSAudio(ttsText, language, cacheKey);
                      }
                    }}
                    disabled={isGeneratingTTS[`ai_message_${index}`] || isPlayingTTS[`ai_message_${index}`]}
                    style={{
                      padding: '0.4rem 0.8rem',
                      borderRadius: 8,
                      border: isPlayingTTS[`ai_message_${index}`] ? 'none' : '1px solid var(--blue-secondary)',
                      background: isPlayingTTS[`ai_message_${index}`] ? 'linear-gradient(135deg, var(--blue-secondary) 0%, #2a4a6a 100%)' : isDarkMode ? 'rgba(139,163,217,0.15)' : 'rgba(59,83,119,0.1)',
                      color: isPlayingTTS[`ai_message_${index}`] ? '#fff' : 'var(--blue-secondary)',
                      fontSize: '0.8rem',
                      cursor: (isGeneratingTTS[`ai_message_${index}`] || isPlayingTTS[`ai_message_${index}`]) ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s ease',
                      opacity: (isGeneratingTTS[`ai_message_${index}`] || isPlayingTTS[`ai_message_${index}`]) ? 0.6 : 1,
                      minWidth: '80px',
                      fontWeight: 600,
                      fontFamily: 'Montserrat, Arial, sans-serif',
                      boxShadow: isPlayingTTS[`ai_message_${index}`] ? '0 2px 6px rgba(59,83,119,0.18)' : isDarkMode ? '0 2px 8px rgba(139,163,217,0.1)' : '0 2px 8px rgba(59,83,119,0.08)',
                      backdropFilter: 'blur(10px)'
                    }}
                    title={isPlayingTTS[`ai_message_${index}`] ? 'Playing audio...' : 'Listen to this message'}
                  >
                    {isGeneratingTTS[`ai_message_${index}`] ? '🔄' : isPlayingTTS[`ai_message_${index}`] ? '🔊 Playing' : '🔊 Listen'}
                  </button>
                  
                  {/* Show suggestions button only for the most recent AI message */}
                  {index === chatHistory.length - 1 && (
                    <button
                      onClick={handleSuggestionButtonClick}
                      disabled={isLoadingSuggestions}
                      style={{
                        padding: '0.4rem 0.8rem',
                        border: '1px solid var(--rose-primary)',
                        background: isDarkMode ? 'rgba(232,179,195,0.15)' : 'rgba(132,84,109,0.1)',
                        color: 'var(--rose-primary)',
                        fontSize: '0.8rem',
                        cursor: isLoadingSuggestions ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s ease',
                        opacity: isLoadingSuggestions ? 0.6 : 1,
                        fontWeight: 600,
                        fontFamily: 'Montserrat, Arial, sans-serif',
                        borderRadius: 8,
                        minWidth: '80px',
                        boxShadow: isDarkMode ? '0 2px 8px rgba(232,179,195,0.1)' : '0 2px 8px rgba(132,84,109,0.08)',
                        backdropFilter: 'blur(10px)'
                      }}
                      title="Get conversation suggestions"
                    >
                      {isLoadingSuggestions ? 'Loading...' : 'Suggestions'}
                    </button>
                  )}
                </div>
              )}
              {showTranslations[index] && translations[index] && (
                <div style={{
                  padding: '0.75rem 1rem',
                  background: 'linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%)',
                  border: '1px solid #d0e4f7',
                  borderRadius: 10,
                  fontSize: '0.93rem',
                  color: '#2c5282',
                  position: 'relative',
                  marginTop: '0.5rem',
                  boxShadow: '0 2px 8px rgba(44,82,130,0.08)',
                  maxWidth: '85%'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                      🌐 Translation
                    </span>
                    <button
                      onClick={() => translateMessage(index, message.text, true)}
                      style={{
                        background: 'rgba(44,82,130,0.08)',
                        border: '1px solid #d0e4f7',
                        color: '#2c5282',
                        padding: '0.25rem 0.7rem',
                        borderRadius: 7,
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      📝 Detailed Breakdown
                    </button>
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>Translation:</strong> {translations[index]?.translation || ''}
                  </div>
                  {translations[index]?.has_breakdown && translations[index]?.breakdown && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <strong>📖 Detailed Analysis:</strong>
                      </div>
                      <div style={{
                        background: 'rgba(255,255,255,0.7)',
                        padding: '0.75rem',
                        borderRadius: 8,
                        border: '1px solid #e0e0e0',
                        fontSize: '0.9rem',
                        lineHeight: '1.5',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {translations[index].breakdown}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {isProcessing && (
            <div style={{
              alignSelf: 'center',
              padding: '0.5rem 1rem',
              background: '#f5f1ec',
              borderRadius: 8,
              color: 'var(--rose-primary)',
              fontSize: '0.95rem',
              fontWeight: 500
            }}>
              ⏳ Processing your speech...
            </div>
          )}
          
          {/* Suggestion Carousel */}
          {showSuggestionCarousel && suggestionMessages.length > 0 && (
            <div style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              marginBottom: '0.7rem'
            }}>
              <div className="hover-lift" style={{
                maxWidth: '70%',
                padding: '1rem 1.25rem',
                background: isDarkMode 
                  ? 'linear-gradient(135deg, rgba(195,141,148,0.15) 0%, rgba(195,141,148,0.08) 100%)'
                  : 'linear-gradient(135deg, rgba(195,141,148,0.12) 0%, rgba(195,141,148,0.06) 100%)',
                color: isDarkMode ? 'var(--foreground)' : '#3e3e3e',
                borderRadius: '28px 28px 8px 28px',
                border: isDarkMode ? '2px dashed rgba(195,141,148,0.5)' : '2px dashed #c38d94',
                fontSize: '0.9rem',
                fontWeight: 600,
                position: 'relative',
                boxShadow: isDarkMode 
                  ? '0 8px 32px rgba(195,141,148,0.2), 0 2px 8px rgba(195,141,148,0.1)' 
                  : '0 8px 32px rgba(195,141,148,0.25), 0 2px 8px rgba(195,141,148,0.15)',
                fontFamily: 'AR One Sans, Arial, sans-serif',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(20px)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem',
                  fontSize: '0.8rem',
                  color: '#c38d94'
                }}>
                  <span>💭 Suggestion ({currentSuggestionIndex + 1}/{suggestionMessages.length})</span>
                  <div style={{ display: 'flex', gap: '0.3rem' }}>
                    <button
                      onClick={() => navigateSuggestion('prev')}
                      disabled={suggestionMessages.length <= 1}
                      style={{
                        padding: '0.4rem 0.6rem',
                        borderRadius: 8,
                        border: '1px solid #c38d94',
                        background: 'rgba(195,141,148,0.08)',
                        color: '#c38d94',
                        cursor: suggestionMessages.length <= 1 ? 'not-allowed' : 'pointer',
                        fontSize: '0.8rem',
                        opacity: suggestionMessages.length <= 1 ? 0.5 : 1,
                        transition: 'all 0.3s ease',
                        fontWeight: 600
                      }}
                    >
                      ←
                    </button>
                    <button
                      onClick={() => navigateSuggestion('next')}
                      disabled={suggestionMessages.length <= 1}
                      style={{
                        padding: '0.4rem 0.6rem',
                        borderRadius: 8,
                        border: '1px solid #c38d94',
                        background: 'rgba(195,141,148,0.08)',
                        color: '#c38d94',
                        cursor: suggestionMessages.length <= 1 ? 'not-allowed' : 'pointer',
                        fontSize: '0.8rem',
                        opacity: suggestionMessages.length <= 1 ? 0.5 : 1,
                        transition: 'all 0.3s ease',
                        fontWeight: 600
                      }}
                    >
                      →
                    </button>
                  </div>
                </div>
                <div style={{
                  lineHeight: '1.4',
                  wordWrap: 'break-word',
                  marginBottom: '0.5rem'
                }}>
                  {(() => {
                    const suggestion = suggestionMessages[currentSuggestionIndex];
                    if (!suggestion) return null;
                    
                    const formatted = formatMessageForDisplay(suggestion, userPreferences.romanizationDisplay);
                    return (
                      <>
                        <span>{formatted.mainText}</span>
                        {formatted.romanizedText && (
                          <span style={{
                            fontSize: '0.82em',
                            color: '#555',
                            opacity: 0.65,
                            marginTop: 2,
                            fontWeight: 400,
                            lineHeight: 1.2,
                            letterSpacing: '0.01em',
                            display: 'block'
                          }}>
                            {formatted.romanizedText}
                          </span>
                        )}
                      </>
                    );
                  })()}
                </div>
                {/* Suggestion Action Buttons */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.3rem'
                }}>
                  {/* TTS button for suggestions */}
                  <button
                    onClick={() => {
                      const suggestion = suggestionMessages[currentSuggestionIndex];
                      if (suggestion) {
                        const cacheKey = `suggestion_${currentSuggestionIndex}`;
                        const ttsText = getTTSText(suggestion, userPreferences.romanizationDisplay, language);
                        playTTSAudio(ttsText, language, cacheKey);
                      }
                    }}
                    disabled={isGeneratingTTS[`suggestion_${currentSuggestionIndex}`] || isPlayingTTS[`suggestion_${currentSuggestionIndex}`]}
                    style={{
                      padding: '0.5rem 0.8rem',
                      borderRadius: 8,
                      border: isPlayingTTS[`suggestion_${currentSuggestionIndex}`] ? 'none' : '1px solid #28a745',
                      background: isPlayingTTS[`suggestion_${currentSuggestionIndex}`] ? 'linear-gradient(135deg, #28a745 0%, #1e7e34 100%)' : 'rgba(40,167,69,0.08)',
                      color: isPlayingTTS[`suggestion_${currentSuggestionIndex}`] ? '#fff' : '#28a745',
                      cursor: (isGeneratingTTS[`suggestion_${currentSuggestionIndex}`] || isPlayingTTS[`suggestion_${currentSuggestionIndex}`]) ? 'not-allowed' : 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      transition: 'all 0.3s ease',
                      opacity: (isGeneratingTTS[`suggestion_${currentSuggestionIndex}`] || isPlayingTTS[`suggestion_${currentSuggestionIndex}`]) ? 0.6 : 1
                    }}
                    title={isPlayingTTS[`suggestion_${currentSuggestionIndex}`] ? 'Playing audio...' : 'Listen to this suggestion'}
                  >
                    {isGeneratingTTS[`suggestion_${currentSuggestionIndex}`] ? '🔄' : isPlayingTTS[`suggestion_${currentSuggestionIndex}`] ? '🔊' : '🔊'}
                  </button>
                  
                  <button
                    onClick={() => explainSuggestion(currentSuggestionIndex, suggestionMessages[currentSuggestionIndex]?.text || '')}
                    disabled={isTranslatingSuggestion[currentSuggestionIndex]}
                    style={{
                      padding: '0.5rem 0.8rem',
                      borderRadius: 8,
                      border: '1px solid #4a90e2',
                      background: 'rgba(74,144,226,0.08)',
                      color: '#4a90e2',
                      cursor: isTranslatingSuggestion[currentSuggestionIndex] ? 'not-allowed' : 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      transition: 'all 0.3s ease',
                      opacity: isTranslatingSuggestion[currentSuggestionIndex] ? 0.6 : 1
                    }}
                    title="Explain this suggestion"
                  >
                    {isTranslatingSuggestion[currentSuggestionIndex] ? '🔄' : '💡 Explain'}
                  </button>
                </div>
                {/* Translation Display */}
                {showSuggestionTranslations[currentSuggestionIndex] && suggestionTranslations[currentSuggestionIndex] && (
                  <div style={{
                    marginTop: '0.75rem',
                    padding: '0.75rem',
                    background: 'linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%)',
                    border: '1px solid #d0e4f7',
                    borderRadius: 8,
                    fontSize: '0.85rem',
                    color: '#2c5282',
                    position: 'relative',
                    boxShadow: '0 2px 8px rgba(44,82,130,0.08)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>
                        💡 Explanation
                      </span>
                      <button
                        onClick={() => setShowSuggestionTranslations(prev => ({ ...prev, [currentSuggestionIndex]: false }))}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#2c5282',
                          fontSize: '1rem',
                          cursor: 'pointer',
                          padding: '0.1rem',
                          borderRadius: '2px'
                        }}
                        title="Hide explanation"
                      >
                        ×
                      </button>
                    </div>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <strong>Translation:</strong> {suggestionTranslations[currentSuggestionIndex]?.translation || ''}
                    </div>
                    {suggestionTranslations[currentSuggestionIndex]?.breakdown && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <div style={{ marginBottom: '0.5rem' }}>
                          <strong>📖 Explanation:</strong>
                        </div>
                        <div style={{
                          background: 'rgba(255,255,255,0.7)',
                          padding: '0.75rem',
                          borderRadius: 6,
                          border: '1px solid #e0e0e0',
                          fontSize: '0.8rem',
                          lineHeight: '1.5',
                          whiteSpace: 'pre-wrap'
                        }}>
                          {suggestionTranslations[currentSuggestionIndex].breakdown}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Recording Controls */}
        {chatHistory.length > 0 && (
          <div
            data-recording-section
            style={{ 
              position: 'relative',
              padding: '1rem 1rem 2.5rem 1rem', 
              borderTop: isDarkMode ? '1px solid var(--border)' : '1px solid rgba(195,141,148,0.2)',
              background: isDarkMode 
                ? 'linear-gradient(135deg, var(--muted) 0%, rgba(255,255,255,0.02) 100%)' 
                : 'linear-gradient(135deg, rgba(195,141,148,0.08) 0%, rgba(195,141,148,0.03) 100%)',
              borderRadius: '0 0 24px 24px',
              textAlign: 'center',
              transition: 'all 0.3s ease',
              boxShadow: '0 -2px 8px rgba(195,141,148,0.1)',
              flexShrink: 0,
              marginBottom: '2rem'
            }}
          >
            {/* Centered main controls */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              height: '100%',
              minHeight: '60px'
            }}>
              {/* Left side - Centered first 3 buttons */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                flex: 1
              }}>
                {/* Autospeak Toggle Button */}
                <button
                  onClick={() => setAutoSpeak(v => !v)}
                  style={{
                    background: autoSpeak 
                      ? 'linear-gradient(135deg, var(--blue-secondary) 0%, #5a6b8a 100%)' 
                      : 'linear-gradient(135deg, var(--blue-secondary) 0%, #5a6b8a 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 12,
                    padding: '0.6rem 1rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 6px 24px rgba(60,76,115,0.25), 0 2px 8px rgba(60,76,115,0.15)',
                    minWidth: '110px',
                    fontFamily: 'Montserrat, Arial, sans-serif',
                    transform: 'translateZ(0)'
                  }}
                >
                  {autoSpeak ? '✅ Autospeak ON' : 'Autospeak OFF'}
                </button>

                {/* Microphone Button */}
                <button
                  onClick={isRecording ? () => stopRecording(false) : startRecording}
                  disabled={isProcessing || (autoSpeak && isRecording)}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    border: 'none',
                    background: isRecording 
                      ? 'linear-gradient(135deg, var(--blue-secondary) 0%, #5a6b8a 100%)' 
                      : 'linear-gradient(135deg, var(--rose-primary) 0%, #8a6a7a 100%)',
                    color: '#fff',
                    fontSize: '24px',
                    cursor: isProcessing || (autoSpeak && isRecording) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: isRecording 
                      ? '0 0 0 10px rgba(195,141,148,0.4), 0 10px 40px rgba(60,76,115,0.4)' 
                      : '0 10px 40px rgba(60,76,115,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: isRecording ? 'scale(1.1)' : 'scale(1)',
                    animation: isRecording ? 'pulse 2s infinite' : 'none',
                    backdropFilter: 'blur(20px)'
                  }}
                  title={isRecording ? 'Stop Recording' : 'Start Recording'}
                >
                  {isRecording ? '⏹️' : '🎤'}
                </button>

                {/* Short Feedback Toggle Button */}
                <button
                  onClick={() => setEnableShortFeedback(v => !v)}
                  style={{
                    background: enableShortFeedback 
                      ? 'linear-gradient(135deg, var(--blue-secondary) 0%, #5a6b8a 100%)' 
                      : 'linear-gradient(135deg, var(--rose-primary) 0%, #8a6a7a 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 12,
                    padding: '0.6rem 1rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 6px 24px rgba(60,76,115,0.25), 0 2px 8px rgba(60,76,115,0.15)',
                    minWidth: '110px',
                    fontFamily: 'Montserrat, Arial, sans-serif',
                    transform: 'translateZ(0)'
                  }}
                >
                  {enableShortFeedback ? '💡 Short Feedback ON' : 'Short Feedback OFF'}
                </button>
              </div>

              {/* Right side - End Chat Button */}
              <button
                onClick={handleEndChat}
                style={{
                  background: 'linear-gradient(135deg, var(--rose-primary) 0%, #8a6a7a 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  padding: '0.6rem 1rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 6px 24px rgba(60,76,115,0.25), 0 2px 8px rgba(60,76,115,0.15)',
                  minWidth: '110px',
                  fontFamily: 'Montserrat, Arial, sans-serif',
                  transform: 'translateZ(0)'
                }}
                title="End chat, generate summary, and return to dashboard"
              >
                🏠 End Chat
              </button>
            </div>

            {/* Redo Button: Only show in manual mode when recording */}
            {isRecording && manualRecording && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginTop: '1rem',
                marginBottom: '0.5rem'
              }}>
                <button
                  onClick={() => stopRecording(true)}
                  style={{
                    background: isDarkMode 
                      ? 'linear-gradient(135deg, var(--rose-primary) 0%, #8a6a7a 100%)' 
                      : 'linear-gradient(135deg, var(--rose-primary) 0%, #8a6a7a 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '0.4rem 0.8rem',
                    cursor: 'pointer',
                    fontWeight: 500,
                    fontSize: '0.8rem',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 3px rgba(195,141,148,0.10)',
                    minWidth: '80px',
                    fontFamily: 'Montserrat, Arial, sans-serif'
                  }}
                >
                  ⏹️ Redo
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Interrupt message - prominent UI position */}
      {wasInterrupted && !isRecording && (
        <div style={{
          position: 'fixed',
          left: 0,
          right: 0,
          top: 80,
          zIndex: 10000,
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none'
        }}>
          <div style={{
            background: '#fff7e6',
            color: '#e67e22',
            border: '2px solid #e67e22',
            borderRadius: 12,
            padding: '1rem 2rem',
            fontWeight: 700,
            fontSize: '1.1rem',
            boxShadow: '0 2px 12px rgba(230,126,34,0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            pointerEvents: 'auto'
          }}>
            <span style={{ fontSize: '1.5rem' }}>⏹️</span>
            Recording canceled. You can try again.
          </div>
        </div>
      )}


      {/* Floating Panel Toggle Buttons */}
      {!showShortFeedbackPanel && (
        <button
          onClick={() => setShowShortFeedbackPanel(true)}
          style={{
            position: 'fixed',
            left: '1rem',
            top: '6rem',
            background: 'var(--blue-secondary)',
            color: '#fff',
            border: 'none',
            borderRadius: '12px 0 0 12px',
            padding: '1.25rem 0.75rem',
            fontSize: '1.4rem',
            cursor: 'pointer',
            fontWeight: 600,
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 16px rgba(60,76,115,0.25)',
            zIndex: 1000,
            fontFamily: 'Montserrat, Arial, sans-serif',
            bottom: '3rem'
          }}
          title="Show Short Feedback Panel"
        >
          💡
        </button>
      )}

      {/* Topic Selection Modal */}
      <TopicSelectionModal
        isOpen={showTopicModal}
        onClose={() => setShowTopicModal(false)}
        onStartConversation={handleModalConversationStart}
        currentLanguage={language}
      />

      {/* Persona Modal */}
      <PersonaModal
        isOpen={showPersonaModal}
        onClose={cancelPersona}
        onSave={savePersona}
        isSaving={isSavingPersona}
        currentTopics={userPreferences?.topics || []}
        currentDescription={conversationDescription}
        currentFormality={userPreferences?.formality || 'neutral'}
      />

      {/* Grammarly-style popup for word explanations */}
      {activePopup && (
        <div
          data-popup="true"
          style={{
            position: 'fixed',
            left: Math.max(10, Math.min(window.innerWidth - 320, activePopup.position.x)),
            top: Math.max(10, activePopup.position.y - 60),
            transform: 'translateX(-50%)',
            backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
            border: `1px solid ${isDarkMode ? '#475569' : '#e2e8f0'}`,
            borderRadius: '8px',
            padding: '12px 16px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
            maxWidth: '300px',
            fontSize: '14px',
            lineHeight: '1.4',
            color: isDarkMode ? '#e2e8f0' : '#1e293b',
            pointerEvents: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ fontWeight: 400, marginBottom: '4px', color: isDarkMode ? '#cbd5e1' : '#475569', fontSize: '13px' }}>
            {activePopup.wordKey.replace(/[__~~==<<>>]/g, '')}
          </div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
            {(() => {
              const translation = quickTranslations[activePopup.messageIndex]?.wordTranslations[activePopup.wordKey];
              console.log('Popup translation lookup:', { 
                messageIndex: activePopup.messageIndex, 
                wordKey: activePopup.wordKey, 
                translation, 
                allTranslations: quickTranslations[activePopup.messageIndex]?.wordTranslations,
                availableKeys: Object.keys(quickTranslations[activePopup.messageIndex]?.wordTranslations || {})
              });
              return translation || feedbackExplanations[activePopup.messageIndex]?.[activePopup.wordKey] || 'No translation available';
            })()}
          </div>
          {/* Arrow pointing down to the word */}
          <div
            style={{
              position: 'absolute',
              bottom: '-6px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: `6px solid ${isDarkMode ? '#1e293b' : '#ffffff'}`,
              filter: `drop-shadow(0 1px 1px ${isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'})`
            }}
          />
        </div>
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
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: isDarkMode ? '#1e293b' : '#ffffff',
            padding: '1rem',
            borderRadius: '12px',
            maxWidth: '500px',
            width: '85%',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            border: isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0'
          }}>
            {/* Header - Different messages based on level-ups */}
            {progressData.levelUpEvents && progressData.levelUpEvents.length > 0 ? (
              // Congratulations header for level-ups
              <div style={{
                textAlign: 'center',
                marginBottom: '1rem'
              }}>
                <div style={{
                  fontSize: '1.5rem',
                  marginBottom: '0.3rem',
                  animation: 'bounce 1s ease-in-out'
                }}>
                  🎉
                </div>
                <div style={{
                  color: 'var(--foreground)',
                  fontSize: '1rem',
                  fontWeight: 700,
                  marginBottom: '0.3rem',
                  fontFamily: 'Gabriela, Arial, sans-serif'
                }}>
                  Congratulations! You've Leveled Up!
                </div>
                <div style={{
                  color: 'var(--muted-foreground)',
                  fontSize: '0.8rem',
                  fontFamily: 'AR One Sans, Arial, sans-serif'
                }}>
                  Your hard work paid off! Here's what you achieved:
                </div>
              </div>
            ) : (
              // Keep practicing header for no level-ups
              <div style={{
                textAlign: 'center',
                marginBottom: '1rem'
              }}>
                <div style={{
                  fontSize: '2rem',
                  marginBottom: '0.4rem'
                }}>
                  📊
                </div>
                <div style={{
                  color: 'var(--foreground)',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  marginBottom: '0.4rem',
                  fontFamily: 'Gabriela, Arial, sans-serif'
                }}>
                  Keep Practicing!
                </div>
                <div style={{
                  color: 'var(--muted-foreground)',
                  fontSize: '0.85rem',
                  fontFamily: 'AR One Sans, Arial, sans-serif'
                }}>
                  Here's your current progress on your learning goals:
                </div>
              </div>
            )}

            {/* Progress Section - Always show all subgoals */}
            <div style={{
              marginTop: '0.3rem',
              padding: '0.75rem',
              background: 'linear-gradient(135deg, rgba(126,90,117,0.1) 0%, rgba(126,90,117,0.05) 100%)',
              borderRadius: '12px',
              border: '1px solid rgba(126,90,117,0.2)',
              overflow: 'hidden'
            }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {progressData.subgoalNames.map((subgoalName, index) => {
                  console.log(`[DEBUG] Progress modal - index ${index}:`, {
                    subgoalName,
                    percentage: progressData.percentages ? progressData.percentages[index] : 'undefined',
                    allPercentages: progressData.percentages,
                    progressDataKeys: Object.keys(progressData),
                    percentagesLength: progressData.percentages?.length,
                    index: index,
                    progressDataType: typeof progressData,
                    percentagesType: typeof progressData.percentages,
                    isArray: Array.isArray(progressData.percentages)
                  });
                  
                  // Check if this subgoal has a level up event
                  const levelUpEvent = progressData.levelUpEvents?.find(event => 
                    event.subgoalId === progressData.subgoalIds[index]
                  );
                  
                  return (
                    <div key={index} style={{
                      background: 'var(--card)',
                      borderRadius: '8px',
                      padding: '0.5rem',
                      border: levelUpEvent ? '1px solid rgba(126,90,117,0.3)' : '1px solid rgba(126,90,117,0.15)',
                      animation: `slideInUp 0.6s ease-out ${index * 0.2}s both`,
                      position: 'relative',
                      ...(levelUpEvent && {
                        background: 'linear-gradient(135deg, rgba(126,90,117,0.05) 0%, rgba(126,90,117,0.02) 100%)',
                        border: '1px solid rgba(126,90,117,0.3)'
                      })
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        marginBottom: '0.5rem'
                      }}>
                        <div style={{
                          background: levelUpEvent ? 'var(--rose-primary)' : 'var(--rose-accent)',
                          color: '#fff',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          fontFamily: 'Montserrat, Arial, sans-serif'
                        }}>
                          {index + 1}
                        </div>
                        <div style={{
                          color: 'var(--foreground)',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          fontFamily: 'Gabriela, Arial, sans-serif'
                        }}>
                          {subgoalName}
                        </div>
                        {/* Always display level separately with consistent styling */}
                        <div style={{
                          color: 'var(--rose-accent)',
                          fontSize: '0.7rem',
                          fontWeight: 500,
                          fontFamily: 'Montserrat, Arial, sans-serif',
                          marginTop: '0.2rem'
                        }}>
                          {(() => {
                            // Check if there's a level-up event for this subgoal
                            const levelUpEvent = progressData.levelUpEvents?.find(event => 
                              progressData.subgoalIds && event.subgoalId === progressData.subgoalIds[index]
                            );
                            
                            if (levelUpEvent) {
                              // If there's a level-up event, show the previous level
                              return `Level ${levelUpEvent.oldLevel + 1}`;
                            } else {
                              // Calculate level from subgoal ID (this would need access to userSubgoalProgress)
                              // For now, default to Level 1 for level 0 subgoals
                              return 'Level 1';
                            }
                          })()}
                        </div>
                        {levelUpEvent && (
                          <div style={{
                            background: 'var(--rose-primary)',
                            color: '#fff',
                            borderRadius: '12px',
                            padding: '0.2rem 0.5rem',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            fontFamily: 'Montserrat, Arial, sans-serif',
                            marginLeft: 'auto'
                          }}>
                            LEVEL UP!
                          </div>
                        )}
                      </div>
                      
                      {/* Progress Section */}
                      <div style={{ marginBottom: '0.5rem' }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '0.3rem'
                        }}>
                          <div style={{
                            color: 'var(--muted-foreground)',
                            fontSize: '0.75rem',
                            fontFamily: 'Montserrat, Arial, sans-serif'
                          }}>
                            {levelUpEvent ? `Level ${levelUpEvent.oldLevel + 1} → Level ${levelUpEvent.newLevel + 1}` : 'Current Progress'}
                          </div>
                          <div style={{
                            color: 'var(--rose-primary)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            fontFamily: 'Montserrat, Arial, sans-serif'
                          }}>
                            {levelUpEvent ? '100%' : (progressData.percentages && progressData.percentages[index] !== undefined ? progressData.percentages[index] : 0) + '%'}
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div style={{
                          width: '100%',
                          height: '6px',
                          background: 'rgba(126,90,117,0.1)',
                          borderRadius: '3px',
                          overflow: 'hidden',
                          position: 'relative'
                        }}>
                          <div style={{
                            width: `${progressData.percentages && progressData.percentages[index] ? progressData.percentages[index] : 0}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, var(--rose-primary) 0%, #8a6a7a 100%)',
                            borderRadius: '4px',
                            animation: 'progressFill 1.5s ease-out 0.5s both',
                            transform: 'translateZ(0)',
                            ['--target-width']: `${progressData.percentages && progressData.percentages[index] ? progressData.percentages[index] : 0}%`
                          } as React.CSSProperties} />
                        </div>
                      </div>
                      
                      {/* Level Transition for level up events */}
                      {levelUpEvent && (
                        <div style={{
                          background: 'rgba(126,90,117,0.05)',
                          borderRadius: '6px',
                          padding: '0.4rem',
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
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
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
    </div>
  );
}

export default Analyze;