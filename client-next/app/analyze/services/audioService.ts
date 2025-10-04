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
    console.log('🔍 [AUDIO_SERVICE] Processing audio transcription:', {
      audioBlobSize: audioBlob.size,
      audioBlobType: audioBlob.type,
      language: language
    });
    
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
    console.log('🔍 [AUDIO_SERVICE] Transcription response:', {
      transcription: transcription,
      responseData: transcriptionResponse.data
    });
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
    console.log('🔍 [AI_RESPONSE] Getting AI response for transcription:', transcription);
    const token = localStorage.getItem('jwt');
    
    const aiResponseData = {
      transcription: transcription,
      chat_history: chatHistory,
      language: language,
      user_level: userPreferences?.userLevel || 'beginner',
      user_topics: userPreferences?.topics || [],
      user_goals: user?.learning_goals ? (typeof user.learning_goals === 'string' ? JSON.parse(user.learning_goals) : user.learning_goals) : [],
      formality: userPreferences?.formality || 'friendly',
      feedback_language: userPreferences?.feedbackLanguage || 'en'
    };
    
    console.log('🔍 [AI_RESPONSE] Request data:', aiResponseData);

    let aiResponseResponse;
    try {
      aiResponseResponse = await axios.post('/api/ai_response', aiResponseData, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
    } catch (primaryErr: any) {
      const status = primaryErr?.response?.status;
      console.warn('🔍 [AI_RESPONSE] /api/ai_response failed:', status, primaryErr?.response?.data);
      // Client-side fallback: call Express directly to bypass any Vercel route issues
      const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || 'https://beyondwords-express.onrender.com').replace(/\/$/, '');
      const directUrl = `${backendUrl}/api/ai_response`;
      try {
        aiResponseResponse = await axios.post(directUrl, aiResponseData, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });
      } catch (directErr) {
        console.error('🔍 [AI_RESPONSE] Direct Express fallback failed:', directErr);
        throw primaryErr; // surface the original
      }
    }
    
    console.log('🔍 [AI_RESPONSE] Response received:', aiResponseResponse.data);
    
    const aiResponse = aiResponseResponse.data?.response || 
                      aiResponseResponse.data?.ai_response || 
                      aiResponseResponse.data?.message;
    
    console.log('🔍 [AI_RESPONSE] Extracted AI response:', aiResponse);
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

// Play TTS audio (simplified - no retry logic)
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
    
    if (response.data.ttsUrl) {
      const audio = new Audio(response.data.ttsUrl);
      await audio.play();
    }
  } catch (error: any) {
    console.error('TTS request failed:', error);
    if (error.response?.status === 503) {
      console.warn('🔊 TTS service is temporarily unavailable.');
    } else if (error.response?.status === 500) {
      console.warn('🔊 TTS generation failed.');
    } else {
      console.warn('🔊 TTS request failed:', error.message);
    }
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
    console.log('🔍 [PIPELINE] Starting audio processing pipeline...');
    console.log('🔍 [PIPELINE] Audio blob size:', audioBlob.size, 'bytes');
    console.log('🔍 [PIPELINE] Language:', language);
    console.log('🔍 [PIPELINE] Chat history length:', chatHistory.length);
    
    // Step 1: Get transcription
    console.log('🔍 [PIPELINE] Step 1: Getting transcription...');
    const transcription = await processAudioTranscription(audioBlob, language);
    console.log('🔍 [PIPELINE] Transcription received:', transcription);
    
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
    console.log('🔍 [PIPELINE] Step 3: Getting AI response...');
    const updatedChatHistory = [...chatHistory, userMessage];
    console.log('🔍 [PIPELINE] Updated chat history length:', updatedChatHistory.length);
    const aiResponse = await getAIResponse(transcription, updatedChatHistory, language, userPreferences, user);
    console.log('🔍 [PIPELINE] AI response received:', aiResponse);
    
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
    
    const result = {
      userMessage,
      aiMessage,
      shortFeedback,
      transcription
    };
    
    console.log('🔍 [PIPELINE] Pipeline completed successfully:', result);
    return result;
  } catch (error) {
    console.error('🔍 [PIPELINE] Error in audio processing pipeline:', error);
    throw error;
  }
};
