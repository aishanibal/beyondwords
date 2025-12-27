/* eslint-disable @typescript-eslint/no-explicit-any */
// API client for server communication
import axios from 'axios';
import { getIdToken } from './firebase';

// All API calls now go through Next.js API routes
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const API_BASE_URL = '';

// Helper function to create auth headers
export const getAuthHeaders = async () => {
  // DEVELOPMENT MODE: In bypass mode, don't send auth headers (server will bypass auth)
  if (process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true' && process.env.NODE_ENV === 'development') {
    console.log('[API] [DEV MODE] Bypassing auth headers');
    return {}; // Server will handle bypass mode
  }

  // Try custom JWT first (from backend token exchange)
  const customJwt = typeof window !== 'undefined' ? localStorage.getItem('jwt') : null;
  if (customJwt) {
    return { Authorization: `Bearer ${customJwt}` };
  }
  
  // Get Firebase ID token
  try {
    const firebaseToken = await getIdToken();
    if (firebaseToken) {
      return { Authorization: `Bearer ${firebaseToken}` };
    }
  } catch (e) {
    console.error('Failed to get Firebase token:', e);
  }
  
  return {};
};

// Language Dashboard API functions
// Use Next.js API routes which will proxy to the correct backend
export const getUserLanguageDashboards = async (userId: string) => {
  try {
    console.log('[API] Getting language dashboards for user:', userId);
    const headers = await getAuthHeaders();
    const response = await axios.get('/api/user/language-dashboards', {
      headers
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
    const headers = await getAuthHeaders();
    const response = await axios.post('/api/user/language-dashboards', {
      language: dashboardData.language,
      proficiency: dashboardData.proficiency_level,
      talkTopics: dashboardData.talk_topics,
      learningGoals: dashboardData.learning_goals,
      practicePreference: dashboardData.practice_preference,
      feedbackLanguage: dashboardData.feedback_language,
      isPrimary: dashboardData.is_primary
    }, {
      headers
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
    const headers = await getAuthHeaders();
    const response = await axios.put('/api/user/language-dashboards', {
      language,
      updates
    }, {
      headers
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
    const headers = await getAuthHeaders();
    await axios.delete('/api/user/language-dashboards', {
      headers,
      data: { language }
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
    const headers = await getAuthHeaders();
    const response = await axios.get('/api/personas', {
      headers
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
    const headers = await getAuthHeaders();
    const response = await axios.get('/api/conversations', {
      headers
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

// User Profile API functions
export const getUserProfile = async (userId: string) => {
  try {
    console.log('[API] Getting user profile for:', userId);
    const headers = await getAuthHeaders();
    const response = await axios.get('/api/user/profile', {
      headers
    });
    
    console.log('[API] User profile response:', response.data);
    return { 
      success: true, 
      data: response.data.user || response.data, 
      error: null 
    };
  } catch (error: any) {
    console.error('[API] Error getting user profile:', error);
    return { 
      success: false, 
      data: null, 
      error: error.response?.data?.error || error.message 
    };
  }
};

export const createUserProfile = async (userData: {
  id: string;
  email: string;
  name: string;
  onboarding_complete?: boolean;
  [key: string]: any;
}) => {
  try {
    console.log('[API] Creating user profile:', userData);
    const headers = await getAuthHeaders();
    const response = await axios.post('/api/user/profile', {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      onboarding_complete: userData.onboarding_complete ?? false
    }, {
      headers
    });
    
    console.log('[API] User profile created:', response.data);
    return { 
      success: true, 
      data: response.data.user || response.data, 
      error: null 
    };
  } catch (error: any) {
    console.error('[API] Error creating user profile:', error);
    return { 
      success: false, 
      data: null, 
      error: error.response?.data?.error || error.message 
    };
  }
};

export const updateUserProfile = async (updates: any) => {
  try {
    console.log('[API] Updating user profile:', updates);
    const headers = await getAuthHeaders();
    const response = await axios.put('/api/user/profile', updates, {
      headers
    });
    
    console.log('[API] User profile updated:', response.data);
    return { 
      success: true, 
      data: response.data.user || response.data, 
      error: null 
    };
  } catch (error: any) {
    console.error('[API] Error updating user profile:', error);
    return { 
      success: false, 
      data: null, 
      error: error.response?.data?.error || error.message 
    };
  }
};
