import { createClient } from '@supabase/supabase-js';
import path from 'path';

// Initialize Supabase client only if environment variables are available
let supabase: any = null;
if (process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)) {
  // Use service role key if available (for admin operations), otherwise use anon key
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
  supabase = createClient(process.env.SUPABASE_URL, supabaseKey);
  console.log('✅ Supabase client initialized with', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'service role key' : 'anon key');
} else {
  console.log('⚠️ Supabase environment variables not found. Database functions will be disabled.');
}

export interface User {
  id: number; // Make ID required since we're using auto-generated IDs
  google_id?: string;
  googleId?: string;
  email: string;
  name: string;
  password_hash?: string;
  passwordHash?: string;
  role: string;
  target_language?: string;
  proficiency_level?: string;
  talk_topics?: string[];
  learning_goals?: string[];
  practice_preference?: string;
  motivation?: string;
  preferences?: {
    theme?: 'light' | 'dark' | 'auto';
    notifications_enabled?: boolean;
    email_notifications?: boolean;
    language?: string;
  };
  onboarding_complete?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Session {
  id: number;
  user_id: number;
  chat_history: any[];
  language: string;
  created_at: string;
  updated_at: string;
}

export interface LanguageDashboard {
  id: number;
  user_id: number;
  language: string;
  proficiency_level?: string;
  talk_topics?: string[];
  learning_goals?: string[];
  practice_preference?: string;
  feedback_language?: string;
  speak_speed?: number;
  romanization_display?: string; // 'both', 'script_only', 'romanized_only'
  is_primary?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Conversation {
  id: number;
  user_id: number;
  language_dashboard_id: number;
  title?: string;
  topics?: string[];
  formality?: string;
  description?: string;
  synopsis?: string;
  message_count?: number;
  uses_persona?: boolean;
  persona_id?: number;
  progress_data?: string | { goals: string[]; percentages: number[] };
  learning_goals?: string[];
  messages?: Message[];
  created_at?: string;
  updated_at?: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender: string;
  text: string;
  romanized_text?: string;
  message_type?: string;
  audio_file_path?: string;
  detailed_feedback?: string;
  message_order: number;
  created_at: string;
}

export interface Persona {
  id: number;
  user_id: number;
  name: string;
  description?: string;
  topics: string[];
  formality: string;
  language: string;
  conversation_id?: string;
  created_at: string;
  updated_at: string;
}

// Database file path - commented out since we're using Supabase
// const dbPath = path.join(__dirname, 'users.db');
// console.log('USING DATABASE FILE:', dbPath);

// Create database connection
// const db = new sqlite3.Database(dbPath, (err) => {
//   if (err) {
//     console.error('Error opening database:', err.message);
//   } else {
//     console.log('Connected to SQLite database');
//     initDatabase();
//   }
// });

// Initialize database tables
// function initDatabase() {
//   db.serialize(() => {
//     // Drop existing tables to start fresh
//     db.run('DROP TABLE IF EXISTS messages');
//     db.run('DROP TABLE IF EXISTS conversations');
//     db.run('DROP TABLE IF EXISTS personas');
//     db.run('DROP TABLE IF EXISTS language_dashboards');
//     db.run('DROP TABLE IF EXISTS sessions');
//     db.run('DROP TABLE IF EXISTS users');
    
//     // Create users table
//     db.run(`
//       CREATE TABLE users (
//         id INTEGER PRIMARY KEY AUTOINCREMENT,
//         google_id TEXT UNIQUE,
//         email TEXT UNIQUE NOT NULL,
//         name TEXT NOT NULL,
//         password_hash TEXT,
//         role TEXT DEFAULT 'user',
//         target_language TEXT,
//         proficiency_level TEXT,
//         talk_topics TEXT,
//         learning_goals TEXT,
//         practice_preference TEXT,
//         motivation TEXT,
//         preferences TEXT,
//         onboarding_complete BOOLEAN DEFAULT FALSE,
//         created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
//         updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
//       )
//     `);
    
//     // Create sessions table
//     db.run(`
//       CREATE TABLE sessions (
//         id INTEGER PRIMARY KEY AUTOINCREMENT,
//         user_id INTEGER NOT NULL,
//         chat_history TEXT,
//         language TEXT DEFAULT 'en',
//         created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
//         updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
//         FOREIGN KEY (user_id) REFERENCES users (id)
//       )
//     `);
    
//     // Create language_dashboards table
//     db.run(`
//       CREATE TABLE language_dashboards (
//         id INTEGER PRIMARY KEY AUTOINCREMENT,
//         user_id INTEGER NOT NULL,
//         language TEXT NOT NULL,
//         proficiency_level TEXT,
//         talk_topics TEXT,
//         learning_goals TEXT,
//         practice_preference TEXT,
//         feedback_language TEXT DEFAULT 'en',
//         speak_speed REAL DEFAULT 1.0,
//         romanization_display TEXT DEFAULT 'both',
//         is_primary BOOLEAN DEFAULT FALSE,
//         created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
//         updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
//         FOREIGN KEY (user_id) REFERENCES users (id),
//         UNIQUE(user_id, language)
//       )
//     `);
    
//     // Create personas table
//     db.run(`
//       CREATE TABLE personas (
//         id INTEGER PRIMARY KEY AUTOINCREMENT,
//         user_id INTEGER NOT NULL,
//         name TEXT NOT NULL,
//         description TEXT,
//         topics TEXT,
//         formality TEXT,
//         language TEXT,
//         conversation_id TEXT,
//         created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
//         updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
//         FOREIGN KEY (user_id) REFERENCES users (id)
//       )
//     `);
    
//     // Create conversations table
//     db.run(`
//       CREATE TABLE conversations (
//         id INTEGER PRIMARY KEY AUTOINCREMENT,
//         user_id INTEGER NOT NULL,
//         language_dashboard_id INTEGER NOT NULL,
//         title TEXT,
//         topics TEXT,
//         formality TEXT,
//         description TEXT,
//         synopsis TEXT,
//         message_count INTEGER DEFAULT 0,
//         uses_persona BOOLEAN DEFAULT FALSE,
//         persona_id INTEGER,
//         progress_data TEXT,
//         learning_goals TEXT,
//         created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
//         updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
//         FOREIGN KEY (user_id) REFERENCES users (id),
//         FOREIGN KEY (language_dashboard_id) REFERENCES language_dashboards (id),
//         FOREIGN KEY (persona_id) REFERENCES personas (id)
//       )
//     `);
    
//     // Create messages table
//     db.run(`
//       CREATE TABLE messages (
//         id INTEGER PRIMARY KEY AUTOINCREMENT,
//         conversation_id INTEGER NOT NULL,
//         sender TEXT NOT NULL,
//         text TEXT NOT NULL,
//         romanized_text TEXT,
//         message_type TEXT DEFAULT 'text',
//         audio_file_path TEXT,
//         detailed_feedback TEXT,
//         message_order INTEGER NOT NULL,
//         created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
//         FOREIGN KEY (conversation_id) REFERENCES conversations (id)
//       )
//     `);
    
//     // Create indexes for better performance
//     db.run('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
//     db.run('CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id)');
//     db.run('CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)');
//     db.run('CREATE INDEX IF NOT EXISTS idx_language_dashboards_user_id ON language_dashboards(user_id)');
//     db.run('CREATE INDEX IF NOT EXISTS idx_language_dashboards_user_language ON language_dashboards(user_id, language)');
//     db.run('CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id)');
//     db.run('CREATE INDEX IF NOT EXISTS idx_conversations_language_dashboard_id ON conversations(language_dashboard_id)');
//     db.run('CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id)');
//     db.run('CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at)');
//     db.run('CREATE INDEX IF NOT EXISTS idx_personas_user_id ON personas(user_id)');
    
//     console.log('Database schema created successfully!');
//   });
// }

// User functions
function createUser(userData: Partial<User>) {
  return new Promise<User>(async (resolve, reject) => {
    try {
      if (!supabase) {
        reject(new Error('Supabase client not initialized'));
        return;
      }

      // For Supabase, we'll create the user directly in our custom users table
      // The auth will be handled by the frontend or through other means
      const { data, error } = await supabase
        .from('users')
        .insert({
          google_id: userData.googleId || userData.google_id,
          email: userData.email,
          name: userData.name,
          password_hash: userData.passwordHash || userData.password_hash,
          role: userData.role || 'user',
          onboarding_complete: userData.onboarding_complete || false
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase createUser error:', error);
        reject(error);
      } else {
        console.log('✅ User created successfully:', data);
        // Ensure the returned user has an ID
        const user = data as User;
        if (!user.id) {
          reject(new Error('User created but no ID returned'));
          return;
        }
        resolve(user);
      }
    } catch (error) {
      console.error('❌ createUser error:', error);
      reject(error);
    }
  });
}

function findUserByGoogleId(googleId: string) {
  return new Promise<User | null>(async (resolve, reject) => {
    try {
      if (!supabase) {
        reject(new Error('Supabase client not initialized'));
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('google_id', googleId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('❌ Supabase findUserByGoogleId error:', error);
        reject(error);
      } else {
        resolve(data as User || null);
      }
    } catch (error) {
      console.error('❌ findUserByGoogleId error:', error);
      reject(error);
    }
  });
}

function findUserByEmail(email: string) {
  return new Promise<User | null>(async (resolve, reject) => {
    try {
      if (!supabase) {
        reject(new Error('Supabase client not initialized'));
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('❌ Supabase findUserByEmail error:', error);
        reject(error);
      } else {
        const user = data as User;
        if (user && !user.id) {
          console.error('❌ User found but no ID:', user);
          reject(new Error('User found but no ID returned'));
          return;
        }
        resolve(user || null);
      }
    } catch (error) {
      console.error('❌ findUserByEmail error:', error);
      reject(error);
    }
  });
}

function findUserById(id: number) {
  return new Promise<User | null>(async (resolve, reject) => {
    try {
      if (!supabase) {
        reject(new Error('Supabase client not initialized'));
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('❌ Supabase findUserById error:', error);
        reject(error);
      } else {
        // Parse JSON fields if they exist
        if (data) {
          if (data.talk_topics) {
            try {
              data.talk_topics = JSON.parse(data.talk_topics as any);
            } catch (e) {
              data.talk_topics = [];
            }
          }
          
          if (data.learning_goals) {
            try {
              data.learning_goals = JSON.parse(data.learning_goals as any);
            } catch (e) {
              data.learning_goals = [];
            }
          }

          // Parse preferences field
          if (data.preferences) {
            try {
              data.preferences = JSON.parse(data.preferences as any);
            } catch (e) {
              data.preferences = {};
            }
          }
        }
        const user = data as User;
        if (user && !user.id) {
          console.error('❌ User found but no ID:', user);
          reject(new Error('User found but no ID returned'));
          return;
        }
        resolve(user || null);
      }
    } catch (error) {
      console.error('❌ findUserById error:', error);
      reject(error);
    }
  });
}

function updateUser(id: number, updates: Partial<User>) {
  return new Promise<{ changes: number }>(async (resolve, reject) => {
    try {
      if (!supabase) {
        reject(new Error('Supabase client not initialized'));
        return;
      }

      // Handle preferences field specially - convert to JSON string
      const processedUpdates: any = { ...updates };
      if (processedUpdates.preferences) {
        processedUpdates.preferences = JSON.stringify(processedUpdates.preferences);
      }

      const { data, error } = await supabase
        .from('users')
        .update(processedUpdates)
        .eq('id', id)
        .select();

      if (error) {
        console.error('❌ Supabase updateUser error:', error);
        reject(error);
      } else {
        console.log('✅ User updated successfully');
        resolve({ changes: data ? data.length : 0 });
      }
    } catch (error) {
      console.error('❌ updateUser error:', error);
      reject(error);
    }
  });
}

// Session functions
function saveSession(userId: number, chatHistory: any[], language: string = 'en') {
  return new Promise<Session>(async (resolve, reject) => {
    try {
      if (!supabase) {
        reject(new Error('Supabase client not initialized'));
        return;
      }

      const { data, error } = await supabase
        .from('sessions')
        .insert({
          user_id: userId,
          chat_history: chatHistory,
          language: language
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase saveSession error:', error);
        reject(error);
      } else {
        console.log('✅ Session saved successfully');
        resolve(data as Session);
      }
    } catch (error) {
      console.error('❌ saveSession error:', error);
      reject(error);
    }
  });
}

function getSession(userId: number) {
  return new Promise<Session | null>(async (resolve, reject) => {
    try {
      if (!supabase) {
        reject(new Error('Supabase client not initialized'));
        return;
      }

      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('❌ Supabase getSession error:', error);
        reject(error);
      } else {
        resolve(data as Session || null);
      }
    } catch (error) {
      console.error('❌ getSession error:', error);
      reject(error);
    }
  });
}

function getAllSessions(userId: number) {
  return new Promise<Session[]>(async (resolve, reject) => {
    try {
      if (!supabase) {
        reject(new Error('Supabase client not initialized'));
        return;
      }

      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Supabase getAllSessions error:', error);
        reject(error);
      } else {
        resolve(data as Session[] || []);
      }
    } catch (error) {
      console.error('❌ getAllSessions error:', error);
      reject(error);
    }
  });
}

function getAllUsers() {
  return new Promise<User[]>(async (resolve, reject) => {
    try {
      if (!supabase) {
        reject(new Error('Supabase client not initialized'));
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Supabase getAllUsers error:', error);
        reject(error);
      } else {
        // Parse JSON fields for each user
        const users = (data as User[] || []).map(user => {
          if (user.talk_topics) {
            try {
              user.talk_topics = JSON.parse(user.talk_topics as any);
            } catch (e) {
              user.talk_topics = [];
            }
          }
          
          if (user.learning_goals) {
            try {
              user.learning_goals = JSON.parse(user.learning_goals as any);
            } catch (e) {
              user.learning_goals = [];
            }
          }

          if (user.preferences) {
            try {
              user.preferences = JSON.parse(user.preferences as any);
            } catch (e) {
              user.preferences = {};
            }
          }
          
          return user;
        });
        
        resolve(users);
      }
    } catch (error) {
      console.error('❌ getAllUsers error:', error);
      reject(error);
    }
  });
}

// Conversation functions
function createConversation(userId: number, language: string, title?: string, topics?: string[], formality?: string, description?: string, usesPersona?: boolean, personaId?: number, learningGoals?: string[]) {
  return new Promise<Conversation>(async (resolve, reject) => {
    try {
      if (!supabase) {
        reject(new Error('Supabase client not initialized'));
        return;
      }

      // First, get or create a language dashboard for this user and language
      let languageDashboard = await getLanguageDashboard(userId, language);
      
      if (!languageDashboard) {
        // Create a default language dashboard
        languageDashboard = await createLanguageDashboard(
          userId, 
          language, 
          'beginner', 
          [], 
          [], 
          'conversation',
          'en',
          true
        );
      }

      // Use language dashboard data as fallbacks for missing parameters
      const finalTopics = topics && topics.length > 0 ? topics : (languageDashboard.talk_topics || []);
      const finalLearningGoals = learningGoals && learningGoals.length > 0 ? learningGoals : (languageDashboard.learning_goals || []);
      const finalFormality = formality || 'casual';
      const finalTitle = title || `New ${language} Conversation`;

      const { data, error } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          language_dashboard_id: languageDashboard.id,
          title: finalTitle,
          topics: finalTopics,
          formality: finalFormality,
          description: description || '',
          uses_persona: usesPersona || false,
          persona_id: personaId || null,
          learning_goals: finalLearningGoals
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase createConversation error:', error);
        reject(error);
      } else {
        console.log('✅ Conversation created successfully');
        resolve(data as Conversation);
      }
    } catch (error) {
      console.error('❌ createConversation error:', error);
      reject(error);
    }
  });
}

function addMessage(
  conversationId: number,
  sender: string,
  text: string,
  messageType: string = 'text',
  audioFilePath?: string,
  detailedFeedback?: string,
  messageOrder?: number,
  romanizedText?: string
) {
  return new Promise<Message>(async (resolve, reject) => {
    try {
      if (!supabase) {
        reject(new Error('Supabase client not initialized'));
        return;
      }

      // Get the next message order if not provided
      let finalOrder = messageOrder;
      if (!finalOrder) {
        const { data: orderData, error: orderError } = await supabase
          .from('messages')
          .select('message_order')
          .eq('conversation_id', conversationId)
          .order('message_order', { ascending: false })
          .limit(1)
          .single();

        if (orderError && orderError.code !== 'PGRST116') {
          console.error('❌ Error getting message order:', orderError);
          reject(orderError);
          return;
        }

        finalOrder = orderData ? orderData.message_order + 1 : 1;
      }

      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender: sender,
          text: text,
          romanized_text: romanizedText,
          message_type: messageType,
          audio_file_path: audioFilePath,
          detailed_feedback: detailedFeedback,
          message_order: finalOrder
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase addMessage error:', error);
        reject(error);
      } else {
        console.log('✅ Message added successfully');
        resolve(data as Message);
      }
    } catch (error) {
      console.error('❌ addMessage error:', error);
      reject(error);
    }
  });
}

function getUserConversations(userId: number, language?: string) {
  return new Promise<Conversation[]>(async (resolve, reject) => {
    try {
      if (!supabase) {
        reject(new Error('Supabase client not initialized'));
        return;
      }

      let query = supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId);

      const { data, error } = await query
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Supabase getUserConversations error:', error);
        reject(error);
      } else {
        // If language is specified, filter conversations by getting their language dashboards
        let conversations = data as Conversation[] || [];
        
        if (language) {
          // Get all language dashboard IDs for this user and language
          const { data: dashboardData, error: dashboardError } = await supabase
            .from('language_dashboards')
            .select('id')
            .eq('user_id', userId)
            .eq('language', language);

          if (dashboardError) {
            console.error('❌ Error fetching language dashboards for filtering:', dashboardError);
            reject(dashboardError);
            return;
          }

          const dashboardIds = dashboardData?.map((d: any) => d.id) || [];
          
          // Filter conversations to only include those with matching language dashboard IDs
          conversations = conversations.filter(conversation => 
            dashboardIds.includes(conversation.language_dashboard_id)
          );
        }

        // Parse JSON fields for each conversation
        const processedConversations = conversations.map(conversation => {
          if (conversation.topics) {
            try {
              conversation.topics = JSON.parse(conversation.topics as any);
            } catch (e) {
              conversation.topics = [];
            }
          }
          
          if (conversation.learning_goals) {
            try {
              conversation.learning_goals = JSON.parse(conversation.learning_goals as any);
            } catch (e) {
              conversation.learning_goals = [];
            }
          }

          if (conversation.progress_data) {
            try {
              conversation.progress_data = JSON.parse(conversation.progress_data as any);
            } catch (e) {
              conversation.progress_data = { goals: [], percentages: [] };
            }
          }
          
          return conversation;
        });
        
        resolve(processedConversations);
      }
    } catch (error) {
      console.error('❌ getUserConversations error:', error);
      reject(error);
    }
  });
}

