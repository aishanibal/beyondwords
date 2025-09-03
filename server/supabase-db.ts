import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  google_id?: string;
  password_hash?: string;
  role: string;
  target_language?: string;
  proficiency_level?: string;
  talk_topics?: string[] | string;
  learning_goals?: string[] | string;
  practice_preference?: string;
  motivation?: string;
  preferences?: string;
  onboarding_complete: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LanguageDashboard {
  id: number;
  user_id: string;
  language: string;
  proficiency_level?: string;
  talk_topics?: string[];
  learning_goals?: string[];
  practice_preference?: string;
  feedback_language?: string;
  speak_speed?: number;
  romanization_display?: string;
  is_primary: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Session {
  id: number;
  user_id: string;
  chat_history?: string;
  language?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Conversation {
  id: number;
  user_id: string;
  title?: string;
  synopsis?: string;
  language?: string;
  topics?: string[];
  formality?: string;
  description?: string;
  uses_persona?: boolean;
  persona_id?: number;
  learning_goals?: string[];
  message_count?: number;
  created_at?: string;
  updated_at?: string;
  messages?: Message[];
}

export interface Message {
  id: number;
  conversation_id: number;
  sender: string;
  text: string;
  message_type?: string;
  audio_file_path?: string;
  detailed_feedback?: string;
  message_order?: number;
  romanized_text?: string;
  created_at?: string;
}

export interface Persona {
  id: number;
  user_id: string;
  name: string;
  description?: string;
  topics?: string[];
  formality?: string;
  language?: string;
  conversation_id?: number;
  created_at?: string;
  updated_at?: string;
}

// User functions
export const createUser = async (userData: Partial<User>): Promise<User> => {
  const { data, error } = await supabase
    .from('users')
    .insert([userData])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const findUserByGoogleId = async (googleId: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('google_id', googleId)
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

export const findUserByEmail = async (email: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

export const findUserById = async (id: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

export const updateUser = async (id: string, updates: Partial<User>): Promise<User> => {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const getAllUsers = async (): Promise<User[]> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

// Session functions
export const saveSession = async (userId: string, chatHistory: any[], language = 'en'): Promise<Session> => {
  const { data, error } = await supabase
    .from('sessions')
    .insert([{
      user_id: userId,
      chat_history: JSON.stringify(chatHistory),
      language
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const getSession = async (userId: string): Promise<Session | null> => {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

export const getAllSessions = async (userId: string): Promise<Session[]> => {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

// Language Dashboard functions
export const createLanguageDashboard = async (
  userId: string,
  language: string,
  proficiencyLevel: string,
  talkTopics: string[],
  learningGoals: string[],
  practicePreference: string,
  feedbackLanguage = 'en',
  isPrimary = false
): Promise<LanguageDashboard> => {
  const { data, error } = await supabase
    .from('language_dashboards')
    .insert([{
      user_id: userId,
      language,
      proficiency_level: proficiencyLevel,
      talk_topics: talkTopics,
      learning_goals: learningGoals,
      practice_preference: practicePreference,
      feedback_language: feedbackLanguage,
      is_primary: isPrimary
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const getUserLanguageDashboards = async (userId: string): Promise<LanguageDashboard[]> => {
  const { data, error } = await supabase
    .from('language_dashboards')
    .select('*')
    .eq('user_id', userId)
    .order('is_primary', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

export const getLanguageDashboard = async (userId: string, language: string): Promise<LanguageDashboard | null> => {
  const { data, error } = await supabase
    .from('language_dashboards')
    .select('*')
    .eq('user_id', userId)
    .eq('language', language)
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

export const updateLanguageDashboard = async (userId: string, language: string, updates: Partial<LanguageDashboard>): Promise<LanguageDashboard> => {
  const { data, error } = await supabase
    .from('language_dashboards')
    .update(updates)
    .eq('user_id', userId)
    .eq('language', language)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteLanguageDashboard = async (userId: string, language: string): Promise<{ changes: number }> => {
  const { error } = await supabase
    .from('language_dashboards')
    .delete()
    .eq('user_id', userId)
    .eq('language', language);
  
  if (error) throw error;
  return { changes: 1 };
};

// Conversation functions
export const createConversation = async (
  userId: string,
  language: string,
  title: string,
  topics: string[],
  formality: string,
  description?: string,
  usesPersona?: boolean,
  personaId?: number,
  learningGoals?: string[]
): Promise<Conversation> => {
  const { data, error } = await supabase
    .from('conversations')
    .insert([{
      user_id: userId,
      language,
      title,
      topics,
      formality,
      description,
      uses_persona: usesPersona,
      persona_id: personaId,
      learning_goals: learningGoals
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const getUserConversations = async (userId: string, language?: string): Promise<Conversation[]> => {
  let query = supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId);
  
  if (language) {
    query = query.eq('language', language);
  }
  
  const { data, error } = await query.order('updated_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

export const getConversationWithMessages = async (conversationId: number): Promise<Conversation | null> => {
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      messages (*)
    `)
    .eq('id', conversationId)
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

export const updateConversationTitle = async (conversationId: number, title: string): Promise<{ changes: number }> => {
  const { error } = await supabase
    .from('conversations')
    .update({ title })
    .eq('id', conversationId);
  
  if (error) throw error;
  return { changes: 1 };
};

export const updateConversationSynopsis = async (conversationId: number, synopsis: string, progressData?: any): Promise<{ changes: number }> => {
  const updates: any = { synopsis };
  if (progressData) {
    updates.progress_data = progressData;
  }
  
  const { error } = await supabase
    .from('conversations')
    .update(updates)
    .eq('id', conversationId);
  
  if (error) throw error;
  return { changes: 1 };
};

export const deleteConversation = async (conversationId: number): Promise<{ changes: number }> => {
  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', conversationId);
  
  if (error) throw error;
  return { changes: 1 };
};

export const updateConversationPersona = async (conversationId: number, usesPersona: boolean, personaId?: number): Promise<{ changes: number }> => {
  const { error } = await supabase
    .from('conversations')
    .update({ 
      uses_persona: usesPersona,
      persona_id: personaId 
    })
    .eq('id', conversationId);
  
  if (error) throw error;
  return { changes: 1 };
};

// Message functions
export const addMessage = async (
  conversationId: number,
  sender: string,
  text: string,
  messageType = 'text',
  audioFilePath?: string,
  detailedFeedback?: string,
  messageOrder?: number,
  romanizedText?: string
): Promise<Message> => {
  const { data, error } = await supabase
    .from('messages')
    .insert([{
      conversation_id: conversationId,
      sender,
      text,
      message_type: messageType,
      audio_file_path: audioFilePath,
      detailed_feedback: detailedFeedback,
      message_order: messageOrder,
      romanized_text: romanizedText
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Persona functions
export const createPersona = async (userId: string, personaData: Partial<Persona>): Promise<Persona> => {
  const { data, error } = await supabase
    .from('personas')
    .insert([{
      user_id: userId,
      ...personaData
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const getUserPersonas = async (userId: string): Promise<Persona[]> => {
  const { data, error } = await supabase
    .from('personas')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

export const deletePersona = async (personaId: number): Promise<{ changes: number }> => {
  const { error } = await supabase
    .from('personas')
    .delete()
    .eq('id', personaId);
  
  if (error) throw error;
  return { changes: 1 };
};

// User streak function (placeholder - implement based on your needs)
export const getUserStreak = async (userId: string, language: string): Promise<any> => {
  // This would need to be implemented based on your streak logic
  // For now, return a placeholder
  return {
    current_streak: 0,
    longest_streak: 0,
    last_practice_date: null
  };
};

// Placeholder function for compatibility
export const closeDatabase = async (): Promise<void> => {
  // No need to close Supabase connection
};
