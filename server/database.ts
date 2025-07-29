import sqlite3 from 'sqlite3';
import path from 'path';

export interface User {
  id: number;
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
  message_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender: string;
  text: string;
  message_type?: string;
  audio_file_path?: string;
  detailed_feedback?: string;
  message_order: number;
  created_at: string;
}

// Database file path
const dbPath = path.join(__dirname, 'users.db');
console.log('USING DATABASE FILE:', dbPath);

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initDatabase();
  }
});

// Initialize database tables
function initDatabase() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        google_id TEXT,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        password_hash TEXT,
        role TEXT DEFAULT 'user',
        target_language TEXT,
        proficiency_level TEXT,
        talk_topics TEXT,
        learning_goals TEXT,
        practice_preference TEXT,
        motivation TEXT,
        onboarding_complete BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS language_dashboards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        language TEXT NOT NULL,
        proficiency_level TEXT,
        talk_topics TEXT,
        learning_goals TEXT,
        practice_preference TEXT,
        feedback_language TEXT,
        speak_speed REAL DEFAULT 1.0,
        is_primary BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        UNIQUE(user_id, language)
      )
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        language_dashboard_id INTEGER NOT NULL,
        title TEXT,
        topics TEXT,
        formality TEXT,
        message_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (language_dashboard_id) REFERENCES language_dashboards (id)
      )
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id INTEGER NOT NULL,
        sender TEXT NOT NULL,
        text TEXT NOT NULL,
        message_type TEXT DEFAULT 'text',
        audio_file_path TEXT,
        detailed_feedback TEXT,
        message_order INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES conversations (id)
      )
    `);
    
    // Add any missing columns to existing tables
    addColumnsIfNotExist();
  });
}

// Add new columns to existing databases
function addColumnsIfNotExist() {
  const newColumns = [
    'ALTER TABLE users ADD COLUMN target_language TEXT',
    'ALTER TABLE users ADD COLUMN proficiency_level TEXT',
    'ALTER TABLE users ADD COLUMN talk_topics TEXT',
    'ALTER TABLE users ADD COLUMN learning_goals TEXT',
    'ALTER TABLE users ADD COLUMN practice_preference TEXT',
    'ALTER TABLE users ADD COLUMN motivation TEXT',
    'ALTER TABLE users ADD COLUMN onboarding_complete BOOLEAN DEFAULT FALSE',
    'ALTER TABLE conversations ADD COLUMN topics TEXT',
    'ALTER TABLE conversations ADD COLUMN language_dashboard_id INTEGER',
    'ALTER TABLE messages ADD COLUMN detailed_feedback TEXT',
    'ALTER TABLE language_dashboards ADD COLUMN feedback_language TEXT',
    'ALTER TABLE conversations ADD COLUMN formality TEXT',
    'ALTER TABLE language_dashboards ADD COLUMN speak_speed REAL DEFAULT 1.0'
  ];
  
  newColumns.forEach(sql => {
    db.run(sql, (err) => {
      // Ignore errors for columns that already exist
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding column:', err.message);
      }
    });
  });
}

// User functions
function createUser(userData: Partial<User>) {
  return new Promise<User>((resolve, reject) => {
    const googleId = userData.googleId || userData.google_id;
    const passwordHash = userData.passwordHash || userData.password_hash;
    const { email, name, role = 'user' } = userData;
    
    const sql = `
      INSERT OR REPLACE INTO users (google_id, email, name, password_hash, role, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;
    
    db.run(sql, [googleId, email, name, passwordHash, role], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, ...userData } as User);
      }
    });
  });
}

function findUserByGoogleId(googleId: string) {
  return new Promise<User | null>((resolve, reject) => {
    const sql = 'SELECT * FROM users WHERE google_id = ?';
    
    db.get(sql, [googleId], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row ? (row as User) : null);
      }
    });
  });
}

