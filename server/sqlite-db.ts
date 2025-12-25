// SQLite database adapter for local development (bypass mode)
import sqlite3 from 'sqlite3';
import path from 'path';

// Database file path
const dbPath = path.join(__dirname, 'users.db');
let db: sqlite3.Database | null = null;

// Initialize database connection
function initDatabase(): sqlite3.Database {
  if (db) return db;

  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening SQLite database:', err.message);
      throw err;
    } else {
      console.log('✅ Connected to SQLite database:', dbPath);
      createTables();
    }
  });

  return db;
}

// Create tables if they don't exist
function createTables() {
  if (!db) return;

  db.serialize(() => {
    // Users table - using TEXT for id to match Supabase format
    db!.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
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

    // Language dashboards table
    db!.run(`
      CREATE TABLE IF NOT EXISTS language_dashboards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
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

    // Conversations table
    db!.run(`
      CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        language_dashboard_id INTEGER,
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
        FOREIGN KEY (language_dashboard_id) REFERENCES language_dashboards (id)
      )
    `);

    // Messages table
    db!.run(`
      CREATE TABLE IF NOT EXISTS messages (
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

    // Personas table
    db!.run(`
      CREATE TABLE IF NOT EXISTS personas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
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

    // Sessions table
    db!.run(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        chat_history TEXT,
        language TEXT DEFAULT 'en',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Create indexes
    db!.run('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    db!.run('CREATE INDEX IF NOT EXISTS idx_language_dashboards_user_id ON language_dashboards(user_id)');
    db!.run('CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id)');
    db!.run('CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id)');

    console.log('✅ SQLite database tables initialized');
  });
}

// Helper to promisify database operations
function dbRun(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
  return new Promise((resolve, reject) => {
    if (!db) db = initDatabase();
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function dbGet<T>(sql: string, params: any[] = []): Promise<T | null> {
  return new Promise((resolve, reject) => {
    if (!db) db = initDatabase();
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row ? (row as T) : null);
    });
  });
}

function dbAll<T>(sql: string, params: any[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    if (!db) db = initDatabase();
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows as T[]);
    });
  });
}

// Initialize on import
initDatabase();

// Export database functions matching Supabase interface
export const createLanguageDashboard = async (
  userId: string,
  language: string,
  proficiencyLevel: string,
  talkTopics: string[],
  learningGoals: string[],
  practicePreference: string,
  feedbackLanguage = 'en',
  isPrimary = false
) => {
  const topicsJson = JSON.stringify(talkTopics);
  const goalsJson = JSON.stringify(learningGoals);
  
  const sql = `
    INSERT INTO language_dashboards (user_id, language, proficiency_level, talk_topics, learning_goals, practice_preference, feedback_language, is_primary)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const result = await dbRun(sql, [userId, language, proficiencyLevel, topicsJson, goalsJson, practicePreference, feedbackLanguage, isPrimary ? 1 : 0]);
  
  return {
    id: result.lastID,
    user_id: userId,
    language,
    proficiency_level: proficiencyLevel,
    talk_topics: talkTopics,
    learning_goals: learningGoals,
    practice_preference: practicePreference,
    feedback_language: feedbackLanguage,
    is_primary: isPrimary,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
};

export const getUserLanguageDashboards = async (userId: string) => {
  const sql = `
    SELECT * FROM language_dashboards 
    WHERE user_id = ?
    ORDER BY is_primary DESC, created_at ASC
  `;
  
  const rows = await dbAll<any>(sql, [userId]);
  
  return rows.map(row => ({
    ...row,
    talk_topics: row.talk_topics ? JSON.parse(row.talk_topics) : [],
    learning_goals: row.learning_goals ? JSON.parse(row.learning_goals) : [],
    is_primary: row.is_primary === 1
  }));
};

export const getLanguageDashboard = async (userId: string, language: string) => {
  const sql = `
    SELECT * FROM language_dashboards 
    WHERE user_id = ? AND language = ?
  `;
  
  const row = await dbGet<any>(sql, [userId, language]);
  
  if (!row) return null;
  
  return {
    ...row,
    talk_topics: row.talk_topics ? JSON.parse(row.talk_topics) : [],
    learning_goals: row.learning_goals ? JSON.parse(row.learning_goals) : [],
    is_primary: row.is_primary === 1
  };
};

export const updateLanguageDashboard = async (userId: string, language: string, updates: any) => {
  const processedUpdates: any = { ...updates };
  
  // Convert arrays to JSON strings
  if (processedUpdates.talk_topics && Array.isArray(processedUpdates.talk_topics)) {
    processedUpdates.talk_topics = JSON.stringify(processedUpdates.talk_topics);
  }
  if (processedUpdates.learning_goals && Array.isArray(processedUpdates.learning_goals)) {
    processedUpdates.learning_goals = JSON.stringify(processedUpdates.learning_goals);
  }
  if (processedUpdates.is_primary !== undefined) {
    processedUpdates.is_primary = processedUpdates.is_primary ? 1 : 0;
  }
  
  const fields = Object.keys(processedUpdates).map(key => `${key} = ?`).join(', ');
  const values = Object.values(processedUpdates);
  
  const sql = `UPDATE language_dashboards SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND language = ?`;
  
  const result = await dbRun(sql, [...values, userId, language]);
  return { changes: result.changes };
};

export const deleteLanguageDashboard = async (userId: string, language: string) => {
  const sql = `DELETE FROM language_dashboards WHERE user_id = ? AND language = ?`;
  const result = await dbRun(sql, [userId, language]);
  return { changes: result.changes };
};

// User functions
export const createUser = async (userData: any) => {
  const sql = `
    INSERT OR REPLACE INTO users (id, email, name, role, onboarding_complete, updated_at)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `;
  
  await dbRun(sql, [
    userData.id || userData.userId,
    userData.email || '',
    userData.name || '',
    userData.role || 'user',
    userData.onboarding_complete ? 1 : 0
  ]);
  
  return {
    id: userData.id || userData.userId,
    email: userData.email || '',
    name: userData.name || '',
    role: userData.role || 'user',
    onboarding_complete: userData.onboarding_complete || false
  };
};

export const findUserById = async (id: string) => {
  const sql = `SELECT * FROM users WHERE id = ?`;
  const row = await dbGet<any>(sql, [id]);
  
  if (!row) return null;
  
  return {
    ...row,
    talk_topics: row.talk_topics ? JSON.parse(row.talk_topics) : [],
    learning_goals: row.learning_goals ? JSON.parse(row.learning_goals) : [],
    preferences: row.preferences ? JSON.parse(row.preferences) : {},
    onboarding_complete: row.onboarding_complete === 1
  };
};

export const updateUser = async (id: string, updates: any) => {
  const processedUpdates: any = { ...updates };
  
  if (processedUpdates.talk_topics && Array.isArray(processedUpdates.talk_topics)) {
    processedUpdates.talk_topics = JSON.stringify(processedUpdates.talk_topics);
  }
  if (processedUpdates.learning_goals && Array.isArray(processedUpdates.learning_goals)) {
    processedUpdates.learning_goals = JSON.stringify(processedUpdates.learning_goals);
  }
  if (processedUpdates.preferences) {
    processedUpdates.preferences = JSON.stringify(processedUpdates.preferences);
  }
  if (processedUpdates.onboarding_complete !== undefined) {
    processedUpdates.onboarding_complete = processedUpdates.onboarding_complete ? 1 : 0;
  }
  
  const fields = Object.keys(processedUpdates).map(key => `${key} = ?`).join(', ');
  const values = Object.values(processedUpdates);
  
  const sql = `UPDATE users SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
  const result = await dbRun(sql, [...values, id]);
  
  return {
    ...updates,
    id
  };
};

export const closeDatabase = async () => {
  if (db) {
    db.close((err) => {
      if (err) console.error('Error closing database:', err);
      else console.log('Database connection closed');
    });
    db = null;
  }
};