function getConversationWithMessages(conversationId: number) {
  return new Promise<Conversation | null>(async (resolve, reject) => {
    try {
      if (!supabase) {
        reject(new Error('Supabase client not initialized'));
        return;
      }

      // Get the conversation
      const { data: conversationData, error: conversationError } = await supabase
        .from('conversations')
        .select(`
          *,
          language_dashboards(language)
        `)
        .eq('id', conversationId)
        .single();

      if (conversationError) {
        console.error('❌ Supabase getConversationWithMessages error:', conversationError);
        reject(conversationError);
        return;
      }

      if (!conversationData) {
        resolve(null);
        return;
      }

      // Get the messages for this conversation
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('message_order', { ascending: true });

      if (messagesError) {
        console.error('❌ Error fetching messages:', messagesError);
        reject(messagesError);
        return;
      }

      // Parse JSON fields
      const conversation = conversationData as Conversation;
      if (conversation.topics) {
        try {
          conversation.topics = JSON.parse(conversation.topics as any);
        } catch (e) {
          conversation.topics = [];
        }
      }
      
      if (conversation.learning_goals) {
        try {
          conversation.learning_goals = JSON.parse(conversation.learning_goals as any);
        } catch (e) {
          conversation.learning_goals = [];
        }
      }

      if (conversation.progress_data) {
        try {
          conversation.progress_data = JSON.parse(conversation.progress_data as any);
        } catch (e) {
          conversation.progress_data = { goals: [], percentages: [] };
        }
      }

      // Add messages to conversation
      conversation.messages = messagesData as Message[] || [];

      console.log('✅ Conversation with messages fetched successfully');
      resolve(conversation);
    } catch (error) {
      console.error('❌ getConversationWithMessages error:', error);
      reject(error);
    }
  });
}