function findUserByEmail(email: string) {
  return new Promise<User | null>((resolve, reject) => {
    const sql = 'SELECT * FROM users WHERE email = ?';
    
    db.get(sql, [email], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row ? (row as User) : null);
      }
    });
  });
}

function findUserById(id: number) {
  return new Promise<User | null>((resolve, reject) => {
    const sql = 'SELECT * FROM users WHERE id = ?';
    
    db.get(sql, [id], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row ? (row as User) : null);
      }
    });
  });
}

function updateUser(id: number, updates: Partial<User>) {
  return new Promise<{ changes: number }>((resolve, reject) => {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    
    const sql = `UPDATE users SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    
    db.run(sql, [...values, id], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ changes: this.changes });
      }
    });
  });
}

// Session functions
function saveSession(userId: number, chatHistory: any[], language: string = 'en') {
  return new Promise<{ id: number }>((resolve, reject) => {
    const sql = `
      INSERT OR REPLACE INTO sessions (user_id, chat_history, language, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `;
    
    db.run(sql, [userId, JSON.stringify(chatHistory), language], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID });
      }
    });
  });
}

function getSession(userId: number) {
  return new Promise<Session | null>((resolve, reject) => {
    const sql = 'SELECT * FROM sessions WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1';
    
    db.get(sql, [userId], (err, row) => {
      if (err) {
        reject(err);
      } else {
        if (row) {
          (row as Session).chat_history = JSON.parse((row as Session).chat_history as any);
        }
        resolve(row ? (row as Session) : null);
      }
    });
  });
}

function getAllSessions(userId: number) {
  return new Promise<Session[]>((resolve, reject) => {
    const sql = 'SELECT * FROM sessions WHERE user_id = ? ORDER BY created_at DESC';
    
    db.all(sql, [userId], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        (rows as Session[]).forEach(row => {
          (row as Session).chat_history = JSON.parse((row as Session).chat_history as any);
        });
        resolve(rows as Session[]);
      }
    });
  });
}

function getAllUsers() {
  return new Promise<User[]>((resolve, reject) => {
    const sql = 'SELECT * FROM users ORDER BY created_at DESC';
    db.all(sql, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve((rows as User[]));
      }
    });
  });
}

// Conversation functions
function createConversation(userId: number, language: string, title?: string, topics?: string[], formality?: string) {
  return new Promise<{ id: number }>((resolve, reject) => {
    console.log('🗄️ DATABASE: Creating conversation:', { userId, language, title, topics, formality });
    
    const topicsJson = topics ? JSON.stringify(topics) : null;
    
    // First, get the language dashboard ID for this user and language
    const getDashboardSql = `SELECT id FROM language_dashboards WHERE user_id = ? AND language = ?`;
    
    db.get(getDashboardSql, [userId, language], (err, dashboard) => {
      if (err) {
        console.error('❌ DATABASE: Error getting language dashboard:', err);
        reject(err);
      } else if (!dashboard) {
        console.error('❌ DATABASE: Language dashboard not found for user:', userId, 'language:', language);
        reject(new Error('Language dashboard not found'));
      } else {
        const sql = `
          INSERT INTO conversations (user_id, language_dashboard_id, title, topics, formality)
          VALUES (?, ?, ?, ?, ?)
        `;
        
        db.run(sql, [userId, (dashboard as { id: number }).id, title, topicsJson, formality], function(err) {
          if (err) {
            console.error('❌ DATABASE: Error creating conversation:', err);
            reject(err);
          } else {
            console.log('✅ DATABASE: Conversation created successfully:', { 
              id: this.lastID, 
              user_id: userId, 
              language_dashboard_id: (dashboard as { id: number }).id,
              title,
              topics: topicsJson,
              formality,
            });
            resolve({ id: this.lastID });
          }
        });
      }
    });
  });
}

function addMessage(
  conversationId: number,
  sender: string,
  text: string,
  messageType: string = 'text',
  audioFilePath?: string,
  detailedFeedback?: string,
  messageOrder?: number // <-- add this parameter
) {
  return new Promise<{ id: number }>((resolve, reject) => {
    console.log('🗄️ DATABASE: Adding message:', { 
      conversationId, 
      sender, 
      text: text.substring(0, 50) + (text.length > 50 ? '...' : ''), 
      messageType, 
      audioFilePath,
      messageOrder
    });

    // If messageOrder is provided, use it; otherwise, auto-increment
    const getOrder = (cb: (order: number) => void) => {
      if (typeof messageOrder === 'number') {
        cb(messageOrder);
      } else {
        const getOrderSql = `
          SELECT COALESCE(MAX(message_order), 0) + 1 as next_order
          FROM messages WHERE conversation_id = ?
        `;
        db.get(getOrderSql, [conversationId], (err, row) => {
          if (err) {
            console.error('❌ DATABASE: Error getting message order:', err);
            reject(err);
          } else {
            cb((row as { next_order: number }).next_order);
          }
        });
      }
    };

    getOrder((finalOrder) => {
      const insertSql = `
        INSERT INTO messages (conversation_id, sender, text, message_type, audio_file_path, detailed_feedback, message_order)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      db.run(insertSql, [conversationId, sender, text, messageType, audioFilePath, detailedFeedback, finalOrder], function(err) {
        if (err) {
          console.error('❌ DATABASE: Error inserting message:', err);
          reject(err);
        } else {
          console.log('✅ DATABASE: Message inserted successfully:', { 
            id: this.lastID, 
            conversationId, 
            sender, 
            messageOrder: finalOrder
          });
          // Update conversation message count
          const updateSql = `
            UPDATE conversations 
            SET message_count = message_count + 1, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `;
          db.run(updateSql, [conversationId], (err) => {
            if (err) {
              console.error('❌ DATABASE: Error updating conversation message count:', err);
              reject(err);
            } else {
              console.log('✅ DATABASE: Conversation message count updated for ID:', conversationId);
              resolve({ id: this.lastID });
            }
          });
        }
      });
    });
  });
}

