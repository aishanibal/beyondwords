"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
exports.createUser = createUser;
exports.findUserByGoogleId = findUserByGoogleId;
exports.findUserByEmail = findUserByEmail;
exports.findUserById = findUserById;
exports.updateUser = updateUser;
exports.saveSession = saveSession;
exports.getSession = getSession;
exports.getAllSessions = getAllSessions;
exports.closeDatabase = closeDatabase;
exports.getAllUsers = getAllUsers;
exports.createConversation = createConversation;
exports.addMessage = addMessage;
exports.getUserConversations = getUserConversations;
exports.getConversationWithMessages = getConversationWithMessages;
exports.getLatestConversation = getLatestConversation;
exports.updateConversationTitle = updateConversationTitle;
exports.updateConversationSynopsis = updateConversationSynopsis;
exports.deleteConversation = deleteConversation;
exports.updateConversationPersona = updateConversationPersona;
exports.createLanguageDashboard = createLanguageDashboard;
exports.getUserLanguageDashboards = getUserLanguageDashboards;
exports.getLanguageDashboard = getLanguageDashboard;
exports.updateLanguageDashboard = updateLanguageDashboard;
exports.deleteLanguageDashboard = deleteLanguageDashboard;
exports.getUserStreak = getUserStreak;
exports.createPersona = createPersona;
exports.getUserPersonas = getUserPersonas;
exports.deletePersona = deletePersona;
const sqlite3_1 = __importDefault(require("sqlite3"));
const path_1 = __importDefault(require("path"));
// Database file path
const dbPath = path_1.default.join(__dirname, 'users.db');
console.log('USING DATABASE FILE:', dbPath);
// Create database connection
const db = new sqlite3_1.default.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    }
    else {
        console.log('Connected to SQLite database');
        initDatabase();
    }
});
exports.db = db;
// Initialize database tables
function initDatabase() {
    db.serialize(() => {
        // Drop existing tables to start fresh
        db.run('DROP TABLE IF EXISTS messages');
        db.run('DROP TABLE IF EXISTS conversations');
        db.run('DROP TABLE IF EXISTS personas');
        db.run('DROP TABLE IF EXISTS language_dashboards');
        db.run('DROP TABLE IF EXISTS sessions');
        db.run('DROP TABLE IF EXISTS users');
        // Create users table
        db.run(`
      CREATE TABLE users (
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
        preferences TEXT,
        onboarding_complete BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
        // Create sessions table
        db.run(`
      CREATE TABLE sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        chat_history TEXT,
        language TEXT DEFAULT 'en',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);
        // Create language_dashboards table
        db.run(`
      CREATE TABLE language_dashboards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        language TEXT NOT NULL,
        proficiency_level TEXT,
        talk_topics TEXT,
        learning_goals TEXT,
        practice_preference TEXT,
        feedback_language TEXT DEFAULT 'en',
        speak_speed REAL DEFAULT 1.0,
        romanization_display TEXT DEFAULT 'both',
        is_primary BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        UNIQUE(user_id, language)
      )
    `);
        // Create personas table
        db.run(`
      CREATE TABLE personas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        topics TEXT,
        formality TEXT,
        language TEXT,
        conversation_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);
        // Create conversations table
        db.run(`
      CREATE TABLE conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        language_dashboard_id INTEGER NOT NULL,
        title TEXT,
        topics TEXT,
        formality TEXT,
        description TEXT,
        synopsis TEXT,
        message_count INTEGER DEFAULT 0,
        uses_persona BOOLEAN DEFAULT FALSE,
        persona_id INTEGER,
        progress_data TEXT,
        learning_goals TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (language_dashboard_id) REFERENCES language_dashboards (id),
        FOREIGN KEY (persona_id) REFERENCES personas (id)
      )
    `);
        // Create messages table
        db.run(`
      CREATE TABLE messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id INTEGER NOT NULL,
        sender TEXT NOT NULL,
        text TEXT NOT NULL,
        romanized_text TEXT,
        message_type TEXT DEFAULT 'text',
        audio_file_path TEXT,
        detailed_feedback TEXT,
        message_order INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES conversations (id)
      )
    `);
        // Create indexes for better performance
        db.run('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
        db.run('CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id)');
        db.run('CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)');
        db.run('CREATE INDEX IF NOT EXISTS idx_language_dashboards_user_id ON language_dashboards(user_id)');
        db.run('CREATE INDEX IF NOT EXISTS idx_language_dashboards_user_language ON language_dashboards(user_id, language)');
        db.run('CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id)');
        db.run('CREATE INDEX IF NOT EXISTS idx_conversations_language_dashboard_id ON conversations(language_dashboard_id)');
        db.run('CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id)');
        db.run('CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at)');
        db.run('CREATE INDEX IF NOT EXISTS idx_personas_user_id ON personas(user_id)');
        console.log('Database schema created successfully!');
    });
}
// User functions
function createUser(userData) {
    return new Promise((resolve, reject) => {
        const googleId = userData.googleId || userData.google_id;
        const passwordHash = userData.passwordHash || userData.password_hash;
        const { email, name, role = 'user', onboarding_complete = false } = userData;
        const sql = `
      INSERT OR REPLACE INTO users (google_id, email, name, password_hash, role, onboarding_complete, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;
        db.run(sql, [googleId, email, name, passwordHash, role, onboarding_complete], function (err) {
            if (err) {
                reject(err);
            }
            else {
                resolve(Object.assign({ id: this.lastID }, userData));
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
            }
            else {
                resolve(row ? row : null);
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
            }
            else {
                resolve(row ? row : null);
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
            }
            else {
                if (row) {
                    // Parse JSON fields
                    if (row.talk_topics) {
                        try {
                            row.talk_topics = JSON.parse(row.talk_topics);
                        }
                        catch (e) {
                            row.talk_topics = [];
                        }
                    }
                    if (row.learning_goals) {
                        try {
                            row.learning_goals = JSON.parse(row.learning_goals);
                        }
                        catch (e) {
                            row.learning_goals = [];
                        }
                    }
                    // Parse preferences field
                    if (row.preferences) {
                        try {
                            row.preferences = JSON.parse(row.preferences);
                        }
                        catch (e) {
                            row.preferences = {};
                        }
                    }
                }
                resolve(row ? row : null);
            }
        });
    });
}
function updateUser(id, updates) {
    return new Promise((resolve, reject) => {
        // Handle preferences field specially - convert to JSON string
        const processedUpdates = Object.assign({}, updates);
        if (processedUpdates.preferences) {
            processedUpdates.preferences = JSON.stringify(processedUpdates.preferences);
        }
        const fields = Object.keys(processedUpdates).map(key => `${key} = ?`).join(', ');
        const values = Object.values(processedUpdates);
        const sql = `UPDATE users SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
        db.run(sql, [...values, id], function (err) {
            if (err) {
                reject(err);
            }
            else {
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
        db.run(sql, [userId, JSON.stringify(chatHistory), language], function (err) {
            if (err) {
                reject(err);
            }
            else {
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
            }
            else {
                if (row) {
                    row.chat_history = JSON.parse(row.chat_history);
                }
                resolve(row ? row : null);
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
            }
            else {
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
            }
            else {
                resolve(rows);
            }
        });
    });
}
// Conversation functions
function createConversation(userId, language, title, topics, formality, description, usesPersona, personaId, learningGoals) {
    return new Promise((resolve, reject) => {
        console.log('🗄️ DATABASE: Creating conversation:', { userId, language, title, topics, formality, description, usesPersona, personaId, learningGoals });
        const topicsJson = topics ? JSON.stringify(topics) : null;
        const learningGoalsJson = learningGoals ? JSON.stringify(learningGoals) : null;
        // First, get the language dashboard ID for this user and language
        const getDashboardSql = `SELECT id FROM language_dashboards WHERE user_id = ? AND language = ?`;
        db.get(getDashboardSql, [userId, language], (err, dashboard) => {
            if (err) {
                console.error('❌ DATABASE: Error getting language dashboard:', err);
                reject(err);
            }
            else if (!dashboard) {
                console.error('❌ DATABASE: Language dashboard not found for user:', userId, 'language:', language);
                reject(new Error('Language dashboard not found'));
            }
            else {
                const sql = `
          INSERT INTO conversations (user_id, language_dashboard_id, title, topics, formality, description, uses_persona, persona_id, learning_goals)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
                db.run(sql, [userId, dashboard.id, title, topicsJson, formality, description, usesPersona || false, personaId || null, learningGoalsJson], function (err) {
                    if (err) {
                        console.error('❌ DATABASE: Error creating conversation:', err);
                        reject(err);
                    }
                    else {
                        console.log('✅ DATABASE: Conversation created successfully:', {
                            id: this.lastID,
                            user_id: userId,
                            language_dashboard_id: dashboard.id,
                            title,
                            topics: topicsJson,
                            formality,
                            description,
                            uses_persona: usesPersona || false,
                            persona_id: personaId || null,
                            learning_goals: learningGoalsJson
                        });
                        resolve({ id: this.lastID });
                    }
                });
            }
        });
    });
}
function addMessage(conversationId, sender, text, messageType = 'text', audioFilePath, detailedFeedback, messageOrder, romanizedText) {
    return new Promise((resolve, reject) => {
        console.log('🗄️ DATABASE: Adding message:', {
            conversationId,
            sender,
            text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
            messageType,
            audioFilePath,
            messageOrder
        });
        // If messageOrder is provided, use it; otherwise, auto-increment
        const getOrder = (cb) => {
            if (typeof messageOrder === 'number') {
                cb(messageOrder);
            }
            else {
                const getOrderSql = `
          SELECT COALESCE(MAX(message_order), 0) + 1 as next_order
          FROM messages WHERE conversation_id = ?
        `;
                db.get(getOrderSql, [conversationId], (err, row) => {
                    if (err) {
                        console.error('❌ DATABASE: Error getting message order:', err);
                        reject(err);
                    }
                    else {
                        cb(row.next_order);
                    }
                });
            }
        };
        getOrder((finalOrder) => {
            const insertSql = `
        INSERT INTO messages (conversation_id, sender, text, romanized_text, message_type, audio_file_path, detailed_feedback, message_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
            db.run(insertSql, [conversationId, sender, text, romanizedText, messageType, audioFilePath, detailedFeedback, finalOrder], function (err) {
                if (err) {
                    console.error('❌ DATABASE: Error inserting message:', err);
                    reject(err);
                }
                else {
                    console.log('✅ DATABASE: Message inserted successfully:', {
                        id: this.lastID,
                        conversationId,
                        sender,
                        messageType,
                        messageOrder: finalOrder,
                        textPreview: text.substring(0, 50) + (text.length > 50 ? '...' : '')
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
                        }
                        else {
                            console.log('✅ DATABASE: Conversation message count updated for ID:', conversationId);
                            resolve({ id: this.lastID });
                        }
                    });
                }
            });
        });
    });
}
function getUserConversations(userId, language) {
    return new Promise((resolve, reject) => {
        let sql;
        let params;
        if (language) {
            // Get conversations for specific language dashboard
            sql = `
        SELECT c.id, c.title, ld.language, c.message_count, c.created_at, c.updated_at, c.uses_persona, c.persona_id, p.name as persona_name, p.description as persona_description, c.synopsis, c.progress_data, c.learning_goals
        FROM conversations c
        JOIN language_dashboards ld ON c.language_dashboard_id = ld.id
        LEFT JOIN personas p ON c.persona_id = p.id
        WHERE c.user_id = ? AND ld.language = ?
        ORDER BY c.updated_at DESC
      `;
            params = [userId, language];
        }
        else {
            // Get all conversations for user
            sql = `
        SELECT c.id, c.title, ld.language, c.message_count, c.created_at, c.updated_at, c.uses_persona, c.persona_id, p.name as persona_name, p.description as persona_description, c.synopsis, c.progress_data, c.learning_goals
        FROM conversations c
        JOIN language_dashboards ld ON c.language_dashboard_id = ld.id
        LEFT JOIN personas p ON c.persona_id = p.id
        WHERE c.user_id = ?
        ORDER BY c.updated_at DESC
      `;
            params = [userId];
        }
        db.all(sql, params, (err, rows) => __awaiter(this, void 0, void 0, function* () {
            if (err) {
                reject(err);
            }
            else {
                console.log('🗄️ DATABASE: Found conversations:', rows.length);
                // For each conversation, get its messages
                const conversationsWithMessages = yield Promise.all(rows.map((conversation) => __awaiter(this, void 0, void 0, function* () {
                    try {
                        const messages = yield new Promise((resolve, reject) => {
                            db.all('SELECT id, sender, text, message_type, audio_file_path, detailed_feedback, message_order, created_at FROM messages WHERE conversation_id = ? ORDER BY message_order', [conversation.id], (err, messages) => {
                                if (err)
                                    reject(err);
                                else
                                    resolve(messages);
                            });
                        });
                        console.log(`Conversation ${conversation.id}: ${messages.length} messages, synopsis: ${conversation.synopsis ? 'YES' : 'NO'}`);
                        // Parse JSON fields
                        const parsedConversation = Object.assign(Object.assign({}, conversation), { topics: conversation.topics ? JSON.parse(conversation.topics) : null, learning_goals: conversation.learning_goals ? JSON.parse(conversation.learning_goals) : null, progress_data: (() => {
                                try {
                                    return conversation.progress_data ? JSON.parse(conversation.progress_data) : null;
                                }
                                catch (error) {
                                    console.error('❌ Error parsing progress data from conversation:', conversation.id, error);
                                    return null;
                                }
                            })(), messages });
                        return parsedConversation;
                    }
                    catch (error) {
                        console.error('Error fetching messages for conversation:', conversation.id, error);
                        return Object.assign(Object.assign({}, conversation), { messages: [] });
                    }
                })));
                console.log('Returning conversations with messages:', conversationsWithMessages.length);
                resolve(conversationsWithMessages);
            }
        }));
    });
}
function getConversationWithMessages(conversationId) {
    return new Promise((resolve, reject) => {
        console.log('🗄️ DATABASE: Getting conversation with messages:', conversationId);
        const conversationSql = `
      SELECT c.*, u.name as user_name, ld.language, c.learning_goals
      FROM conversations c
      JOIN users u ON c.user_id = u.id
      JOIN language_dashboards ld ON c.language_dashboard_id = ld.id
      WHERE c.id = ?
    `;
        const messagesSql = `
      SELECT id, sender, text, romanized_text, message_type, audio_file_path, detailed_feedback, message_order, created_at
      FROM messages 
      WHERE conversation_id = ?
      ORDER BY message_order
    `;
        db.get(conversationSql, [conversationId], (err, conversation) => {
            if (err) {
                console.error('❌ DATABASE: Error getting conversation:', err);
                reject(err);
            }
            else if (conversation) {
                const conv = conversation;
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
                    }
                    else {
                        console.log('📋 DATABASE: Found', messages.length, 'messages for conversation', conversationId);
                        if (messages.length > 0) {
                            console.log('📝 DATABASE: Sample messages:', messages.slice(0, 2).map((m) => ({
                                id: m.id,
                                sender: m.sender,
                                text: m.text.substring(0, 50) + '...',
                                message_order: m.message_order
                            })));
                        }
                        else {
                            // If no messages found, let's check if there are any messages in the database at all
                            console.log('🔍 DATABASE: No messages found, checking all messages in database...');
                            db.all('SELECT conversation_id, COUNT(*) as count FROM messages GROUP BY conversation_id', [], (err, allMessages) => {
                                if (!err) {
                                    console.log('📊 DATABASE: All messages by conversation:', allMessages);
                                }
                            });
                        }
                        // Parse topics from JSON if present
                        const conv = conversation;
                        const parsedConversation = Object.assign(Object.assign({}, conv), { topics: conv.topics ? JSON.parse(conv.topics) : null, formality: conv.formality, learning_goals: conv.learning_goals ? JSON.parse(conv.learning_goals) : null, progress_data: (() => {
                                try {
                                    return conv.progress_data ? JSON.parse(conv.progress_data) : null;
                                }
                                catch (error) {
                                    console.error('❌ Error parsing progress data from conversation:', conv.id, error);
                                    return null;
                                }
                            })(), messages: messages });
                        console.log('🔍 DATABASE: Raw learning_goals from DB:', conv.learning_goals);
                        console.log('🔍 DATABASE: Parsed learning_goals:', parsedConversation.learning_goals);
                        resolve(parsedConversation);
                    }
                });
            }
            else {
                console.log('❌ DATABASE: Conversation not found:', conversationId);
                resolve(null);
            }
        });
    });
}
function getLatestConversation(userId, language) {
    return new Promise((resolve, reject) => {
        let sql;
        let params;
        if (language) {
            sql = `
        SELECT c.id FROM conversations c
        JOIN language_dashboards ld ON c.language_dashboard_id = ld.id
        WHERE c.user_id = ? AND ld.language = ?
        ORDER BY c.updated_at DESC 
        LIMIT 1
      `;
            params = [userId, language];
        }
        else {
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
            }
            else if (row) {
                // Get the full conversation with messages
                getConversationWithMessages(row.id).then(resolve).catch(reject);
            }
            else {
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
        db.run(sql, [title, conversationId], function (err) {
            if (err) {
                reject(err);
            }
            else {
                resolve({ changes: this.changes });
            }
        });
    });
}
function updateConversationSynopsis(conversationId, synopsis, progressData) {
    return new Promise((resolve, reject) => {
        console.log('🗄️ DATABASE: Updating conversation synopsis:', { conversationId, synopsis: synopsis.substring(0, 50) + '...', progressData });
        const sql = `UPDATE conversations SET synopsis = ?, progress_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
        console.log('🗄️ DATABASE: SQL query:', sql);
        console.log('🗄️ DATABASE: Parameters:', [synopsis.substring(0, 50) + '...', progressData, conversationId]);
        db.run(sql, [synopsis, progressData || null, conversationId], function (err) {
            if (err) {
                console.error('❌ DATABASE: Error updating conversation synopsis:', err);
                reject(err);
            }
            else {
                console.log('✅ DATABASE: Conversation synopsis and progress updated successfully, changes:', this.changes);
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
            }
            else {
                // Then delete the conversation
                const deleteConversationSql = `DELETE FROM conversations WHERE id = ?`;
                db.run(deleteConversationSql, [conversationId], function (err) {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve({ changes: this.changes });
                    }
                });
            }
        });
    });
}
function updateConversationPersona(conversationId, usesPersona, personaId) {
    return new Promise((resolve, reject) => {
        const sql = `UPDATE conversations SET uses_persona = ?, persona_id = ? WHERE id = ?`;
        db.run(sql, [usesPersona, personaId || null, conversationId], function (err) {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
}
// Close database connection
function closeDatabase() {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        }
        else {
            console.log('Database connection closed');
        }
    });
}
// Language Dashboard functions
function createLanguageDashboard(userId, language, proficiencyLevel, talkTopics, learningGoals, practicePreference, feedbackLanguage = 'en', isPrimary = false) {
    return new Promise((resolve, reject) => {
        const topicsJson = talkTopics ? JSON.stringify(talkTopics) : null;
        const goalsJson = learningGoals ? JSON.stringify(learningGoals) : null;
        const sql = `
      INSERT INTO language_dashboards (user_id, language, proficiency_level, talk_topics, learning_goals, practice_preference, feedback_language, speak_speed, is_primary)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
        db.run(sql, [userId, language, proficiencyLevel, topicsJson, goalsJson, practicePreference, feedbackLanguage, 1.0, isPrimary], function (err) {
            if (err) {
                reject(err);
            }
            else {
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
function getUserLanguageDashboards(userId) {
    return new Promise((resolve, reject) => {
        const sql = `
      SELECT id, language, proficiency_level, talk_topics, learning_goals, practice_preference, feedback_language, speak_speed, romanization_display, is_primary, created_at, updated_at
      FROM language_dashboards 
      WHERE user_id = ?
      ORDER BY is_primary DESC, created_at ASC
    `;
        db.all(sql, [userId], (err, rows) => {
            if (err) {
                reject(err);
            }
            else {
                const dashboards = rows.map(row => (Object.assign(Object.assign({}, row), { talk_topics: row.talk_topics ? JSON.parse(row.talk_topics) : [], learning_goals: row.learning_goals ? JSON.parse(row.learning_goals) : [] })));
                resolve(dashboards);
            }
        });
    });
}
function getLanguageDashboard(userId, language) {
    return new Promise((resolve, reject) => {
        const sql = `
      SELECT id, language, proficiency_level, talk_topics, learning_goals, practice_preference, feedback_language, speak_speed, romanization_display, is_primary, created_at, updated_at
      FROM language_dashboards 
      WHERE user_id = ? AND language = ?
    `;
        db.get(sql, [userId, language], (err, row) => {
            if (err) {
                reject(err);
            }
            else if (row) {
                const dash = row;
                const dashboard = Object.assign(Object.assign({}, dash), { talk_topics: dash.talk_topics ? JSON.parse(dash.talk_topics) : [], learning_goals: dash.learning_goals ? JSON.parse(dash.learning_goals) : [] });
                resolve(dashboard);
            }
            else {
                resolve(null);
            }
        });
    });
}
function updateLanguageDashboard(userId, language, updates) {
    return new Promise((resolve, reject) => {
        console.log('[DEBUG] updateLanguageDashboard called with:', { userId, language, updates });
        const processedUpdates = Object.assign({}, updates);
        // Convert arrays to JSON strings if present
        if (processedUpdates.talk_topics && Array.isArray(processedUpdates.talk_topics)) {
            processedUpdates.talk_topics = JSON.stringify(processedUpdates.talk_topics);
        }
        if (processedUpdates.learning_goals && Array.isArray(processedUpdates.learning_goals)) {
            processedUpdates.learning_goals = JSON.stringify(processedUpdates.learning_goals);
        }
        const fields = Object.keys(processedUpdates).map(key => `${key} = ?`).join(', ');
        const values = Object.values(processedUpdates);
        const sql = `UPDATE language_dashboards SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND language = ?`;
        console.log('[DEBUG] SQL query:', sql);
        console.log('[DEBUG] Values:', [...values, userId, language]);
        db.run(sql, [...values, userId, language], function (err) {
            if (err) {
                console.error('[DEBUG] Database error:', err);
                reject(err);
            }
            else {
                console.log('[DEBUG] Update successful, changes:', this.changes);
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
            }
            else {
                const conversationIds = conversations.map(c => c.id);
                if (conversationIds.length > 0) {
                    const deleteMessagesSql = `DELETE FROM messages WHERE conversation_id IN (${conversationIds.map(() => '?').join(',')})`;
                    db.run(deleteMessagesSql, conversationIds, (err) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            const deleteConversationsSql = `DELETE FROM conversations WHERE id IN (${conversationIds.map(() => '?').join(',')})`;
                            db.run(deleteConversationsSql, conversationIds, (err) => {
                                if (err) {
                                    reject(err);
                                }
                                else {
                                    // Finally delete the dashboard
                                    const deleteDashboardSql = `DELETE FROM language_dashboards WHERE user_id = ? AND language = ?`;
                                    db.run(deleteDashboardSql, [userId, language], function (err) {
                                        if (err) {
                                            reject(err);
                                        }
                                        else {
                                            resolve({ changes: this.changes });
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
                else {
                    // No conversations, just delete the dashboard
                    const deleteDashboardSql = `DELETE FROM language_dashboards WHERE user_id = ? AND language = ?`;
                    db.run(deleteDashboardSql, [userId, language], function (err) {
                        if (err) {
                            reject(err);
                        }
                        else {
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
            if (err)
                return reject(err);
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
                if (i === 0)
                    lastActive = days[i];
                // Calculate expected date string for streak
                const expectedDate = new Date(now);
                expectedDate.setDate(expectedDate.getDate() - streak);
                const expectedStr = expectedDate.toLocaleDateString('en-CA', { timeZone: tz }); // 'YYYY-MM-DD'
                console.log(`[STREAK DEBUG] Comparing day: ${days[i]} to expected: ${expectedStr}`);
                if (days[i] === expectedStr) {
                    streak++;
                }
                else {
                    break;
                }
            }
            console.log('[STREAK DEBUG] Final streak:', streak, 'Last active:', lastActive);
            resolve({ streak, last_active: lastActive, days });
        });
    });
}
// Persona functions
function createPersona(userId, personaData) {
    return new Promise((resolve, reject) => {
        const sql = `
      INSERT INTO personas (user_id, name, description, topics, formality, language, conversation_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
        const topicsJson = JSON.stringify(personaData.topics);
        db.run(sql, [
            userId,
            personaData.name,
            personaData.description || null,
            topicsJson,
            personaData.formality,
            personaData.language,
            personaData.conversationId || null
        ], function (err) {
            if (err) {
                reject(err);
            }
            else {
                // Get the created persona
                const selectSql = `SELECT * FROM personas WHERE id = ?`;
                db.get(selectSql, [this.lastID], (err, row) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        const persona = row;
                        resolve(Object.assign(Object.assign({}, persona), { topics: JSON.parse(persona.topics || '[]') }));
                    }
                });
            }
        });
    });
}
function getUserPersonas(userId) {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM personas WHERE user_id = ? ORDER BY created_at DESC`;
        db.all(sql, [userId], (err, rows) => {
            if (err) {
                reject(err);
            }
            else {
                const personas = rows.map(row => (Object.assign(Object.assign({}, row), { topics: JSON.parse(row.topics || '[]') })));
                resolve(personas);
            }
        });
    });
}
function deletePersona(personaId) {
    return new Promise((resolve, reject) => {
        const sql = `DELETE FROM personas WHERE id = ?`;
        db.run(sql, [personaId], function (err) {
            if (err) {
                reject(err);
            }
            else {
                resolve({ changes: this.changes });
            }
        });
    });
}