function getLatestConversation(userId: number, language?: string) {
  return new Promise<Conversation | null>(async (resolve, reject) => {
    try {
      if (!supabase) {
        reject(new Error('Supabase client not initialized'));
        return;
      }

      let query = supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId);

      // If language is specified, filter by language dashboard IDs
      if (language) {
        // Get all language dashboard IDs for this user and language
        const { data: dashboardData, error: dashboardError } = await supabase
          .from('language_dashboards')
          .select('id')
          .eq('user_id', userId)
          .eq('language', language);

        if (dashboardError) {
          console.error('❌ Error fetching language dashboards for latest conversation:', dashboardError);
          reject(dashboardError);
          return;
        }

        const dashboardIds = dashboardData?.map((d: any) => d.id) || [];
        
        if (dashboardIds.length === 0) {
          resolve(null);
          return;
        }

        query = query.in('language_dashboard_id', dashboardIds);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('❌ Supabase getLatestConversation error:', error);
        reject(error);
      } else {
        if (data) {
          // Parse JSON fields
          const conversation = data as Conversation;
          if (conversation.topics) {
            try {
              conversation.topics = JSON.parse(conversation.topics as any);
            } catch (e) {
              conversation.topics = [];
            }
          }
          
          if (conversation.learning_goals) {
            try {
              conversation.learning_goals = JSON.parse(conversation.learning_goals as any);
            } catch (e) {
              conversation.learning_goals = [];
            }
          }

          if (conversation.progress_data) {
            try {
              conversation.progress_data = JSON.parse(conversation.progress_data as any);
            } catch (e) {
              conversation.progress_data = { goals: [], percentages: [] };
            }
          }
          
          resolve(conversation);
        } else {
          resolve(null);
        }
      }
    } catch (error) {
      console.error('❌ getLatestConversation error:', error);
      reject(error);
    }
  });
}

