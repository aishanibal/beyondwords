import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Add better error handling for missing environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    environment: process.env.NODE_ENV
  });
  
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Critical: Supabase environment variables are missing in production');
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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
})

// Test connection function for debugging
export const getCurrentSession = async () => {
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

export const testSupabaseConnection = async () => {
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

export const getUserLanguageDashboards = async (userId: string) => {
  try {
    // console.log('[SUPABASE] Getting language dashboards for:', userId);
    const { data, error } = await supabase
      .from('language_dashboards')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      console.error('[SUPABASE] Error getting language dashboards:', error);
      return { success: false, data: null, error };
    }
    
    // console.log('[SUPABASE] Language dashboards retrieved:', data);
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