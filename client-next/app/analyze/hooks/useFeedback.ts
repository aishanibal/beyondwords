import { useState, useCallback } from 'react';
import axios from 'axios';
import { ChatMessage } from '../types/analyze';

export function useFeedback() {
  const [isProcessingShortFeedback, setIsProcessingShortFeedback] = useState(false);
  const [isPlayingShortFeedbackTTS, setIsPlayingShortFeedbackTTS] = useState(false);
  const [shortFeedbacks, setShortFeedbacks] = useState<Record<number, string>>({});
  const [isLoadingMessageFeedback, setIsLoadingMessageFeedback] = useState<Record<number, boolean>>({});

  const fetchAndShowShortFeedback = useCallback(async (
    transcription: string,
    detectedLanguage: string,
    language: string,
    chatHistory: ChatMessage[],
    userPreferences: any,
    autoSpeak: boolean,
    enableShortFeedback: boolean,
    setChatHistory: (history: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void,
    playTTSAudio: (text: string, language: string, cacheKey: string) => Promise<void>
  ) => {
    if (!autoSpeak || !enableShortFeedback) return;
    
    // Prevent duplicate calls while processing
    if (isProcessingShortFeedback) {
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
      return;
    }
    
    setIsProcessingShortFeedback(true);
    
    // Prepare chat history for short feedback
    const chatHistoryForShortFeedback = chatHistory.map(msg => ({
      sender: msg.sender,
      text: msg.text,
      timestamp: msg.timestamp
    }));
    
    console.log('🔍 [FRONTEND] Sending chat history to short feedback:', chatHistoryForShortFeedback.length, 'messages');
    
    try {
      // Call the Express proxy endpoint instead of Python directly
      const token = localStorage.getItem('jwt');
      const shortFeedbackRes = await axios.post(
        '/api/short_feedback',
        {
          user_input: transcription,
          chat_history: chatHistoryForShortFeedback, // Send full chat history for context
          language: language,
          user_level: userPreferences.userLevel,
          user_topics: userPreferences.topics,
          formality: userPreferences.formality,
          feedback_language: userPreferences.feedbackLanguage
        },
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );
      console.log('[DEBUG] /short_feedback response', shortFeedbackRes);
      const shortFeedback = shortFeedbackRes.data.feedback;
      console.log('[DEBUG] shortFeedback value:', shortFeedback);
      
      if (shortFeedback !== undefined && shortFeedback !== null && shortFeedback !== '') {
        // Use a more reliable approach to set the short feedback key
        setChatHistory(prev => {
          const currentLength = prev.length;
          const updated = [...prev, { 
            sender: 'System', 
            text: shortFeedback, 
            timestamp: new Date() 
          }];
          
          // Set short feedback with the correct index
          setShortFeedbacks(shortFeedbacks => ({ ...shortFeedbacks, [currentLength]: shortFeedback }));
          
          return updated;
        });
        
        // Play short feedback TTS immediately for all modes
        const cacheKey = `short_feedback_${Date.now()}`;
        console.log('[DEBUG] Playing short feedback TTS immediately');
        setIsPlayingShortFeedbackTTS(true);
        try {
          await playTTSAudio(shortFeedback, language, cacheKey);
          console.log('[DEBUG] Short feedback TTS finished');
        } catch (error) {
          console.error('[DEBUG] Error playing short feedback TTS:', error);
        } finally {
          setIsPlayingShortFeedbackTTS(false);
        }
      } else {
        console.warn('[DEBUG] (fetchAndShowShortFeedback) shortFeedback is empty or undefined:', shortFeedback);
      }
    } catch (e: unknown) {
      // Error handling removed for performance
    } finally {
      setIsProcessingShortFeedback(false);
    }
  }, [isProcessingShortFeedback]);

  const requestDetailedFeedbackForMessage = useCallback(async (
    messageIndex: number,
    conversationId: string | null,
    chatHistory: ChatMessage[],
    language: string,
    userPreferences: any,
    fetchUserDashboardPreferences: (languageCode: string) => Promise<any>,
    setUserPreferences: (prefs: any) => void
  ) => {
    if (!conversationId) {
      return;
    }
    
    setIsLoadingMessageFeedback(prev => ({ ...prev, [messageIndex]: true }));
    
    try {
      const token = localStorage.getItem('jwt');
      
      // Get the message text and context
      const message = chatHistory[messageIndex];
      const user_input = message?.text || '';
      const context = chatHistory.slice(-4).map(msg => `${msg.sender}: ${msg.text}`).join('\n');
      
      // Ensure user preferences are loaded for the current language
      if (!userPreferences.romanizationDisplay || userPreferences.romanizationDisplay === 'both') {
        const dashboardPrefs = await fetchUserDashboardPreferences(language || 'en');
        if (dashboardPrefs) {
          setUserPreferences(prev => ({
            ...prev,
            romanizationDisplay: dashboardPrefs.romanization_display || 'both'
          }));
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
      
      const response = await axios.post(
        '/api/feedback',
        requestData,
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );
      
      // Handle the feedback response
      const feedback = response.data.feedback;
      if (feedback) {
        // Update the message with detailed feedback
        // This would need to be handled by the parent component
        console.log('Detailed feedback received:', feedback);
      }
    } catch (error) {
      console.error('Error requesting detailed feedback:', error);
    } finally {
      setIsLoadingMessageFeedback(prev => ({ ...prev, [messageIndex]: false }));
    }
  }, []);

  const requestShortFeedbackForMessage = useCallback(async (
    messageIndex: number,
    conversationId: string | null,
    chatHistory: ChatMessage[],
    language: string,
    userPreferences: any
  ) => {
    if (!conversationId) {
      return;
    }
    
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
        user_topics: userPreferences.topics,
        formality: userPreferences.formality,
        feedback_language: userPreferences.feedbackLanguage
      };
      
      const response = await axios.post(
        '/api/short_feedback',
        requestData,
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );
      
      const shortFeedback = response.data.feedback;
      if (shortFeedback) {
        setShortFeedbacks(prev => ({ ...prev, [messageIndex]: shortFeedback }));
      }
    } catch (error) {
      console.error('Error requesting short feedback:', error);
    } finally {
      setIsLoadingMessageFeedback(prev => ({ ...prev, [messageIndex]: false }));
    }
  }, []);

  const clearFeedback = useCallback(() => {
    setShortFeedbacks({});
    setIsLoadingMessageFeedback({});
  }, []);

  return {
    isProcessingShortFeedback,
    isPlayingShortFeedbackTTS,
    shortFeedbacks,
    isLoadingMessageFeedback,
    fetchAndShowShortFeedback,
    requestDetailedFeedbackForMessage,
    requestShortFeedbackForMessage,
    clearFeedback,
  };
}