function updateConversationTitle(conversationId: number, title: string) {
  return new Promise<{ changes: number }>(async (resolve, reject) => {
    try {
      if (!supabase) {
        reject(new Error('Supabase client not initialized'));
        return;
      }

      const { data, error } = await supabase
        .from('conversations')
        .update({ title: title })
        .eq('id', conversationId)
        .select();

      if (error) {
        console.error('❌ Supabase updateConversationTitle error:', error);
        reject(error);
      } else {
        console.log('✅ Conversation title updated successfully');
        resolve({ changes: data ? data.length : 0 });
      }
    } catch (error) {
      console.error('❌ updateConversationTitle error:', error);
      reject(error);
    }
  });
}

function updateConversationSynopsis(conversationId: number, synopsis: string, progressData?: string) {
  return new Promise<{ changes: number }>(async (resolve, reject) => {
    try {
      if (!supabase) {
        reject(new Error('Supabase client not initialized'));
        return;
      }

      const updateData: any = { 
        synopsis: synopsis 
      };

      if (progressData) {
        updateData.progress_data = progressData;
      }

      const { data, error } = await supabase
        .from('conversations')
        .update(updateData)
        .eq('id', conversationId)
        .select();

      if (error) {
        console.error('❌ Supabase updateConversationSynopsis error:', error);
        reject(error);
      } else {
        console.log('✅ Conversation synopsis updated successfully');
        resolve({ changes: data ? data.length : 0 });
      }
    } catch (error) {
      console.error('❌ updateConversationSynopsis error:', error);
      reject(error);
    }
  });
}