function getUserConversations(userId: number, language?: string) {
  return new Promise<Conversation[]>((resolve, reject) => {
    let sql: string;
    let params: any[];
    
    if (language) {
      // Get conversations for specific language dashboard
      sql = `
        SELECT c.id, c.title, ld.language, c.message_count, c.created_at, c.updated_at
        FROM conversations c
        JOIN language_dashboards ld ON c.language_dashboard_id = ld.id
        WHERE c.user_id = ? AND ld.language = ?
        ORDER BY c.updated_at DESC
      `;
      params = [userId, language];
    } else {
      // Get all conversations for user
      sql = `
        SELECT c.id, c.title, ld.language, c.message_count, c.created_at, c.updated_at
        FROM conversations c
        JOIN language_dashboards ld ON c.language_dashboard_id = ld.id
        WHERE c.user_id = ?
        ORDER BY c.updated_at DESC
      `;
      params = [userId];
    }
    
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve((rows as Conversation[]));
      }
    });
  });
}

function getConversationWithMessages(conversationId: number) {
  return new Promise<Conversation & { messages: Message[] } | null>((resolve, reject) => {
    console.log('🗄️ DATABASE: Getting conversation with messages:', conversationId);
    const conversationSql = `
      SELECT c.*, u.name as user_name, ld.language
      FROM conversations c
      JOIN users u ON c.user_id = u.id
      JOIN language_dashboards ld ON c.language_dashboard_id = ld.id
      WHERE c.id = ?
    `;
    
    const messagesSql = `
      SELECT id, sender, text, message_type, audio_file_path, detailed_feedback, message_order, created_at
      FROM messages 
      WHERE conversation_id = ?
      ORDER BY message_order
    `;
    
    db.get(conversationSql, [conversationId], (err, conversation) => {
      if (err) {
        console.error('❌ DATABASE: Error getting conversation:', err);
        reject(err);
      } else if (conversation) {
        const conv = conversation as Conversation;
        console.log('✅ DATABASE: Conversation found:', {
          id: conv.id,
          title: conv.title,
          message_count: conv.message_count
        });
        console.log('🔍 DATABASE: Executing message query with conversationId:', conversationId, 'type:', typeof conversationId);
        db.all(messagesSql, [conversationId], (err, messages) => {
          if (err) {
            console.error('❌ DATABASE: Error getting messages:', err);
            reject(err);
          } else {
            console.log('📋 DATABASE: Found', messages.length, 'messages for conversation', conversationId);
            if ((messages as Message[]).length > 0) {
              console.log('📝 DATABASE: Sample messages:', (messages as Message[]).slice(0, 2).map((m: any) => ({
                id: m.id,
                sender: m.sender,
                text: m.text.substring(0, 50) + '...',
                message_order: m.message_order
              })));
            } else {
              // If no messages found, let's check if there are any messages in the database at all
              console.log('🔍 DATABASE: No messages found, checking all messages in database...');
              db.all('SELECT conversation_id, COUNT(*) as count FROM messages GROUP BY conversation_id', [], (err, allMessages) => {
                if (!err) {
                  console.log('📊 DATABASE: All messages by conversation:', allMessages);
                }
              });
            }
            // Parse topics from JSON if present
            const conv = conversation as Conversation;
            const parsedConversation = {
              ...conv,
              topics: (conv as any).topics ? JSON.parse((conv as any).topics) : null,
              formality: (conv as any).formality,
              messages: messages as Message[]
            };
            resolve(parsedConversation as Conversation & { messages: Message[] });
          }
        });
      } else {
        console.log('❌ DATABASE: Conversation not found:', conversationId);
        resolve(null);
      }
    });
  });
}

