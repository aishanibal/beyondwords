/* eslint-disable @typescript-eslint/no-explicit-any */
// API client for server communication
import axios from 'axios';
import { supabase } from './supabase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://beyondwords-express.onrender.com';

// Helper function to get auth token synchronously
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    // First try to get the custom JWT token
    const customJwt = localStorage.getItem('jwt');
    if (customJwt) return customJwt;
    
    // Try to get Supabase token from localStorage
    const supabaseToken = localStorage.getItem('supabase.auth.token');
    if (supabaseToken) {
      try {
        const tokenData = JSON.parse(supabaseToken);
        return tokenData.access_token;
      } catch (e) {
        console.error('Failed to parse Supabase token:', e);
      }
    }
    
    // Try to get from Supabase session storage
    const sessionData = localStorage.getItem('sb-' + process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0] + '-auth-token');
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData);
        return session.access_token;
      } catch (e) {
        console.error('Failed to parse Supabase session:', e);
      }
    }
  }
  return null;
};

// Helper function to create auth headers
export const getAuthHeaders = async () => {
  // Try custom JWT first
  const customJwt = typeof window !== 'undefined' ? localStorage.getItem('jwt') : null;
  if (customJwt) {
    return { Authorization: `Bearer ${customJwt}` };
  }
  
  // Get Supabase session token
  try {
    const { supabase } = await import('./supabase');
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      return { Authorization: `Bearer ${session.access_token}` };
    }
  } catch (e) {
    console.error('Failed to get Supabase session:', e);
  }
  
  return {};
};

// Language Dashboard API functions
export const getUserLanguageDashboards = async (userId: string) => {
  try {
    console.log('[API] Getting language dashboards for user:', userId);
    const response = await axios.get(`${API_BASE_URL}/api/user/language-dashboards`, {
      headers: await getAuthHeaders()
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
      headers: await getAuthHeaders()
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
      headers: await getAuthHeaders()
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
      headers: await getAuthHeaders()
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
      headers: await getAuthHeaders()
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
      headers: await getAuthHeaders()
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