function deleteConversation(conversationId: number) {
  return new Promise<{ changes: number }>(async (resolve, reject) => {
    try {
      if (!supabase) {
        reject(new Error('Supabase client not initialized'));
        return;
      }

      // First delete all messages in the conversation
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', conversationId);

      if (messagesError) {
        console.error('❌ Error deleting messages:', messagesError);
        reject(messagesError);
        return;
      }

      // Then delete the conversation
      const { data, error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId)
        .select();

      if (error) {
        console.error('❌ Supabase deleteConversation error:', error);
        reject(error);
      } else {
        console.log('✅ Conversation deleted successfully');
        resolve({ changes: data ? data.length : 0 });
      }
    } catch (error) {
      console.error('❌ deleteConversation error:', error);
      reject(error);
    }
  });
}

function updateConversationPersona(conversationId: number, usesPersona: boolean, personaId?: number) {
  return new Promise<{ changes: number }>(async (resolve, reject) => {
    try {
      if (!supabase) {
        reject(new Error('Supabase client not initialized'));
        return;
      }

      const updateData: any = {
        uses_persona: usesPersona
      };

      if (personaId !== undefined) {
        updateData.persona_id = personaId;
      }

      const { data, error } = await supabase
        .from('conversations')
        .update(updateData)
        .eq('id', conversationId)
        .select();

      if (error) {
        console.error('❌ Supabase updateConversationPersona error:', error);
        reject(error);
      } else {
        console.log('✅ Conversation persona updated successfully');
        resolve({ changes: data ? data.length : 0 });
      }
    } catch (error) {
      console.error('❌ updateConversationPersona error:', error);
      reject(error);
    }
  });
}

