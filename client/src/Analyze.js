import React, { useState, useRef, useEffect } from 'react';
import { useUser } from './App';
import axios from 'axios';

const API = axios.create({ 
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001', 
  withCredentials: true 
});

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
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [chatHistory, setChatHistory] = usePersistentChatHistory(user);

  useEffect(() => {
    if (user && localStorage.getItem('chatHistory')) {
      setShowSavePrompt(true);
    }
  }, [user]);

  const saveSessionToBackend = async () => {
    try {
      await API.post('/api/save-session', { chatHistory });
      setShowSavePrompt(false);
      localStorage.removeItem('chatHistory');
      alert('Session saved to your account!');
    } catch (e) {
      alert('Failed to save session.');
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
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');
      formData.append('chatHistory', JSON.stringify(chatHistory));
      const response = await API.post('/api/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const transcription = response.data.transcription || 'Speech recorded';
      setChatHistory(prev => prev.map(msg => 
        msg === userMessage ? { ...msg, text: transcription } : msg
      ));
      if (response.data.aiResponse) {
        const aiMessage = { 
          sender: 'AI', 
          text: response.data.aiResponse, 
          timestamp: new Date() 
        };
        setChatHistory(prev => [...prev, aiMessage]);
      }
      if (response.data.ttsUrl) {
        const audio = new window.Audio(`http://localhost:3001${response.data.ttsUrl}`);
        audio.play();
      }
    } catch (error) {
      console.error('Error sending audio:', error);
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
    setIsLoadingFeedback(true);
    try {
      const response = await API.post('/api/feedback', {
        chatHistory: chatHistory
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
      <div style={{ flex: 1, background: '#fff', borderRadius: 0, marginRight: '1rem', display: 'flex', flexDirection: 'column', border: '2px solid #3c4c73' }}>
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
        border: '2px solid #3c4c73'
      }}>
        {/* Feedback Header */}
        <div style={{ 
          background: '#c38d94', 
          color: '#3e3e3e', 
          padding: '1rem', 
          borderRadius: '18px 18px 0 0',
          textAlign: 'center'
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
              border: '2px inset #3c4c73',
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