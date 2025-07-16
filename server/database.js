const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database file path
const dbPath = path.join(__dirname, 'users.db');

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
  // Create users table
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      google_id TEXT UNIQUE,
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
  `;

  // Create sessions table for chat history
  const createSessionsTable = `
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      chat_history TEXT,
      language TEXT DEFAULT 'en',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `;

  // Create language_dashboards table
  const createLanguageDashboardsTable = `
    CREATE TABLE IF NOT EXISTS language_dashboards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      language TEXT NOT NULL,
      proficiency_level TEXT,
      talk_topics TEXT,
      learning_goals TEXT,
      practice_preference TEXT,
      is_primary BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      UNIQUE(user_id, language)
    )
  `;

  // Create conversations table (now tied to language dashboards)
  const createConversationsTable = `
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      language_dashboard_id INTEGER NOT NULL,
      title TEXT,
      topics TEXT,
      message_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (language_dashboard_id) REFERENCES language_dashboards (id)
    )
  `;

  // Create messages table
  const createMessagesTable = `
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
  `;

  db.serialize(() => {
    db.run(createUsersTable, (err) => {
      if (err) {
        console.error('Error creating users table:', err.message);
      } else {
        console.log('Users table ready');
        // Add new columns if they don't exist (for existing databases)
        addColumnsIfNotExist();
      }
    });

    db.run(createSessionsTable, (err) => {
      if (err) {
        console.error('Error creating sessions table:', err.message);
      } else {
        console.log('Sessions table ready');
      }
    });

    db.run(createLanguageDashboardsTable, (err) => {
      if (err) {
        console.error('Error creating language_dashboards table:', err.message);
      } else {
        console.log('Language dashboards table ready');
      }
    });

    db.run(createConversationsTable, (err) => {
      if (err) {
        console.error('Error creating conversations table:', err.message);
      } else {
        console.log('Conversations table ready');
      }
    });

    db.run(createMessagesTable, (err) => {
      if (err) {
        console.error('Error creating messages table:', err.message);
      } else {
        console.log('Messages table ready');
      }
    });
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
    'ALTER TABLE messages ADD COLUMN detailed_feedback TEXT'
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
function createUser(userData) {
  return new Promise((resolve, reject) => {
    const { googleId, email, name, passwordHash, role = 'user' } = userData;
    
    const sql = `
      INSERT OR REPLACE INTO users (google_id, email, name, password_hash, role, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;
    
    db.run(sql, [googleId, email, name, passwordHash, role], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, ...userData });
      }
    });
  });
}

