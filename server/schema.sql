-- SQLite schema for BeyondWords project

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  google_id TEXT UNIQUE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT,
  role TEXT DEFAULT 'user',
  target_language TEXT,
  proficiency_level TEXT,
  talk_topics TEXT, -- JSON array
  learning_goals TEXT, -- JSON array
  practice_preference TEXT,
  motivation TEXT,
  preferences TEXT, -- JSON object for user preferences (theme, notifications, etc.)
  onboarding_complete BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  chat_history TEXT, -- JSON array
  language TEXT DEFAULT 'en',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS language_dashboards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  language TEXT NOT NULL,
  proficiency_level TEXT,
  talk_topics TEXT, -- JSON array
  learning_goals TEXT, -- JSON array
  practice_preference TEXT,
  feedback_language TEXT DEFAULT 'en',
  speak_speed REAL DEFAULT 1.0,
  romanization_display TEXT DEFAULT 'both', -- 'both', 'script_only', 'romanized_only'
  is_primary BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id),
  UNIQUE(user_id, language)
);

CREATE TABLE IF NOT EXISTS personas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  topics TEXT, -- JSON array
  formality TEXT,
  language TEXT,
  conversation_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  language_dashboard_id INTEGER NOT NULL,
  title TEXT,
  topics TEXT, -- JSON array
  formality TEXT,
  description TEXT,
  synopsis TEXT,
  message_count INTEGER DEFAULT 0,
  uses_persona BOOLEAN DEFAULT FALSE,
  persona_id INTEGER,
  progress_data TEXT, -- JSON object
  learning_goals TEXT, -- JSON array
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id),
  FOREIGN KEY (language_dashboard_id) REFERENCES language_dashboards (id),
  FOREIGN KEY (persona_id) REFERENCES personas (id)
);

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
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_language_dashboards_user_id ON language_dashboards(user_id);
CREATE INDEX IF NOT EXISTS idx_language_dashboards_user_language ON language_dashboards(user_id, language);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_language_dashboard_id ON conversations(language_dashboard_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_personas_user_id ON personas(user_id); 