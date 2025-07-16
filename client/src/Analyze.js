import React, { useState, useRef, useEffect } from 'react';
import { useUser } from './App';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import PropTypes from 'prop-types';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let MediaRecorderClass = null;
if (typeof window !== 'undefined') {
  MediaRecorderClass = window.MediaRecorder;
}

const TALK_TOPICS = [
  { id: 'family',    label: 'Family and relationships',            icon: '👨‍👩‍👧‍👦' },
  { id: 'travel',    label: 'Travel experiences and cultures',      icon: '✈️' },
  { id: 'heritage',  label: 'Cultural heritage and traditions',     icon: '🏛️' },
  { id: 'business',  label: 'Work and professional life',           icon: '💼' },
  { id: 'media',     label: 'Movies, music, and media',             icon: '🎬' },
  { id: 'food',      label: 'Food and cooking',                     icon: '🍽️' },
  { id: 'hobbies',   label: 'Hobbies and leisure activities',       icon: '🎨' },
  { id: 'news',      label: 'News and current events',              icon: '📰' },
  { id: 'sports',    label: 'Sports and fitness',                   icon: '⚽️' },
  { id: 'education', label: 'Education and learning',               icon: '📚' },
  { id: 'technology', label: 'Technology and innovation',           icon: '💻' },
  { id: 'health',    label: 'Health and wellness',                  icon: '🏥' }
];

const API = axios.create({ 
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:4000', 
  withCredentials: false 
});

