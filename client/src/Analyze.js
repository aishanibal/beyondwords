import React, { useState, useRef, useEffect } from 'react';
import { useUser } from './App';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';

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

function TopicSelectionModal({ isOpen, onClose, onStartConversation, user, currentLanguage }) {
  const [selectedTopic, setSelectedTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [useCustomTopic, setUseCustomTopic] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentDashboard, setCurrentDashboard] = useState(null);

  useEffect(() => {
    if (currentLanguage && isOpen) {
      fetchLanguageDashboard();
    }
  }, [currentLanguage, isOpen]);

  const fetchLanguageDashboard = async () => {
    try {
      const response = await API.get(`/api/user/language-dashboards/${currentLanguage}`);
      setCurrentDashboard(response.data.dashboard);
    } catch (err) {
      console.error('Error fetching language dashboard:', err);
      setError('Failed to load language settings');
    }
  };

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
                Visit your profile settings to add topics you'd like to discuss.
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
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [chatHistory, setChatHistory] = usePersistentChatHistory(user);
  const [language, setLanguage] = useState(urlLang || user?.target_language || 'en');
  const [conversationId, setConversationId] = useState(null);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [translations, setTranslations] = useState({});
  const [isTranslating, setIsTranslating] = useState({});
  const [showTranslations, setShowTranslations] = useState({});
  const [isLoadingMessageFeedback, setIsLoadingMessageFeedback] = useState({});
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [showTopicModal, setShowTopicModal] = useState(false);
  
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
      setSelectedTopics(topics);
    }
  }, [urlTopics]);

  // Debug chat history changes
  useEffect(() => {
    console.log('Chat history changed:', chatHistory);
  }, [chatHistory]);

  // Remove auto-fetch - suggestions will be fetched on-demand only

  // Handle conversation loading and creation
  useEffect(() => {
    console.log('[DEBUG] useEffect for conversation loading:', {
      user,
      conversationId,
      isCreatingConversation,
      isLoadingConversation,
      urlConversationId
    });
    
    // Load existing conversation if URL has conversation ID
    if (user && urlConversationId && !conversationId && !isLoadingConversation && !isCreatingConversation) {
      console.log('[DEBUG] CONDITIONS MET - Loading existing conversation from URL:', urlConversationId);
      loadExistingConversation(urlConversationId);
    } else {
      console.log('[DEBUG] CONDITIONS NOT MET for conversation loading:', {
        hasUser: !!user,
        hasUrlConversationId: !!urlConversationId,
        noConversationId: !conversationId,
        notLoadingConversation: !isLoadingConversation,
        notCreatingConversation: !isCreatingConversation
      });
    }
    
    // Show save prompt for localStorage data
    if (user && localStorage.getItem('chatHistory')) {
      setShowSavePrompt(true);
    }
  }, [user, conversationId, isCreatingConversation, isLoadingConversation, urlConversationId]);


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
  const autoSaveSession = async () => {
    if (user?.id && chatHistory.length > 0) {
      await saveSessionToBackend(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await sendAudioToBackend(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Error accessing microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const sendAudioToBackend = async (audioBlob) => {
    // Create conversation if needed, but don't fail if it doesn't work
    let currentConversationId = conversationId;
    if (!currentConversationId && user) {
      console.log('[AUTO] No conversationId, attempting to create new conversation.');
      try {
        currentConversationId = await createNewConversation();
        console.log('[AUTO] After conversation creation, got conversationId:', currentConversationId);
      } catch (error) {
        console.error('[AUTO] Failed to create conversation, but continuing with audio processing:', error);
      }
    }
    setIsProcessing(true);
    const userMessage = { sender: 'User', text: '🎤 Recording...', timestamp: new Date() };
    setChatHistory(prev => [...prev, userMessage]);
    try {
      console.log('=== FRONTEND: Starting audio processing ===');
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');
      formData.append('chatHistory', JSON.stringify(chatHistory));
      formData.append('language', language);
      
      console.log('=== FRONTEND: Sending request to server ===');
      const response = await API.post('/api/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      console.log('=== FRONTEND: Server response received ===');
      console.log('Server response:', response.data);
      
      console.log('=== FRONTEND: Processing transcription ===');
      const transcription = response.data.transcription || 'Speech recorded';
      console.log('Transcription:', transcription);
      
      console.log('=== FRONTEND: Updating chat history with transcription ===');
      setChatHistory(prev => prev.map(msg => 
        msg === userMessage ? { ...msg, text: transcription } : msg
      ));
      if (currentConversationId) {
        console.log('[DEBUG] Saving user message with conversationId:', currentConversationId);
        await saveMessageToBackend('User', transcription, 'text', null, currentConversationId);
      } else {
        console.log('[DEBUG] No conversationId available, skipping user message save');
      }
      
      if (response.data.aiResponse) {
        console.log('=== FRONTEND: Processing AI response ===');
        console.log('AI Response received:', response.data.aiResponse);
        const aiMessage = { 
          sender: 'AI', 
          text: response.data.aiResponse, 
          timestamp: new Date() 
        };
        console.log('=== FRONTEND: Adding AI message to chat history ===');
        setChatHistory(prev => {
          const newHistory = [...prev, aiMessage];
          console.log('Updated chat history:', newHistory);
          return newHistory;
        });
        if (currentConversationId) {
          console.log('[DEBUG] Saving AI message with conversationId:', currentConversationId);
          await saveMessageToBackend('AI', response.data.aiResponse, 'text', null, currentConversationId);
        } else {
          console.log('[DEBUG] No conversationId available, skipping AI message save');
        }
      } else {
        console.log('No AI response received');
      }
      if (response.data.ttsUrl) {
        console.log('=== FRONTEND: Processing TTS ===');
        console.log('TTS URL received:', response.data.ttsUrl);
        const audioUrl = `http://localhost:4000${response.data.ttsUrl}`;
        console.log('Full audio URL:', audioUrl);
        
        // Test if the audio file exists by making a HEAD request
        try {
          console.log('=== FRONTEND: Checking TTS audio file ===');
          const headResponse = await fetch(audioUrl, { method: 'HEAD' });
          if (!headResponse.ok) {
            console.error('TTS audio file not found:', headResponse.status);
            console.log('Skipping TTS playback due to missing file');
          } else {
            console.log('TTS audio file exists, size:', headResponse.headers.get('content-length'));
            
            console.log('=== FRONTEND: Creating audio element ===');
            const audio = new window.Audio(audioUrl);
            
            // Add error handling for audio playback
            audio.onerror = (e) => {
              console.error('TTS audio playback error:', e);
              console.error('Audio error details:', audio.error);
            };
            
            audio.onloadstart = () => {
              console.log('TTS audio loading started');
            };
            
            audio.oncanplay = () => {
              console.log('TTS audio can play');
            };
            
            audio.onended = () => {
              console.log('TTS audio playback completed');
            };
            
            audio.onload = () => {
              console.log('TTS audio loaded successfully');
            };
            
            // Try to play the audio
            console.log('=== FRONTEND: Attempting to play TTS audio ===');
            audio.play().catch(error => {
              console.error('Failed to play TTS audio:', error);
            });
            console.log('=== FRONTEND: TTS audio play() called ===');
          }
        } catch (fetchError) {
          console.error('Error checking TTS audio file:', fetchError);
          console.log('Skipping TTS playback due to fetch error');
        }
      } else {
        console.log('No TTS URL received from server');
      }
      
      console.log('=== FRONTEND: All processing complete, should be successful ===');
    } catch (error) {
      console.error('=== FRONTEND: ERROR CAUGHT ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Full error object:', error);
      
      if (error.response) {
        console.error('Server responded with error:', error.response.status, error.response.data);
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
      
      const errorMessage = { 
        sender: 'System', 
        text: '❌ Error processing audio. Please try again.', 
        timestamp: new Date() 
      };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      console.log('=== FRONTEND: Finally block - setting isProcessing to false ===');
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
    setSelectedTopics(topics);
    setChatHistory([]);
    setShowTopicModal(false);
    
    // Update URL to include conversation ID
    const newUrl = new URL(window.location);
    newUrl.searchParams.set('conversation', newConversationId);
    newUrl.searchParams.set('topics', topics.join(','));
    window.history.pushState({}, '', newUrl);
  };

  const handleSuggestionClick = (suggestionText) => {
    // Just scroll to recording button to encourage user to record
    const recordingSection = document.querySelector('[data-recording-section]');
    if (recordingSection) {
      recordingSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const createNewConversation = async () => {
    if (!user) {
      console.log('[DEBUG] No user found, skipping conversation creation');
      return null;
    }
    console.log('[DEBUG] Creating new conversation for user:', user.email);
    setIsCreatingConversation(true);
    try {
      const title = selectedTopics.length > 0 
        ? `${getLanguageLabel(language)} Practice Session - ${selectedTopics.join(', ')}`
        : `${getLanguageLabel(language)} Practice Session`;
      console.log('[DEBUG] Sending conversation creation request:', { language, title, topics: selectedTopics });
      const response = await API.post('/api/conversations', {
        language,
        title,
        topics: selectedTopics
      });
      console.log('[DEBUG] Conversation creation response:', response.data);
      const newConversationId = response.data.conversation.id;
      setConversationId(newConversationId);
      console.log('[DEBUG] Created new conversation:', newConversationId);
      return newConversationId;
    } catch (error) {
      console.error('[DEBUG] Error creating conversation:', error);
      console.error('[DEBUG] Error details:', error.response?.data || error.message);
      return null;
    } finally {
      setIsCreatingConversation(false);
    }
  };

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
                    borderRadius: message.sender === 'User' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                    background: message.sender === 'User' ? 
                      'linear-gradient(135deg, #c38d94 0%, #b87d8a 100%)' : 
                      message.sender === 'AI' ? 
                        'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)' : '#f5f1ec',
                    color: message.sender === 'User' ? '#fff' : '#3e3e3e',
                    border: message.sender === 'AI' ? '1px solid #e0e0e0' : 'none',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: isTranslating[index] ? 0.7 : 1,
                    position: 'relative',
                    boxShadow: message.sender === 'User' ? 
                      '0 2px 8px rgba(195,141,148,0.3)' : 
                      '0 2px 8px rgba(60,76,115,0.15)',
                    maxWidth: '75%',
                    wordWrap: 'break-word',
                    transform: 'scale(1)',
                    fontWeight: message.sender === 'User' ? '500' : '400',
                    animation: 'messageAppear 0.3s ease-out'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.02)';
                    e.target.style.boxShadow = message.sender === 'User' ? 
                      '0 4px 12px rgba(195,141,148,0.4)' : 
                      '0 4px 12px rgba(60,76,115,0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = message.sender === 'User' ? 
                      '0 2px 8px rgba(195,141,148,0.3)' : 
                      '0 2px 8px rgba(60,76,115,0.15)';
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
          
          <button
            onClick={isRecording ? stopRecording : startRecording}
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
              animation: isRecording ? 'pulse 1.5s infinite' : 'none'
            }}
          >
            {isRecording ? '⏹️' : '🎤'}
          </button>
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
      
      {/* Topic Selection Modal */}
      <TopicSelectionModal
        isOpen={showTopicModal}
        onClose={() => setShowTopicModal(false)}
        onStartConversation={handleModalConversationStart}
        user={user}
        currentLanguage={language}
      />
    </div>
  );
}

export default Analyze; 