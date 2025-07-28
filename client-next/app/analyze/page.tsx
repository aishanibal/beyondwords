"use client";
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useUser } from '../ClientLayout';
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import { TALK_TOPICS, Topic } from '../../lib/preferences';
import TopicSelectionModal from './TopicSelectionModal';
// TypeScript: Add type declarations for browser APIs
// Fix: Use 'any' for SpeechRecognition to avoid recursive type error
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
    MediaRecorder: typeof MediaRecorder;
  }
}

// Remove top-level window usage
// let SpeechRecognition: any = null;
// let MediaRecorderClass: typeof window.MediaRecorder | null = null;
// if (typeof window !== 'undefined') {
//   SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
//   MediaRecorderClass = window.MediaRecorder;
// }

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

function usePersistentChatHistory(user: any): [any[], React.Dispatch<React.SetStateAction<any[]>>] {
  const [chatHistory, setChatHistory] = React.useState<any[]>(() => {
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

  const { user } = useUser() as { user: any };
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string>('');
  const [isLoadingFeedback, setIsLoadingFeedback] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const autoSpeakRef = useRef<boolean>(false);
  const [showSavePrompt, setShowSavePrompt] = useState<boolean>(false);
  const [chatHistory, setChatHistory] = usePersistentChatHistory(user);
  const [language, setLanguage] = useState<string>(urlLang || user?.target_language || 'en');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoadingConversation, setIsLoadingConversation] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<any[]>([]); // TODO: type this
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState<boolean>(false);
  const [translations, setTranslations] = useState<Record<number, any>>({});
  const [isTranslating, setIsTranslating] = useState<Record<number, boolean>>({});
  const [showTranslations, setShowTranslations] = useState<Record<number, boolean>>({});
  const [isLoadingMessageFeedback, setIsLoadingMessageFeedback] = useState<Record<number, boolean>>({});
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
      const messages = conversation.messages || [];
      const history = messages.map((msg: any) => ({
        sender: msg.sender,
        text: msg.text,
        timestamp: new Date(msg.created_at)
      }));
      console.log('[DEBUG] Loaded conversation history with', history.length, 'messages');
      console.log('[DEBUG] Messages:', history);
      setChatHistory(history);
    } catch (error: any) {
      console.error('[DEBUG] Error loading conversation:', error);
      console.error('[DEBUG] Error details:', error.response?.data || error.message);
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
    user: any,
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
      } catch (error: any) {
        if (error.response && error.response.status === 404) {
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
    } catch (e: any) {
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
    }
  }, []);

  // Replace startRecording and stopRecording with MediaRecorder + SpeechRecognition logic
  const startRecording = async () => {
    setWasInterrupted(false);
    if (!MediaRecorderClassRef.current) {
      alert('MediaRecorder API not supported in this browser.');
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
        recognition.onresult = (event: any) => {
          setIsRecording(false);
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
          }
        };
        recognition.onerror = (event: any) => {
          setIsRecording(false);
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
          }
          alert('Speech recognition error: ' + event.error);
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
    } catch (err: any) {
      alert('Could not start audio recording: ' + err.message);
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
      console.log('[DEBUG] (fetchAndShowShortFeedback) Calling /short_feedback API with:', { transcription, context, language, user_level: user?.proficiency_level || 'beginner', user_topics: user?.talk_topics || [] });
      // Call the Express proxy endpoint instead of Python directly
      const token = localStorage.getItem('jwt');
      const shortFeedbackRes = await axios.post(
        '/api/short_feedback',
        {
          user_input: transcription,
          context,
          language,
          user_level: user?.proficiency_level || 'beginner',
          user_topics: user?.talk_topics || []
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
    } catch (e: any) {
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
        } catch (fetchError: any) {
          console.error('Error checking TTS audio file:', fetchError);
        }
      }
    } catch (error: any) {
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
    } catch (error: any) {
      setFeedback('❌ Error getting detailed feedback. Please try again.');
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
          language: language
        },
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );
      setSuggestions(response.data.suggestions || []);
    } catch (error: any) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
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
        setChatHistory([{ sender: 'AI', text: response.data.aiMessage.text, timestamp: new Date() }]);
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
        const aiMsg = messages.find((m: any) => m.sender === 'AI');
        if (aiMsg) {
          console.log('[DEBUG] AI message from GET:', aiMsg);
          setChatHistory([{ sender: 'AI', text: aiMsg.text, timestamp: new Date(aiMsg.created_at) }]);
        } else {
          console.log('[DEBUG] No AI message found in conversation after GET');
        }
      }
    } catch (err: any) {
      console.error('[DEBUG] Error in fetchInitialAIMessage:', err);
      // Fallback: just add a generic AI greeting
      setChatHistory([{ sender: 'AI', text: 'Hello! What would you like to talk about today?', timestamp: new Date() }]);
    } finally {
      setIsLoadingInitialAI(false);
    }
  };

  const handleModalConversationStart = async (newConversationId: string, topics: string[], aiMessage: any) => {
    setConversationId(newConversationId);
    setChatHistory([]);
    setShowTopicModal(false);
    setSkipValidation(true);
    setTimeout(() => setSkipValidation(false), 2000); // Skip validation for 2 seconds
    // Use Next.js router to update the URL
    router.replace(`/analyze?conversation=${newConversationId}&topics=${encodeURIComponent(topics.join(','))}`);
    // Set the initial AI message from the backend response
    if (aiMessage && aiMessage.text && aiMessage.text.trim()) {
      setChatHistory([{ sender: 'AI', text: aiMessage.text, timestamp: new Date() }]);
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
    } catch (error: any) {
      console.error('[DEBUG] Error saving message to backend:', error);
      console.error('[DEBUG] Error details:', error.response?.data || error.message);
    }
  };

  const translateMessage = async (messageIndex: number, text: string, breakdown = false) => {
    if (isTranslating[messageIndex]) return;
    
    setIsTranslating(prev => ({ ...prev, [messageIndex]: true }));
    
    try {
      const token = localStorage.getItem('jwt');
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
      
      setShowTranslations(prev => ({ 
        ...prev, 
        [messageIndex]: true 
      }));
    } catch (error: any) {
      console.error('Translation error:', error);
      setTranslations(prev => ({ 
        ...prev, 
        [messageIndex]: { 
          translation: 'Translation failed', 
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
      // Show or fetch translation
      if (translations[index]) {
        setShowTranslations(prev => ({ ...prev, [index]: true }));
      } else {
        translateMessage(index, text);
      }
    }
  };

  const requestDetailedFeedbackForMessage = async (messageIndex: number) => {
    if (!conversationId) return;
    
    setIsLoadingMessageFeedback(prev => ({ ...prev, [messageIndex]: true }));
    
    try {
      const token = localStorage.getItem('jwt');
      const response = await axios.post(
        '/api/feedback',
        {
          conversationId,
          language
        },
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );
      
      const detailedFeedback = response.data.feedback;
      
      // Store feedback in the database for the specific message
      const message = chatHistory[messageIndex];
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
              ? { ...msg, detailed_feedback: detailedFeedback }
              : msg
          )
        );
      }
      
      // Update the main feedback display
      setFeedback(detailedFeedback);
    } catch (error: any) {
      console.error('Error getting detailed feedback:', error);
      setFeedback('Error getting detailed feedback. Please try again.');
    } finally {
      setIsLoadingMessageFeedback(prev => ({ ...prev, [messageIndex]: false }));
    }
  };

  const toggleDetailedFeedback = (messageIndex: number) => {
    const message = chatHistory[messageIndex];
    
    if (message && message.detailed_feedback) {
      // Show existing feedback in right panel
      setFeedback(message.detailed_feedback);
    } else {
      // Generate new feedback
      requestDetailedFeedbackForMessage(messageIndex);
    }
  };

  useEffect(() => {
    console.log('[DEBUG] Chat history changed:', chatHistory);
  }, [chatHistory]);

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

  return (
    <div style={{ 
      display: 'flex', 
      height: 'calc(100vh - 80px)', 
      background: 'linear-gradient(135deg, #f5f1ec 0%, #e8e0d8 50%, #d4c8c0 100%)',
      padding: '2rem'
    }}>
      <div style={{ flex: 1, background: '#fff', borderRadius: 16, marginRight: '1rem', display: 'flex', flexDirection: 'column', border: '1px solid #e0e0e0', boxShadow: '0 4px 24px rgba(60,76,115,0.08)' }}>
        {/* Header Bar */}
        <div style={{ padding: '1rem', background: '#f5f1ec', borderBottom: '1px solid #ececec', display: 'flex', justifyContent: 'center', alignItems: 'center', borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
          <div style={{ color: 'var(--rose-primary)', fontWeight: 700, fontSize: '1.1rem', fontFamily: 'Gabriela, Arial, sans-serif' }}>
            🌐 {getLanguageLabel(language)} Practice Session
          </div>
        </div>
        {/* Chat Header */}
        <div style={{ background: 'var(--blue-secondary)', color: '#fff', padding: '1rem', borderRadius: '14px 14px 0 0', textAlign: 'center', fontFamily: 'Gabriela, Arial, sans-serif', fontWeight: 700, fontSize: '1.3rem', letterSpacing: '-0.5px' }}>
          🎤 BeyondWords Chat
        </div>
        {/* Chat Messages */}
        <div style={{ 
          flex: 1, 
          padding: '1.2rem', 
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.7rem',
          background: '#f9f6f4',
          borderBottomLeftRadius: 16, borderBottomRightRadius: 16
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
          {chatHistory.map((message, index) => (
            <div key={index} style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: message.sender === 'User' ? 'flex-end' : 'flex-start',
              marginBottom: '0.7rem'
            }}>
              <div 
                onClick={() => handleMessageClick(index, message.text)}
                style={{
                  flex: 1,
                  padding: '0.85rem 1.1rem',
                  borderRadius: message.sender === 'User' ? '18px 18px 6px 18px' : message.sender === 'AI' ? '18px 18px 18px 6px' : '10px',
                  background: message.sender === 'User' ? 'linear-gradient(135deg, #c38d94 0%, #b87d8a 100%)' : message.sender === 'AI' ? 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)' : '#fff7e6',
                  color: message.sender === 'User' ? '#fff' : message.sender === 'System' ? '#e67e22' : '#3e3e3e',
                  border: message.sender === 'AI' ? '1px solid #e0e0e0' : message.sender === 'System' ? '1px solid #e67e22' : 'none',
                  fontSize: '0.98rem',
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
              {/* Detailed Feedback Button - only for user messages */}
              {message.sender === 'User' && (
                <button
                  onClick={() => toggleDetailedFeedback(index)}
                  disabled={isLoadingMessageFeedback[index]}
                  style={{
                    padding: '0.45rem 1.1rem',
                    borderRadius: 8,
                    border: message.detailed_feedback ? 'none' : '1px solid #c38d94',
                    background: message.detailed_feedback ? 'linear-gradient(135deg, #c38d94 0%, #b87d8a 100%)' : 'rgba(195,141,148,0.08)',
                    color: message.detailed_feedback ? '#fff' : '#c38d94',
                    fontSize: '0.88rem',
                    cursor: isLoadingMessageFeedback[index] ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: isLoadingMessageFeedback[index] ? 0.6 : 1,
                    minWidth: '80px',
                    fontWeight: 600,
                    marginTop: 6,
                    boxShadow: message.detailed_feedback ? '0 2px 6px rgba(195,141,148,0.18)' : '0 1px 3px rgba(195,141,148,0.10)'
                  }}
                  title={message.detailed_feedback ? 'Show detailed feedback' : 'Generate detailed feedback'}
                >
                  {isLoadingMessageFeedback[index] ? '🔄' : message.detailed_feedback ? '🎯 Show' : '🎯 Get'}
                </button>
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
                    <strong>Translation:</strong> {translations[index].translation}
                  </div>
                  {translations[index].has_breakdown && translations[index].breakdown && (
                    <div style={{ marginTop: '0.5rem' }}>
                      {translations[index].breakdown.word_by_word && (
                        <div style={{ marginBottom: '0.5rem' }}>
                          <strong>Word by Word:</strong>
                          <div style={{ marginTop: '0.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                            {translations[index].breakdown.word_by_word.map((word: any, wordIndex: any) => (
                              <span key={wordIndex} style={{
                                display: 'inline-block',
                                margin: 0,
                                padding: '0.25rem 0.5rem',
                                background: 'linear-gradient(135deg, #e6f3ff 0%, #d1e7ff 100%)',
                                borderRadius: 7,
                                border: '1px solid #b8daff',
                                fontSize: '0.8rem',
                                boxShadow: '0 1px 3px rgba(44,82,130,0.08)'
                              }}>
                                <strong>{word.original}</strong> → {word.translation}
                                {word.part_of_speech && (
                                  <span style={{ opacity: 0.7, fontSize: '0.75rem' }}>
                                    {' '}({word.part_of_speech})
                                  </span>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {translations[index].breakdown.grammar_notes && (
                        <div style={{ marginBottom: '0.5rem' }}>
                          <strong>Grammar Notes:</strong> {translations[index].breakdown.grammar_notes}
                        </div>
                      )}
                      {translations[index].breakdown.cultural_notes && (
                        <div style={{ marginBottom: '0.5rem' }}>
                          <strong>Cultural Notes:</strong> {translations[index].breakdown.cultural_notes}
                        </div>
                      )}
                      {translations[index].breakdown.literal_translation && (
                        <div>
                          <strong>Literal Translation:</strong> {translations[index].breakdown.literal_translation}
                        </div>
                      )}
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
        </div>
        {/* Text Suggestions + Mic Button Row */}
        {chatHistory.length > 0 && (
          <div style={{ 
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 16,
            padding: '1rem',
            borderTop: '1px solid #e0e0e0',
            background: '#f9f9f9',
            borderBottomLeftRadius: 12, borderBottomRightRadius: 12,
            marginBottom: 0
          }}>
            {/* Get Suggestions Button (smaller, left) */}
            {suggestions.length === 0 && !isLoadingSuggestions && (
              <button
                onClick={fetchSuggestions}
                style={{
                  padding: '0.5rem 1.1rem',
                  background: 'var(--rose-primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 14,
                  cursor: 'pointer',
                  fontSize: '0.93rem',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  boxShadow: '0 1px 4px rgba(195,141,148,0.10)'
                }}
              >
                💡 Get Suggestions
              </button>
            )}
            {/* Microphone Button (right) */}
            <button
              onClick={isRecording ? () => stopRecording(false) : startRecording}
              disabled={isProcessing || (autoSpeak && isRecording)}
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                border: 'none',
                background: isRecording ? 'var(--blue-secondary)' : 'var(--rose-primary)',
                color: '#fff',
                fontSize: '32px',
                cursor: isProcessing || (autoSpeak && isRecording) ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s',
                boxShadow: isRecording ? '0 0 0 10px #c38d9440' : '0 2px 8px rgba(60,76,115,0.10)'
              }}
              title={isRecording ? 'Stop Recording' : 'Start Recording'}
            >
              {isRecording ? '⏹️' : '🎤'}
            </button>
          </div>
        )}
        {/* Suggestions List (if present) */}
        {chatHistory.length > 0 && suggestions.length > 0 && (
          <div style={{ 
            padding: '1rem', 
            borderTop: '1px solid #e0e0e0',
            background: '#f9f9f9',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            borderBottomLeftRadius: 12, borderBottomRightRadius: 12
          }}>
            <div style={{ fontSize: '1rem', color: 'var(--rose-primary)', fontWeight: 600, marginBottom: '0.5rem' }}>
              💬 Try saying:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick()}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'rgba(195,141,148,0.13)',
                    color: 'var(--rose-primary)',
                    border: 'none',
                    borderRadius: 14,
                    cursor: 'pointer',
                    fontSize: '0.93rem',
                    fontWeight: 600,
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    minWidth: '120px',
                    boxShadow: '0 1px 4px rgba(195,141,148,0.08)'
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: '0.2rem' }}>
                    {suggestion.text}
                  </div>
                  {suggestion.translation && suggestion.translation !== suggestion.text && (
                    <div style={{ fontSize: '0.85rem', opacity: 0.8, fontStyle: 'italic' }}>
                      {suggestion.translation}
                    </div>
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setSuggestions([]);
                fetchSuggestions();
              }}
              style={{
                padding: '0.5rem 1rem',
                background: '#fff',
                color: 'var(--rose-primary)',
                border: '1px solid #c38d94',
                borderRadius: 10,
                cursor: 'pointer',
                fontSize: '0.93rem',
                fontWeight: 600,
                transition: 'all 0.2s ease',
                alignSelf: 'center',
                marginTop: '0.5rem',
                boxShadow: '0 1px 4px rgba(195,141,148,0.08)'
              }}
            >
              🔄 Get New Suggestions
            </button>
          </div>
        )}
        {/* Recording Controls */}
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
          {/* Autospeak Toggle Button */}
          <button
            onClick={() => setAutoSpeak(v => !v)}
            style={{
              marginBottom: '0.5rem',
              background: autoSpeak ? 'var(--blue-secondary)' : 'var(--rose-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: 16,
              padding: '0.5rem 1.2rem',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '1rem',
              marginRight: 8,
              transition: 'all 0.2s',
              boxShadow: '0 1px 4px rgba(60,76,115,0.08)'
            }}
          >
            {autoSpeak ? '✅ Autospeak ON' : 'Autospeak OFF'}
          </button>
          {/* Short Feedback Toggle Button */}
          <button
            onClick={() => setEnableShortFeedback(v => !v)}
            style={{
              marginBottom: '0.5rem',
              background: enableShortFeedback ? '#e67e22' : 'var(--rose-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: 16,
              padding: '0.5rem 1.2rem',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '1rem',
              marginRight: 8,
              transition: 'all 0.2s',
              boxShadow: '0 1px 4px rgba(230,126,34,0.08)'
            }}
          >
            {enableShortFeedback ? '💡 Short Feedback ON' : 'Short Feedback OFF'}
          </button>
          {/* Redo Button: Only show in manual mode when recording */}
          {isRecording && manualRecording && (
            <button
              onClick={() => stopRecording(true)}
              style={{
                marginLeft: 8,
                background: '#e67e22',
                color: '#fff',
                border: 'none',
                borderRadius: 16,
                padding: '0.5rem 1.2rem',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '1rem',
                transition: 'all 0.2s',
                boxShadow: '0 1px 4px rgba(230,126,34,0.08)'
              }}
            >
              ⏹️ Redo
            </button>
          )}
          {/* Mic Button: In manual mode, toggles start/stop. In autospeak, toggles start/stop but disables stop if not recording. */}
          {/* This button is now in the top right of the chat card */}
        </div>
      </div>
      {/* Feedback Section */}
      <div style={{ 
        width: 320, 
        background: '#f5f1ec', 
        borderRadius: 16,
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid #e0e0e0',
        boxShadow: '0 4px 24px rgba(60,76,115,0.08)',
        marginLeft: 0,
        marginTop: 0
      }}>
        {/* Feedback Header */}
        <div style={{ 
          background: 'var(--rose-accent)', 
          color: 'var(--blue-secondary)', 
          padding: '1rem', 
          borderRadius: '14px 14px 0 0',
          textAlign: 'center',
          borderBottom: '1px solid #ececec',
          fontFamily: 'Gabriela, Arial, sans-serif',
          fontWeight: 700,
          fontSize: '1.1rem'
        }}>
          📊 Detailed Analysis
        </div>
        {/* Feedback Content */}
        <div style={{ 
          flex: 1, 
          padding: '1.2rem',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <button
            onClick={requestDetailedFeedback}
            disabled={isLoadingFeedback || chatHistory.length === 0}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'var(--blue-secondary)',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              boxShadow: 'inset 0 2px 8px #3c4c7322',
              cursor: isLoadingFeedback ? 'not-allowed' : 'pointer',
              fontWeight: 700,
              marginBottom: '1rem',
              fontSize: '1rem',
              transition: 'all 0.2s'
            }}
          >
            {isLoadingFeedback ? '⏳ Processing...' : 'Request Detailed Feedback'}
          </button>
          {feedback && (
            <div style={{
              background: '#fff',
              padding: '1rem',
              borderRadius: 10,
              border: '1px solid #c38d94',
              flex: 1,
              overflowY: 'auto',
              fontSize: '1rem',
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              fontFamily: 'AR One Sans, Arial, sans-serif',
              fontWeight: 400
            }}>
              {feedback}
            </div>
          )}
        </div>
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
      {/* Topic Selection Modal */}
      <TopicSelectionModal
        isOpen={showTopicModal}
        onClose={() => setShowTopicModal(false)}
        onStartConversation={handleModalConversationStart}
        currentLanguage={language}
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