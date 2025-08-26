/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

console.log('[SUPABASE] Config check:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  urlLength: supabaseUrl?.length,
  keyLength: supabaseAnonKey?.length,
  url: supabaseUrl?.substring(0, 50) + '...',
  key: supabaseAnonKey?.substring(0, 20) + '...'
});

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
}

// Create Supabase client with auth configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Test the client immediately
console.log('[SUPABASE] Client created, testing connection...');
supabase.auth.getSession().then(({ data, error }) => {
  console.log('[SUPABASE] Initial connection test:', { hasData: !!data, error });
}).catch(err => {
  console.error('[SUPABASE] Initial connection test failed:', err);
});

// Test database connection without RLS
export const testDatabaseConnection = async () => {
  try {
    console.log('[DB_TEST] Testing database connection...');
    
    // Test 1: Simple count query
    const { data: countData, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    console.log('[DB_TEST] Count query result:', { countData, countError });
    
    // Test 2: Check if we can access the table at all
    const { data: tableData, error: tableError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    console.log('[DB_TEST] Table access result:', { tableData, tableError });
    
    return { success: true, countData, tableData };
  } catch (error) {
    console.error('[DB_TEST] Database test failed:', error);
    return { success: false, error };
  }
};

// Function to save waitlist email
export const saveWaitlistEmail = async (email: string, source: string = 'website'):
  Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('waitlist_emails')
      .insert([
        { 
          email: email,
          source: source,
          created_at: new Date().toISOString()
        }
      ])
    
    if (error) {
      console.error('Error saving email:', error)
      throw error
    }
    
    return { success: true, data }
  } catch (error: any) {
    console.error('Supabase error:', error)
    return { success: false, error: error.message }
  }
}

// Function to get all waitlist emails (for admin purposes)
export const getWaitlistEmails = async ():
  Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('waitlist_emails')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching emails:', error)
      throw error
    }
    
    return { success: true, data }
  } catch (error: any) {
    console.error('Supabase error:', error)
    return { success: false, error: error.message }
  }
}

// User management functions
export const createUserProfile = async (userData: {
  id: string;
  email: string;
  name: string;
  google_id?: string;
  target_language?: string;
  proficiency_level?: string;
}): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
    
    if (error) {
      console.error('Error creating user profile:', error)
      throw error
    }
    
    return { success: true, data }
  } catch (error: any) {
    console.error('Supabase error:', error)
    return { success: false, error: error.message }
  }
}

export const getUserProfile = async (userId: string):
  Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) {
      console.error('Error fetching user profile:', error)
      throw error
    }
    
    return { success: true, data }
  } catch (error: any) {
    console.error('Supabase error:', error)
    return { success: false, error: error.message }
  }
}

// Language dashboard functions
export const createLanguageDashboard = async (dashboardData: {
  user_id: string;
  language: string;
  proficiency_level?: string;
  talk_topics?: string[];
  learning_goals?: string[];
  practice_preference?: string;
  feedback_language?: string;
  speak_speed?: number;
  romanization_display?: string;
  is_primary?: boolean;
}): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('language_dashboards')
      .insert([dashboardData])
    
    if (error) {
      console.error('Error creating language dashboard:', error)
      throw error
    }
    
    return { success: true, data }
  } catch (error: any) {
    console.error('Supabase error:', error)
    return { success: false, error: error.message }
  }
}

export const getUserLanguageDashboards = async (userId: string):
  Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('language_dashboards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching language dashboards:', error)
      throw error
    }
    
    return { success: true, data }
  } catch (error: any) {
    console.error('Supabase error:', error)
    return { success: false, error: error.message }
  }
}

// Persona functions
export const createPersona = async (personaData: {
  user_id: string;
  name: string;
  description?: string;
  topics?: string[];
  formality?: string;
  language?: string;
  conversation_id?: string;
}): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('personas')
      .insert([personaData])
    
    if (error) {
      console.error('Error creating persona:', error)
      throw error
    }
    
    return { success: true, data }
  } catch (error: any) {
    console.error('Supabase error:', error)
    return { success: false, error: error.message }
  }
}

export const getUserPersonas = async (userId: string):
  Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('personas')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching personas:', error)
      throw error
    }
    
    return { success: true, data }
  } catch (error: any) {
    console.error('Supabase error:', error)
    return { success: false, error: error.message }
  }
}

// Conversation functions
export const createConversation = async (conversationData: {
  user_id: string;
  language_dashboard_id: number;
  title?: string;
  topics?: string[];
  formality?: string;
  description?: string;
  uses_persona?: boolean;
  persona_id?: number;
  learning_goals?: string[];
}): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .insert([conversationData])
    
    if (error) {
      console.error('Error creating conversation:', error)
      throw error
    }
    
    return { success: true, data }
  } catch (error: any) {
    console.error('Supabase error:', error)
    return { success: false, error: error.message }
  }
}

export const getUserConversations = async (userId: string):
  Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        language_dashboards(language),
        personas(name, description)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching conversations:', error)
      throw error
    }
    
    return { success: true, data }
  } catch (error: any) {
    console.error('Supabase error:', error)
    return { success: false, error: error.message }
  }
}

// Message functions
export const createMessage = async (messageData: {
  conversation_id: number;
  sender: string;
  text: string;
  romanized_text?: string;
  message_type?: string;
  audio_file_path?: string;
  detailed_feedback?: string;
  message_order: number;
}): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert([messageData])
    
    if (error) {
      console.error('Error creating message:', error)
      throw error
    }
    
    return { success: true, data }
  } catch (error: any) {
    console.error('Supabase error:', error)
    return { success: false, error: error.message }
  }
}

export const getConversationMessages = async (conversationId: number):
  Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('message_order', { ascending: true })
    
    if (error) {
      console.error('Error fetching messages:', error)
      throw error
    }
    
    return { success: true, data }
  } catch (error: any) {
    console.error('Supabase error:', error)
    return { success: false, error: error.message }
  }
}

// Session functions
export const createSession = async (sessionData: {
  user_id: string;
  chat_history?: any[];
  language?: string;
}): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .insert([sessionData])
    
    if (error) {
      console.error('Error creating session:', error)
      throw error
    }
    
    return { success: true, data }
  } catch (error: any) {
    console.error('Supabase error:', error)
    return { success: false, error: error.message }
  }
}

export const getUserSessions = async (userId: string):
  Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching sessions:', error)
      throw error
    }
    
    return { success: true, data }
  } catch (error: any) {
    console.error('Supabase error:', error)
    return { success: false, error: error.message }
  }
} 