// Add JWT token to requests
API.interceptors.request.use(config => {
  const token = localStorage.getItem('jwt');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const getLanguageLabel = (code) => {
  const languages = {
    'en': 'English',
    'es': 'Spanish', 
    'hi': 'Hindi',
    'ja': 'Japanese',
    'tl': 'Tagalog',
    'ta': 'Tamil',
    'ar': 'Arabic',
    'zh': 'Mandarin',
    'ko': 'Korean'
  };
  return languages[code] || 'English';
};

function TopicSelectionModal({ isOpen, onClose, onStartConversation, currentLanguage }) {
  const [selectedTopic, setSelectedTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [useCustomTopic, setUseCustomTopic] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentDashboard, setCurrentDashboard] = useState(null);

  // Move fetchLanguageDashboard back inside the component
  const fetchLanguageDashboard = async () => {
    try {
      const response = await API.get(`/api/user/language-dashboards/${currentLanguage}`);
      setCurrentDashboard(response.data.dashboard);
    } catch (err) {
      console.error('Error fetching language dashboard:', err);
      setError('Failed to load language settings');
    }
  };

  useEffect(() => {
    if (currentLanguage && isOpen) {
      fetchLanguageDashboard();
    }
  }, [currentLanguage, isOpen, fetchLanguageDashboard]);



  const handleTopicSelect = (topicId) => {
    setSelectedTopic(topicId);
    setUseCustomTopic(false);
    setCustomTopic('');
    setError('');
  };

  const handleCustomTopicToggle = () => {
    setUseCustomTopic(!useCustomTopic);
    setSelectedTopic('');
    setError('');
  };

  const handleStartConversation = async () => {
    const finalTopic = useCustomTopic ? customTopic.trim() : selectedTopic;
    
    if (!finalTopic) {
      setError('Please select a topic or enter a custom topic.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const topicLabel = useCustomTopic 
        ? customTopic.trim() 
        : TALK_TOPICS.find(t => t.id === selectedTopic)?.label;

      const response = await API.post('/api/conversations', {
        language: currentLanguage || 'en',
        title: `${topicLabel} Discussion`,
        topics: [finalTopic]
      });

      const conversationId = response.data.conversation.id;
      onStartConversation(conversationId, [finalTopic]);
      onClose();
    } catch (err) {
      console.error('Error creating conversation:', err);
      setError('Failed to start conversation. Please try again.');
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
            Choose from the topics you selected during onboarding. You can add or remove topics in your profile settings.
          </p>
          
          {currentDashboard?.talk_topics && currentDashboard.talk_topics.length > 0 ? (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '0.5rem'
            }}>
              {currentDashboard.talk_topics.map(topicId => {
                const topic = TALK_TOPICS.find(t => t.id === topicId);
                if (!topic) return null;
                return (
                  <div
                    key={topic.id}
                    onClick={() => handleTopicSelect(topic.id)}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: `2px solid ${selectedTopic === topic.id ? '#7e5a75' : 'rgba(126,90,117,0.2)'}`,
                      backgroundColor: selectedTopic === topic.id ? 'rgba(126,90,117,0.1)' : '#f8f6f4',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <div style={{ fontSize: '1.2rem' }}>{topic.icon}</div>
                    <div style={{ fontWeight: 500, color: '#3c4c73', fontSize: '0.85rem' }}>{topic.label}</div>
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
              onChange={handleCustomTopicToggle}
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

        {/* Selected Topic Display */}
        {(selectedTopic || (useCustomTopic && customTopic.trim())) && (
          <div style={{
            background: 'rgba(126,90,117,0.1)',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1.5rem'
          }}>
            <h4 style={{ color: '#3c4c73', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              Selected Topic:
            </h4>
            <div style={{
              background: '#7e5a75',
              color: '#fff',
              padding: '0.5rem 1rem',
              borderRadius: '12px',
              fontSize: '0.9rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              {useCustomTopic ? (
                <>✍️ {customTopic}</>
              ) : (
                <>
                  {TALK_TOPICS.find(t => t.id === selectedTopic)?.icon} {TALK_TOPICS.find(t => t.id === selectedTopic)?.label}
                </>
              )}
            </div>
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
            disabled={isLoading || (!selectedTopic && (!useCustomTopic || !customTopic.trim()))}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: 10,
              border: 'none',
              background: isLoading || (!selectedTopic && (!useCustomTopic || !customTopic.trim())) ? '#ccc' : 
                         'linear-gradient(135deg, #7e5a75 0%, #8a6a7a 100%)',
              color: '#fff',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: isLoading || (!selectedTopic && (!useCustomTopic || !customTopic.trim())) ? 'not-allowed' : 'pointer',
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

TopicSelectionModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onStartConversation: PropTypes.func.isRequired,
  currentLanguage: PropTypes.string
};

function usePersistentChatHistory(user) {
  const [chatHistory, setChatHistory] = useState(() => {
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
    return () => document.head.removeChild(style);
  }, []);

  const { user } = useUser();
  const [searchParams] = useSearchParams();
  const urlLang = searchParams.get('language') || searchParams.get('lang');
  const urlConversationId = searchParams.get('conversation');
  const urlTopics = searchParams.get('topics');
  
  // Debug URL parameters
  console.log('[DEBUG] URL parameters:', {
    urlLang,
    urlConversationId,
    urlTopics,
    allParams: Object.fromEntries(searchParams.entries())
  });
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const recognitionRef = useRef(null);
  const ttsAudioRef = useRef(null);
  const autoSpeakRef = useRef(false);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [chatHistory, setChatHistory] = usePersistentChatHistory(user);
  const [language, setLanguage] = useState(urlLang || user?.target_language || 'en');
  const [conversationId, setConversationId] = useState(null);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [translations, setTranslations] = useState({});
  const [isTranslating, setIsTranslating] = useState({});
  const [showTranslations, setShowTranslations] = useState({});
  const [isLoadingMessageFeedback, setIsLoadingMessageFeedback] = useState({});
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  // Add state for short feedback toggle
  const [enableShortFeedback, setEnableShortFeedback] = useState(true); // default ON
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [mediaStream, setMediaStream] = useState(null);
  const [wasInterrupted, setWasInterrupted] = useState(false);
  const interruptedRef = useRef(false);
  // Add a state to store short feedback for each message
  const [shortFeedbacks, setShortFeedbacks] = useState({});
  
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
      const topics = urlTopics.split(',').filter(topic => topic.trim());
      // setSelectedTopics(topics); // This setter is no longer used
    }
  }, [urlTopics]);

  // Debug chat history changes
  useEffect(() => {
    console.log('Chat history changed:', chatHistory);
  }, [chatHistory]);
  const loadExistingConversation = async (convId) => {
    if (!user || !convId) {
      console.log('[DEBUG] No user or conversation ID, skipping load');
      return;
    }
    console.log('[DEBUG] Loading existing conversation:', convId);
    setIsLoadingConversation(true);
    try {
      const response = await API.get(`/api/conversations/${convId}`);
      console.log('[DEBUG] Conversation load response:', response.data);
      const conversation = response.data.conversation;
      setConversationId(conversation.id);
      setLanguage(conversation.language);
      const messages = conversation.messages || [];
      const history = messages.map(msg => ({
        sender: msg.sender,
        text: msg.text,
        timestamp: new Date(msg.created_at)
      }));
      console.log('[DEBUG] Loaded conversation history with', history.length, 'messages');
      console.log('[DEBUG] Messages:', history);
      setChatHistory(history);
    } catch (error) {
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
  const validateConversationId = async (user, urlConversationId, setConversationId) => {
    if (user && urlConversationId) {
      try {
        const response = await API.get(`/api/conversations/${urlConversationId}`);
        if (!response.data.conversation) {
          // Conversation not found, clear from URL and state
          const newUrl = new URL(window.location);
          newUrl.searchParams.delete('conversation');
          window.history.replaceState({}, '', newUrl);
          setConversationId(null);
        }
      } catch (error) {
        if (error.response && error.response.status === 404) {
          // Conversation not found, clear from URL and state
          const newUrl = new URL(window.location);
          newUrl.searchParams.delete('conversation');
          window.history.replaceState({}, '', newUrl);
          setConversationId(null);
        }
      }
    }
  };

  useEffect(() => {
    // On login, check if urlConversationId is present and valid
    validateConversationId(user, urlConversationId, setConversationId);
  }, [user, urlConversationId]);


   // Load existing conversation if URL has conversation ID
    if (user && urlConversationId && !conversationId && !isLoadingConversation) {
      console.log('[DEBUG] CONDITIONS MET - Loading existing conversation from URL:', urlConversationId);
      loadExistingConversation(urlConversationId);
    } else {
      console.log('[DEBUG] CONDITIONS NOT MET for conversation loading:', {
        hasUser: !!user,
        hasUrlConversationId: !!urlConversationId,
        noConversationId: !conversationId,
        notLoadingConversation: !isLoadingConversation
      });
    }



  const saveSessionToBackend = async (showAlert = true) => {
    try {
      await API.post('/api/save-session', { 
        userId: user?.id,
        chatHistory,
        language
      });
      setShowSavePrompt(false);
      localStorage.removeItem('chatHistory');
      if (showAlert) {
        alert('Session saved to your account!');
      }
    } catch (e) {
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

  // Replace startRecording and stopRecording with MediaRecorder + SpeechRecognition logic
  const startRecording = async () => {
    setWasInterrupted(false);
    if (!SpeechRecognition) {
      alert('SpeechRecognition API not supported in this browser.');
      return;
    }
    if (!MediaRecorderClass) {
      alert('MediaRecorder API not supported in this browser.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMediaStream(stream);
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorderClass(stream);
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (e) => {
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
          return;
        }
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        sendAudioToBackend(audioBlob);
        stream.getTracks().forEach(track => track.stop());
        setMediaStream(null);
      };
      mediaRecorder.start();
      // Start SpeechRecognition for speech activity detection
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = language || 'en-US';
      recognition.interimResults = false;
      recognition.continuous = false;
      setIsRecording(true);
      recognition.onresult = (event) => {
        setIsRecording(false);
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
      };
      recognition.onerror = (event) => {
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
    } catch (err) {
      alert('Could not start audio recording: ' + err.message);
      setIsRecording(false);
      setMediaStream(null);
    }
  };

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
  };

  // New: Separate function to fetch and show short feedback
  const fetchAndShowShortFeedback = async (transcription) => {
    console.log('[DEBUG] fetchAndShowShortFeedback called', { autoSpeak, enableShortFeedback, chatHistory: [...chatHistory] });
    if (!autoSpeak || !enableShortFeedback) return;
    // Prepare context (last 4 messages)
    const context = chatHistory.slice(-4).map(msg => `${msg.sender}: ${msg.text}`).join('\n');
    try {
      console.log('[DEBUG] (fetchAndShowShortFeedback) Calling /short_feedback API with:', { transcription, context, language, user_level: user?.proficiency_level || 'beginner', user_topics: user?.talk_topics || [] });
      // Hardcode the short feedback endpoint to the Python backend
      const shortFeedbackRes = await axios.post(
        'http://localhost:5001/short_feedback',
        {
          user_input: transcription,
          context,
          language,
          user_level: user?.proficiency_level || 'beginner',
          user_topics: user?.talk_topics || []
        }
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
    } catch (e) {
      console.error('[DEBUG] (fetchAndShowShortFeedback) Error calling /short_feedback API:', e);
    }
  };

  // Update sendAudioToBackend to handle short feedback in autospeak mode
  const sendAudioToBackend = async (audioBlob) => {
    if (!(audioBlob instanceof Blob)) return;
    try {
      setIsProcessing(true);
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('language', language);
      formData.append('chatHistory', JSON.stringify(chatHistory));
      // Add JWT token to headers
      const token = localStorage.getItem('jwt');
      const response = await API.post('/api/analyze', formData, {
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
        await saveMessageToBackend('User', transcription, 'text', null, conversationId);
      }
      // Add AI response if present
      if (response.data.aiResponse) {
        setChatHistory(prev => [...prev, { sender: 'AI', text: response.data.aiResponse, timestamp: new Date() }]);
        if (conversationId) {
          await saveMessageToBackend('AI', response.data.aiResponse, 'text', null, conversationId);
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
        } catch (fetchError) {
          console.error('Error checking TTS audio file:', fetchError);
        }
      }
    } catch (error) {
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
      const response = await API.post('/api/feedback', {
        conversationId: conversationId,
        language,
      });
      setFeedback(response.data.feedback);
    } catch (error) {
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
      const response = await API.post('/api/suggestions', {
        conversationId: conversationId,
        language: language
      });
      setSuggestions(response.data.suggestions || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleModalConversationStart = (newConversationId, topics) => {
    setConversationId(newConversationId);
    // setSelectedTopics(topics); // This setter is no longer used
    setChatHistory([]);
    setShowTopicModal(false);
    
    // Update URL to include conversation ID
    const newUrl = new URL(window.location);
    newUrl.searchParams.set('conversation', newConversationId);
    newUrl.searchParams.set('topics', topics.join(','));
    window.history.pushState({}, '', newUrl);
  };

  const handleSuggestionClick = () => {
    // Just scroll to recording button to encourage user to record
    const recordingSection = document.querySelector('[data-recording-section]');
    if (recordingSection) {
      recordingSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const saveMessageToBackend = async (sender, text, messageType = 'text', audioFilePath = null, targetConversationId = null) => {
    const useConversationId = targetConversationId || conversationId;
    if (!useConversationId) {
      console.error('[DEBUG] No conversation ID available');
      return;
    }
    console.log('[DEBUG] Saving message to backend:', { sender, text, messageType, audioFilePath, conversationId: useConversationId });
    try {
      const response = await API.post(`/api/conversations/${useConversationId}/messages`, {
        sender,
        text,
        messageType,
        audioFilePath
      });
      console.log('[DEBUG] Message saved to backend successfully:', response.data);
    } catch (error) {
      console.error('[DEBUG] Error saving message to backend:', error);
      console.error('[DEBUG] Error details:', error.response?.data || error.message);
    }
  };

  const translateMessage = async (messageIndex, text, breakdown = false) => {
    if (isTranslating[messageIndex]) return;
    
    setIsTranslating(prev => ({ ...prev, [messageIndex]: true }));
    
    try {
      const response = await API.post('/api/translate', {
        text,
        source_language: 'auto',
        target_language: 'en',
        breakdown
      });
      
      setTranslations(prev => ({ 
        ...prev, 
        [messageIndex]: response.data 
      }));
      
      setShowTranslations(prev => ({ 
        ...prev, 
        [messageIndex]: true 
      }));
    } catch (error) {
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

  const handleMessageClick = (index, text) => {
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

  const requestDetailedFeedbackForMessage = async (messageIndex) => {
    if (!conversationId) return;
    
    setIsLoadingMessageFeedback(prev => ({ ...prev, [messageIndex]: true }));
    
    try {
      const response = await API.post('/api/feedback', {
        conversationId,
        language
      });
      
      const detailedFeedback = response.data.feedback;
      
      // Store feedback in the database for the specific message
      const message = chatHistory[messageIndex];
      if (message && message.id) {
        await API.post(`/api/messages/${message.id}/feedback`, {
          feedback: detailedFeedback
        });
        
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
    } catch (error) {
      console.error('Error getting detailed feedback:', error);
      setFeedback('Error getting detailed feedback. Please try again.');
    } finally {
      setIsLoadingMessageFeedback(prev => ({ ...prev, [messageIndex]: false }));
    }
  };

  const toggleDetailedFeedback = (messageIndex) => {
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
            <button onClick={saveSessionToBackend} style={{ marginRight: 8 }}>Save</button>
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
          {console.log('Rendering chat history:', chatHistory)}
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
                    e.target.style.transform = 'scale(1.02)';
                    e.target.style.boxShadow = message.sender === 'User' ? 
                      '0 4px 12px rgba(195,141,148,0.4)' : 
                      message.sender === 'AI' ? '0 4px 12px rgba(60,76,115,0.2)' : '0 2px 8px rgba(230,126,34,0.18)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = message.sender === 'User' ? 
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
                            {translations[index].breakdown.word_by_word.map((word, wordIndex) => (
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
                  e.target.style.background = '#6b4d64';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = '#7e5a75';
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
                      onClick={() => handleSuggestionClick(suggestion.text)}
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
                        e.target.style.background = '#7e5a75';
                        e.target.style.color = '#fff';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.background = '#c38d94';
                        e.target.style.color = '#3e3e3e';
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
                    e.target.style.background = '#7e5a75';
                    e.target.style.color = '#fff';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = 'transparent';
                    e.target.style.color = '#7e5a75';
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
         {/* Interrupt/Redo Button */}
         {isRecording && (
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
          <button
            onClick={isRecording ? () => stopRecording(false) : startRecording}
            disabled={isProcessing}
            style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              border: 'none',
              background: isRecording ? '#7e5a75' : '#c38d94',
              color: isRecording ? '#fff' : '#3e3e3e',
              fontSize: '24px',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
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
            {isRecording ? 'Recording... Click to stop' : 'Click to start recording'}
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

export default Analyze; 