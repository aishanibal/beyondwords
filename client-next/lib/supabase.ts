import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Check for bypass mode first (before reading env vars)
const bypassAuth = process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true' && process.env.NODE_ENV === 'development'

// Get environment variables (may be undefined or empty)
// Use nullish coalescing to ensure we have strings (even if empty) for safe .trim() calls
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()

// DEVELOPMENT MODE: Create a mock Supabase client if bypassing auth
let supabase: SupabaseClient;

if (bypassAuth) {
  console.warn('⚠️ [DEV MODE] Supabase authentication bypassed - using mock client');
  // Create a minimal mock client with valid dummy URL/key (SupabaseClient requires non-empty strings)
  // Using a valid-looking URL format to satisfy the constructor
  supabase = createClient(
    'https://dev-bypass.supabase.co',
    'dev-bypass-key-12345678901234567890',
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      }
    }
  ) as any;
} else {
  // Production/development with auth: require valid Supabase credentials
  // Check for empty strings as well as undefined
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === '' || supabaseAnonKey === '') {
    console.error('Missing Supabase environment variables:', {
      hasUrl: !!supabaseUrl && supabaseUrl !== '',
      hasKey: !!supabaseAnonKey && supabaseAnonKey !== '',
      environment: process.env.NODE_ENV
    });
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Critical: Supabase environment variables are missing in production');
    }
    
    // In development without bypass, still create a mock to prevent crashes
    console.warn('⚠️ [DEV] Creating mock Supabase client due to missing credentials');
    supabase = createClient(
      'https://dev-mock.supabase.co',
      'dev-mock-key-12345678901234567890',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        }
      }
    ) as any;
  } else {
    // Validate Supabase URL format
    if (supabaseUrl && !supabaseUrl.match(/^https:\/\/[a-z0-9-]+\.supabase\.co$/)) {
      console.warn('[SUPABASE] URL format may be incorrect:', supabaseUrl.substring(0, 50) + '...');
      console.warn('[SUPABASE] Expected format: https://[project-ref].supabase.co');
    }

    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: 'supabase.auth.token',
        flowType: 'pkce'
      },
      global: {
        headers: {
          'x-application-name': 'beyondwords-client'
        }
      }
    });
  }
}

export { supabase }

// Test connection function for debugging
export const getCurrentSession = async () => {
  // DEVELOPMENT MODE: Return no session if bypassing auth
  if (bypassAuth) {
    return { session: null, error: null };
  }

  try {
    // Try to get session from storage first
    const storedSession = typeof window !== 'undefined' ? 
      localStorage.getItem('supabase.auth.token') : null;

    if (storedSession) {
      console.log('[AUTH] Found stored session');
    }

    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('[AUTH] Session error:', error);
      return { session: null, error };
    }

    if (!session) {
      console.log('[AUTH] No active session');
      return { session: null, error: null };
    }

    console.log('[AUTH] Active session found:', session.user.id);
    return { session, error: null };
  } catch (err) {
    console.error('[AUTH] Session retrieval error:', err);
    return { session: null, error: err };
  }
};

// Test if Supabase URL is reachable
export const testSupabaseReachability = async (): Promise<{ reachable: boolean; error?: string }> => {
  // DEVELOPMENT MODE: Return reachable if bypassing auth
  if (bypassAuth) {
    return { reachable: true };
  }

  if (!supabaseUrl) {
    return { reachable: false, error: 'Supabase URL is not configured' };
  }

  try {
    // Try to fetch the health endpoint or auth endpoint
    const testUrl = `${supabaseUrl}/rest/v1/`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(testUrl, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'apikey': supabaseAnonKey || '',
      }
    });

    clearTimeout(timeoutId);
    return { reachable: true };
  } catch (err: any) {
    console.error('[SUPABASE] Reachability test failed:', err);
    
    if (err.name === 'AbortError') {
      return { reachable: false, error: 'Connection timeout - Supabase server is not responding' };
    }
    
    if (err.message?.includes('ERR_NAME_NOT_RESOLVED') || err.message?.includes('Failed to fetch')) {
      return { 
        reachable: false, 
        error: `Cannot resolve Supabase URL: ${supabaseUrl}. The project may be paused, deleted, or the URL is incorrect.` 
      };
    }
    
    return { reachable: false, error: err.message || 'Unknown connection error' };
  }
};

export const testSupabaseConnection = async () => {
  // DEVELOPMENT MODE: Return success if bypassing auth
  if (bypassAuth) {
    return { success: true, data: { hasSession: false }, error: null };
  }

  try {
    console.log('[SUPABASE] Testing connection with auth session...');
    
    // Test connection using auth.getSession() which doesn't require RLS
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('[SUPABASE] Auth session error:', error);
      return { success: false, data: null, error };
    }
    
    console.log('[SUPABASE] Connection successful, session:', data.session ? 'exists' : 'none');
    return { success: true, data: { hasSession: !!data.session }, error: null };
  } catch (err) {
    console.error('[SUPABASE] Connection exception:', err);
    return { success: false, data: null, error: err };
  }
};

