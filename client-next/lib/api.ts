/* eslint-disable @typescript-eslint/no-explicit-any */
// API client for server communication
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://heirloom-express-backend.onrender.com';

// Helper function to get auth token
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    // First try to get the custom JWT token
    const customJwt = localStorage.getItem('jwt');
    if (customJwt) return customJwt;
    
    // Fallback to Supabase token
    const supabaseToken = localStorage.getItem('supabase.auth.token');
    if (supabaseToken) {
      try {
        const tokenData = JSON.parse(supabaseToken);
        return tokenData.access_token;
      } catch (e) {
        console.error('Failed to parse Supabase token:', e);
      }
    }
  }
  return null;
};

// Helper function to create auth headers
const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Language Dashboard API functions
export const getUserLanguageDashboards = async (userId: string) => {
  try {
    console.log('[API] Getting language dashboards for user:', userId);
    const response = await axios.get(`${API_BASE_URL}/api/user/language-dashboards`, {
      headers: getAuthHeaders()
    });
    
    console.log('[API] Language dashboards response:', response.data);
    return { 
      success: true, 
      data: response.data.dashboards, 
      error: null 
    };
  } catch (error: any) {
    console.error('[API] Error getting language dashboards:', error);
    return { 
      success: false, 
      data: null, 
      error: error.response?.data?.error || error.message 
    };
  }
};

export const createLanguageDashboard = async (dashboardData: {
  user_id: string;
  language: string;
  proficiency_level: string;
  talk_topics: string[];
  learning_goals: string[];
  practice_preference: string;
  feedback_language: string;
  is_primary: boolean;
}) => {
  try {
    console.log('[API] Creating language dashboard:', dashboardData);
    const response = await axios.post(`${API_BASE_URL}/api/user/language-dashboards`, {
      language: dashboardData.language,
      proficiency: dashboardData.proficiency_level,
      talkTopics: dashboardData.talk_topics,
      learningGoals: dashboardData.learning_goals,
      practicePreference: dashboardData.practice_preference,
      feedbackLanguage: dashboardData.feedback_language
    }, {
      headers: getAuthHeaders()
    });
    
    console.log('[API] Language dashboard created:', response.data);
    return { 
      success: true, 
      data: response.data.dashboard, 
      error: null 
    };
  } catch (error: any) {
    console.error('[API] Error creating language dashboard:', error);
    return { 
      success: false, 
      data: null, 
      error: error.response?.data?.error || error.message 
    };
  }
};

export const updateLanguageDashboard = async (language: string, updates: any) => {
  try {
    console.log('[API] Updating language dashboard:', language, updates);
    const response = await axios.put(`${API_BASE_URL}/api/user/language-dashboards/${language}`, updates, {
      headers: getAuthHeaders()
    });
    
    console.log('[API] Language dashboard updated:', response.data);
    return { 
      success: true, 
      data: response.data.dashboard, 
      error: null 
    };
  } catch (error: any) {
    console.error('[API] Error updating language dashboard:', error);
    return { 
      success: false, 
      data: null, 
      error: error.response?.data?.error || error.message 
    };
  }
};

export const deleteLanguageDashboard = async (language: string) => {
  try {
    console.log('[API] Deleting language dashboard:', language);
    await axios.delete(`${API_BASE_URL}/api/user/language-dashboards/${language}`, {
      headers: getAuthHeaders()
    });
    
    console.log('[API] Language dashboard deleted');
    return { 
      success: true, 
      data: null, 
      error: null 
    };
  } catch (error: any) {
    console.error('[API] Error deleting language dashboard:', error);
    return { 
      success: false, 
      data: null, 
      error: error.response?.data?.error || error.message 
    };
  }
};

// User API functions
export const getUserPersonas = async (userId: string) => {
  try {
    console.log('[API] Getting personas for user:', userId);
    const response = await axios.get(`${API_BASE_URL}/api/personas`, {
      headers: getAuthHeaders()
    });
    
    console.log('[API] Personas response:', response.data);
    return { 
      success: true, 
      data: response.data.personas || response.data, 
      error: null 
    };
  } catch (error: any) {
    console.error('[API] Error getting personas:', error);
    return { 
      success: false, 
      data: null, 
      error: error.response?.data?.error || error.message 
    };
  }
};

export const getUserConversations = async (userId: string) => {
  try {
    console.log('[API] Getting conversations for user:', userId);
    const response = await axios.get(`${API_BASE_URL}/api/conversations`, {
      headers: getAuthHeaders()
    });
    
    console.log('[API] Conversations response:', response.data);
    return { 
      success: true, 
      data: response.data.conversations || response.data, 
      error: null 
    };
  } catch (error: any) {
    console.error('[API] Error getting conversations:', error);
    return { 
      success: false, 
      data: null, 
      error: error.response?.data?.error || error.message 
    };
  }
};
