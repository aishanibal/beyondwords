import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useUser } from './_app';
import axios from 'axios';
import { useRouter } from 'next/router';
import { TALK_TOPICS, Topic } from '../lib/preferences';

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

// Add interface for TopicSelectionModal props
interface TopicSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartConversation: (id: string, topics: string[], aiMessage: any, formality: string) => void;
  currentLanguage?: string;
}
function TopicSelectionModal({ isOpen, onClose, onStartConversation, currentLanguage }: TopicSelectionModalProps) {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [customTopic, setCustomTopic] = useState<string>('');
  const [useCustomTopic, setUseCustomTopic] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [currentDashboard, setCurrentDashboard] = useState<any>(null); // TODO: type this
  const [selectedFormality, setSelectedFormality] = useState<string>('friendly');

  // Memoize fetchLanguageDashboard to avoid recreating it on every render
  const fetchLanguageDashboard = useCallback(async () => {
    try {
      const response = await axios.get(`/api/user/language-dashboards/${currentLanguage}`, { headers: getAuthHeaders() });
      setCurrentDashboard(response.data.dashboard);
    } catch (err: any) {
      console.error('Error fetching language dashboard:', err);
      setError('Failed to load language settings');
    }
  }, [currentLanguage]);

  // Only run when currentLanguage or isOpen changes
  useEffect(() => {
    if (currentLanguage && isOpen) {
      fetchLanguageDashboard();
    }
  }, [currentLanguage, isOpen, fetchLanguageDashboard]);

  // Add a helper to check if dashboard exists and is valid
  const dashboardExists = !!(currentDashboard && currentDashboard.language === currentLanguage);

  const handleTopicSelect = (topicId: string) => {
    setSelectedTopics((prev: string[]) =>
      prev.includes(topicId)
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
    setError('');
  };

  const handleCustomTopicToggle = () => {
    setUseCustomTopic(!useCustomTopic);
    setSelectedTopics([]); // Clear selected topics if custom topic is used
    setError('');
  };

  const handleStartConversation = async () => {
    if (!dashboardExists) {
      setError('No language dashboard found for this language. Please complete onboarding or add this language in your dashboard.');
      return;
    }
    let topics: string[] = [...selectedTopics];
    if (useCustomTopic && customTopic.trim()) {
      topics.push(customTopic.trim());
    }
    if (topics.length === 0) {
      setError('Please select at least one topic or enter a custom topic.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('jwt');
      // Use the language from the current dashboard if available
      const dashboardLanguage = currentDashboard?.language || currentLanguage || 'en';
      const response = await axios.post('/api/conversations', {
        language: dashboardLanguage,
        title: topics.length === 1 ? `${topics[0]} Discussion` : 'Multi-topic Discussion',
        topics: topics,
        formality: selectedFormality
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const { conversation, aiMessage } = response.data;
      if (!conversation || !conversation.id) {
        setError('Failed to create conversation. Please check your language dashboard for this language.');
        setIsLoading(false);
        return;
      }
      // Robust verification: retry GET a few times if needed
      let verified = null;
      for (let i = 0; i < 5; i++) {
        try {
          const fetchRes = await axios.get(`/api/conversations/${conversation.id}`, { headers: { Authorization: `Bearer ${token}` } });
          if (fetchRes.data && fetchRes.data.conversation) {
            verified = fetchRes.data.conversation;
            break;
          }
        } catch (e) {
          await new Promise(res => setTimeout(res, 300));
        }
      }
      if (verified) {
        onStartConversation(conversation.id, topics, aiMessage, selectedFormality);
        onClose();
      } else {
        setError('Failed to verify new conversation. Please try again.');
      }
    } catch (err: any) {
      console.error('Error creating conversation:', err);
      setError('Failed to start conversation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 20,
        padding: '2rem',
        boxShadow: '0 20px 60px rgba(60,76,115,0.25)',
        maxWidth: 500,
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💬</div>
          <h2 style={{
            color: '#3c4c73',
            fontSize: '1.5rem',
            fontWeight: 700,
            marginBottom: '0.5rem',
            fontFamily: 'Grandstander, Arial, sans-serif'
          }}>
            Choose Your Topic
          </h2>
          <p style={{ color: '#7e5a75', fontSize: '0.9rem', margin: 0 }}>
            Select one topic to focus on in this practice session
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div style={{
            background: 'rgba(220,53,69,0.1)',
            color: '#dc3545',
            padding: '0.75rem',
            borderRadius: 8,
            marginBottom: '1.5rem',
            border: '1px solid rgba(220,53,69,0.2)',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {/* Dashboard missing warning */}
        {!dashboardExists && (
          <div style={{
            background: 'rgba(255, 215, 0, 0.15)',
            color: '#b8860b',
            padding: '1rem',
            borderRadius: 8,
            marginBottom: '1.5rem',
            border: '1px solid #ffe066',
            textAlign: 'center',
            fontWeight: 600
          }}>
            No language dashboard found for this language.<br />
            Please complete onboarding or add this language in your dashboard settings before starting a conversation.
          </div>
        )}

        {/* Available Topics */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ 
            color: '#3c4c73', 
            fontSize: '1rem', 
            fontWeight: 600, 
            marginBottom: '0.5rem'
          }}>
            Your Topics
          </h3>
          <p style={{ 
            color: '#7e5a75', 
            fontSize: '0.85rem', 
            marginBottom: '1rem',
            lineHeight: 1.4
          }}>
            Choose one or more topics to focus on in this practice session. You can add or remove topics in your profile settings.
          </p>
          
          {currentDashboard?.talk_topics && currentDashboard.talk_topics.length > 0 ? (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '0.5rem'
            }}>
              {currentDashboard.talk_topics.map((topicId: string) => {
                const topic: Topic | undefined = TALK_TOPICS.find((t: Topic) => t.id === topicId);
                if (!topic) return null;
                const isSelected = selectedTopics.includes(topic.id);
                return (
                  <div
                    key={topic.id}
                    onClick={() => handleTopicSelect(topic.id)}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: `2px solid ${isSelected ? '#7e5a75' : 'rgba(126,90,117,0.2)'}`,
                      backgroundColor: isSelected ? 'rgba(126,90,117,0.1)' : '#f8f6f4',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontWeight: 500,
                      color: '#3c4c73',
                      fontSize: '0.85rem',
                    }}
                  >
                    <div style={{ fontSize: '1.2rem' }}>{topic.icon}</div>
                    <div>{topic.label}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{
              padding: '1.5rem',
              background: 'rgba(126,90,117,0.1)',
              borderRadius: '8px',
              textAlign: 'center',
              border: '2px dashed rgba(126,90,117,0.3)'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📝</div>
              <div style={{ color: '#7e5a75', fontWeight: 600, marginBottom: '0.5rem' }}>
                No topics selected yet
              </div>
              <div style={{ color: '#7e5a75', fontSize: '0.85rem' }}>
                Visit your profile settings to add topics you&apos;d like to discuss.
              </div>
            </div>
          )}
        </div>

        {/* Custom Topic Section */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            marginBottom: '0.75rem' 
          }}>
            <input
              type="checkbox"
              checked={useCustomTopic}
              onChange={() => setUseCustomTopic(!useCustomTopic)}
              style={{ transform: 'scale(1.2)' }}
            />
            <h3 style={{ 
              color: '#3c4c73', 
              fontSize: '1rem', 
              fontWeight: 600, 
              margin: 0
            }}>
              ✍️ Custom Topic
            </h3>
          </div>
          
          {useCustomTopic && (
            <div>
              <input
                type="text"
                placeholder="Enter your custom topic (e.g., 'My childhood memories', 'Planning a vacation')"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '2px solid rgba(126,90,117,0.3)',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit',
                  background: '#f8f6f4',
                  color: '#3c4c73'
                }}
                autoFocus
              />
            </div>
          )}
        </div>

        {/* Formality/Closeness Selector */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ color: '#3c4c73', fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Conversation Formality
          </h3>
          <p style={{ color: '#7e5a75', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: 1.4 }}>
            Choose the level of formality or closeness for this session. This affects the AI's tone, pronouns, and style.
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.5rem'
          }}>
            {Object.entries(CLOSENESS_LEVELS).map(([key, desc]) => {
              const iconMatch = desc.match(/([\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF])/);
              const icon = iconMatch ? iconMatch[0] : '';
              const label = desc.split(':')[0];
              const detail = desc.split(':').slice(1).join(':').trim();
              return (
                <div
                  key={key}
                  onClick={() => setSelectedFormality(key)}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: `2px solid ${selectedFormality === key ? '#7e5a75' : 'rgba(126,90,117,0.2)'}`,
                    backgroundColor: selectedFormality === key ? 'rgba(126,90,117,0.1)' : '#f8f6f4',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    minHeight: 60,
                    boxShadow: selectedFormality === key ? '0 2px 8px rgba(126,90,117,0.12)' : 'none',
                  }}
                >
                  <div style={{ fontSize: '1.5rem', marginTop: 2 }}>{icon}</div>
                  <div>
                    <div style={{ fontWeight: 600, color: '#3c4c73', fontSize: '0.95rem', marginBottom: 2 }}>{label}</div>
                    <div style={{ color: '#7e5a75', fontSize: '0.85rem', opacity: 0.85 }}>{detail}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Tags Display (Topics + Formality) */}
        {(selectedTopics.length > 0 || (useCustomTopic && customTopic.trim()) || selectedFormality) && (
          <div style={{
            background: 'rgba(126,90,117,0.1)',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            alignItems: 'center'
          }}>
            {/* Topic tags */}
            {selectedTopics.map((topicId: string) => {
              const topic: Topic | undefined = TALK_TOPICS.find((t: Topic) => t.id === topicId);
              if (!topic) return null;
              return (
                <span key={topicId} style={{
                  background: '#7e5a75',
                  color: '#fff',
                  padding: '0.5rem 1rem',
                  borderRadius: '12px',
                  fontSize: '0.9rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 500
                }}>
                  {topic.icon} {topic.label}
                </span>
              );
            })}
            {/* Custom topic tag */}
            {useCustomTopic && customTopic.trim() && (
              <span style={{
                background: '#e67e22',
                color: '#fff',
                padding: '0.5rem 1rem',
                borderRadius: '12px',
                fontSize: '0.9rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: 500
              }}>
                ✍️ {customTopic.trim()}
              </span>
            )}
            {/* Formality tag */}
            {selectedFormality && (
              <span style={{
                background: '#3c4c73',
                color: '#fff',
                padding: '0.5rem 1rem',
                borderRadius: '12px',
                fontSize: '0.9rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: 500
              }}>
                🏷️ {CLOSENESS_LEVELS[selectedFormality].split(':')[0]}
              </span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: 10,
              border: '2px solid rgba(126,90,117,0.3)',
              background: 'transparent',
              color: '#7e5a75',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            Cancel
          </button>

          <button
            onClick={handleStartConversation}
            disabled={isLoading || (!selectedTopics.length && (!useCustomTopic || !customTopic.trim())) || !dashboardExists}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: 10,
              border: 'none',
              background: isLoading || (!selectedTopics.length && (!useCustomTopic || !customTopic.trim())) || !dashboardExists ? '#ccc' : 
                         'linear-gradient(135deg, #7e5a75 0%, #8a6a7a 100%)',
              color: '#fff',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: isLoading || (!selectedTopics.length && (!useCustomTopic || !customTopic.trim())) || !dashboardExists ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            {isLoading ? '🔄 Starting...' : '🎤 Start Practice Session'}
          </button>
        </div>
      </div>
    </div>
  );
}

function usePersistentChatHistory(user: any): [any[], React.Dispatch<React.SetStateAction<any[]>>] {
  const [chatHistory, setChatHistory] = useState<any[]>(() => {
    if (!user) {
      const saved = localStorage.getItem('chatHistory');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  useEffect(() => {
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
  const { conversation: urlConversationId, language: urlLang, topics: urlTopics } = router.query;

  // Helper to get a string or null from router.query param
  const getQueryString = (param: string | string[] | undefined): string | null => {
    if (Array.isArray(param)) return param[0] || null;
    return param ?? null;
  };

  const conversationIdParam = getQueryString(urlConversationId);
  const langParam = getQueryString(urlLang);
  const topicsParam = getQueryString(urlTopics);

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
  const [language, setLanguage] = useState<string>(langParam || user?.target_language || 'en');
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
    if (user && !conversationIdParam && !conversationId && chatHistory.length === 0) {
      setShowTopicModal(true);
    }
  }, [user, conversationIdParam, conversationId, chatHistory.length]);

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
    if (topicsParam) {
      const topics = topicsParam.split(',').filter((topic: string) => topic.trim());
      // setSelectedTopics(topics); // This setter is no longer used
    }
  }, [topicsParam]);

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
      validateConversationId(user, conversationIdParam, setConversationId);
    }
  }, [user, conversationIdParam, skipValidation]);


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
    if (chatHistory.length === 0) {
      alert('Please record some speech first.');
      return;
    }
    if (!conversationId) {
      alert('No conversation found. Please start a conversation first.');
      return;
    }
    setIsLoadingFeedback(true);
    try {
      const token = localStorage.getItem('jwt');
      const response = await axios.post(
        '/api/feedback',
        {
          conversationId: conversationId,
          language,
        },
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );
      setFeedback(response.data.feedback);
    } catch (error: any) {
      console.error('Error requesting feedback:', error);
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
    router.replace({
      pathname: '/analyze',
      query: { conversation: newConversationId, topics: topics.join(',') }
    });
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
    if (user && conversationIdParam && chatHistory.length === 0) {
      loadExistingConversation(conversationIdParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, conversationIdParam]);

  return (
    <div style={{ 
      display: 'flex', 
      height: 'calc(100vh - 80px)', 
      background: '#f5f1ec',
      padding: '2rem'
    }}>
      <div style={{ flex: 1, background: '#fff', borderRadius: 0, marginRight: '1rem', display: 'flex', flexDirection: 'column', border: '1px solid #e0e0e0', boxShadow: '0 1px 4px rgba(0,0,0,0.02)' }}>
        {/* Header Bar */}
        <div style={{ padding: '1rem', background: '#f5f1ec', borderBottom: '1px solid #ececec', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ color: '#7e5a75', fontWeight: 600, fontSize: '1rem' }}>
            🌐 {getLanguageLabel(language)} Practice Session
          </div>
        </div>
        {/* Save session prompt */}
        {showSavePrompt && (
          <div style={{ background: '#fffbe6', border: '1px solid #c38d94', padding: 16, borderRadius: 8, margin: 16 }}>
            <p>You have an unsaved session. Save it to your account?</p>
            <button onClick={() => saveSessionToBackend()} style={{ marginRight: 8 }}>Save</button>
            <button onClick={() => { setShowSavePrompt(false); localStorage.removeItem('chatHistory'); }}>Dismiss</button>
          </div>
        )}
        {/* Chat Header */}
        <div style={{ background: '#3c4c73', color: '#fff', padding: '1rem', borderRadius: '18px 18px 0 0', textAlign: 'center' }}>
          <h2>🎤 BeyondWords Chat</h2>
        </div>
        {/* Chat Messages */}
        <div style={{ 
          flex: 1, 
          padding: '1rem', 
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          
          {isLoadingConversation && (
            <div style={{
              alignSelf: 'center',
              padding: '0.5rem 1rem',
              background: '#f5f1ec',
              borderRadius: 0,
              color: '#7e5a75',
              fontSize: '0.9rem'
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
              marginBottom: '1rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem'
              }}>
                <div 
                  onClick={() => handleMessageClick(index, message.text)}
                  style={{
                    flex: 1,
                    padding: '0.75rem 1rem',
                    borderRadius: message.sender === 'User' ? '20px 20px 4px 20px' : message.sender === 'AI' ? '20px 20px 20px 4px' : '12px',
                    background: message.sender === 'User' ? 
                      'linear-gradient(135deg, #c38d94 0%, #b87d8a 100%)' : 
                      message.sender === 'AI' ? 
                        'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)' :
                        '#fff7e6',
                    color: message.sender === 'User' ? '#fff' : message.sender === 'System' ? '#e67e22' : '#3e3e3e',
                    border: message.sender === 'AI' ? '1px solid #e0e0e0' : message.sender === 'System' ? '1px solid #e67e22' : 'none',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: isTranslating[index] ? 0.7 : 1,
                    position: 'relative',
                    boxShadow: message.sender === 'User' ? 
                      '0 2px 8px rgba(195,141,148,0.3)' : 
                      message.sender === 'AI' ? '0 2px 8px rgba(60,76,115,0.15)' : '0 1px 4px rgba(230,126,34,0.08)',
                    maxWidth: '75%',
                    wordWrap: 'break-word',
                    transform: 'scale(1)',
                    fontWeight: message.sender === 'User' ? '500' : message.sender === 'System' ? '500' : '400',
                    animation: 'messageAppear 0.3s ease-out'
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLButtonElement).style.transform = 'scale(1.02)';
                    (e.target as HTMLButtonElement).style.boxShadow = message.sender === 'User' ? 
                      '0 4px 12px rgba(195,141,148,0.4)' : 
                      message.sender === 'AI' ? '0 4px 12px rgba(60,76,115,0.2)' : '0 2px 8px rgba(230,126,34,0.18)';
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLButtonElement).style.transform = 'scale(1)';
                    (e.target as HTMLButtonElement).style.boxShadow = message.sender === 'User' ? 
                      '0 2px 8px rgba(195,141,148,0.3)' : 
                      message.sender === 'AI' ? '0 2px 8px rgba(60,76,115,0.15)' : '0 1px 4px rgba(230,126,34,0.08)';
                  }}
                >
                  {message.text}
                  {isTranslating[index] && (
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem' }}>
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
                      padding: '0.5rem 0.75rem',
                      borderRadius: '12px',
                      border: message.detailed_feedback ? 'none' : '1px solid #c38d94',
                      background: message.detailed_feedback ? 
                        'linear-gradient(135deg, #c38d94 0%, #b87d8a 100%)' : 
                        'rgba(195,141,148,0.1)',
                      color: message.detailed_feedback ? '#fff' : '#c38d94',
                      fontSize: '0.8rem',
                      cursor: isLoadingMessageFeedback[index] ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      opacity: isLoadingMessageFeedback[index] ? 0.6 : 1,
                      minWidth: '80px',
                      fontWeight: '500',
                      boxShadow: message.detailed_feedback ? 
                        '0 2px 6px rgba(195,141,148,0.3)' : 
                        '0 1px 3px rgba(195,141,148,0.2)'
                    }}
                    title={message.detailed_feedback ? 'Show detailed feedback' : 'Generate detailed feedback'}
                  >
                    {isLoadingMessageFeedback[index] ? '🔄' : 
                     message.detailed_feedback ? '🎯 Show' : '🎯 Get'}
                  </button>
                )}
              </div>
              
              {showTranslations[index] && translations[index] && (
                <div style={{
                  padding: '0.75rem 1rem',
                  background: 'linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%)',
                  border: '1px solid #d0e4f7',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  color: '#2c5282',
                  position: 'relative',
                  marginTop: '0.5rem',
                  boxShadow: '0 2px 8px rgba(44,82,130,0.1)',
                  maxWidth: '85%'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '0.5rem'
                  }}>
                    <span style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>
                      🌐 Translation
                    </span>
                    <button
                      onClick={() => translateMessage(index, message.text, true)}
                      style={{
                        background: 'rgba(44,82,130,0.1)',
                        border: '1px solid #d0e4f7',
                        color: '#2c5282',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        transition: 'all 0.2s ease',
                        fontWeight: '500'
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
                          <div style={{ marginTop: '0.25rem' }}>
                            {translations[index].breakdown.word_by_word.map((word: any, wordIndex: any) => (
                              <span key={wordIndex} style={{
                                display: 'inline-block',
                                margin: '0.25rem 0.5rem 0.25rem 0',
                                padding: '0.3rem 0.6rem',
                                background: 'linear-gradient(135deg, #e6f3ff 0%, #d1e7ff 100%)',
                                borderRadius: '8px',
                                border: '1px solid #b8daff',
                                fontSize: '0.75rem',
                                boxShadow: '0 1px 3px rgba(44,82,130,0.1)'
                              }}>
                                <strong>{word.original}</strong> → {word.translation}
                                {word.part_of_speech && (
                                  <span style={{ opacity: 0.7, fontSize: '0.7rem' }}>
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
              borderRadius: 0,
              color: '#7e5a75',
              fontSize: '0.9rem'
            }}>
              ⏳ Processing your speech...
            </div>
          )}
        </div>
        
        {/* Text Suggestions */}
        {chatHistory.length > 0 && (
          <div style={{ 
            padding: '1rem', 
            borderTop: '1px solid #e0e0e0',
            background: '#f9f9f9',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            {suggestions.length === 0 && !isLoadingSuggestions && (
              <button
                onClick={fetchSuggestions}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#7e5a75',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  transition: 'all 0.3s ease',
                  alignSelf: 'center'
                }}
                onMouseOver={(e) => {
                  (e.target as HTMLButtonElement).style.background = '#6b4d64';
                }}
                onMouseOut={(e) => {
                  (e.target as HTMLButtonElement).style.background = '#7e5a75';
                }}
              >
                💡 Get Suggestions
              </button>
            )}
            
            {suggestions.length > 0 && (
              <>
                <div style={{ 
                  fontSize: '0.9rem', 
                  color: '#7e5a75', 
                  fontWeight: 600,
                  marginBottom: '0.5rem'
                }}>
                  💬 Try saying:
                </div>
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: '0.5rem' 
                }}>
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick()}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#c38d94',
                        color: '#3e3e3e',
                        border: 'none',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        minWidth: '120px'
                      }}
                      onMouseOver={(e) => {
                        (e.target as HTMLButtonElement).style.background = '#7e5a75';
                        (e.target as HTMLButtonElement).style.color = '#fff';
                      }}
                      onMouseOut={(e) => {
                        (e.target as HTMLButtonElement).style.background = '#c38d94';
                        (e.target as HTMLButtonElement).style.color = '#3e3e3e';
                      }}
                    >
                      <div style={{ fontWeight: 600, marginBottom: '0.2rem' }}>
                        {suggestion.text}
                      </div>
                      {suggestion.translation && suggestion.translation !== suggestion.text && (
                        <div style={{ 
                          fontSize: '0.75rem', 
                          opacity: 0.8,
                          fontStyle: 'italic'
                        }}>
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
                    background: 'transparent',
                    color: '#7e5a75',
                    border: '1px solid #7e5a75',
                    borderRadius: '15px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    transition: 'all 0.3s ease',
                    alignSelf: 'center',
                    marginTop: '0.5rem'
                  }}
                  onMouseOver={(e) => {
                    (e.target as HTMLButtonElement).style.background = '#7e5a75';
                    (e.target as HTMLButtonElement).style.color = '#fff';
                  }}
                  onMouseOut={(e) => {
                    (e.target as HTMLButtonElement).style.background = 'transparent';
                    (e.target as HTMLButtonElement).style.color = '#7e5a75';
                  }}
                >
                  🔄 Get New Suggestions
                </button>
              </>
            )}
            
            {isLoadingSuggestions && (
              <div style={{ 
                textAlign: 'center', 
                color: '#7e5a75', 
                fontSize: '0.85rem',
                opacity: 0.7,
                padding: '1rem'
              }}>
                Loading suggestions...
              </div>
            )}
          </div>
        )}
        
        {/* Recording Controls */}
        <div 
          data-recording-section
          style={{ 
            padding: '1rem', 
            borderTop: '1px solid #c38d94',
            background: '#f5f1ec',
            borderRadius: '0 0 18px 18px',
            textAlign: 'center'
          }}
        >
          {/* Autospeak Toggle Button */}
          <button
            onClick={() => setAutoSpeak(v => !v)}
            style={{
              marginBottom: '0.5rem',
              background: autoSpeak ? '#7e5a75' : '#c38d94',
              color: '#fff',
              border: 'none',
              borderRadius: '20px',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            {autoSpeak ? '✅ Autospeak ON' : 'Autospeak OFF'}
          </button>
          {/* Short Feedback Toggle Button */}
          <button
            onClick={() => setEnableShortFeedback(v => !v)}
            style={{
              marginBottom: '0.5rem',
              marginLeft: 12,
              background: enableShortFeedback ? '#e67e22' : '#c38d94',
              color: '#fff',
              border: 'none',
              borderRadius: '20px',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            {enableShortFeedback ? '💡 Short Feedback ON' : 'Short Feedback OFF'}
          </button>
          {/* Redo Button: Only show in manual mode when recording */}
          {isRecording && manualRecording && (
            <button
              onClick={() => stopRecording(true)}
              style={{
                marginLeft: 12,
                background: '#e67e22',
                color: '#fff',
                border: 'none',
                borderRadius: '20px',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              ⏹️ Redo
            </button>
          )}
          {/* Mic Button: In manual mode, toggles start/stop. In autospeak, toggles start/stop but disables stop if not recording. */}
          <button
            onClick={isRecording ? () => stopRecording(false) : startRecording}
            disabled={isProcessing || (autoSpeak && isRecording)}
            style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              border: 'none',
              background: isRecording ? '#7e5a75' : '#c38d94',
              color: isRecording ? '#fff' : '#3e3e3e',
              fontSize: '24px',
              cursor: isProcessing || (autoSpeak && isRecording) ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
              animation: isRecording
                ? autoSpeak
                  ? 'pulse-autospeak 1s infinite'
                  : 'pulse 1.5s infinite'
                : 'none',
              boxShadow: isRecording && autoSpeak
                ? '0 0 0 6px rgba(195,141,148,0.25), 0 0 0 12px rgba(60,76,115,0.15)'
                : isRecording
                  ? '0 0 0 8px rgba(195,141,148,0.18)'
                  : 'none'
            }}
          >
            {isRecording ? '⏹️' : '🎤'}
          </button>
          {/* Visual indicator for recording and silence detection */}
          {isRecording && (
            <div style={{ marginTop: '0.5rem', color: '#c0392b', fontWeight: 600, fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span style={{
                display: 'inline-block',
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: '#c0392b',
                marginRight: 6,
                boxShadow: '0 0 8px 2px #c0392b55'
              }} />
              Recording...
            </div>
          )}
          <p style={{ marginTop: '0.5rem', color: '#7e5a75', fontSize: '0.9rem' }}>
            {isRecording ? (autoSpeak ? 'Recording... Speak and pause to auto-submit.' : 'Recording... Click to stop and send') : 'Click to start recording'}
          </p>
        </div>
      </div>
      {/* Feedback Section */}
      <div style={{ 
        width: 320, 
        background: '#f5f1ec', 
        borderRadius: 0,
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid #e0e0e0',
        boxShadow: '0 1px 4px rgba(0,0,0,0.02)'
      }}>
        {/* Feedback Header */}
        <div style={{ 
          background: '#c38d94', 
          color: '#3e3e3e', 
          padding: '1rem', 
          borderRadius: '18px 18px 0 0',
          textAlign: 'center',
          borderBottom: '1px solid #ececec'
        }}>
          <h3>📊 Detailed Analysis</h3>
        </div>
        {/* Feedback Content */}
        <div style={{ 
          flex: 1, 
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <button
            onClick={requestDetailedFeedback}
            disabled={isLoadingFeedback || chatHistory.length === 0}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: '#3c4c73',
              color: '#fff',
              border: 'none',
              borderRadius: 0,
              boxShadow: 'inset 0 2px 8px #3c4c7322',
              cursor: isLoadingFeedback ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              marginBottom: '1rem'
            }}
          >
            {isLoadingFeedback ? '⏳ Processing...' : 'Request Detailed Feedback'}
          </button>
          {feedback && (
            <div style={{
              background: '#fff',
              padding: '1rem',
              borderRadius: 0,
              border: '1px solid #c38d94',
              flex: 1,
              overflowY: 'auto',
              fontSize: '0.9rem',
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap'
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