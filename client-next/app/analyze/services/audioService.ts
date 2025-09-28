import axios from 'axios';
import { getAuthHeaders } from './conversationService';
import { generateRomanizedText } from '../utils/romanization';
import { cleanTextForTTS } from '../utils/textFormatting';
import { isScriptLanguage } from '../utils/romanization';
import { formatScriptLanguageText } from '../utils/romanization';
import { ChatMessage } from '../types/analyze';

// Process audio and get transcription
export const processAudioTranscription = async (audioBlob: Blob, language: string) => {
  try {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('language', language);
    
    const token = localStorage.getItem('jwt');
    
    const transcriptionResponse = await axios.post('/api/transcribe_only', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    
    const transcription = transcriptionResponse.data.transcription || 'Speech recorded';
    return transcription;
  } catch (error) {
    console.error('Error processing audio transcription:', error);
    throw error;
  }
};

// Get AI response
export const getAIResponse = async (
  transcription: string,
  chatHistory: ChatMessage[],
  language: string,
  userPreferences: any,
  user?: any
) => {
  try {
    const token = localStorage.getItem('jwt');
    
    const aiResponseData = {
      transcription: transcription,
      chat_history: chatHistory,
      language: language,
      user_level: userPreferences?.userLevel || 'beginner',
      user_topics: userPreferences?.topics || [],
      user_goals: user?.learning_goals ? (typeof user.learning_goals === 'string' ? JSON.parse(user.learning_goals) : user.learning_goals) : [],
      formality: userPreferences?.formality || 'neutral',
      feedback_language: userPreferences?.feedbackLanguage || 'en'
    };

    const aiResponseResponse = await axios.post('/api/ai_response', aiResponseData, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    
    const aiResponse = aiResponseResponse.data?.response || 
                      aiResponseResponse.data?.ai_response || 
                      aiResponseResponse.data?.message;
    
    return aiResponse;
  } catch (error) {
    console.error('Error getting AI response:', error);
    throw error;
  }
};

// Get short feedback
export const getShortFeedback = async (transcription: string, language: string) => {
  try {
    const token = localStorage.getItem('jwt');
    
    const response = await axios.post('/api/short_feedback', {
      transcription: transcription,
      language: language
    }, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    
    return response.data.feedback || '';
  } catch (error) {
    console.error('Error getting short feedback:', error);
    return '';
  }
};

// Get TTS text for a message
export const getTTSText = (message: ChatMessage, romanizationDisplay: string, language: string): string => {
  if (romanizationDisplay === 'both' && message.romanizedText) {
    return `${message.romanizedText} (${message.text})`;
  } else if (romanizationDisplay === 'romanized' && message.romanizedText) {
    return message.romanizedText;
  } else {
    return message.text;
  }
};

// Play TTS audio
export const playTTSAudio = async (text: string, language: string, cacheKey: string): Promise<void> => {
  try {
    const cleanText = cleanTextForTTS(text);
    const token = localStorage.getItem('jwt');
    
    const response = await axios.post('/api/tts', {
      text: cleanText,
      language: language,
      cacheKey: cacheKey
    }, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    
    if (response.data.success && response.data.audioUrl) {
      const audio = new Audio(response.data.audioUrl);
      await audio.play();
    }
  } catch (error) {
    console.error('Error playing TTS audio:', error);
  }
};

// Process audio with full pipeline
export const processAudioWithPipeline = async (
  audioBlob: Blob,
  language: string,
  chatHistory: ChatMessage[],
  userPreferences: any,
  autoSpeak: boolean,
  enableShortFeedback: boolean,
  user?: any
) => {
  try {
    // Step 1: Get transcription
    const transcription = await processAudioTranscription(audioBlob, language);
    
    // Generate romanized text for user messages in script languages
    let userRomanizedText = '';
    if (isScriptLanguage(language) && transcription !== 'Speech recorded') {
      userRomanizedText = await generateRomanizedText(transcription, language);
    }
    
    // Create user message
    const userMessage: ChatMessage = {
      sender: 'User',
      text: transcription,
      romanizedText: userRomanizedText,
      timestamp: new Date(),
      isFromOriginalConversation: false
    };
    
    // Step 2: Get short feedback if enabled
    let shortFeedback = '';
    if (autoSpeak && enableShortFeedback && transcription !== 'Speech recorded') {
      shortFeedback = await getShortFeedback(transcription, language);
    }
    
    // Step 3: Get AI response
    const updatedChatHistory = [...chatHistory, userMessage];
    const aiResponse = await getAIResponse(transcription, updatedChatHistory, language, userPreferences, user);
    
    // Format AI response
    let formattedResponse: { mainText: string; romanizedText?: string } | null = null;
    if (aiResponse) {
      formattedResponse = formatScriptLanguageText(aiResponse, language);
    }
    
    // Create AI message
    const aiMessage: ChatMessage | null = formattedResponse ? {
      sender: 'AI',
      text: formattedResponse.mainText,
      romanizedText: formattedResponse.romanizedText || '',
      timestamp: new Date(),
      isFromOriginalConversation: false
    } : null;
    
    return {
      userMessage,
      aiMessage,
      shortFeedback,
      transcription
    };
  } catch (error) {
    console.error('Error in audio processing pipeline:', error);
    throw error;
  }
};
