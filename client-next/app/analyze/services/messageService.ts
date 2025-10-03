import axios from 'axios';
import { getAuthHeaders } from './conversationService';

// Get detailed feedback for a message
export const getDetailedFeedback = async (messageIndex: number, text: string, language: string) => {
  try {
    const token = localStorage.getItem('jwt');
    const response = await axios.post('/api/detailed_breakdown', {
      message: text,
      language: language
    }, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error getting detailed feedback:', error);
    throw error;
  }
};

// Get short feedback for a message
export const getShortFeedback = async (messageIndex: number, text: string, language: string) => {
  try {
    const token = localStorage.getItem('jwt');
    const response = await axios.post('/api/short_feedback', {
      transcription: text,
      language: language
    }, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error getting short feedback:', error);
    throw error;
  }
};

// Get detailed breakdown for a message
export const getDetailedBreakdown = async (messageIndex: number, text: string, language: string) => {
  try {
    const token = localStorage.getItem('jwt');
    const response = await axios.post('/api/detailed_breakdown', {
      message: text,
      language: language
    }, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error getting detailed breakdown:', error);
    throw error;
  }
};

// Get quick translation for a message
export const getQuickTranslation = async (messageIndex: number, text: string, language: string) => {
  try {
    const token = localStorage.getItem('jwt');
    const response = await axios.post('/api/quick_translation', {
      ai_message: text,
      chat_history: [],
      language: language,
      user_level: 'beginner',
      user_topics: [],
      formality: 'friendly',
      feedback_language: 'en',
      user_goals: [],
      description: null
    }, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error getting quick translation:', error);
    throw error;
  }
};

// Explain LLM response
export const explainLLMResponse = async (messageIndex: number, text: string, language: string) => {
  try {
    const token = localStorage.getItem('jwt');
    const response = await axios.post('/api/explain_suggestion', {
      suggestion: text,
      language: language
    }, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error explaining LLM response:', error);
    throw error;
  }
};
