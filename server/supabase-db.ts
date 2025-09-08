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
  googleId?: string; // Add camelCase version for compatibility
  password_hash?: string;
  passwordHash?: string; // Add camelCase version for compatibility
  role: string;
  target_language?: string;
  targetLanguage?: string; // Add camelCase version for compatibility
  proficiency_level?: string;
  proficiencyLevel?: string; // Add camelCase version for compatibility
  talk_topics?: string[] | string;
  talkTopics?: string[] | string; // Add camelCase version for compatibility
  learning_goals?: string[] | string;
  learningGoals?: string[] | string; // Add camelCase version for compatibility
  practice_preference?: string;
  practicePreference?: string; // Add camelCase version for compatibility
  motivation?: string;
  preferences?: string;
  onboarding_complete: boolean;
  onboardingComplete?: boolean; // Add camelCase version for compatibility
  created_at?: string;
  updated_at?: string;
}

export interface LanguageDashboard {
  id: number;
  user_id: string;
  userId?: string; // Add camelCase version for compatibility
  language: string;
  proficiency_level?: string;
  proficiencyLevel?: string; // Add camelCase version for compatibility
  talk_topics?: string[];
  talkTopics?: string[]; // Add camelCase version for compatibility
  learning_goals?: string[];
  learningGoals?: string[]; // Add camelCase version for compatibility
  practice_preference?: string;
  practicePreference?: string; // Add camelCase version for compatibility
  feedback_language?: string;
  feedbackLanguage?: string; // Add camelCase version for compatibility
  speak_speed?: number;
  speakSpeed?: number; // Add camelCase version for compatibility
  romanization_display?: string;
  romanizationDisplay?: string; // Add camelCase version for compatibility
  is_primary: boolean;
  isPrimary?: boolean; // Add camelCase version for compatibility
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
  conversationId?: number; // Add camelCase version for compatibility
  created_at?: string;
  updated_at?: string;
}

// User functions
export const createUser = async (userData: Partial<User>): Promise<User> => {
  // Convert camelCase to snake_case for database
  const dbData: any = { ...userData };
  
  // Handle camelCase -> snake_case conversions
  if (userData.googleId) {
    dbData.google_id = userData.googleId;
    delete dbData.googleId;
  }
  if (userData.passwordHash) {
    dbData.password_hash = userData.passwordHash;
    delete dbData.passwordHash;
  }
  if (userData.targetLanguage) {
    dbData.target_language = userData.targetLanguage;
    delete dbData.targetLanguage;
  }
  if (userData.proficiencyLevel) {
    dbData.proficiency_level = userData.proficiencyLevel;
    delete dbData.proficiencyLevel;
  }
  if (userData.talkTopics) {
    dbData.talk_topics = userData.talkTopics;
    delete dbData.talkTopics;
  }
  if (userData.learningGoals) {
    dbData.learning_goals = userData.learningGoals;
    delete dbData.learningGoals;
  }
  if (userData.practicePreference) {
    dbData.practice_preference = userData.practicePreference;
    delete dbData.practicePreference;
  }
  if (userData.onboardingComplete !== undefined) {
    dbData.onboarding_complete = userData.onboardingComplete;
    delete dbData.onboardingComplete;
  }
  
  const { data, error } = await supabase
    .from('users')
    .insert([dbData])
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
  // Convert camelCase to snake_case for database
  const dbUpdates: any = { ...updates };
  
  // Handle camelCase -> snake_case conversions
  if (updates.googleId) {
    dbUpdates.google_id = updates.googleId;
    delete dbUpdates.googleId;
  }
  if (updates.passwordHash) {
    dbUpdates.password_hash = updates.passwordHash;
    delete dbUpdates.passwordHash;
  }
  if (updates.targetLanguage) {
    dbUpdates.target_language = updates.targetLanguage;
    delete dbUpdates.targetLanguage;
  }
  if (updates.proficiencyLevel) {
    dbUpdates.proficiency_level = updates.proficiencyLevel;
    delete dbUpdates.proficiencyLevel;
  }
  if (updates.talkTopics) {
    dbUpdates.talk_topics = updates.talkTopics;
    delete dbUpdates.talkTopics;
  }
  if (updates.learningGoals) {
    dbUpdates.learning_goals = updates.learningGoals;
    delete dbUpdates.learningGoals;
  }
  if (updates.practicePreference) {
    dbUpdates.practice_preference = updates.practicePreference;
    delete dbUpdates.practicePreference;
  }
  if (updates.onboardingComplete !== undefined) {
    dbUpdates.onboarding_complete = updates.onboardingComplete;
    delete dbUpdates.onboardingComplete;
  }
  
  const { data, error } = await supabase
    .from('users')
    .update(dbUpdates)
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
  // Resolve the user's language dashboard id for this language
  let languageDashboardId: number | null = null;
  try {
    const dashboard = await getLanguageDashboard(userId, language);
    languageDashboardId = dashboard?.id ?? null;
  } catch (e) {
    // If dashboard lookup fails, continue without it
    languageDashboardId = null;
  }

  const insertPayload: any = {
    user_id: userId,
    // Do NOT set language if the column doesn't exist in Supabase
    title,
    topics,
    formality,
    description,
    uses_persona: usesPersona,
    persona_id: personaId,
    learning_goals: learningGoals
  };

  if (languageDashboardId) {
    insertPayload.language_dashboard_id = languageDashboardId;
  }

  const { data, error } = await supabase
    .from('conversations')
    .insert([insertPayload])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const getUserConversations = async (userId: string, language?: string): Promise<Conversation[]> => {
  // If a language is provided, map it to the user's language dashboard id
  if (language) {
    try {
      const dashboard = await getLanguageDashboard(userId, language);
      if (dashboard?.id) {
        const { data, error } = await supabase
          .from('conversations')
          .select('*')
          .eq('user_id', userId)
          .eq('language_dashboard_id', dashboard.id)
          .order('updated_at', { ascending: false });
        if (error) throw error;
        return data || [];
      }
    } catch (e) {
      // Fall through to fetch by user only
    }
  }

  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  
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
  // Convert camelCase to snake_case for database
  const dbData: any = {
    user_id: userId,
    ...personaData
  };
  
  // Handle conversationId -> conversation_id conversion
  if (personaData.conversationId) {
    dbData.conversation_id = personaData.conversationId;
    delete dbData.conversationId;
  }
  
  const { data, error } = await supabase
    .from('personas')
    .insert([dbData])
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
