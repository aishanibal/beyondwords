import { useState, useCallback } from 'react';
import axios from 'axios';
import { ChatMessage } from '../types/analyze';
import { generateRomanizedText, isScriptLanguage } from '../utils/romanization';

export function useAudioProcessing() {
  const [isProcessing, setIsProcessing] = useState(false);

  const sendAudioToBackend = useCallback(async (
    audioBlob: Blob,
    language: string,
    conversationId: string | null,
    chatHistory: ChatMessage[],
    setChatHistory: (history: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void,
    saveMessageToBackend: (sender: string, text: string, messageType?: string, audioFilePath?: string | null, targetConversationId?: string | null, romanizedText?: string | null) => Promise<any>,
    autoSpeak: boolean = false,
    enableShortFeedback: boolean = true,
    fetchAndShowShortFeedback?: (transcription: string, detectedLanguage?: string) => Promise<void>
  ) => {
    if (!(audioBlob instanceof Blob)) return;
    
    try {
      setIsProcessing(true);
      
      // Add user message immediately with a placeholder
      const placeholderMessage: ChatMessage = { 
        sender: 'User', 
        text: '🎤 Processing your message...', 
        romanizedText: '',
        timestamp: new Date(),
        isFromOriginalConversation: false,
        isProcessing: true // Add flag to identify processing messages
      };
      
      // Add placeholder message immediately
      setChatHistory(prev => [...prev, placeholderMessage]);
      
      // Step 1: Get transcription first with language detection
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      // Explicitly pass the selected language to guide transcription
      formData.append('language', language);
      
      // Add JWT token to headers
      const token = localStorage.getItem('jwt');
      const transcriptionResponse = await axios.post('/api/transcribe_only', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      
      const transcription = transcriptionResponse.data.transcription || 'Speech recorded';
      const detectedLanguage = language; // Persist session language; ignore detection
      
      // Generate romanized text for user messages in script languages
      let userRomanizedText = '';
      if (isScriptLanguage(language) && transcription !== 'Speech recorded') {
        userRomanizedText = await generateRomanizedText(transcription, language);
      }
      
      // Replace the placeholder message with the actual transcript
      setChatHistory(prev => {
        const updated = prev.map((msg, index) => {
          // Find the last processing message and replace it
          if (msg.isProcessing && msg.sender === 'User') {
            return {
              ...msg,
              text: transcription,
              romanizedText: userRomanizedText,
              isProcessing: false
            };
          }
          return msg;
        });
        return updated;
      });
      
      // Save user message to backend
      if (conversationId) {
        console.log('[MESSAGE_SAVE] Saving user message to conversation:', conversationId);
        console.log('[MESSAGE_SAVE] User message text:', transcription);
        console.log('[MESSAGE_SAVE] User romanized text:', userRomanizedText);
        await saveMessageToBackend('User', transcription, 'text', null, null, userRomanizedText);
      } else {
        console.warn('[MESSAGE_SAVE] No conversation ID available for user message');
      }
      
      // Step 1.5: Get short feedback first for autospeak mode
      if (autoSpeak && enableShortFeedback && transcription !== 'Speech recorded' && fetchAndShowShortFeedback) {
        console.log('[DEBUG] Step 1.5: Getting short feedback for autospeak mode...');
        await fetchAndShowShortFeedback(transcription, language);
        console.log('[DEBUG] Short feedback completed, now starting AI processing...');
      }
      
      // Step 2: Get AI response after short feedback is done
      console.log('[DEBUG] Step 2: Getting AI response after short feedback...');
      
      // Add AI processing message after short feedback is complete
      const aiProcessingMessage: ChatMessage = { 
        sender: 'AI', 
        text: '🤖 Processing AI response...', 
        romanizedText: '',
        timestamp: new Date(),
        isFromOriginalConversation: false,
        isProcessing: true
      };
      setChatHistory(prev => [...prev, aiProcessingMessage]);
      
      // Create updated chat history that includes the user's transcription
      const updatedChatHistory = [...chatHistory, {
        sender: 'User',
        text: transcription,
        romanizedText: userRomanizedText,
        timestamp: new Date(),
        isFromOriginalConversation: false,
        isProcessing: false
      }];
      
      // Get AI response
      const aiResponse = await getAIResponse(updatedChatHistory, language, conversationId);
      
      if (aiResponse) {
        // Replace AI processing message with actual response
        setChatHistory(prev => {
          const updated = prev.map((msg, index) => {
            if (msg.isProcessing && msg.sender === 'AI') {
              return {
                ...msg,
                text: aiResponse.text,
                romanizedText: aiResponse.romanizedText,
                isProcessing: false
              };
            }
            return msg;
          });
          return updated;
        });
        
        // Save AI message to backend
        if (conversationId) {
          console.log('[MESSAGE_SAVE] Saving AI message to conversation:', conversationId);
          await saveMessageToBackend('AI', aiResponse.text, 'text', null, null, aiResponse.romanizedText);
        }
      }
      
    } catch (error) {
      console.error('Error processing audio:', error);
      
      // Remove processing messages on error
      setChatHistory(prev => prev.filter(msg => !msg.isProcessing));
      
      // Show error message
      const errorMessage: ChatMessage = {
        sender: 'AI',
        text: 'Sorry, there was an error processing your audio. Please try again.',
        romanizedText: '',
        timestamp: new Date(),
        isFromOriginalConversation: false,
        isProcessing: false
      };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const getAIResponse = useCallback(async (
    chatHistory: ChatMessage[],
    language: string,
    conversationId: string | null
  ) => {
    try {
      const token = localStorage.getItem('jwt');
      
      const response = await axios.post('/api/ai_response', {
        messages: chatHistory,
        language,
        conversation_id: conversationId
      }, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      
      const aiText = response.data.response || 'No response received';
      
      // Generate romanized text for AI responses in script languages
      let aiRomanizedText = '';
      if (isScriptLanguage(language) && aiText !== 'No response received') {
        aiRomanizedText = await generateRomanizedText(aiText, language);
      }
      
      return {
        text: aiText,
        romanizedText: aiRomanizedText
      };
    } catch (error) {
      console.error('Error getting AI response:', error);
      return null;
    }
  }, []);

  return {
    isProcessing,
    sendAudioToBackend,
    getAIResponse,
  };
}
