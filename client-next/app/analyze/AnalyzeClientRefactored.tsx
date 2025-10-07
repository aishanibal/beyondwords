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
import { getUserLanguageDashboards } from '../../lib/api';
import ChatMessageItem from './ChatMessageItem';

// Import the new components
import AnalyzeLayout from './components/AnalyzeLayout';
import MainContentArea from './components/MainContentArea';
import ChatMessagesContainer from './components/ChatMessagesContainer';
import SuggestionCarousel from './components/SuggestionCarousel';
import RightPanel from './components/RightPanel';
import ProgressModal from './components/ProgressModal';
import WordExplanationPopup from './components/WordExplanationPopup';

// Import hooks
import { usePersistentChatHistory } from './hooks/useChatHistory';
import { useAudioRecording } from './hooks/useAudioRecording';
import { useTTS } from './hooks/useTTS';
import { useSuggestions } from './hooks/useSuggestions';
import { useAudioHandlers } from './hooks/useAudioHandlers';
import { useConversationManagement } from './hooks/useConversationManagement';
import { useMessageInteractions } from './hooks/useMessageInteractions';

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
import { renderClickableMessage, getSessionMessages } from './utils/messageUtils';
import { explainLLMResponse } from './services/messageService';

// Import services
import { getAuthHeaders, fetchUserDashboardPreferences } from './services/conversationService';