// Close database connection
// function closeDatabase() {
//   db.close((err) => {
//     if (err) {
//       console.error('Error closing database:', err.message);
//     } else {
//       console.log('Database connection closed');
//     }
//   });
// }

// Language Dashboard functions
function createLanguageDashboard(userId: number, language: string, proficiencyLevel: string, talkTopics: string[], learningGoals: string[], practicePreference: string, feedbackLanguage: string = 'en', isPrimary: boolean = false) {
  return new Promise<LanguageDashboard>(async (resolve, reject) => {
    try {
      console.log('🔍 DB: createLanguageDashboard called with:', { userId, language, proficiencyLevel, talkTopics, learningGoals, practicePreference, feedbackLanguage, isPrimary });
      
      if (!supabase) {
        console.error('❌ DB: Supabase client not initialized');
        reject(new Error('Supabase client not initialized'));
        return;
      }

      // Convert arrays to JSON strings for database storage
      const { data, error } = await supabase
        .from('language_dashboards')
        .insert({
          user_id: userId,
          language: language,
          proficiency_level: proficiencyLevel,
          talk_topics: JSON.stringify(talkTopics),
          learning_goals: JSON.stringify(learningGoals),
          practice_preference: practicePreference,
          feedback_language: feedbackLanguage,
          speak_speed: 1.0,
          romanization_display: 'both',
          is_primary: isPrimary
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase createLanguageDashboard error:', error);
        reject(error);
      } else {
        console.log('✅ Language dashboard created successfully');
        resolve(data as LanguageDashboard);
      }
    } catch (error) {
      console.error('❌ createLanguageDashboard error:', error);
      reject(error);
    }
  });
}

function getUserLanguageDashboards(userId: number) {
  return new Promise<LanguageDashboard[]>(async (resolve, reject) => {
    try {
      if (!supabase) {
        reject(new Error('Supabase client not initialized'));
        return;
      }

      const { data, error } = await supabase
        .from('language_dashboards')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Supabase getUserLanguageDashboards error:', error);
        reject(error);
      } else {
        // Parse JSON fields for each dashboard
        const dashboards = (data as LanguageDashboard[] || []).map(dashboard => {
          if (dashboard.talk_topics) {
            try {
              dashboard.talk_topics = JSON.parse(dashboard.talk_topics as any);
            } catch (e) {
              dashboard.talk_topics = [];
            }
          }
          
          if (dashboard.learning_goals) {
            try {
              dashboard.learning_goals = JSON.parse(dashboard.learning_goals as any);
            } catch (e) {
              dashboard.learning_goals = [];
            }
          }
          
          return dashboard;
        });
        
        resolve(dashboards);
      }
    } catch (error) {
      console.error('❌ getUserLanguageDashboards error:', error);
      reject(error);
    }
  });
}