function getLatestConversation(userId: number, language?: string) {
  return new Promise<Conversation & { messages: Message[] } | null>((resolve, reject) => {
    let sql: string;
    let params: any[];
    
    if (language) {
      sql = `
        SELECT c.id FROM conversations c
        JOIN language_dashboards ld ON c.language_dashboard_id = ld.id
        WHERE c.user_id = ? AND ld.language = ?
        ORDER BY c.updated_at DESC 
        LIMIT 1
      `;
      params = [userId, language];
    } else {
      sql = `
        SELECT id FROM conversations 
        WHERE user_id = ? 
        ORDER BY updated_at DESC 
        LIMIT 1
      `;
      params = [userId];
    }
    
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else if (row) {
        // Get the full conversation with messages
        getConversationWithMessages((row as { id: number }).id).then(resolve).catch(reject);
      } else {
        resolve(null);
      }
    });
  });
}

function updateConversationTitle(conversationId: number, title: string) {
  return new Promise<{ changes: number }>((resolve, reject) => {
    const sql = `
      UPDATE conversations 
      SET title = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    db.run(sql, [title, conversationId], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ changes: this.changes });
      }
    });
  });
}

function deleteConversation(conversationId: number) {
  return new Promise<{ changes: number }>((resolve, reject) => {
    // First delete all messages in the conversation
    const deleteMessagesSql = `DELETE FROM messages WHERE conversation_id = ?`;
    
    db.run(deleteMessagesSql, [conversationId], (err) => {
      if (err) {
        reject(err);
      } else {
        // Then delete the conversation
        const deleteConversationSql = `DELETE FROM conversations WHERE id = ?`;
        
        db.run(deleteConversationSql, [conversationId], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ changes: this.changes });
          }
        });
      }
    });
  });
}

// Close database connection
function closeDatabase() {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed');
    }
  });
}

// Language Dashboard functions
function createLanguageDashboard(userId: number, language: string, proficiencyLevel: string, talkTopics: string[], learningGoals: string[], practicePreference: string, feedbackLanguage: string = 'en', isPrimary: boolean = false) {
  return new Promise<LanguageDashboard>((resolve, reject) => {
    const topicsJson = talkTopics ? JSON.stringify(talkTopics) : null;
    const goalsJson = learningGoals ? JSON.stringify(learningGoals) : null;
    
    const sql = `
      INSERT INTO language_dashboards (user_id, language, proficiency_level, talk_topics, learning_goals, practice_preference, feedback_language, speak_speed, is_primary)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.run(sql, [userId, language, proficiencyLevel, topicsJson, goalsJson, practicePreference, feedbackLanguage, 1.0, isPrimary], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ 
          id: this.lastID, 
          user_id: userId, 
          language, 
          proficiency_level: proficiencyLevel, 
          talk_topics: talkTopics, 
          learning_goals: learningGoals, 
          practice_preference: practicePreference, 
          feedback_language: feedbackLanguage,
          speak_speed: 1.0,
          is_primary: isPrimary 
        });
      }
    });
  });
}

