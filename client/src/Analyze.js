import React, { useState, useRef, useEffect } from 'react';
import { useUser } from './App';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';

const API = axios.create({ 
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:4000', 
  withCredentials: true 
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
  const { user } = useUser();
  const [searchParams] = useSearchParams();
  const urlLang = searchParams.get('lang');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [chatHistory, setChatHistory] = usePersistentChatHistory(user);
  const [language, setLanguage] = useState(urlLang || user?.target_language || 'en');

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

  // Debug chat history changes
  useEffect(() => {
    console.log('Chat history changed:', chatHistory);
  }, [chatHistory]);


  const resetConversation = () => {
    setChatHistory([]);
    setFeedback('');
  };

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
          // Auto-save session after AI response
          setTimeout(() => autoSaveSession(), 1000);
          return newHistory;
        });
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
    setIsLoadingFeedback(true);
    try {
      const response = await API.post('/api/feedback', {
        chatHistory: chatHistory,
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

  return (
    <div style={{ 
      display: 'flex', 
      height: 'calc(100vh - 80px)', 
      background: '#f5f1ec',
      padding: '2rem'
    }}>
      <div style={{ flex: 1, background: '#fff', borderRadius: 0, marginRight: '1rem', display: 'flex', flexDirection: 'column', border: '1px solid #e0e0e0', boxShadow: '0 1px 4px rgba(0,0,0,0.02)' }}>
        {/* Reset Conversation Button */}
        <div style={{ padding: '1rem', background: '#f5f1ec', borderBottom: '1px solid #ececec', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: '#7e5a75', fontWeight: 600, fontSize: '0.9rem' }}>
            Language: {getLanguageLabel(language)}
          </div>
          <button onClick={resetConversation} style={{
            fontSize: '1rem',
            padding: '0.4rem 1.2rem',
            borderRadius: 6,
            border: '1px solid #c38d94',
            background: '#fff',
            color: '#c38d94',
            fontWeight: 600,
            cursor: 'pointer',
            marginRight: 8
          }}>
            🔄 Reset Conversation
          </button>
          {/* Language display (not dropdown) */}
          {language && (
            <span style={{ fontWeight: 600, color: '#3c4c73', marginLeft: 16 }}>
              🌐 Language: {getLanguageLabel(language)}
            </span>
          )}
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
          {chatHistory.map((message, index) => (
            <div key={index} style={{
              maxWidth: '80%',
              padding: '0.75rem 1rem',
              borderRadius: 0,
              alignSelf: message.sender === 'User' ? 'flex-end' : 'flex-start',
              background: message.sender === 'User' ? '#c38d94' : 
                         message.sender === 'AI' ? '#fff' : '#f5f1ec',
              color: message.sender === 'User' ? '#3e3e3e' : '#7e5a75',
              border: message.sender === 'AI' ? '1px solid #c38d94' : 'none',
              fontSize: '0.9rem'
            }}>
              {message.text}
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
        {/* Recording Controls */}
        <div style={{ 
          padding: '1rem', 
          borderTop: '1px solid #c38d94',
          background: '#f5f1ec',
          borderRadius: '0 0 18px 18px',
          textAlign: 'center'
        }}>
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
    </div>
  );
}

export default Analyze; 