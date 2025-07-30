/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/no-unescaped-entities */
"use client";
import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '../ClientLayout';
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import TopicSelectionModal from './TopicSelectionModal';
import PersonaModal from './PersonaModal';

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
  timestamp: Date;
  messageType?: string;
  audioFilePath?: string | null;
  translation?: string;
  breakdown?: unknown;
  detailedFeedback?: string;
  shortFeedback?: string;
  showDetailedFeedback?: boolean;
  showShortFeedback?: boolean;
  showDetailedBreakdown?: boolean;
  isSuggestion?: boolean;
  suggestionIndex?: number;
  totalSuggestions?: number;
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
      return saved ? JSON.parse(saved) : [];
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

  const urlConversationId = searchParams?.get('conversation');
  const urlLang = searchParams?.get('language');
  const urlTopics = searchParams?.get('topics');
  const urlFormality = searchParams?.get('formality');
  const usePersona = searchParams?.get('usePersona') === 'true';

  // Flag to skip validation right after creating a conversation
  const [skipValidation, setSkipValidation] = useState(false);

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
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  const { user } = useUser() as { user: User | null };
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string>('');
  const [isLoadingFeedback, setIsLoadingFeedback] = useState<boolean>(false);
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
  const [translations, setTranslations] = useState<Record<number, unknown>>({});
  const [isTranslating, setIsTranslating] = useState<Record<number, boolean>>({});
  const [showTranslations, setShowTranslations] = useState<Record<number, boolean>>({});
  const [isLoadingMessageFeedback, setIsLoadingMessageFeedback] = useState<Record<number, boolean>>({});
  const [leftPanelWidth, setLeftPanelWidth] = useState(0.25); // 25% of screen width (1/4)
  const [rightPanelWidth, setRightPanelWidth] = useState(0.25); // 25% of screen width (1/4)
  const [isResizing, setIsResizing] = useState(false);
  const [resizingPanel, setResizingPanel] = useState<'left' | 'right' | null>(null);
  const [showPersonaModal, setShowPersonaModal] = useState(false);
  const [isSavingPersona, setIsSavingPersona] = useState(false);
  const [conversationDescription, setConversationDescription] = useState<string>('');
  const [isUsingPersona, setIsUsingPersona] = useState<boolean>(false);
  const [isNewPersona, setIsNewPersona] = useState<boolean>(false);

  // Calculate actual panel widths based on visibility
  const getPanelWidths = () => {
    const visiblePanels = [showShortFeedbackPanel, true, showDetailedFeedbackPanel].filter(Boolean).length;
    
    if (visiblePanels === 1) {
      // Only middle panel visible
      return { left: 0, center: 1, right: 0 };
    } else if (visiblePanels === 2) {
      // Two panels visible - allow resizing between them
      if (!showShortFeedbackPanel) {
        // Left panel hidden - middle and right panels are resizable
        const centerWidth = Math.max(0.33, 1 - rightPanelWidth); // Ensure center is at least 1/3
        return { left: 0, center: centerWidth, right: 1 - centerWidth };
      } else if (!showDetailedFeedbackPanel) {
        // Right panel hidden - left and middle panels are resizable
        const centerWidth = Math.max(0.33, 1 - leftPanelWidth); // Ensure center is at least 1/3
        return { left: 1 - centerWidth, center: centerWidth, right: 0 };
      }
    }
    
    // All three panels visible (default case)
    return { left: leftPanelWidth, center: 1 - leftPanelWidth - rightPanelWidth, right: rightPanelWidth };
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
  const [isLoadingInitialAI, setIsLoadingInitialAI] = useState<boolean>(false);
  const [manualRecording, setManualRecording] = useState(false);
  const [showShortFeedbackPanel, setShowShortFeedbackPanel] = useState<boolean>(true);
  const [showDetailedFeedbackPanel, setShowDetailedFeedbackPanel] = useState<boolean>(true);
  const [shortFeedback, setShortFeedback] = useState<string>('');
  const [showDetailedBreakdown, setShowDetailedBreakdown] = useState<{[key: number]: boolean}>({});
  const [showSuggestionExplanations, setShowSuggestionExplanations] = useState<{[key: number]: boolean}>({});
  const [explainButtonPressed, setExplainButtonPressed] = useState<boolean>(false);
  const [parsedBreakdown, setParsedBreakdown] = useState<{
    sentence: string;
    overview: string;
    details: string;
  }[]>([]);
  const [userPreferences, setUserPreferences] = useState<{
    formality: string;
    topics: string[];
    user_goals: string[];
    userLevel: string;
    feedbackLanguage: string;
  }>({
    formality: 'friendly',
    topics: [],
    user_goals: [],
    userLevel: 'beginner',
    feedbackLanguage: 'en'
  });
  
  // Keep refs in sync with state
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language || 'en-US';
    }
  }, [language]);

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
      const userLevel = user?.proficiency_level || 'beginner';
      const feedbackLanguage = 'en'; // Default to English for now
      
      // Get user goals from the user's language dashboard
      const user_goals = user?.learning_goals ? (typeof user.learning_goals === 'string' ? JSON.parse(user.learning_goals) : user.learning_goals) : [];
      
      // Check if conversation uses a persona
      const usesPersona = conversation.uses_persona || false;
      const personaDescription = conversation.description || '';
      
      console.log('[DEBUG] Extracted user preferences:', { formality, topics, user_goals, userLevel, feedbackLanguage, usesPersona, personaDescription });
      
      // Set persona flags
      setIsUsingPersona(usesPersona);
      setIsNewPersona(false); // Existing conversations are not new personas
      setConversationDescription(personaDescription);
      
      const messages = conversation.messages || [];
      const history = messages.map((msg: unknown) => ({
        sender: (msg as any).sender,
        text: (msg as any).text,
        timestamp: new Date((msg as any).created_at)
      }));
      console.log('[DEBUG] Loaded conversation history with', history.length, 'messages');
      console.log('[DEBUG] Messages:', history);
      setChatHistory(history);
      
      // Store user preferences for use in API calls
      setUserPreferences({ formality, topics, user_goals, userLevel, feedbackLanguage });
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
      setShortFeedbacks(prev => ({ ...prev, [chatHistory.length]: shortFeedback }));
      if (shortFeedback !== undefined && shortFeedback !== null && shortFeedback !== '') {
        console.log('[DEBUG] Adding System feedback to chatHistory', { shortFeedback, chatHistory: [...chatHistory] });
        setChatHistory(prev => {
          const updated = [...prev, { sender: 'System', text: shortFeedback, timestamp: new Date() }];
          console.log('[DEBUG] (fetchAndShowShortFeedback) Updated chatHistory after System message:', updated);
          return updated;
        });
      } else {
        console.warn('[DEBUG] (fetchAndShowShortFeedback) shortFeedback is empty or undefined:', shortFeedback);
      }
      // Play short feedback TTS (if autospeak and feedback exists)
      if (shortFeedback) {
        const ttsUrl = await getTTSUrl(shortFeedback, language);
        if (ttsUrl) {
          await playTTS(ttsUrl);
        }
      }
    } catch (e: unknown) {
      console.error('[DEBUG] (fetchAndShowShortFeedback) Error calling /short_feedback API:', e);
    }
  };

  // Add stubs for getTTSUrl and playTTS above their usage
  const getTTSUrl = async (text: string, language: string) => null;
  const playTTS = async (url: string) => {};

  // Update sendAudioToBackend to handle short feedback in autospeak mode
  const sendAudioToBackend = async (audioBlob: Blob) => {
    if (!(audioBlob instanceof Blob)) return;
    try {
      setIsProcessing(true);
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('language', language);
      formData.append('chatHistory', JSON.stringify(chatHistory));
      formData.append('formality', userPreferences.formality);
      formData.append('user_level', userPreferences.userLevel);
      formData.append('user_topics', JSON.stringify(userPreferences.topics));
      formData.append('feedback_language', userPreferences.feedbackLanguage);
      // Add JWT token to headers
      const token = localStorage.getItem('jwt');
      const response = await axios.post('/api/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      // Prepare new chat messages
      const transcription = response.data.transcription || 'Speech recorded';
      
      // Clear suggestion carousel when user sends a message
      clearSuggestionCarousel();
      
      // Use callback form to ensure chatHistory is updated before fetching feedback
      setChatHistory(prev => {
        const updated = [...prev, { sender: 'User', text: transcription, timestamp: new Date() }];
        // After chatHistory is updated, fetch short feedback if needed
        if (autoSpeak && enableShortFeedback) {
          // Use setTimeout to ensure state update is flushed before calling feedback
          setTimeout(() => {
            fetchAndShowShortFeedback(transcription);
          }, 0);
        }
        return updated;
      });
      // Save user message to backend
      if (conversationId) {
        await saveMessageToBackend('User', transcription, 'text', null);
      }
      // Add AI response if present
      if (response.data.aiResponse) {
        setChatHistory(prev => [...prev, { sender: 'AI', text: response.data.aiResponse, timestamp: new Date() }]);
        if (conversationId) {
          await saveMessageToBackend('AI', response.data.aiResponse, 'text', null);
        }
      }
      // Play AI response TTS if present
      if (response.data.ttsUrl) {
        const audioUrl = `http://localhost:4000${response.data.ttsUrl}`;
        try {
          const headResponse = await fetch(audioUrl, { method: 'HEAD' });
          if (headResponse.ok) {
            const audio = new window.Audio(audioUrl);
            ttsAudioRef.current = audio;
            audio.onended = () => {
              ttsAudioRef.current = null;
              if (autoSpeakRef.current) {
                setTimeout(() => {
                  if (autoSpeakRef.current) startRecording();
                }, 300);
              }
            };
            audio.play().catch(error => {
              console.error('Failed to play TTS audio:', error);
            });
          }
        } catch (fetchError: unknown) {
          console.error('Error checking TTS audio file:', fetchError);
        }
      }
    } catch (error: unknown) {
      const errorMessage = {
        sender: 'System',
        text: '❌ Error processing audio. Please try again.',
        timestamp: new Date()
      };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
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
      setFeedback('No valid user speech found for feedback. Please record a message first.');
      return;
    }

    setIsLoadingFeedback(true);
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
      setFeedback(response.data.feedback);
      // Optionally, add to chatHistory
      setChatHistory(prev => [...prev, { sender: 'System', text: response.data.feedback, timestamp: new Date() }]);
    } catch (error: unknown) {
      console.error('Error getting detailed feedback:', error);
      console.error('[DEBUG] Error response:', (error as any).response?.data);
      console.error('[DEBUG] Error status:', (error as any).response?.status);
      console.error('[DEBUG] Error message:', (error as any).message);
      setFeedback('Error getting detailed feedback. Please try again.');
    } finally {
      setIsLoadingFeedback(false);
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
        // Create temporary suggestion messages
        const tempMessages = suggestions.map((suggestion: any, index: number) => ({
          sender: 'User',
          text: suggestion.text?.replace(/\*\*/g, '') || '',
          timestamp: new Date(),
          messageType: 'text',
          isSuggestion: true,
          suggestionIndex: index,
          totalSuggestions: suggestions.length
        }));
        
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
    setShowSuggestionCarousel(false);
    setSuggestionMessages([]);
    setCurrentSuggestionIndex(0);
  };

  // Helper to get initial AI message
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
        setChatHistory([{ sender: 'AI', text: (response.data.aiMessage as any).text, timestamp: new Date() }]);
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
          setChatHistory([{ sender: 'AI', text: (aiMsg as any).text, timestamp: new Date((aiMsg as any).created_at) }]);
        } else {
          console.log('[DEBUG] No AI message found in conversation after GET');
        }
      }
    } catch (err: unknown) {
      console.error('[DEBUG] Error in fetchInitialAIMessage:', err);
      // Fallback: just add a generic AI greeting
      setChatHistory([{ sender: 'AI', text: 'Hello! What would you like to talk about today?', timestamp: new Date() }]);
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
    
    // Set the conversation description
    setConversationDescription(description || '');
    
    // Check if this is a persona-based conversation (has a description)
    const isPersonaConversation = !!(description && description.trim());
    setIsUsingPersona(isPersonaConversation);
    
    // Mark this as a new persona only if not using an existing persona
    setIsNewPersona(!isUsingExistingPersona);
    
    console.log('[DEBUG] Starting conversation with persona:', { 
      description, 
      isPersonaConversation, 
      formality, 
      topics 
    });
    
    // Update user preferences with the selected formality, topics, and learning goals
    setUserPreferences(prev => ({
      ...prev,
      formality,
      topics,
      user_goals: learningGoals
    }));
    
    // Use Next.js router to update the URL
    router.replace(`/analyze?conversation=${newConversationId}&topics=${encodeURIComponent(topics.join(','))}`);
    // Set the initial AI message from the backend response
    if (aiMessage && (aiMessage as any).text && (aiMessage as any).text.trim()) {
      setChatHistory([{ sender: 'AI', text: (aiMessage as any).text, timestamp: new Date() }]);
    } else {
      setChatHistory([{ sender: 'AI', text: 'Hello! What would you like to talk about today?', timestamp: new Date() }]);
    }
  };

  const handleSuggestionClick = () => {
    // Just scroll to recording button to encourage user to record
    const recordingSection = document.querySelector('[data-recording-section]');
    if (recordingSection) {
      recordingSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const saveMessageToBackend = async (sender: string, text: string, messageType = 'text', audioFilePath = null, targetConversationId = null) => {
    const useConversationId = targetConversationId || conversationId;
    if (!useConversationId) {
      console.error('[DEBUG] No conversation ID available');
      return;
    }
    console.log('[DEBUG] Saving message to backend:', { sender, text, messageType, audioFilePath, conversationId: useConversationId });
    try {
      const token = localStorage.getItem('jwt');
      const response = await axios.post(
        `/api/conversations/${useConversationId}/messages`,
        {
          sender,
          text,
          messageType,
          audioFilePath
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
    if (!conversationId) return;
    
    setIsLoadingMessageFeedback(prev => ({ ...prev, [messageIndex]: true }));
    
    try {
      const token = localStorage.getItem('jwt');
      
      // Get the message text and context
      const message = chatHistory[messageIndex];
      const user_input = message?.text || '';
      const context = chatHistory.slice(-4).map(msg => `${msg.sender}: ${msg.text}`).join('\n');
      
      const requestData = {
        user_input,
        context,
        language,
        user_level: userPreferences.userLevel,
        user_topics: userPreferences.topics
      };
      
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
      
      const response = await axios.post(
        '/api/feedback',
        requestData,
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );
      
      const detailedFeedback = response.data.feedback;
      
      // Store feedback in the database for the specific message
      if (message && message.id) {
        const token = localStorage.getItem('jwt');
        await axios.post(
          '/api/messages/feedback',
          {
            messageId: message.id,
            feedback: detailedFeedback
          },
          token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
        );
        
        // Update the message in chat history with the feedback
        setChatHistory(prev => 
          prev.map((msg, idx) => 
            idx === messageIndex 
              ? { ...msg, detailedFeedback: detailedFeedback }
              : msg
          )
        );
      }
      
      // Update the main feedback display
      setFeedback(detailedFeedback);
    } catch (error: unknown) {
      console.error('Error getting detailed feedback:', error);
      console.error('[DEBUG] Error response:', (error as any).response?.data);
      setFeedback('Error getting detailed feedback. Please try again.');
    } finally {
      setIsLoadingMessageFeedback(prev => ({ ...prev, [messageIndex]: false }));
    }
  };

  const toggleDetailedFeedback = (messageIndex: number) => {
    const message = chatHistory[messageIndex];
    
    if (message && message.detailedFeedback) {
      // Show existing feedback in right panel
      setFeedback(message.detailedFeedback);
    } else {
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

  const handleRightResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    setResizingPanel('right');
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing || !resizingPanel) return;
    
    const containerWidth = window.innerWidth;
    const minPanelRatio = 0.25; // Minimum 25% of screen width
    const maxPanelRatio = 0.33; // Maximum 33.33% of screen width (allows 1/3, 1/3, 1/3)
    const minCenterRatio = 0.33; // Middle panel should never be smaller than 1/3
    
    const visiblePanels = [showShortFeedbackPanel, true, showDetailedFeedbackPanel].filter(Boolean).length;
    
    if (visiblePanels === 2) {
      // Only two panels visible - handle resizing between them
      if (!showShortFeedbackPanel && resizingPanel === 'right') {
        // Left panel hidden, resizing right panel (which affects center panel)
        const newRightRatio = Math.max(minPanelRatio, Math.min(1 - minCenterRatio, (containerWidth - e.clientX) / containerWidth));
        setRightPanelWidth(newRightRatio);
      } else if (!showDetailedFeedbackPanel && resizingPanel === 'left') {
        // Right panel hidden, resizing left panel (which affects center panel)
        const newLeftRatio = Math.max(minPanelRatio, Math.min(1 - minCenterRatio, e.clientX / containerWidth));
        setLeftPanelWidth(newLeftRatio);
      }
    } else if (visiblePanels === 3) {
      // All three panels visible
      if (resizingPanel === 'left') {
        // Resizing left panel
        const newLeftRatio = Math.max(minPanelRatio, Math.min(maxPanelRatio, e.clientX / containerWidth));
        // Ensure middle panel doesn't get smaller than 1/3
        const remainingForRight = 1 - newLeftRatio - minCenterRatio;
        if (remainingForRight >= minPanelRatio) {
          setLeftPanelWidth(newLeftRatio);
        }
      } else if (resizingPanel === 'right') {
        // Resizing right panel
        const newRightRatio = Math.max(minPanelRatio, Math.min(maxPanelRatio, (containerWidth - e.clientX) / containerWidth));
        // Ensure middle panel doesn't get smaller than 1/3
        const remainingForLeft = 1 - newRightRatio - minCenterRatio;
        if (remainingForLeft >= minPanelRatio) {
          setRightPanelWidth(newRightRatio);
        }
      }
    }
  };

  const handleMouseUp = () => {
    setIsResizing(false);
    setResizingPanel(null);
  };

  // Persona-related functions
  const handleEndChat = () => {
    // Only show persona modal if this is a new persona (not using an existing one)
    if (isNewPersona) {
      setShowPersonaModal(true);
    } else {
      router.push('/dashboard');
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
        
        // Close modal and navigate to dashboard
        setShowPersonaModal(false);
        router.push('/dashboard');
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

  const cancelPersona = () => {
    setShowPersonaModal(false);
    router.push('/dashboard');
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
            // Update user preferences with persona data
            setUserPreferences(prev => ({
              ...prev,
              formality: persona.formality || prev.formality,
              topics: persona.topics || prev.topics
            }));
          }
          
          // Auto-start conversation with persona data
          const startConversationWithPersona = async () => {
            try {
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
                personaId: null // This is a new persona, not a saved one
              }, {
                headers: { Authorization: `Bearer ${token}` }
              });
              
              const { conversation, aiMessage } = response.data;
              if (conversation && conversation.id) {
                // Start the conversation immediately
                await handleModalConversationStart(conversation.id, topics, aiMessage, formality, [], persona.description);
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

  return (
    <div style={{ 
      display: 'flex', 
      height: 'calc(100vh - 80px)', 
      width: '100%',
      background: 'linear-gradient(135deg, #f5f1ec 0%, #e8e0d8 50%, #d4c8c0 100%)',
      padding: '1rem',
      gap: '0.5rem'
    }}>
      {/* Short Feedback Panel - Left */}
      {showShortFeedbackPanel && (
        <div style={{ 
          width: `${getPanelWidths().left * 100}%`, 
          background: '#fff', 
          borderRadius: 12,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 3px 20px rgba(60,76,115,0.08)',
          position: 'relative'
        }}>
          {/* Short Feedback Header */}
          <div style={{ 
            background: 'var(--blue-secondary)', 
            color: '#fff', 
            padding: '0.75rem 1rem', 
            borderRadius: '12px 12px 0 0',
            textAlign: 'center',
            borderBottom: '1px solid #ececec',
            fontFamily: 'Gabriela, Arial, sans-serif',
            fontWeight: 600,
            fontSize: '0.95rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
                          <span>💡 AI Explanations</span>
            <button
              onClick={() => setShowShortFeedbackPanel(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                fontSize: '1.2rem',
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
            {shortFeedback && (
              <div style={{
                background: '#fff',
                padding: '1rem',
                flex: 1,
                overflowY: 'auto',
                overflowX: 'hidden',
                fontSize: '1rem',
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
                fontFamily: 'AR One Sans, Arial, sans-serif',
                fontWeight: 400,
                minHeight: 0
              }}>
                {parsedBreakdown.length > 0 ? (
                  <div>
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
                              <div style={{ fontWeight: 600, fontSize: '0.95rem', flex: 1 }}>
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
                            <div style={{ color: '#666', fontSize: '0.85rem', width: '100%', lineHeight: '1.4' }}>
                              {sentenceData.overview}
                            </div>
                          </div>
                        {showDetailedBreakdown[index] && sentenceData.details && sentenceData.details.trim() && (
                          <div style={{
                            marginTop: '0.75rem',
                            padding: '1rem',
                            background: 'linear-gradient(135deg, #f8f9fa 0%, #f0f4f8 100%)',
                            borderRadius: 8,
                            border: '1px solid #e1e8ed',
                            fontSize: '0.8rem',
                            lineHeight: 1.5,
                            whiteSpace: 'pre-wrap',
                            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)',
                            color: '#2c3e50'
                          }}>
                            {sentenceData.details}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>{shortFeedback}</div>
                )}
              </div>
            )}

            {!shortFeedback && (
              <div style={{
                background: '#fff',
                padding: '1rem',
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#666',
                fontSize: '0.9rem',
                fontStyle: 'italic'
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
                      requestDetailedBreakdownForMessage(fallbackIndex);
                    }
                  }
                }}
                disabled={isLoadingFeedback || !shortFeedback}
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  background: shortFeedback ? 'var(--rose-primary)' : '#ccc',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  boxShadow: 'inset 0 2px 8px #c38d9422',
                  cursor: (isLoadingFeedback || !shortFeedback) ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  transition: 'all 0.2s',
                  marginTop: 'auto'
                }}
              >
                {isLoadingFeedback ? '⏳ Processing...' : '🎯 Get Detailed Explanation'}
              </button>
            )}
        </div>
        </div>
      )}
      {/* Chat Panel - Center */}
              <div style={{ 
          flex: 1, 
          background: '#fff', 
          borderRadius: 12, 
          display: 'flex', 
          flexDirection: 'column', 
          boxShadow: '0 3px 20px rgba(60,76,115,0.08)',
          position: 'relative'
        }}>
        {/* Header Bar */}
        <div style={{ padding: '0.75rem 1rem', background: '#f5f1ec', borderBottom: '1px solid #ececec', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
          <div style={{ color: 'var(--rose-primary)', fontWeight: 600, fontSize: '0.95rem', fontFamily: 'Gabriela, Arial, sans-serif' }}>
            🌐 {getLanguageLabel(language)} Practice Session
          </div>

        </div>

        {/* Chat Messages */}
        <div style={{ 
          flex: 1, 
          padding: '1rem', 
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.6rem',
          background: '#f9f6f4',
          borderRadius: '0 0 12px 12px'
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
              alignItems: (message as any).sender === 'User' ? 'flex-end' : 'flex-start',
              marginBottom: '0.7rem'
            }}>
              <div 
                onClick={() => handleMessageClick(index, message.text)}
                style={{
                  flex: 1,
                  padding: '0.7rem 1rem',
                  borderRadius: message.sender === 'User' ? '16px 16px 4px 16px' : message.sender === 'AI' ? '16px 16px 16px 4px' : '8px',
                  background: message.sender === 'User' ? 'linear-gradient(135deg, #c38d94 0%, #b87d8a 100%)' : message.sender === 'AI' ? 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)' : '#fff7e6',
                  color: message.sender === 'User' ? '#fff' : message.sender === 'System' ? '#e67e22' : '#3e3e3e',
                  border: message.sender === 'AI' ? '1px solid #e0e0e0' : message.sender === 'System' ? '1px solid #e67e22' : 'none',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: isTranslating[index] ? 0.7 : 1,
                  position: 'relative',
                  boxShadow: message.sender === 'User' ? '0 2px 8px rgba(195,141,148,0.18)' : message.sender === 'AI' ? '0 2px 8px rgba(60,76,115,0.10)' : '0 1px 4px rgba(230,126,34,0.08)',
                  maxWidth: '75%',
                  wordWrap: 'break-word',
                  fontWeight: message.sender === 'User' ? 600 : message.sender === 'System' ? 600 : 400,
                  animation: 'messageAppear 0.3s ease-out',
                  fontFamily: 'AR One Sans, Arial, sans-serif'
                }}
              >
                {message.text}
                {isTranslating[index] && (
                  <span style={{ marginLeft: '0.5rem', fontSize: '0.85rem' }}>
                    🔄 Translating...
                  </span>
                )}
              </div>
              {/* Feedback Buttons */}
              {message.sender === 'User' && (
                <button
                  onClick={() => toggleDetailedFeedback(index)}
                  disabled={isLoadingMessageFeedback[index]}
                  style={{
                    padding: '0.35rem 0.9rem',
                    borderRadius: 6,
                    border: message.detailedFeedback ? 'none' : '1px solid #c38d94',
                    background: message.detailedFeedback ? 'linear-gradient(135deg, #c38d94 0%, #b87d8a 100%)' : 'rgba(195,141,148,0.08)',
                    color: message.detailedFeedback ? '#fff' : '#c38d94',
                    fontSize: '0.8rem',
                    cursor: isLoadingMessageFeedback[index] ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: isLoadingMessageFeedback[index] ? 0.6 : 1,
                    minWidth: '70px',
                    fontWeight: 500,
                    marginTop: 4,
                    boxShadow: message.detailedFeedback ? '0 2px 6px rgba(195,141,148,0.18)' : '0 1px 3px rgba(195,141,148,0.10)'
                  }}
                  title={message.detailedFeedback ? 'Show detailed feedback' : 'Check for errors'}
                >
                  {isLoadingMessageFeedback[index] ? '🔄' : message.detailedFeedback ? '🎯 Show' : '🎯 Check'}
                </button>
              )}
              {message.sender === 'AI' && (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 4 }}>
                  <button
                    onClick={() => toggleShortFeedback(index)}
                    disabled={isLoadingMessageFeedback[index]}
                    style={{
                      padding: '0.35rem 0.9rem',
                      borderRadius: 6,
                      border: shortFeedbacks[index] ? 'none' : '1px solid #4a90e2',
                      background: shortFeedbacks[index] ? 'linear-gradient(135deg, #4a90e2 0%, #357abd 100%)' : 'rgba(74,144,226,0.08)',
                      color: shortFeedbacks[index] ? '#fff' : '#4a90e2',
                      fontSize: '0.8rem',
                      cursor: isLoadingMessageFeedback[index] ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      opacity: isLoadingMessageFeedback[index] ? 0.6 : 1,
                      minWidth: '70px',
                      fontWeight: 500,
                      boxShadow: shortFeedbacks[index] ? '0 2px 6px rgba(74,144,226,0.18)' : '0 1px 3px rgba(74,144,226,0.10)'
                    }}
                    title={shortFeedbacks[index] ? 'Show short feedback' : 'Get short feedback'}
                  >
                    {isLoadingMessageFeedback[index] ? '🔄' : shortFeedbacks[index] ? '💡 Show' : '💡 Explain'}
                  </button>
                  {/* Show suggestions button only for the most recent AI message */}
                  {index === chatHistory.length - 1 && (
                    <button
                      onClick={handleSuggestionButtonClick}
                      disabled={isLoadingSuggestions}
                      style={{
                        padding: '0.35rem 0.9rem',
                        border: 'none',
                        background: 'none',
                        color: '#c38d94',
                        fontSize: '0.8rem',
                        cursor: isLoadingSuggestions ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        opacity: isLoadingSuggestions ? 0.6 : 1,
                        fontWeight: 500,
                        textDecoration: 'underline',
                        textDecorationColor: '#c38d94'
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
                    <strong>Translation:</strong> {translations[index] && typeof translations[index] === 'object' && 'translation' in translations[index] ? (translations[index] as any).translation : ''}
                  </div>
                  {translations[index] && typeof translations[index] === 'object' && 'has_breakdown' in translations[index] && (translations[index] as any).has_breakdown && (translations[index] as any).breakdown && (
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
                        {(translations[index] as any).breakdown}
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
              <div style={{
                maxWidth: '75%',
                padding: '0.7rem 1rem',
                background: 'linear-gradient(135deg, #fdf2f2 0%, #fce7e7 100%)',
                color: '#3e3e3e',
                borderRadius: '16px 16px 4px 16px',
                border: '2px dashed #c38d94',
                fontSize: '0.9rem',
                fontWeight: 600,
                position: 'relative',
                boxShadow: '0 2px 8px rgba(195,141,148,0.18)',
                fontFamily: 'AR One Sans, Arial, sans-serif'
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
                          padding: '0.2rem 0.4rem',
                          borderRadius: 3,
                          border: '1px solid #c38d94',
                          background: 'rgba(195,141,148,0.08)',
                          color: '#c38d94',
                          cursor: suggestionMessages.length <= 1 ? 'not-allowed' : 'pointer',
                          fontSize: '0.7rem',
                          opacity: suggestionMessages.length <= 1 ? 0.5 : 1
                        }}
                      >
                        ←
                      </button>
                      <button
                        onClick={() => navigateSuggestion('next')}
                        disabled={suggestionMessages.length <= 1}
                        style={{
                          padding: '0.2rem 0.4rem',
                          borderRadius: 3,
                          border: '1px solid #c38d94',
                          background: 'rgba(195,141,148,0.08)',
                          color: '#c38d94',
                          cursor: suggestionMessages.length <= 1 ? 'not-allowed' : 'pointer',
                          fontSize: '0.7rem',
                          opacity: suggestionMessages.length <= 1 ? 0.5 : 1
                        }}
                      >
                        →
                      </button>
                    </div>
                  </div>
                <div style={{
                  lineHeight: '1.4',
                  wordWrap: 'break-word'
                }}>
                  {suggestionMessages[currentSuggestionIndex]?.text}
                </div>
              </div>
            </div>
          )}
        </div>


        {/* Recording Controls */}
        {chatHistory.length > 0 && (
          <div
            data-recording-section
            style={{ 
              padding: '1.2rem', 
              borderTop: '1px solid #c38d94',
              background: '#f5f1ec',
              borderRadius: '0 0 16px 16px',
              textAlign: 'center',
              marginTop: 0
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '1rem',
              flexWrap: 'wrap'
            }}>
              {/* Autospeak Toggle Button */}
              <button
                onClick={() => setAutoSpeak(v => !v)}
                style={{
                  background: autoSpeak ? 'var(--blue-secondary)' : 'var(--blue-secondary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '0.5rem 0.9rem',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '0.85rem',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(60,76,115,0.15)',
                  minWidth: '110px'
                }}
              >
                {autoSpeak ? '✅ Autospeak ON' : 'Autospeak OFF'}
              </button>

              {/* Microphone Button (centered) */}
              <button
                onClick={isRecording ? () => stopRecording(false) : startRecording}
                disabled={isProcessing || (autoSpeak && isRecording)}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  border: 'none',
                  background: isRecording ? 'var(--blue-secondary)' : 'var(--rose-primary)',
                  color: '#fff',
                  fontSize: '20px',
                  cursor: isProcessing || (autoSpeak && isRecording) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s',
                  boxShadow: isRecording ? '0 0 0 6px #c38d9440' : '0 3px 12px rgba(60,76,115,0.20)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title={isRecording ? 'Stop Recording' : 'Start Recording'}
              >
                {isRecording ? '⏹️' : '🎤'}
              </button>

              {/* Short Feedback Toggle Button */}
              <button
                onClick={() => setEnableShortFeedback(v => !v)}
                style={{
                  background: enableShortFeedback ? 'var(--blue-secondary)' : 'var(--rose-primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '0.5rem 0.9rem',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '0.85rem',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(60,76,115,0.15)',
                  minWidth: '110px'
                }}
              >
                {enableShortFeedback ? '💡 Short Feedback ON' : 'Short Feedback OFF'}
              </button>
            </div>

                          {/* End Chat button - positioned as a separate floating element */}
              <button
                onClick={handleEndChat}
              style={{
                position: 'absolute',
                bottom: '1rem',
                right: '1rem',
                background: '#e74c3c',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem',
                transition: 'all 0.2s',
                boxShadow: '0 2px 4px rgba(231,76,60,0.15)',
                minWidth: '100px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                zIndex: 10
              }}
              title="End chat and return to dashboard"
            >
              🏠 End Chat
            </button>
                      {/* Redo Button: Only show in manual mode when recording */}
            {isRecording && manualRecording && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginTop: '0.8rem'
              }}>
                <button
                  onClick={() => stopRecording(true)}
                  style={{
                    background: '#e67e22',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    padding: '0.5rem 0.9rem',
                    cursor: 'pointer',
                    fontWeight: 500,
                    fontSize: '0.85rem',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 4px rgba(230,126,34,0.15)',
                    minWidth: '90px'
                  }}
                >
                  ⏹️ Redo
                </button>
              </div>
            )}
          </div>
        )}
        {/* Resize Handle */}
        {showDetailedFeedbackPanel && (
          <div
            onMouseDown={handleRightResizeStart}
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
        )}
      </div>
      {/* Right Panel - Split into Detailed Analysis and Suggestions */}
      {showDetailedFeedbackPanel && (
        <div style={{ 
          width: `${getPanelWidths().right * 100}%`, 
          background: '#fff', 
          borderRadius: 12,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 3px 20px rgba(60,76,115,0.08)',
          marginLeft: 0,
          marginTop: 0
        }}>
          {/* Full Height - Detailed Analysis */}
          <div style={{ 
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Detailed Analysis Header */}
            <div style={{ 
              background: 'var(--rose-accent)', 
              color: 'var(--blue-secondary)', 
              padding: '0.75rem 1rem', 
              borderRadius: '12px 12px 0 0',
              textAlign: 'center',
              borderBottom: '1px solid #ececec',
              fontFamily: 'Gabriela, Arial, sans-serif',
              fontWeight: 600,
              fontSize: '0.95rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>📊 Conversation Errors</span>
              <button
                onClick={() => setShowDetailedFeedbackPanel(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--blue-secondary)',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  padding: '0.2rem',
                  borderRadius: '4px',
                  transition: 'all 0.2s'
                }}
                title="Hide panel"
              >
                ▶
              </button>
            </div>
            {/* Detailed Analysis Content */}
            <div style={{ 
              flex: 1, 
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
              overflowX: 'hidden',
              minHeight: 0,
              maxHeight: '100%'
            }}>
              {feedback && (
                <div style={{
                  background: '#fff',
                  padding: '1rem',
                  fontSize: '0.9rem',
                  lineHeight: 1.4,
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'AR One Sans, Arial, sans-serif',
                  fontWeight: 400,
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word'
                }}>
                  {feedback}
                </div>
              )}
              {!feedback && (
                <div style={{
                  background: '#fff',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#666',
                  fontSize: '0.85rem',
                  fontStyle: 'italic',
                  textAlign: 'center',
                  minHeight: '100px'
                }}>
                  Click "🎯 Check" on any user message to see corrections here
                </div>
              )}
            </div>
          </div>


        </div>
      )}
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
            borderRadius: '8px 0 0 8px',
            padding: '1rem 0.5rem',
            fontSize: '1.2rem',
            cursor: 'pointer',
            fontWeight: 600,
            transition: 'all 0.2s',
            boxShadow: '0 2px 8px rgba(60,76,115,0.2)',
            zIndex: 1000
          }}
          title="Show Short Feedback Panel"
        >
          💡
        </button>
      )}
      {!showDetailedFeedbackPanel && (
        <button
          onClick={() => setShowDetailedFeedbackPanel(true)}
          style={{
            position: 'fixed',
            right: '1rem',
            top: '6rem',
            background: 'var(--rose-primary)',
            color: '#fff',
            border: 'none',
            borderRadius: '0 8px 8px 0',
            padding: '1rem 0.5rem',
            fontSize: '1.2rem',
            cursor: 'pointer',
            fontWeight: 600,
            transition: 'all 0.2s',
            boxShadow: '0 2px 8px rgba(195,141,148,0.2)',
            zIndex: 1000
          }}
          title="Show Detailed Analysis Panel"
        >
          📊
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
    </div>
  );
}

// Helper to get JWT token
const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('jwt') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default Analyze; 