function getUserLanguageDashboards(userId: number) {
  return new Promise<LanguageDashboard[]>((resolve, reject) => {
    const sql = `
      SELECT id, language, proficiency_level, talk_topics, learning_goals, practice_preference, feedback_language, speak_speed, is_primary, created_at, updated_at
      FROM language_dashboards 
      WHERE user_id = ?
      ORDER BY is_primary DESC, created_at ASC
    `;
    
    db.all(sql, [userId], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        const dashboards = (rows as LanguageDashboard[]).map(row => ({
          ...row,
          talk_topics: (row as any).talk_topics ? JSON.parse((row as any).talk_topics) : [],
          learning_goals: (row as any).learning_goals ? JSON.parse((row as any).learning_goals) : []
        }));
        resolve(dashboards as LanguageDashboard[]);
      }
    });
  });
}

function getLanguageDashboard(userId: number, language: string) {
  return new Promise<LanguageDashboard | null>((resolve, reject) => {
    const sql = `
      SELECT id, language, proficiency_level, talk_topics, learning_goals, practice_preference, feedback_language, speak_speed, is_primary, created_at, updated_at
      FROM language_dashboards 
      WHERE user_id = ? AND language = ?
    `;
    
    db.get(sql, [userId, language], (err, row) => {
      if (err) {
        reject(err);
      } else if (row) {
        const dash = row as LanguageDashboard;
        const dashboard = {
          ...dash,
          talk_topics: (dash as any).talk_topics ? JSON.parse((dash as any).talk_topics) : [],
          learning_goals: (dash as any).learning_goals ? JSON.parse((dash as any).learning_goals) : []
        };
        resolve(dashboard as LanguageDashboard);
      } else {
        resolve(null);
      }
    });
  });
}

function updateLanguageDashboard(userId: number, language: string, updates: Partial<LanguageDashboard>) {
  return new Promise<{ changes: number }>((resolve, reject) => {
    const processedUpdates = { ...updates };
    
    // Convert arrays to JSON strings if present
    if (processedUpdates.talk_topics && Array.isArray(processedUpdates.talk_topics)) {
      processedUpdates.talk_topics = JSON.stringify(processedUpdates.talk_topics) as unknown as string[];
    }
    if (processedUpdates.learning_goals && Array.isArray(processedUpdates.learning_goals)) {
      processedUpdates.learning_goals = JSON.stringify(processedUpdates.learning_goals) as unknown as string[];
    }
    
    const fields = Object.keys(processedUpdates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(processedUpdates);
    
    const sql = `UPDATE language_dashboards SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND language = ?`;
    
    db.run(sql, [...values, userId, language], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ changes: this.changes });
      }
    });
  });
}