// Import constants
import { MESSAGES_PER_PAGE, DEFAULT_PANEL_WIDTHS } from './config/constants';


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
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [enableShortFeedback, setEnableShortFeedback] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationDescription, setConversationDescription] = useState('');
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [isSavingPersona, setIsSavingPersona] = useState(false);
  const [loadedConversationId, setLoadedConversationId] = useState<string | null>(null);
  
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
  const [shortFeedbackTTSQueued, setShortFeedbackTTSQueued] = useState<{ text: string; language: string; cacheKey: string } | null>(null);

  // Suggestions state - now handled by useSuggestions hook

  // Translation state
  const [showTranslations, setShowTranslations] = useState<Record<number, boolean>>({});
  const [isTranslating, setIsTranslating] = useState<Record<number, boolean>>({});
  const [translations, setTranslations] = useState<Record<number, { translation?: string; breakdown?: string; has_breakdown?: boolean }>>({});
  // Suggestion translation state - now handled by useSuggestions hook

  // UI panels state
  const [showShortFeedbackPanel, setShowShortFeedbackPanel] = useState(true);
  const [leftPanelWidth, setLeftPanelWidth] = useState(0.2); // 20% of screen width
  
  // Calculate actual panel widths based on visibility - memoized to prevent unnecessary re-renders
  const panelWidths = useMemo(() => {
    const visiblePanels = [showShortFeedbackPanel, true].filter(Boolean).length;
    
    if (visiblePanels === 1) {
      // Only middle panel visible
      return { left: 0, center: 1, right: 0 };
    } else {
      // Left and middle panels visible - allow resizing between them
      // Limit left panel to maximum 1/3 (33.33%) of screen width
      const maxLeftWidth = 1/3; // 33.33%
      const constrainedLeftWidth = Math.min(leftPanelWidth, maxLeftWidth);
      const centerWidth = 1 - constrainedLeftWidth; // Center takes remaining space
      return { left: constrainedLeftWidth, center: centerWidth, right: 0 };
    }
  }, [showShortFeedbackPanel, leftPanelWidth]);
  
  // Left panel content state - all from original
  const [shortFeedback, setShortFeedback] = useState<string>('');
  const [shortFeedbacks, setShortFeedbacks] = useState<Record<number, string>>({});
  const [showQuickTranslation, setShowQuickTranslation] = useState<boolean>(true);
  const [llmBreakdown, setLlmBreakdown] = useState<string>('');
  const [showLlmBreakdown, setShowLlmBreakdown] = useState<boolean>(false);
  const [isLoadingExplain, setIsLoadingExplain] = useState<boolean>(false);

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
  
  // Auto TTS queue state
  const [isPlayingShortFeedbackTTS, setIsPlayingShortFeedbackTTS] = useState(false);
  const [isPlayingAITTS, setIsPlayingAITTS] = useState(false);
  const [hasPlayedInitialTTS, setHasPlayedInitialTTS] = useState(false);
  const [lastTTSMessageId, setLastTTSMessageId] = useState<string | null>(null);
  // Progress tracking state
  const [userProgress, setUserProgress] = useState<{ [goalId: string]: SubgoalProgress }>({});
  const [learningGoals, setLearningGoals] = useState<LearningGoal[]>([]);

  // Detailed feedback state
  const [showDetailedBreakdown, setShowDetailedBreakdown] = useState<{[key: number]: boolean}>({});
  const [parsedBreakdown, setParsedBreakdown] = useState<any[]>([]);
  const [activePopup, setActivePopup] = useState<{ messageIndex: number; wordKey: string; position: { x: number; y: number } } | null>(null);

  // Quick translations state - now handled by messageInteractions hook

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

  // Refs - all from original
  const recognitionRef = useRef<any>(null);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const autoSpeakRef = useRef<boolean>(false);
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
  
  // Use suggestions hook
  const suggestions = useSuggestions(
    user,
    language,
    conversationId,
    userPreferences,
    chatHistory,
    formatScriptLanguageText
  );

  // Use conversation management hook
  const conversationManagement = useConversationManagement(
    user,
    language,
    urlConversationId,
    chatHistory,
    setChatHistory,
    setConversationId,
    setConversationDescription,
    setSessionStartTime,
    setUserPreferences,
    setShowProgressModal,
    setProgressData,
    setUserProgress,
    userProgress
  );

  // Use audio handlers hook
  const audioHandlers = useAudioHandlers(
    user,
    language,
    conversationId,
    userPreferences,
    chatHistory,
    setChatHistory,
    setIsProcessing,
    autoSpeak,
    enableShortFeedback,
    isAnyTTSPlaying,
    setIsAnyTTSPlaying,
    setAiTTSQueued,
    setShortFeedback,
    setIsPlayingShortFeedbackTTS,
    setShortFeedbackTTSQueued,
    suggestions.clearSuggestionCarousel
  );

  // Use message interactions hook
  const messageInteractions = useMessageInteractions(language);

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

  // Load conversation when URL conversation ID is available
  useEffect(() => {
    if (urlConversationId && user && !isLoadingConversation && loadedConversationId !== urlConversationId) {
      console.log('[CONVERSATION_LOAD] Loading conversation from URL:', urlConversationId);
      console.log('[CONVERSATION_LOAD] Current conversationId:', conversationId);
      console.log('[CONVERSATION_LOAD] Loaded conversationId:', loadedConversationId);
      
      setLoadedConversationId(urlConversationId);
      conversationManagement.loadConversation(urlConversationId);
    }
  }, [urlConversationId, user, isLoadingConversation, loadedConversationId, conversationId, conversationManagement]);

  // Reset loaded conversation ID when URL changes to empty (new conversation)
  useEffect(() => {
    if (!urlConversationId && loadedConversationId) {
      console.log('[CONVERSATION_LOAD] URL conversation ID cleared, resetting loaded conversation ID');
      setLoadedConversationId(null);
      setHasPlayedInitialTTS(false); // Reset TTS flag for new conversations
      setLastTTSMessageId(null); // Reset TTS message tracking
    }
  }, [urlConversationId, loadedConversationId]);

  // Add global click handler for word clicks and popup management
  useEffect(() => {
    // Add click handler to close popup when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      if (target && target.closest('[data-popup="true"]')) {
        return; // Don't hide if clicking on popup
      }
      
      if (target && target.closest('[data-clickable-word="true"]')) {
        return; // Don't hide if clicking on a word
      }
      
      setActivePopup(null);
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle persona data when using a persona - from original
  useEffect(() => {
    if (usePersona && user) {
      setIsUsingPersona(true); // Set flag that we're using an existing persona
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

  // Handle existing conversations - check if they were using a persona
  useEffect(() => {
    if (urlConversationId && !usePersona && user) {
      // For existing conversations, check if they were using a persona
      // This would require a backend call to check conversation metadata
      // For now, we'll assume existing conversations without usePersona flag are new conversations
      console.log('[PERSONA] Existing conversation without persona flag - will show persona modal');
    }
  }, [urlConversationId, usePersona, user]);

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

  // Show topic modal for new conversations only
  useEffect(() => {
    // Add a small delay to ensure URL parameters are fully loaded
    const timer = setTimeout(() => {
      console.log('[TOPIC_MODAL] Checking conditions:', {
        urlConversationId,
        user: !!user,
        isLoadingConversation,
        conversationId,
        chatHistoryLength: chatHistory.length,
        urlParamsConversationId: urlParams.conversationId
      });

      // Show topic modal if:
      // 1. No URL conversation ID (new conversation)
      // 2. User is authenticated
      // 3. Not currently loading a conversation
      // 4. No current conversation ID
      // 5. No chat history
      if (!urlConversationId && user && !isLoadingConversation && !conversationId && chatHistory.length === 0) {
        console.log('[TOPIC_MODAL] Showing topic modal - new conversation');
        setShowTopicModal(true);
      } else if (urlConversationId) {
        // If we have a URL conversation ID, hide topic modal (existing conversation)
        console.log('[TOPIC_MODAL] Hiding topic modal - existing conversation from URL');
        setShowTopicModal(false);
      } else if (conversationId && chatHistory.length > 0) {
        // If we have a loaded conversation with messages, hide topic modal
        console.log('[TOPIC_MODAL] Hiding topic modal - conversation loaded with messages');
        setShowTopicModal(false);
      }
    }, 200); // Increased delay to ensure URL params are loaded

    return () => clearTimeout(timer);
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

  // Play TTS for initial AI message ONLY for new conversations (not existing ones)
  useEffect(() => {
    // Only play TTS for new conversations (no conversationId in URL) and only once
    if (chatHistory.length === 1 && user && !isProcessing && !urlConversationId && !hasPlayedInitialTTS) {
      const firstMessage = chatHistory[0];
      if (firstMessage.sender === 'AI') {
        setHasPlayedInitialTTS(true); // Mark as played to prevent multiple calls
        
        if (firstMessage.ttsUrl) {
          console.log('🔍 [INITIAL_TTS] Playing TTS for initial AI message in new conversation:', firstMessage.ttsUrl);
          // Play the existing TTS URL
          audioHandlers.handlePlayExistingTTS(firstMessage.ttsUrl).catch(error => {
            console.error('🔍 [INITIAL_TTS] Error playing existing TTS:', error);
          });
        } else {
          console.log('🔍 [INITIAL_TTS] Generating TTS for initial AI message in new conversation');
          // Generate TTS for the initial message
          const ttsText = firstMessage.romanizedText || firstMessage.text;
          audioHandlers.handlePlayTTS(ttsText, language).catch(error => {
            console.error('🔍 [INITIAL_TTS] Error playing initial AI TTS:', error);
          });
        }
      }
    }
  }, [chatHistory, user, isProcessing, language, audioHandlers, urlConversationId, hasPlayedInitialTTS]);

  // Auto-play TTS for new AI messages (not from database)
  useEffect(() => {
    if (chatHistory.length > 0 && user && !isProcessing) {
      const lastMessage = chatHistory[chatHistory.length - 1];
      
      // Create a unique ID for this message to prevent duplicate TTS calls
      const messageId = `${lastMessage.timestamp.getTime()}_${lastMessage.text.substring(0, 50)}`;
      
      // Only play TTS for new AI messages (not from original conversation) and only once per message
      if (lastMessage.sender === 'AI' && 
          !lastMessage.isFromOriginalConversation && 
          lastTTSMessageId !== messageId) {
        
        // Only trigger auto TTS if NOT in autospeak mode
        // In autospeak mode, TTS is handled by the queue system
        if (!autoSpeak) {
          console.log('🔍 [AUTO_TTS] New AI message detected, playing TTS (manual mode)');
          setLastTTSMessageId(messageId); // Mark this message as having TTS played
          
          if (lastMessage.ttsUrl) {
            // Play existing TTS URL
            audioHandlers.handlePlayExistingTTS(lastMessage.ttsUrl).catch(error => {
              console.error('🔍 [AUTO_TTS] Error playing existing TTS:', error);
            });
          } else {
            // Generate new TTS
            const ttsText = lastMessage.romanizedText || lastMessage.text;
            audioHandlers.handlePlayTTS(ttsText, language).catch(error => {
              console.error('🔍 [AUTO_TTS] Error playing new AI TTS:', error);
            });
          }
        } else {
          console.log('🔍 [AUTO_TTS] New AI message detected, but autospeak mode - TTS handled by queue');
          setLastTTSMessageId(messageId); // Still mark as processed to prevent duplicate triggers
        }
      }
    }
  }, [chatHistory, user, isProcessing, language, audioHandlers, lastTTSMessageId]);

  // Handle AI TTS playback when short feedback TTS finishes (auto TTS queue)
  useEffect(() => {
    if (!isPlayingShortFeedbackTTS && aiTTSQueued && !isPlayingAITTS && autoSpeak) {
      console.log('[DEBUG] Short feedback TTS finished, playing AI TTS');
      setIsPlayingAITTS(true);
      
      const playAITTS = async () => {
        try {
          await audioHandlers.handlePlayTTS(aiTTSQueued.text, aiTTSQueued.language);
          console.log('[DEBUG] AI TTS finished');
        } catch (error) {
          console.error('[DEBUG] Error playing AI TTS:', error);
        } finally {
          setIsPlayingAITTS(false);
          setAiTTSQueued(null);
          
          // Restart recording after AI TTS is completely done
          if (autoSpeak) {
            console.log('[DEBUG] AI TTS finished, restarting recording');
            setTimeout(() => {
              if (autoSpeak && !isAnyTTSPlaying) {
                console.log('[DEBUG] Starting recording after AI TTS completion');
                audioHandlers.handleStartRecording();
              }
            }, 300);
          }
        }
      };
      
      playAITTS();
    }
  }, [isPlayingShortFeedbackTTS, aiTTSQueued, isPlayingAITTS, autoSpeak, isAnyTTSPlaying, audioHandlers]);

  // Handle short feedback TTS playback when AI response TTS finishes (auto TTS queue)
  useEffect(() => {
    if (!isPlayingAITTS && shortFeedbackTTSQueued && !isPlayingShortFeedbackTTS && autoSpeak) {
      console.log('[DEBUG] AI response TTS finished, playing short feedback TTS');
      setIsPlayingShortFeedbackTTS(true);
      setIsAnyTTSPlaying(true);
      
      const playShortFeedbackTTS = async () => {
        try {
          await audioHandlers.handlePlayTTS(shortFeedbackTTSQueued.text, shortFeedbackTTSQueued.language);
          console.log('[DEBUG] Short feedback TTS finished');
        } catch (error) {
          console.error('[DEBUG] Error playing short feedback TTS:', error);
        } finally {
          setIsPlayingShortFeedbackTTS(false);
          setIsAnyTTSPlaying(false);
          setShortFeedbackTTSQueued(null);
          
          // Restart recording after short feedback TTS is completely done
          if (autoSpeak) {
            console.log('[DEBUG] Short feedback TTS finished, restarting recording');
            setTimeout(() => {
              if (autoSpeak && !isAnyTTSPlaying) {
                console.log('[DEBUG] Starting recording after short feedback TTS completion');
                audioHandlers.handleStartRecording();
              }
            }, 300);
          }
        }
      };
      
      playShortFeedbackTTS();
    }
  }, [isPlayingAITTS, shortFeedbackTTSQueued, isPlayingShortFeedbackTTS, autoSpeak, isAnyTTSPlaying, audioHandlers]);

  // Suggestions functions are now handled by useSuggestions hook







  // Event handlers - using new hooks
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

  // Helper function to render formatted text with color-coded underlines and clickable popups
  const renderFormattedText = (text: string, messageIndex: number) => {
    console.log('[DEBUG] renderFormattedText called with:', text);
    if (!text) return text;
    
    // Test if the text contains any formatting markers
    const hasFormatting = text.includes('__') || text.includes('~~') || text.includes('==') || text.includes('<<');
    console.log('[DEBUG] Text has formatting markers:', hasFormatting);
    
    if (!hasFormatting) {
      return text;
    }
    
    // Process the text to create clickable elements
    let result = text;
    
    // Replace formatting markers with HTML
    result = result.replace(/__([^_]+)__/g, '<span style="text-decoration: underline; text-decoration-color: #ff6b6b; cursor: pointer;" data-clickable-word="true" data-word="$1" data-message-index="' + messageIndex + '">$1</span>');
    result = result.replace(/~~([^~]+)~~/g, '<span style="text-decoration: underline; text-decoration-color: #4ecdc4; cursor: pointer;" data-clickable-word="true" data-word="$1" data-message-index="' + messageIndex + '">$1</span>');
    result = result.replace(/==([^=]+)==/g, '<span style="text-decoration: underline; text-decoration-color: #45b7d1; cursor: pointer;" data-clickable-word="true" data-word="$1" data-message-index="' + messageIndex + '">$1</span>');
    result = result.replace(/<<([^>]+)>>/g, '<span style="text-decoration: underline; text-decoration-color: #f9ca24; cursor: pointer;" data-clickable-word="true" data-word="$1" data-message-index="' + messageIndex + '">$1</span>');
    
    return (
      <span 
        dangerouslySetInnerHTML={{ __html: result }} 
      />
    );
  };

  // Helper function to extract corrected version from feedback
  const extractCorrectedVersion = (feedback: string): { mainText: string; romanizedText?: string } | null => {
    if (!feedback) return null;
    
    // Find the corrected version section
    const correctedMatch = feedback.match(/\*\*Corrected Version\*\*\s*\n([\s\S]*?)(?=\n\n|$)/);
    if (!correctedMatch) return null;
    
    const correctedText = correctedMatch[1].trim();
    
    // Check if there's romanized text in parentheses
    const romanizedMatch = correctedText.match(/^(.+?)\s*\(([^)]+)\)$/);
    if (romanizedMatch) {
      return {
        mainText: romanizedMatch[1].trim(),
        romanizedText: romanizedMatch[2].trim()
      };
    }
    
    return { mainText: correctedText };
  };

  // Event handlers - using message interactions hook
  const handleRequestDetailedFeedback = async (messageIndex: number) => {
    const message = chatHistory[messageIndex];
    if (message) {
      await messageInteractions.handleRequestDetailedFeedback(
        messageIndex, 
        message.text, 
        chatHistory, 
        userPreferences,
        conversationId,
        setChatHistory,
        (languageCode: string) => fetchUserDashboardPreferences(languageCode, (user as any)?.id),
        setUserPreferences
      );
    }
  };

  const handleRequestShortFeedback = async (messageIndex: number) => {
    const message = chatHistory[messageIndex];
    if (message) {
      await messageInteractions.handleRequestShortFeedback(messageIndex, message.text);
    }
  };

  const handleRequestDetailedBreakdown = async (messageIndex: number) => {
    const message = chatHistory[messageIndex];
    if (message) {
      await messageInteractions.handleRequestDetailedBreakdown(messageIndex, message.text);
    }
  };

  const handleToggleDetailedFeedback = (messageIndex: number) => {
    messageInteractions.handleToggleDetailedFeedback(messageIndex);
  };

  const handleToggleShortFeedback = (messageIndex: number) => {
    messageInteractions.handleToggleShortFeedback(messageIndex);
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
        
        // Simple parsing: look for "script \/ romanized -- translation" format
        if (trimmedLine.includes(' / ') && trimmedLine.includes(' -- ')) {
          console.log('Found script/romanized format:', trimmedLine);
          const parts = trimmedLine.split(' -- ');
          if (parts.length === 2) {
            const leftSide = parts[0].trim();
            const translation = parts[1].trim();
            
            // Split left side on " \/ " to get script and romanized
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

  const handleQuickTranslation = async (messageIndex: number, text: string) => {
    console.log('[DEBUG] handleQuickTranslation() called with messageIndex:', messageIndex, 'text:', text);
    
    if (messageInteractions.isLoadingMessageFeedback[messageIndex]) {
      console.log('[DEBUG] Already loading, returning early');
      return;
    }
    
    try {
      const token = localStorage.getItem('jwt');
      const requestData = {
        ai_message: text,
        chat_history: chatHistory,
        language: language,
        user_level: userPreferences?.userLevel || 'beginner',
        user_topics: userPreferences?.topics || [],
        formality: userPreferences?.formality || 'friendly',
        feedback_language: userPreferences?.feedbackLanguage || 'en',
        user_goals: (user as any)?.learning_goals ? (typeof (user as any).learning_goals === 'string' ? JSON.parse((user as any).learning_goals) : (user as any).learning_goals) : [],
        description: conversationDescription
      };
      
      console.log('[DEBUG] Current userPreferences:', userPreferences);
      
      const response = await axios.post('/api/quick_translation', requestData, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      
      const result = response.data;
      console.log('[DEBUG] handleQuickTranslation() received response:', result);
      
      const translationText = result.translation;
      console.log('[DEBUG] Raw Gemini translation text:', translationText);
      
      const parsedTranslation = parseQuickTranslation(translationText);
      console.log('[DEBUG] Parsed translation:', parsedTranslation);
      
      // Handle translation result
      if (!translationText || Object.keys(parsedTranslation.wordTranslations).length === 0) {
        console.log('[DEBUG] No translation received, setting error state');
        messageInteractions.setQuickTranslations(prev => ({ 
          ...prev, 
          [messageIndex]: { 
            fullTranslation: 'Translation failed - please try again', 
            wordTranslations: {},
            romanized: '',
            error: true,
            generatedWords: [],
            generatedScriptWords: []
          } 
        }));
      } else {
        console.log('[DEBUG] Translation received successfully, setting parsed translation');
        messageInteractions.setQuickTranslations(prev => ({ ...prev, [messageIndex]: parsedTranslation }));
      }
      
    } catch (error) {
      console.error('Quick translation error:', error);
      messageInteractions.setQuickTranslations(prev => ({ 
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
    }
  };

  const handleExplainLLMResponse = async (messageIndex: number, text: string) => {
    // Prevent multiple simultaneous requests
    if (isLoadingExplain) {
      console.log('[DEBUG] Explain request already in progress, ignoring');
      return;
    }
    
    // This function is now used for the explain button in the translation panel
    // It should call the detailed breakdown function
    try {
      setIsLoadingExplain(true);
      
      // Call the detailed breakdown function
      await handleRequestDetailedBreakdown(messageIndex);
      
    } catch (error) {
      console.error('Error explaining LLM response:', error);
    } finally {
      setIsLoadingExplain(false);
    }
  };

  // Wrapper function for renderClickableMessage with additional parameters
  const renderClickableMessageWrapper = (message: any, messageIndex: number, translation: any) => {
    return renderClickableMessage(message, messageIndex, translation, setActivePopup, isDarkMode, userPreferences, language);
  };

  // Wrapper function for playTTS with cacheKey parameter
  const playTTSWrapper = (text: string, language: string, cacheKey: string) => {
    return audioHandlers.handlePlayTTS(text, language);
  };

  // Wrapper function for playTTS with only 2 parameters (for ChatMessagesContainer)
  const playTTSWrapper2 = (text: string, language: string) => {
    return audioHandlers.handlePlayTTS(text, language);
  };

  // Handle end chat functionality
  const handleEndChat = async () => {
    console.log('🏁 [END_CHAT] End chat initiated');
    console.log('🏁 [END_CHAT] isNewPersona:', isNewPersona);
    console.log('🏁 [END_CHAT] isUsingPersona:', isUsingPersona);
    console.log('🏁 [END_CHAT] conversationDescription:', conversationDescription);
    
    // Check if there are any user messages in the chat history
    const userMessages = chatHistory.filter(msg => msg.sender === 'User');
    
    console.log('🏁 [END_CHAT] Chat history:', chatHistory.length);
    console.log('🏁 [END_CHAT] User messages:', userMessages.length);
    console.log('🏁 [END_CHAT] Conversation ID:', conversationId);
    
    // For new conversations (no conversationId), always generate title and progress
    // even if there are no user messages, so it shows up in recent conversations
    const isNewConversation = !conversationId;
    
    if (userMessages.length === 0 && !isNewConversation) {
      console.log('🏁 [END_CHAT] No user messages in existing conversation, navigating to dashboard without evaluation');
      router.push('/dashboard');
      return;
    }
    
    // Show persona modal unless we're using an existing persona
    if (!isUsingPersona) {
      console.log('🏁 [END_CHAT] Showing persona modal - no existing persona being used');
      setShowPersonaModal(true);
    } else {
      console.log('🏁 [END_CHAT] Skipping persona modal - using existing persona');
      // Generate conversation summary (progress modal will handle navigation if needed)
      try {
        // For new conversations, always generate summary even if chatHistory is empty
        // This ensures the conversation gets a title and shows up in recent conversations
        if (chatHistory.length > 0 || isNewConversation) {
          console.log('🏁 [END_CHAT] Calling generateSummary...');
          const progressModalShown = await conversationManagement.generateSummary(
            chatHistory,
            userPreferences?.topics || [],
            userPreferences?.formality || 'friendly',
            conversationId || ''
          );
          // Progress modal will handle navigation if learning goals exist
          // If no learning goals, navigate to dashboard
          if (!progressModalShown) {
            console.log('🏁 [END_CHAT] No progress modal shown, navigating to dashboard');
            router.push('/dashboard');
          }
        } else {
          console.log('🏁 [END_CHAT] No chat history in existing conversation, navigating to dashboard');
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('🏁 [END_CHAT] Error generating conversation summary:', error);
        router.push('/dashboard');
      }
    }
  };

  // Save persona functionality
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
        userId: (user as any)?.id
      };

      // Save persona to database
      const response = await axios.post('/api/personas', personaData, {
        headers: await getAuthHeaders()
      });

      if (response.status === 201) {
        // Update the conversation to mark it as using a persona
        if (conversationId) {
          try {
            await axios.patch(`/api/conversations/${conversationId}`, {
              uses_persona: true,
              persona_id: response.data.persona.id
            }, {
              headers: await getAuthHeaders()
            });
          } catch (error) {
            console.error('Error updating conversation with persona info:', error);
          }
        }
        
        // Close modal
        setShowPersonaModal(false);
        
        // Generate conversation summary after saving persona
        try {
          // Check if there are any user messages in the chat history
          const userMessages = chatHistory.filter(msg => msg.sender === 'User');
          
          console.log('Session messages in savePersona:', chatHistory.length);
          console.log('User session messages in savePersona:', userMessages.length);
          console.log('Conversation ID in savePersona:', conversationId);
          
          // For new conversations, always generate title and progress even if no user messages
          // so it shows up in recent conversations section
          const isNewConversation = !conversationId;
          
          if (userMessages.length === 0 && !isNewConversation) {
            console.log('No user messages in existing conversation, navigating to dashboard without evaluation');
            router.push('/dashboard');
            return;
          }
          
          // For new conversations, always generate summary even if chatHistory is empty
          // This ensures the conversation gets a title and shows up in recent conversations
          if (chatHistory.length > 0 || isNewConversation) {
            const progressModalShown = await conversationManagement.generateSummary(
              chatHistory,
              userPreferences?.topics || [],
              userPreferences?.formality || 'friendly',
              conversationId || ''
            );
            // Progress modal will handle navigation if learning goals exist
            // If no learning goals, navigate to dashboard
            if (!progressModalShown) {
              router.push('/dashboard');
            }
          } else {
            router.push('/dashboard');
          }
        } catch (error) {
          console.error('Error generating conversation summary:', error);
          router.push('/dashboard');
        }
      }
    } catch (error) {
      console.error('Error saving persona:', error);
    } finally {
      setIsSavingPersona(false);
    }
  };

  // Initialize MediaRecorder and SpeechRecognition classes - from original
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioHandlers.MediaRecorderClassRef.current = window.MediaRecorder;
      audioHandlers.SpeechRecognitionClassRef.current = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!audioHandlers.MediaRecorderClassRef.current) {
        console.warn('MediaRecorder API not supported in this browser.');
      }
      if (!audioHandlers.SpeechRecognitionClassRef.current) {
        console.warn('SpeechRecognition API not supported in this browser.');
      }
      
      // Check for HTTPS in production
      if (process.env.NODE_ENV === 'production' && window.location.protocol !== 'https:') {
        console.warn('getUserMedia requires HTTPS in production. Audio recording may not work.');
      }
    }
  }, [audioHandlers.MediaRecorderClassRef, audioHandlers.SpeechRecognitionClassRef]);





  // Show loading while loading conversation
  if (isLoadingConversation) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading conversation...</div>
      </div>
    );
  }

  // Show error if conversation failed to load and we have a URL conversation ID
  if (urlConversationId && !conversationId && !isLoadingConversation && chatHistory.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg text-red-600 mb-4">❌ Conversation Not Found</div>
          <div className="text-gray-600 mb-4">
            The conversation with ID {urlConversationId} could not be loaded.
          </div>
          <button 
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <AnalyzeLayout
        isDarkMode={isDarkMode}
        panelWidths={panelWidths}
        showShortFeedbackPanel={showShortFeedbackPanel}
        setShowShortFeedbackPanel={setShowShortFeedbackPanel}
        ttsDebugInfo={ttsDebugInfo}
        setTtsDebugInfo={setTtsDebugInfo}
        romanizationDebugInfo={romanizationDebugInfo}
        setRomanizationDebugInfo={setRomanizationDebugInfo}
        translations={translations}
        showTranslations={showTranslations}
        feedbackExplanations={messageInteractions.feedbackExplanations}
        showDetailedBreakdown={showDetailedBreakdown}
        setShowDetailedBreakdown={setShowDetailedBreakdown}
        parsedBreakdown={parsedBreakdown}
        activePopup={activePopup}
        // Left panel content props
        shortFeedback={shortFeedback}
        quickTranslations={messageInteractions.quickTranslations}
        showQuickTranslation={showQuickTranslation}
        setShowQuickTranslation={setShowQuickTranslation}
        llmBreakdown={llmBreakdown}
        showLlmBreakdown={showLlmBreakdown}
        setShowLlmBreakdown={setShowLlmBreakdown}
        chatHistory={chatHistory}
        isLoadingMessageFeedback={messageInteractions.isLoadingMessageFeedback}
        isLoadingExplain={isLoadingExplain}
        explainLLMResponse={handleExplainLLMResponse}
        handleRequestDetailedBreakdown={handleRequestDetailedBreakdown}
        renderClickableMessage={renderClickableMessageWrapper}
      >
        <MainContentArea 
          isDarkMode={isDarkMode}
          isRecording={audioHandlers.isRecording}
          onStartRecording={audioHandlers.handleStartRecording}
          onStopRecording={audioHandlers.handleStopRecording}
          autoSpeak={autoSpeak}
          setAutoSpeak={setAutoSpeak}
          enableShortFeedback={enableShortFeedback}
          setEnableShortFeedback={setEnableShortFeedback}
          onEndChat={handleEndChat}
        >
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
              onExplainLLMResponse={async (messageIndex: number, text: string) => {
                await handleExplainLLMResponse(messageIndex, text);
              }}
            onPlayTTS={playTTSWrapper2}
            onPlayExistingTTS={audioHandlers.handlePlayExistingTTS}
            translations={translations}
            isTranslating={isTranslating}
            showTranslations={showTranslations}
            showDetailedBreakdown={messageInteractions.showDetailedBreakdown}
            showSuggestionExplanations={{}}
            explainButtonPressed={suggestions.explainButtonPressed}
            parsedBreakdown={parsedBreakdown}
            feedbackExplanations={messageInteractions.feedbackExplanations}
            activePopup={activePopup}
            showCorrectedVersions={messageInteractions.showCorrectedVersions}
            quickTranslations={messageInteractions.quickTranslations}
            showQuickTranslations={messageInteractions.showQuickTranslations}
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
            handleSuggestionButtonClick={suggestions.handleSuggestionButtonClick}
            isLoadingSuggestions={suggestions.isLoadingSuggestions}
            isLoadingMessageFeedback={messageInteractions.isLoadingMessageFeedback}
            isLoadingExplain={isLoadingExplain}
            // Suggestion carousel props
            showSuggestionCarousel={suggestions.showSuggestionCarousel}
            suggestionMessages={suggestions.suggestionMessages}
            currentSuggestionIndex={suggestions.currentSuggestionIndex}
            onNavigateSuggestion={suggestions.navigateSuggestion}
            onExplainSuggestion={suggestions.explainSuggestion}
            onPlaySuggestionTTS={suggestions.playSuggestionTTS}
            isTranslatingSuggestion={suggestions.isTranslatingSuggestion}
            showSuggestionTranslations={suggestions.showSuggestionTranslations}
            suggestionTranslations={suggestions.suggestionTranslations}
          />
          
          
        </MainContentArea>
      </AnalyzeLayout>

      {/* Modals */}
      {showTopicModal && (
        <TopicSelectionModal
          isOpen={showTopicModal}
          onClose={() => setShowTopicModal(false)}
          onStartConversation={conversationManagement.handleModalConversationStart}
          currentLanguage={language}
        />
      )}

      {showPersonaModal && (
        <PersonaModal
          isOpen={showPersonaModal}
          onClose={async () => {
            setShowPersonaModal(false);
            // Generate conversation summary when skipping persona
            try {
              const userMessages = chatHistory.filter(msg => msg.sender === 'User');
              const isNewConversation = !conversationId;
              
              if (userMessages.length === 0 && !isNewConversation) {
                console.log('🏁 [SKIP_PERSONA] No user messages in existing conversation, navigating to dashboard without evaluation');
                router.push('/dashboard');
                return;
              }
              
              if (chatHistory.length > 0 || isNewConversation) {
                console.log('🏁 [SKIP_PERSONA] Calling generateSummary...');
                const progressModalShown = await conversationManagement.generateSummary(
                  chatHistory,
                  userPreferences?.topics || [],
                  userPreferences?.formality || 'friendly',
                  conversationId || ''
                );
                if (!progressModalShown) {
                  console.log('🏁 [SKIP_PERSONA] No progress modal shown, navigating to dashboard');
                  router.push('/dashboard');
                }
              } else {
                console.log('🏁 [SKIP_PERSONA] No chat history in existing conversation, navigating to dashboard');
                router.push('/dashboard');
              }
            } catch (error) {
              console.error('🏁 [SKIP_PERSONA] Error generating conversation summary:', error);
              router.push('/dashboard');
            }
          }}
          onSave={savePersona}
          isSaving={isSavingPersona}
          currentTopics={userPreferences?.topics || []}
          currentDescription={conversationDescription}
          currentFormality={userPreferences?.formality || 'neutral'}
        />
      )}

      {/* Progress Modal */}
      <ProgressModal
        isOpen={showProgressModal}
        onClose={() => {
          setShowProgressModal(false);
          setProgressData(null);
          // Navigate back to dashboard after closing progress modal
          router.push('/dashboard');
        }}
        progressData={progressData}
      />

      {/* Word Explanation Popup */}
      <WordExplanationPopup
        activePopup={activePopup}
        isDarkMode={isDarkMode}
        quickTranslations={messageInteractions.quickTranslations}
        feedbackExplanations={messageInteractions.feedbackExplanations}
      />
    </>
  );
};

export default AnalyzeContent;