// Enhanced user profile functions with better error handling
export const getUserProfile = async (userId: string) => {
  // DEVELOPMENT MODE: Return mock profile if bypassing auth
  if (bypassAuth) {
    return { 
      success: true, 
      data: {
        id: userId,
        email: 'dev@localhost.test',
        name: 'Development User',
        onboarding_complete: true
      }, 
      error: null 
    };
  }

  try {
    // console.log('[SUPABASE] Getting user profile for:', userId);
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('[SUPABASE] Error getting user profile:', error);
      
      // Handle specific deployment errors
      if (error.code === 'PGRST116') {
        console.log('[SUPABASE] User not found in database - this is expected for new users');
        return { success: true, data: null, error: null };
      }
      
      return { success: false, data: null, error };
    }
    
    // console.log('[SUPABASE] User profile retrieved:', data);
    return { success: true, data, error: null };
  } catch (err) {
    console.error('[SUPABASE] Exception getting user profile:', err);
    return { success: false, data: null, error: err };
  }
};

export const createUserProfile = async (userData: any) => {
  // DEVELOPMENT MODE: Return mock profile if bypassing auth
  if (bypassAuth) {
    return { 
      success: true, 
      data: {
        ...userData,
        id: userData.id || 'dev-user-123',
        onboarding_complete: false
      }, 
      error: null 
    };
  }

  try {
    console.log('[SUPABASE] Creating user profile:', userData);
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();
    
    if (error) {
      console.error('[SUPABASE] Error creating user profile:', error);
      return { success: false, data: null, error };
    }
    
    console.log('[SUPABASE] User profile created:', data);
    return { success: true, data, error: null };
  } catch (err) {
    console.error('[SUPABASE] Exception creating user profile:', err);
    return { success: false, data: null, error: err };
  }
};

// Note: This function is deprecated - use the API client in lib/api.ts instead
export const getUserLanguageDashboards = async (userId: string) => {
  console.warn('[SUPABASE] getUserLanguageDashboards is deprecated. Use the API client from lib/api.ts instead.');
  try {
    const { data, error } = await supabase
      .from('language_dashboards')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      console.error('[SUPABASE] Error getting language dashboards:', error);
      return { success: false, data: null, error };
    }
    
    return { success: true, data, error: null };
  } catch (err) {
    console.error('[SUPABASE] Exception getting language dashboards:', err);
    return { success: false, data: null, error: err };
  }
};

// Add the missing createLanguageDashboard function
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
    console.log('[SUPABASE] Creating language dashboard:', dashboardData);
    
    // Store arrays directly (database expects text[] type)
    const dataToInsert = {
      ...dashboardData,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    const { data, error } = await supabase
      .from('language_dashboards')
      .insert([dataToInsert])
      .select()
      .single();
    
    if (error) {
      console.error('[SUPABASE] Error creating language dashboard:', error);
      return { success: false, data: null, error: error.message };
    }
    
    console.log('[SUPABASE] Language dashboard created:', data);
    return { success: true, data, error: null };
  } catch (err) {
    console.error('[SUPABASE] Exception creating language dashboard:', err);
    return { success: false, data: null, error: err instanceof Error ? err.message : 'Unknown error' };
  }
};

// Add this function to your existing supabase.ts file
export const getUserPersonas = async (userId: string) => {
  try {
    console.log('[SUPABASE] Getting personas for user:', userId);
    const { data, error } = await supabase
      .from('personas')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      console.error('[SUPABASE] Error getting personas:', error);
      return { success: false, data: null, error: error.message };
    }
    
    console.log('[SUPABASE] Personas retrieved:', data);
    return { success: true, data, error: null };
  } catch (err) {
    console.error('[SUPABASE] Exception getting personas:', err);
    return { success: false, data: null, error: err instanceof Error ? err.message : 'Unknown error' };
  }
};

// Add this function to get user conversations
export const getUserConversations = async (userId: string) => {
  try {
    console.log('[SUPABASE] Getting conversations for user:', userId);
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('[SUPABASE] Error getting conversations:', error);
      return { success: false, data: null, error: error.message };
    }
    
    console.log('[SUPABASE] Conversations retrieved:', data);
    return { success: true, data, error: null };
  } catch (err) {
    console.error('[SUPABASE] Exception getting conversations:', err);
    return { success: false, data: null, error: err instanceof Error ? err.message : 'Unknown error' };
  }
};