function findUserByGoogleId(googleId) {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM users WHERE google_id = ?';
    
    db.get(sql, [googleId], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function findUserByEmail(email) {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM users WHERE email = ?';
    
    db.get(sql, [email], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function findUserById(id) {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM users WHERE id = ?';
    
    db.get(sql, [id], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function updateUser(id, updates) {
  return new Promise((resolve, reject) => {
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
function saveSession(userId, chatHistory, language = 'en') {
  return new Promise((resolve, reject) => {
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

function getSession(userId) {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM sessions WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1';
    
    db.get(sql, [userId], (err, row) => {
      if (err) {
        reject(err);
      } else {
        if (row) {
          row.chat_history = JSON.parse(row.chat_history);
        }
        resolve(row);
      }
    });
  });
}

function getAllSessions(userId) {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM sessions WHERE user_id = ? ORDER BY created_at DESC';
    
    db.all(sql, [userId], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        rows.forEach(row => {
          row.chat_history = JSON.parse(row.chat_history);
        });
        resolve(rows);
      }
    });
  });
}

function getAllUsers() {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM users ORDER BY created_at DESC';
    db.all(sql, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Conversation functions
function createConversation(userId, language, title = null, topics = null) {
  return new Promise((resolve, reject) => {
    console.log('🗄️ DATABASE: Creating conversation:', { userId, language, title, topics });
    
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
          INSERT INTO conversations (user_id, language_dashboard_id, title, topics)
          VALUES (?, ?, ?, ?)
        `;
        
        db.run(sql, [userId, dashboard.id, title, topicsJson], function(err) {
          if (err) {
            console.error('❌ DATABASE: Error creating conversation:', err);
            reject(err);
          } else {
            console.log('✅ DATABASE: Conversation created successfully:', { 
              id: this.lastID, 
              user_id: userId, 
              language_dashboard_id: dashboard.id,
              title,
              topics: topicsJson
            });
            resolve({ id: this.lastID });
          }
        });
      }
    });
  });
}

function addMessage(conversationId, sender, text, messageType = 'text', audioFilePath = null, detailedFeedback = null) {
  return new Promise((resolve, reject) => {
    console.log('🗄️ DATABASE: Adding message:', { 
      conversationId, 
      sender, 
      text: text.substring(0, 50) + (text.length > 50 ? '...' : ''), 
      messageType, 
      audioFilePath 
    });
    
    // Get the next message order
    const getOrderSql = `
      SELECT COALESCE(MAX(message_order), 0) + 1 as next_order
      FROM messages WHERE conversation_id = ?
    `;
    
    db.get(getOrderSql, [conversationId], (err, row) => {
      if (err) {
        console.error('❌ DATABASE: Error getting message order:', err);
        reject(err);
      } else {
        const messageOrder = row.next_order;
        console.log('📝 DATABASE: Message order:', messageOrder);
        
        const insertSql = `
          INSERT INTO messages (conversation_id, sender, text, message_type, audio_file_path, detailed_feedback, message_order)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        db.run(insertSql, [conversationId, sender, text, messageType, audioFilePath, detailedFeedback, messageOrder], function(err) {
          if (err) {
            console.error('❌ DATABASE: Error inserting message:', err);
            reject(err);
          } else {
            console.log('✅ DATABASE: Message inserted successfully:', { 
              id: this.lastID, 
              conversationId, 
              sender, 
              messageOrder 
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
      }
    });
  });
}

function getUserConversations(userId, language = null) {
  return new Promise((resolve, reject) => {
    let sql, params;
    
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
        resolve(rows);
      }
    });
  });
}

function getConversationWithMessages(conversationId) {
  return new Promise((resolve, reject) => {
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
        console.log('✅ DATABASE: Conversation found:', {
          id: conversation.id,
          title: conversation.title,
          message_count: conversation.message_count
        });
        console.log('🔍 DATABASE: Executing message query with conversationId:', conversationId, 'type:', typeof conversationId);
        db.all(messagesSql, [conversationId], (err, messages) => {
          if (err) {
            console.error('❌ DATABASE: Error getting messages:', err);
            reject(err);
          } else {
            console.log('📋 DATABASE: Found', messages.length, 'messages for conversation', conversationId);
            if (messages.length > 0) {
              console.log('📝 DATABASE: Sample messages:', messages.slice(0, 2).map(m => ({
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
            const parsedConversation = {
              ...conversation,
              topics: conversation.topics ? JSON.parse(conversation.topics) : null,
              messages: messages
            };
            resolve(parsedConversation);
          }
        });
      } else {
        console.log('❌ DATABASE: Conversation not found:', conversationId);
        resolve(null);
      }
    });
  });
}

function getLatestConversation(userId, language = null) {
  return new Promise((resolve, reject) => {
    let sql, params;
    
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
        getConversationWithMessages(row.id).then(resolve).catch(reject);
      } else {
        resolve(null);
      }
    });
  });
}

function updateConversationTitle(conversationId, title) {
  return new Promise((resolve, reject) => {
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

function deleteConversation(conversationId) {
  return new Promise((resolve, reject) => {
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
function createLanguageDashboard(userId, language, proficiencyLevel, talkTopics, learningGoals, practicePreference, isPrimary = false) {
  return new Promise((resolve, reject) => {
    const topicsJson = talkTopics ? JSON.stringify(talkTopics) : null;
    const goalsJson = learningGoals ? JSON.stringify(learningGoals) : null;
    
    const sql = `
      INSERT INTO language_dashboards (user_id, language, proficiency_level, talk_topics, learning_goals, practice_preference, is_primary)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.run(sql, [userId, language, proficiencyLevel, topicsJson, goalsJson, practicePreference, isPrimary], function(err) {
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
          is_primary: isPrimary 
        });
      }
    });
  });
}

function getUserLanguageDashboards(userId) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT id, language, proficiency_level, talk_topics, learning_goals, practice_preference, is_primary, created_at, updated_at
      FROM language_dashboards 
      WHERE user_id = ?
      ORDER BY is_primary DESC, created_at ASC
    `;
    
    db.all(sql, [userId], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        const dashboards = rows.map(row => ({
          ...row,
          talk_topics: row.talk_topics ? JSON.parse(row.talk_topics) : [],
          learning_goals: row.learning_goals ? JSON.parse(row.learning_goals) : []
        }));
        resolve(dashboards);
      }
    });
  });
}

function getLanguageDashboard(userId, language) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT id, language, proficiency_level, talk_topics, learning_goals, practice_preference, is_primary, created_at, updated_at
      FROM language_dashboards 
      WHERE user_id = ? AND language = ?
    `;
    
    db.get(sql, [userId, language], (err, row) => {
      if (err) {
        reject(err);
      } else if (row) {
        const dashboard = {
          ...row,
          talk_topics: row.talk_topics ? JSON.parse(row.talk_topics) : [],
          learning_goals: row.learning_goals ? JSON.parse(row.learning_goals) : []
        };
        resolve(dashboard);
      } else {
        resolve(null);
      }
    });
  });
}

function updateLanguageDashboard(userId, language, updates) {
  return new Promise((resolve, reject) => {
    const processedUpdates = { ...updates };
    
    // Convert arrays to JSON strings if present
    if (processedUpdates.talk_topics) {
      processedUpdates.talk_topics = JSON.stringify(processedUpdates.talk_topics);
    }
    if (processedUpdates.learning_goals) {
      processedUpdates.learning_goals = JSON.stringify(processedUpdates.learning_goals);
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

function deleteLanguageDashboard(userId, language) {
  return new Promise((resolve, reject) => {
    // First, delete all conversations and messages for this dashboard
    const getConversationsSql = `SELECT id FROM conversations WHERE user_id = ? AND language_dashboard_id = (SELECT id FROM language_dashboards WHERE user_id = ? AND language = ?)`;
    
    db.all(getConversationsSql, [userId, userId, language], (err, conversations) => {
      if (err) {
        reject(err);
      } else {
        const conversationIds = conversations.map(c => c.id);
        
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

function getUserStreak(userId, language) {
  return new Promise((resolve, reject) => {
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
      const days = rows.map(r => r.day);
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

module.exports = {
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