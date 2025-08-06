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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUser = createUser;
exports.findUserByGoogleId = findUserByGoogleId;
exports.findUserByEmail = findUserByEmail;
exports.findUserById = findUserById;
exports.updateUser = updateUser;
exports.saveSession = saveSession;
exports.getSession = getSession;
exports.getAllSessions = getAllSessions;
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
const supabase_js_1 = require("@supabase/supabase-js");
// Initialize Supabase client only if environment variables are available
let supabase = null;
if (process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)) {
    // Use service role key if available (for admin operations), otherwise use anon key
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
    supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, supabaseKey);
    console.log('✅ Supabase client initialized with', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'service role key' : 'anon key');
}
else {
    console.log('⚠️ Supabase environment variables not found. Database functions will be disabled.');
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
function createUser(userData) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        try {
            if (!supabase) {
                reject(new Error('Supabase client not initialized'));
                return;
            }
            // For Supabase, we need to create the user in auth.users first
            // Then insert into our custom users table
            const { data: authData, error: authError } = yield supabase.auth.admin.createUser({
                email: userData.email,
                password: userData.passwordHash || userData.password_hash || 'temporary_password',
                email_confirm: true
            });
            if (authError) {
                console.error('❌ Supabase auth createUser error:', authError);
                reject(authError);
                return;
            }
            if (!authData.user) {
                reject(new Error('Failed to create auth user'));
                return;
            }
            // Now insert into our custom users table
            const { data, error } = yield supabase
                .from('users')
                .insert({
                id: authData.user.id, // Use the UUID from auth.users
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
            }
            else {
                console.log('✅ User created successfully:', data);
                resolve(data);
            }
        }
        catch (error) {
            console.error('❌ createUser error:', error);
            reject(error);
        }
    }));
}
function findUserByGoogleId(googleId) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        try {
            if (!supabase) {
                reject(new Error('Supabase client not initialized'));
                return;
            }
            const { data, error } = yield supabase
                .from('users')
                .select('*')
                .eq('google_id', googleId)
                .single();
            if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
                console.error('❌ Supabase findUserByGoogleId error:', error);
                reject(error);
            }
            else {
                resolve(data || null);
            }
        }
        catch (error) {
            console.error('❌ findUserByGoogleId error:', error);
            reject(error);
        }
    }));
}
function findUserByEmail(email) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        try {
            if (!supabase) {
                reject(new Error('Supabase client not initialized'));
                return;
            }
            const { data, error } = yield supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .single();
            if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
                console.error('❌ Supabase findUserByEmail error:', error);
                reject(error);
            }
            else {
                resolve(data || null);
            }
        }
        catch (error) {
            console.error('❌ findUserByEmail error:', error);
            reject(error);
        }
    }));
}
function findUserById(id) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        try {
            if (!supabase) {
                reject(new Error('Supabase client not initialized'));
                return;
            }
            const { data, error } = yield supabase
                .from('users')
                .select('*')
                .eq('id', id)
                .single();
            if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
                console.error('❌ Supabase findUserById error:', error);
                reject(error);
            }
            else {
                // Parse JSON fields if they exist
                if (data) {
                    if (data.talk_topics) {
                        try {
                            data.talk_topics = JSON.parse(data.talk_topics);
                        }
                        catch (e) {
                            data.talk_topics = [];
                        }
                    }
                    if (data.learning_goals) {
                        try {
                            data.learning_goals = JSON.parse(data.learning_goals);
                        }
                        catch (e) {
                            data.learning_goals = [];
                        }
                    }
                    // Parse preferences field
                    if (data.preferences) {
                        try {
                            data.preferences = JSON.parse(data.preferences);
                        }
                        catch (e) {
                            data.preferences = {};
                        }
                    }
                }
                resolve(data || null);
            }
        }
        catch (error) {
            console.error('❌ findUserById error:', error);
            reject(error);
        }
    }));
}
function updateUser(id, updates) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        try {
            if (!supabase) {
                reject(new Error('Supabase client not initialized'));
                return;
            }
            // Handle preferences field specially - convert to JSON string
            const processedUpdates = Object.assign({}, updates);
            if (processedUpdates.preferences) {
                processedUpdates.preferences = JSON.stringify(processedUpdates.preferences);
            }
            const { data, error } = yield supabase
                .from('users')
                .update(processedUpdates)
                .eq('id', id)
                .select();
            if (error) {
                console.error('❌ Supabase updateUser error:', error);
                reject(error);
            }
            else {
                console.log('✅ User updated successfully');
                resolve({ changes: data ? data.length : 0 });
            }
        }
        catch (error) {
            console.error('❌ updateUser error:', error);
            reject(error);
        }
    }));
}
// Session functions
function saveSession(userId, chatHistory, language = 'en') {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        try {
            if (!supabase) {
                reject(new Error('Supabase client not initialized'));
                return;
            }
            const { data, error } = yield supabase
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
            }
            else {
                console.log('✅ Session saved successfully');
                resolve(data);
            }
        }
        catch (error) {
            console.error('❌ saveSession error:', error);
            reject(error);
        }
    }));
}
function getSession(userId) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        try {
            if (!supabase) {
                reject(new Error('Supabase client not initialized'));
                return;
            }
            const { data, error } = yield supabase
                .from('sessions')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
            if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
                console.error('❌ Supabase getSession error:', error);
                reject(error);
            }
            else {
                resolve(data || null);
            }
        }
        catch (error) {
            console.error('❌ getSession error:', error);
            reject(error);
        }
    }));
}
function getAllSessions(userId) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        try {
            if (!supabase) {
                reject(new Error('Supabase client not initialized'));
                return;
            }
            const { data, error } = yield supabase
                .from('sessions')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
            if (error) {
                console.error('❌ Supabase getAllSessions error:', error);
                reject(error);
            }
            else {
                resolve(data || []);
            }
        }
        catch (error) {
            console.error('❌ getAllSessions error:', error);
            reject(error);
        }
    }));
}
function getAllUsers() {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        try {
            if (!supabase) {
                reject(new Error('Supabase client not initialized'));
                return;
            }
            const { data, error } = yield supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) {
                console.error('❌ Supabase getAllUsers error:', error);
                reject(error);
            }
            else {
                // Parse JSON fields for each user
                const users = (data || []).map(user => {
                    if (user.talk_topics) {
                        try {
                            user.talk_topics = JSON.parse(user.talk_topics);
                        }
                        catch (e) {
                            user.talk_topics = [];
                        }
                    }
                    if (user.learning_goals) {
                        try {
                            user.learning_goals = JSON.parse(user.learning_goals);
                        }
                        catch (e) {
                            user.learning_goals = [];
                        }
                    }
                    if (user.preferences) {
                        try {
                            user.preferences = JSON.parse(user.preferences);
                        }
                        catch (e) {
                            user.preferences = {};
                        }
                    }
                    return user;
                });
                resolve(users);
            }
        }
        catch (error) {
            console.error('❌ getAllUsers error:', error);
            reject(error);
        }
    }));
}
// Conversation functions
function createConversation(userId, language, title, topics, formality, description, usesPersona, personaId, learningGoals) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        try {
            if (!supabase) {
                reject(new Error('Supabase client not initialized'));
                return;
            }
            // First, get or create a language dashboard for this user and language
            let languageDashboard = yield getLanguageDashboard(userId, language);
            if (!languageDashboard) {
                // Create a default language dashboard
                languageDashboard = yield createLanguageDashboard(userId, language, 'beginner', [], [], 'conversation', 'en', true);
            }
            // Use language dashboard data as fallbacks for missing parameters
            const finalTopics = topics && topics.length > 0 ? topics : (languageDashboard.talk_topics || []);
            const finalLearningGoals = learningGoals && learningGoals.length > 0 ? learningGoals : (languageDashboard.learning_goals || []);
            const finalFormality = formality || 'casual';
            const finalTitle = title || `New ${language} Conversation`;
            const { data, error } = yield supabase
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
            }
            else {
                console.log('✅ Conversation created successfully');
                resolve(data);
            }
        }
        catch (error) {
            console.error('❌ createConversation error:', error);
            reject(error);
        }
    }));
}
function addMessage(conversationId, sender, text, messageType = 'text', audioFilePath, detailedFeedback, messageOrder, romanizedText) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        try {
            if (!supabase) {
                reject(new Error('Supabase client not initialized'));
                return;
            }
            // Get the next message order if not provided
            let finalOrder = messageOrder;
            if (!finalOrder) {
                const { data: orderData, error: orderError } = yield supabase
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
            const { data, error } = yield supabase
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
            }
            else {
                console.log('✅ Message added successfully');
                resolve(data);
            }
        }
        catch (error) {
            console.error('❌ addMessage error:', error);
            reject(error);
        }
    }));
}
function getUserConversations(userId, language) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        try {
            if (!supabase) {
                reject(new Error('Supabase client not initialized'));
                return;
            }
            let query = supabase
                .from('conversations')
                .select(`
          *,
          language_dashboards!inner(language)
        `)
                .eq('user_id', userId);
            if (language) {
                query = query.eq('language_dashboards.language', language);
            }
            const { data, error } = yield query
                .order('created_at', { ascending: false });
            if (error) {
                console.error('❌ Supabase getUserConversations error:', error);
                reject(error);
            }
            else {
                // Parse JSON fields for each conversation
                const conversations = (data || []).map(conversation => {
                    if (conversation.topics) {
                        try {
                            conversation.topics = JSON.parse(conversation.topics);
                        }
                        catch (e) {
                            conversation.topics = [];
                        }
                    }
                    if (conversation.learning_goals) {
                        try {
                            conversation.learning_goals = JSON.parse(conversation.learning_goals);
                        }
                        catch (e) {
                            conversation.learning_goals = [];
                        }
                    }
                    if (conversation.progress_data) {
                        try {
                            conversation.progress_data = JSON.parse(conversation.progress_data);
                        }
                        catch (e) {
                            conversation.progress_data = { goals: [], percentages: [] };
                        }
                    }
                    return conversation;
                });
                resolve(conversations);
            }
        }
        catch (error) {
            console.error('❌ getUserConversations error:', error);
            reject(error);
        }
    }));
}
function getConversationWithMessages(conversationId) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        try {
            if (!supabase) {
                reject(new Error('Supabase client not initialized'));
                return;
            }
            // Get the conversation
            const { data: conversationData, error: conversationError } = yield supabase
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
            const { data: messagesData, error: messagesError } = yield supabase
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
            const conversation = conversationData;
            if (conversation.topics) {
                try {
                    conversation.topics = JSON.parse(conversation.topics);
                }
                catch (e) {
                    conversation.topics = [];
                }
            }
            if (conversation.learning_goals) {
                try {
                    conversation.learning_goals = JSON.parse(conversation.learning_goals);
                }
                catch (e) {
                    conversation.learning_goals = [];
                }
            }
            if (conversation.progress_data) {
                try {
                    conversation.progress_data = JSON.parse(conversation.progress_data);
                }
                catch (e) {
                    conversation.progress_data = { goals: [], percentages: [] };
                }
            }
            // Add messages to conversation
            conversation.messages = messagesData || [];
            console.log('✅ Conversation with messages fetched successfully');
            resolve(conversation);
        }
        catch (error) {
            console.error('❌ getConversationWithMessages error:', error);
            reject(error);
        }
    }));
}
function getLatestConversation(userId, language) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        try {
            if (!supabase) {
                reject(new Error('Supabase client not initialized'));
                return;
            }
            let query = supabase
                .from('conversations')
                .select(`
          *,
          language_dashboards!inner(language)
        `)
                .eq('user_id', userId);
            if (language) {
                query = query.eq('language_dashboards.language', language);
            }
            const { data, error } = yield query
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
            if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
                console.error('❌ Supabase getLatestConversation error:', error);
                reject(error);
            }
            else {
                if (data) {
                    // Parse JSON fields
                    const conversation = data;
                    if (conversation.topics) {
                        try {
                            conversation.topics = JSON.parse(conversation.topics);
                        }
                        catch (e) {
                            conversation.topics = [];
                        }
                    }
                    if (conversation.learning_goals) {
                        try {
                            conversation.learning_goals = JSON.parse(conversation.learning_goals);
                        }
                        catch (e) {
                            conversation.learning_goals = [];
                        }
                    }
                    if (conversation.progress_data) {
                        try {
                            conversation.progress_data = JSON.parse(conversation.progress_data);
                        }
                        catch (e) {
                            conversation.progress_data = { goals: [], percentages: [] };
                        }
                    }
                    resolve(conversation);
                }
                else {
                    resolve(null);
                }
            }
        }
        catch (error) {
            console.error('❌ getLatestConversation error:', error);
            reject(error);
        }
    }));
}
function updateConversationTitle(conversationId, title) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        try {
            if (!supabase) {
                reject(new Error('Supabase client not initialized'));
                return;
            }
            const { data, error } = yield supabase
                .from('conversations')
                .update({ title: title })
                .eq('id', conversationId)
                .select();
            if (error) {
                console.error('❌ Supabase updateConversationTitle error:', error);
                reject(error);
            }
            else {
                console.log('✅ Conversation title updated successfully');
                resolve({ changes: data ? data.length : 0 });
            }
        }
        catch (error) {
            console.error('❌ updateConversationTitle error:', error);
            reject(error);
        }
    }));
}
function updateConversationSynopsis(conversationId, synopsis, progressData) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        try {
            if (!supabase) {
                reject(new Error('Supabase client not initialized'));
                return;
            }
            const updateData = {
                synopsis: synopsis
            };
            if (progressData) {
                updateData.progress_data = progressData;
            }
            const { data, error } = yield supabase
                .from('conversations')
                .update(updateData)
                .eq('id', conversationId)
                .select();
            if (error) {
                console.error('❌ Supabase updateConversationSynopsis error:', error);
                reject(error);
            }
            else {
                console.log('✅ Conversation synopsis updated successfully');
                resolve({ changes: data ? data.length : 0 });
            }
        }
        catch (error) {
            console.error('❌ updateConversationSynopsis error:', error);
            reject(error);
        }
    }));
}
function deleteConversation(conversationId) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        try {
            if (!supabase) {
                reject(new Error('Supabase client not initialized'));
                return;
            }
            // First delete all messages in the conversation
            const { error: messagesError } = yield supabase
                .from('messages')
                .delete()
                .eq('conversation_id', conversationId);
            if (messagesError) {
                console.error('❌ Error deleting messages:', messagesError);
                reject(messagesError);
                return;
            }
            // Then delete the conversation
            const { data, error } = yield supabase
                .from('conversations')
                .delete()
                .eq('id', conversationId)
                .select();
            if (error) {
                console.error('❌ Supabase deleteConversation error:', error);
                reject(error);
            }
            else {
                console.log('✅ Conversation deleted successfully');
                resolve({ changes: data ? data.length : 0 });
            }
        }
        catch (error) {
            console.error('❌ deleteConversation error:', error);
            reject(error);
        }
    }));
}
function updateConversationPersona(conversationId, usesPersona, personaId) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        try {
            if (!supabase) {
                reject(new Error('Supabase client not initialized'));
                return;
            }
            const updateData = {
                uses_persona: usesPersona
            };
            if (personaId !== undefined) {
                updateData.persona_id = personaId;
            }
            const { data, error } = yield supabase
                .from('conversations')
                .update(updateData)
                .eq('id', conversationId)
                .select();
            if (error) {
                console.error('❌ Supabase updateConversationPersona error:', error);
                reject(error);
            }
            else {
                console.log('✅ Conversation persona updated successfully');
                resolve({ changes: data ? data.length : 0 });
            }
        }
        catch (error) {
            console.error('❌ updateConversationPersona error:', error);
            reject(error);
        }
    }));
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
function createLanguageDashboard(userId, language, proficiencyLevel, talkTopics, learningGoals, practicePreference, feedbackLanguage = 'en', isPrimary = false) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        try {
            if (!supabase) {
                reject(new Error('Supabase client not initialized'));
                return;
            }
            // Convert arrays to JSON strings for database storage
            const { data, error } = yield supabase
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
            }
            else {
                console.log('✅ Language dashboard created successfully');
                resolve(data);
            }
        }
        catch (error) {
            console.error('❌ createLanguageDashboard error:', error);
            reject(error);
        }
    }));
}
function getUserLanguageDashboards(userId) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        try {
            if (!supabase) {
                reject(new Error('Supabase client not initialized'));
                return;
            }
            const { data, error } = yield supabase
                .from('language_dashboards')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
            if (error) {
                console.error('❌ Supabase getUserLanguageDashboards error:', error);
                reject(error);
            }
            else {
                // Parse JSON fields for each dashboard
                const dashboards = (data || []).map(dashboard => {
                    if (dashboard.talk_topics) {
                        try {
                            dashboard.talk_topics = JSON.parse(dashboard.talk_topics);
                        }
                        catch (e) {
                            dashboard.talk_topics = [];
                        }
                    }
                    if (dashboard.learning_goals) {
                        try {
                            dashboard.learning_goals = JSON.parse(dashboard.learning_goals);
                        }
                        catch (e) {
                            dashboard.learning_goals = [];
                        }
                    }
                    return dashboard;
                });
                resolve(dashboards);
            }
        }
        catch (error) {
            console.error('❌ getUserLanguageDashboards error:', error);
            reject(error);
        }
    }));
}
function getLanguageDashboard(userId, language) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        try {
            if (!supabase) {
                reject(new Error('Supabase client not initialized'));
                return;
            }
            const { data, error } = yield supabase
                .from('language_dashboards')
                .select('*')
                .eq('user_id', userId)
                .eq('language', language)
                .single();
            if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
                console.error('❌ Supabase getLanguageDashboard error:', error);
                reject(error);
            }
            else {
                if (data) {
                    // Parse JSON fields
                    const dashboard = data;
                    if (dashboard.talk_topics) {
                        try {
                            dashboard.talk_topics = JSON.parse(dashboard.talk_topics);
                        }
                        catch (e) {
                            dashboard.talk_topics = [];
                        }
                    }
                    if (dashboard.learning_goals) {
                        try {
                            dashboard.learning_goals = JSON.parse(dashboard.learning_goals);
                        }
                        catch (e) {
                            dashboard.learning_goals = [];
                        }
                    }
                    resolve(dashboard);
                }
                else {
                    resolve(null);
                }
            }
        }
        catch (error) {
            console.error('❌ getLanguageDashboard error:', error);
            reject(error);
        }
    }));
}
function updateLanguageDashboard(userId, language, updates) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        try {
            if (!supabase) {
                reject(new Error('Supabase client not initialized'));
                return;
            }
            // Handle JSON fields
            const processedUpdates = Object.assign({}, updates);
            if (processedUpdates.talk_topics) {
                processedUpdates.talk_topics = JSON.stringify(processedUpdates.talk_topics);
            }
            if (processedUpdates.learning_goals) {
                processedUpdates.learning_goals = JSON.stringify(processedUpdates.learning_goals);
            }
            const { data, error } = yield supabase
                .from('language_dashboards')
                .update(processedUpdates)
                .eq('user_id', userId)
                .eq('language', language)
                .select();
            if (error) {
                console.error('❌ Supabase updateLanguageDashboard error:', error);
                reject(error);
            }
            else {
                console.log('✅ Language dashboard updated successfully');
                resolve({ changes: data ? data.length : 0 });
            }
        }
        catch (error) {
            console.error('❌ updateLanguageDashboard error:', error);
            reject(error);
        }
    }));
}
function deleteLanguageDashboard(userId, language) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        try {
            if (!supabase) {
                reject(new Error('Supabase client not initialized'));
                return;
            }
            const { data, error } = yield supabase
                .from('language_dashboards')
                .delete()
                .eq('user_id', userId)
                .eq('language', language)
                .select();
            if (error) {
                console.error('❌ Supabase deleteLanguageDashboard error:', error);
                reject(error);
            }
            else {
                console.log('✅ Language dashboard deleted successfully');
                resolve({ changes: data ? data.length : 0 });
            }
        }
        catch (error) {
            console.error('❌ deleteLanguageDashboard error:', error);
            reject(error);
        }
    }));
}
function getUserStreak(userId, language) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        try {
            if (!supabase) {
                reject(new Error('Supabase client not initialized'));
                return;
            }
            // Get conversations for this user and language
            const { data: conversations, error: conversationsError } = yield supabase
                .from('conversations')
                .select(`
          id,
          language_dashboards!inner(language)
        `)
                .eq('user_id', userId)
                .eq('language_dashboards.language', language)
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
            const conversationDates = conversations.map((conv) => {
                const date = new Date(conv.created_at);
                date.setHours(0, 0, 0, 0);
                return date;
            });
            // Remove duplicates and sort by date (newest first)
            const uniqueDates = [...new Set(conversationDates.map((d) => d.getTime()))]
                .map((time) => new Date(time))
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
                }
                else if (daysDiff < consecutiveDays) {
                    // This conversation is from a future date (shouldn't happen with sorted data)
                    continue;
                }
                else {
                    // Gap found, streak is broken
                    break;
                }
            }
            streak = consecutiveDays;
            console.log('✅ User streak calculated:', streak);
            resolve({ streak });
        }
        catch (error) {
            console.error('❌ getUserStreak error:', error);
            reject(error);
        }
    }));
}
// Persona functions
function createPersona(userId, personaData) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        try {
            if (!supabase) {
                reject(new Error('Supabase client not initialized'));
                return;
            }
            const { data, error } = yield supabase
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
            }
            else {
                console.log('✅ Persona created successfully');
                resolve(data);
            }
        }
        catch (error) {
            console.error('❌ createPersona error:', error);
            reject(error);
        }
    }));
}
function getUserPersonas(userId) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        try {
            if (!supabase) {
                reject(new Error('Supabase client not initialized'));
                return;
            }
            const { data, error } = yield supabase
                .from('personas')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
            if (error) {
                console.error('❌ Supabase getUserPersonas error:', error);
                reject(error);
            }
            else {
                // Parse JSON fields for each persona
                const personas = (data || []).map(persona => {
                    if (persona.topics) {
                        try {
                            persona.topics = JSON.parse(persona.topics);
                        }
                        catch (e) {
                            persona.topics = [];
                        }
                    }
                    return persona;
                });
                resolve(personas);
            }
        }
        catch (error) {
            console.error('❌ getUserPersonas error:', error);
            reject(error);
        }
    }));
}
function deletePersona(personaId) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        try {
            if (!supabase) {
                reject(new Error('Supabase client not initialized'));
                return;
            }
            const { data, error } = yield supabase
                .from('personas')
                .delete()
                .eq('id', personaId)
                .select();
            if (error) {
                console.error('❌ Supabase deletePersona error:', error);
                reject(error);
            }
            else {
                console.log('✅ Persona deleted successfully');
                resolve({ changes: data ? data.length : 0 });
            }
        }
        catch (error) {
            console.error('❌ deletePersona error:', error);
            reject(error);
        }
    }));
}