function deleteLanguageDashboard(userId: number, language: string) {
  return new Promise<{ changes: number }>((resolve, reject) => {
    // First, delete all conversations and messages for this dashboard
    const getConversationsSql = `SELECT id FROM conversations WHERE user_id = ? AND language_dashboard_id = (SELECT id FROM language_dashboards WHERE user_id = ? AND language = ?)`;
    
    db.all(getConversationsSql, [userId, userId, language], (err, conversations) => {
      if (err) {
        reject(err);
      } else {
        const conversationIds = (conversations as { id: number }[]).map(c => c.id);
        
        if (conversationIds.length > 0) {
          const deleteMessagesSql = `DELETE FROM messages WHERE conversation_id IN (${conversationIds.map(() => '?').join(',')})`;
          db.run(deleteMessagesSql, conversationIds, (err) => {
            if (err) {
              reject(err);
            } else {
              const deleteConversationsSql = `DELETE FROM conversations WHERE id IN (${conversationIds.map(() => '?').join(',')})`;
              db.run(deleteConversationsSql, conversationIds, (err) => {
                if (err) {
                  reject(err);
                } else {
                  // Finally delete the dashboard
                  const deleteDashboardSql = `DELETE FROM language_dashboards WHERE user_id = ? AND language = ?`;
                  db.run(deleteDashboardSql, [userId, language], function(err) {
                    if (err) {
                      reject(err);
                    } else {
                      resolve({ changes: this.changes });
                    }
                  });
                }
              });
            }
          });
        } else {
          // No conversations, just delete the dashboard
          const deleteDashboardSql = `DELETE FROM language_dashboards WHERE user_id = ? AND language = ?`;
          db.run(deleteDashboardSql, [userId, language], function(err) {
            if (err) {
              reject(err);
            } else {
              resolve({ changes: this.changes });
            }
          });
        }
      }
    });
  });
}

function getUserStreak(userId: number, language: string) {
  return new Promise<{ streak: number; last_active: string | null; days: string[] }>((resolve, reject) => {
    // Get all user messages for the language, grouped by date
    const sql = `
      SELECT DATE(m.created_at) as day
      FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      JOIN language_dashboards ld ON c.language_dashboard_id = ld.id
      WHERE c.user_id = ? AND ld.language = ? AND m.sender = 'User'
      GROUP BY day
      ORDER BY day DESC
    `;
    db.all(sql, [userId, language], (err, rows) => {
      if (err) return reject(err);
      const days = (rows as { day: string }[]).map(r => r.day);
      console.log('[STREAK DEBUG] User:', userId, 'Language:', language);
      console.log('[STREAK DEBUG] Message days:', days);
      if (days.length === 0) {
        console.log('[STREAK DEBUG] No days found, streak is 0');
        return resolve({ streak: 0, last_active: null, days: [] });
      }

      // Calculate streak in US Eastern Time by comparing date strings
      const tz = 'America/New_York';
      const now = new Date();
      let streak = 0;
      let lastActive = null;
      for (let i = 0; i < days.length; i++) {
        if (i === 0) lastActive = days[i];
        // Calculate expected date string for streak
        const expectedDate = new Date(now);
        expectedDate.setDate(expectedDate.getDate() - streak);
        const expectedStr = expectedDate.toLocaleDateString('en-CA', { timeZone: tz }); // 'YYYY-MM-DD'
        console.log(`[STREAK DEBUG] Comparing day: ${days[i]} to expected: ${expectedStr}`);
        if (days[i] === expectedStr) {
          streak++;
        } else {
          break;
        }
      }
      console.log('[STREAK DEBUG] Final streak:', streak, 'Last active:', lastActive);
      resolve({ streak, last_active: lastActive, days });
    });
  });
}

export {
  db,
  createUser,
  findUserByGoogleId,
  findUserByEmail,
  findUserById,
  updateUser,
  saveSession,
  getSession,
  getAllSessions,
  closeDatabase,
  getAllUsers,
  // New conversation functions
  createConversation,
  addMessage,
  getUserConversations,
  getConversationWithMessages,
  getLatestConversation,
  updateConversationTitle,
  deleteConversation,
  // Language Dashboard functions
  createLanguageDashboard,
  getUserLanguageDashboards,
  getLanguageDashboard,
  updateLanguageDashboard,
  deleteLanguageDashboard,
  getUserStreak
}; 