function getLanguageDashboard(userId: number, language: string) {
  return new Promise<LanguageDashboard | null>(async (resolve, reject) => {
    try {
      if (!supabase) {
        reject(new Error('Supabase client not initialized'));
        return;
      }

      const { data, error } = await supabase
        .from('language_dashboards')
        .select('*')
        .eq('user_id', userId)
        .eq('language', language)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('❌ Supabase getLanguageDashboard error:', error);
        reject(error);
      } else {
        if (data) {
          // Parse JSON fields
          const dashboard = data as LanguageDashboard;
          if (dashboard.talk_topics) {
            try {
              dashboard.talk_topics = JSON.parse(dashboard.talk_topics as any);
            } catch (e) {
              dashboard.talk_topics = [];
            }
          }
          
          if (dashboard.learning_goals) {
            try {
              dashboard.learning_goals = JSON.parse(dashboard.learning_goals as any);
            } catch (e) {
              dashboard.learning_goals = [];
            }
          }
          
          resolve(dashboard);
        } else {
          resolve(null);
        }
      }
    } catch (error) {
      console.error('❌ getLanguageDashboard error:', error);
      reject(error);
    }
  });
}

function updateLanguageDashboard(userId: number, language: string, updates: Partial<LanguageDashboard>) {
  return new Promise<{ changes: number }>(async (resolve, reject) => {
    try {
      if (!supabase) {
        reject(new Error('Supabase client not initialized'));
        return;
      }

      // Handle JSON fields
      const processedUpdates: any = { ...updates };
      if (processedUpdates.talk_topics) {
        processedUpdates.talk_topics = JSON.stringify(processedUpdates.talk_topics);
      }
      if (processedUpdates.learning_goals) {
        processedUpdates.learning_goals = JSON.stringify(processedUpdates.learning_goals);
      }

      const { data, error } = await supabase
        .from('language_dashboards')
        .update(processedUpdates)
        .eq('user_id', userId)
        .eq('language', language)
        .select();

      if (error) {
        console.error('❌ Supabase updateLanguageDashboard error:', error);
        reject(error);
      } else {
        console.log('✅ Language dashboard updated successfully');
        resolve({ changes: data ? data.length : 0 });
      }
    } catch (error) {
      console.error('❌ updateLanguageDashboard error:', error);
      reject(error);
    }
  });
}

function deleteLanguageDashboard(userId: number, language: string) {
  return new Promise<{ changes: number }>(async (resolve, reject) => {
    try {
      if (!supabase) {
        reject(new Error('Supabase client not initialized'));
        return;
      }

      const { data, error } = await supabase
        .from('language_dashboards')
        .delete()
        .eq('user_id', userId)
        .eq('language', language)
        .select();

      if (error) {
        console.error('❌ Supabase deleteLanguageDashboard error:', error);
        reject(error);
      } else {
        console.log('✅ Language dashboard deleted successfully');
        resolve({ changes: data ? data.length : 0 });
      }
    } catch (error) {
      console.error('❌ deleteLanguageDashboard error:', error);
      reject(error);
    }
  });
}

