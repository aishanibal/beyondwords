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
import RecordingControls from './components/RecordingControls';
import SuggestionCarousel from './components/SuggestionCarousel';
import RightPanel from './components/RightPanel';
import ProgressModal from './components/ProgressModal';

// Import hooks
import { usePersistentChatHistory } from './hooks/useChatHistory';
import { useAudioRecording } from './hooks/useAudioRecording';
import { useTTS } from './hooks/useTTS';
import { useTranslation } from './hooks/useTranslation';
import { useConversation } from './hooks/useConversation';
import { useAudioProcessing } from './hooks/useAudioProcessing';
import { useFeedback } from './hooks/useFeedback';
import { useSuggestions } from './hooks/useSuggestions';
import { useAudioHandlers } from './hooks/useAudioHandlers';
import { useConversationManagement } from './hooks/useConversationManagement';

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
import { explainLLMResponse, renderClickableMessage, getSessionMessages } from './utils/messageUtils';

// Import services
import { getAuthHeaders } from './services/conversationService';

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

  // Suggestions state - now handled by useSuggestions hook

  // Translation state
  const [showTranslations, setShowTranslations] = useState<Record<number, boolean>>({});
  const [isTranslating, setIsTranslating] = useState<Record<number, boolean>>({});
  const [translations, setTranslations] = useState<Record<number, { translation?: string; breakdown?: string; has_breakdown?: boolean }>>({});
  // Suggestion translation state - now handled by useSuggestions hook

  // UI panels state
  const [showShortFeedbackPanel, setShowShortFeedbackPanel] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(DEFAULT_PANEL_WIDTHS.left);
  const [rightPanelWidth, setRightPanelWidth] = useState<number>(DEFAULT_PANEL_WIDTHS.right);
  
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
  
  // Use suggestions hook
  const suggestions = useSuggestions(
    user,
    language,
    conversationId,
    userPreferences,
    chatHistory,
    isProcessing,
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
    setUserProgress
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
    setShortFeedback
  );

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
              onPlayTTS={audioHandlers.handlePlayTTS}
              onPlayExistingTTS={audioHandlers.handlePlayExistingTTS}
            translations={translations}
            isTranslating={isTranslating}
            showTranslations={showTranslations}
            showDetailedBreakdown={showDetailedBreakdown}
            showSuggestionExplanations={{}}
            explainButtonPressed={suggestions.explainButtonPressed}
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
          {!isProcessing && suggestions.showSuggestionCarousel && suggestions.suggestionMessages.length > 0 && (
            <SuggestionCarousel
              isDarkMode={isDarkMode}
              suggestionMessages={suggestions.suggestionMessages}
              currentSuggestionIndex={suggestions.currentSuggestionIndex}
              onNavigateSuggestion={suggestions.navigateSuggestion}
              onExplainSuggestion={suggestions.explainSuggestion}
              onPlaySuggestionTTS={suggestions.playSuggestionTTS}
              isTranslatingSuggestion={suggestions.isTranslatingSuggestion}
              showSuggestionTranslations={suggestions.showSuggestionTranslations}
              suggestionTranslations={suggestions.suggestionTranslations}
              isGeneratingTTS={isGeneratingTTS}
              isPlayingTTS={isPlayingTTS}
              userPreferences={userPreferences}
              language={language}
            />
          )}
          
        <RecordingControls
                  isDarkMode={isDarkMode}
            isRecording={audioHandlers.isRecording}
            isProcessing={isProcessing}
                    onStartRecording={audioHandlers.handleStartRecording}
                    onStopRecording={audioHandlers.handleStopRecording}
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
          onStartConversation={conversationManagement.handleModalConversationStart}
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
      <ProgressModal
        isOpen={showProgressModal}
        onClose={() => {
          setShowProgressModal(false);
          setProgressData(null);
        }}
        progressData={progressData}
      />
    </>
  );
};

export default AnalyzeContent;
