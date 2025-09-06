-- Supabase schema for BeyondWords project
-- Run this in your Supabase SQL editor to create the tables

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, -- Using TEXT to match your current system
  google_id TEXT UNIQUE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT,
  role TEXT DEFAULT 'user',
  target_language TEXT,
  proficiency_level TEXT,
  talk_topics TEXT[], -- Array of text
  learning_goals TEXT[], -- Array of text
  practice_preference TEXT,
  motivation TEXT,
  preferences JSONB, -- JSON object for user preferences (theme, notifications, etc.)
  onboarding_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Language dashboards table
CREATE TABLE IF NOT EXISTS language_dashboards (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  proficiency_level TEXT,
  talk_topics TEXT[], -- Array of text
  learning_goals TEXT[], -- Array of text
  practice_preference TEXT,
  feedback_language TEXT DEFAULT 'en',
  speak_speed REAL DEFAULT 1.0,
  romanization_display TEXT DEFAULT 'both', -- 'both', 'script_only', 'romanized_only'
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, language)
);

-- Personas table
CREATE TABLE IF NOT EXISTS personas (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  topics TEXT[], -- Array of text
  formality TEXT,
  language TEXT,
  conversation_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  language_dashboard_id BIGINT REFERENCES language_dashboards(id) ON DELETE SET NULL,
  title TEXT,
  topics TEXT[], -- Array of text
  formality TEXT,
  description TEXT,
  synopsis TEXT,
  message_count INTEGER DEFAULT 0,
  uses_persona BOOLEAN DEFAULT FALSE,
  persona_id BIGINT REFERENCES personas(id) ON DELETE SET NULL,
  progress_data JSONB, -- JSON object
  learning_goals TEXT[], -- Array of text
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender TEXT NOT NULL,
  text TEXT NOT NULL,
  romanized_text TEXT,
  message_type TEXT DEFAULT 'text',
  audio_file_path TEXT,
  detailed_feedback TEXT,
  message_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_language_dashboards_user_id ON language_dashboards(user_id);
CREATE INDEX IF NOT EXISTS idx_language_dashboards_user_language ON language_dashboards(user_id, language);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_language_dashboard_id ON conversations(language_dashboard_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_personas_user_id ON personas(user_id);

-- Enable Row Level Security (RLS) - You can enable this later when ready
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE language_dashboards ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (commented out since you have RLS disabled)
-- CREATE POLICY "Users can only see their own data" ON users FOR ALL USING (auth.uid()::text = id);
-- CREATE POLICY "Users can only see their own dashboards" ON language_dashboards FOR ALL USING (auth.uid()::text = user_id);
-- CREATE POLICY "Users can only see their own personas" ON personas FOR ALL USING (auth.uid()::text = user_id);
-- CREATE POLICY "Users can only see their own conversations" ON conversations FOR ALL USING (auth.uid()::text = user_id);
-- CREATE POLICY "Users can only see messages from their conversations" ON messages FOR ALL USING (
--   EXISTS (SELECT 1 FROM conversations WHERE conversations.id = messages.conversation_id AND conversations.user_id = auth.uid()::text)
-- );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_language_dashboards_updated_at BEFORE UPDATE ON language_dashboards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_personas_updated_at BEFORE UPDATE ON personas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