function getUserStreak(userId: number, language: string) {
  return new Promise<{ streak: number }>(async (resolve, reject) => {
    try {
      if (!supabase) {
        reject(new Error('Supabase client not initialized'));
        return;
      }

      // First, get the language dashboard IDs for this user and language
      const { data: dashboardData, error: dashboardError } = await supabase
        .from('language_dashboards')
        .select('id')
        .eq('user_id', userId)
        .eq('language', language);

      if (dashboardError) {
        console.error('❌ Error fetching language dashboards for streak:', dashboardError);
        reject(dashboardError);
        return;
      }

      const dashboardIds = dashboardData?.map((d: any) => d.id) || [];
      
      if (dashboardIds.length === 0) {
        resolve({ streak: 0 });
        return;
      }

      // Get conversations for this user that match the language dashboard IDs
      const { data: conversations, error: conversationsError } = await supabase
        .from('conversations')
        .select('id, created_at')
        .eq('user_id', userId)
        .in('language_dashboard_id', dashboardIds)
        .order('created_at', { ascending: false });

      if (conversationsError) {
        console.error('❌ Error fetching conversations for streak:', conversationsError);
        reject(conversationsError);
        return;
      }

      if (!conversations || conversations.length === 0) {
        resolve({ streak: 0 });
        return;
      }

      // Calculate streak based on consecutive days with conversations
      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get unique dates from conversations (sorted by date, newest first)
      const conversationDates = conversations.map((conv: any) => {
        const date = new Date(conv.created_at);
        date.setHours(0, 0, 0, 0);
        return date;
      });

      // Remove duplicates and sort by date (newest first)
      const uniqueDates = [...new Set(conversationDates.map((d: Date) => d.getTime()))]
        .map((time: unknown) => new Date(time as number))
        .sort((a, b) => b.getTime() - a.getTime());

      // Calculate consecutive days starting from today
      let currentDate = new Date(today);
      let consecutiveDays = 0;

      for (let i = 0; i < uniqueDates.length; i++) {
        const conversationDate = uniqueDates[i];
        const daysDiff = Math.floor((currentDate.getTime() - conversationDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === consecutiveDays) {
          // This conversation is from the expected consecutive day
          consecutiveDays++;
          currentDate.setDate(currentDate.getDate() - 1); // Move to previous day
        } else if (daysDiff < consecutiveDays) {
          // This conversation is from a future date (shouldn't happen with sorted data)
          continue;
        } else {
          // Gap found, streak is broken
          break;
        }
      }

      streak = consecutiveDays;

      console.log('✅ User streak calculated:', streak);
      resolve({ streak });
    } catch (error) {
      console.error('❌ getUserStreak error:', error);
      reject(error);
    }
  });
}

// Persona functions
function createPersona(userId: number, personaData: {
  name: string;
  description?: string;
  topics: string[];
  formality: string;
  language: string;
  conversationId?: string;
}) {
  return new Promise<Persona>(async (resolve, reject) => {
    try {
      if (!supabase) {
        reject(new Error('Supabase client not initialized'));
        return;
      }

      const { data, error } = await supabase
        .from('personas')
        .insert({
          user_id: userId,
          name: personaData.name,
          description: personaData.description,
          topics: personaData.topics,
          formality: personaData.formality,
          language: personaData.language,
          conversation_id: personaData.conversationId
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase createPersona error:', error);
        reject(error);
      } else {
        console.log('✅ Persona created successfully');
        resolve(data as Persona);
      }
    } catch (error) {
      console.error('❌ createPersona error:', error);
      reject(error);
    }
  });
}

function getUserPersonas(userId: number) {
  return new Promise<Persona[]>(async (resolve, reject) => {
    try {
      if (!supabase) {
        reject(new Error('Supabase client not initialized'));
        return;
      }

      const { data, error } = await supabase
        .from('personas')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Supabase getUserPersonas error:', error);
        reject(error);
      } else {
        // Parse JSON fields for each persona
        const personas = (data as Persona[] || []).map(persona => {
          if (persona.topics) {
            try {
              persona.topics = JSON.parse(persona.topics as any);
            } catch (e) {
              persona.topics = [];
            }
          }
          return persona;
        });
        
        resolve(personas);
      }
    } catch (error) {
      console.error('❌ getUserPersonas error:', error);
      reject(error);
    }
  });
}

function deletePersona(personaId: number) {
  return new Promise<{ changes: number }>(async (resolve, reject) => {
    try {
      if (!supabase) {
        reject(new Error('Supabase client not initialized'));
        return;
      }

      const { data, error } = await supabase
        .from('personas')
        .delete()
        .eq('id', personaId)
        .select();

      if (error) {
        console.error('❌ Supabase deletePersona error:', error);
        reject(error);
      } else {
        console.log('✅ Persona deleted successfully');
        resolve({ changes: data ? data.length : 0 });
      }
    } catch (error) {
      console.error('❌ deletePersona error:', error);
      reject(error);
    }
  });
}

export {
  // db,
  createUser,
  findUserByGoogleId,
  findUserByEmail,
  findUserById,
  updateUser,
  saveSession,
  getSession,
  getAllSessions,
  // closeDatabase,
  getAllUsers,
  // New conversation functions
  createConversation,
  addMessage,
  getUserConversations,
  getConversationWithMessages,
  getLatestConversation,
  updateConversationTitle,
  updateConversationSynopsis,
  deleteConversation,
  updateConversationPersona,
  // Language Dashboard functions
  createLanguageDashboard,
  getUserLanguageDashboards,
  getLanguageDashboard,
  updateLanguageDashboard,
  deleteLanguageDashboard,
  getUserStreak,
  // Persona functions
  createPersona,
  getUserPersonas,
  deletePersona
}; 