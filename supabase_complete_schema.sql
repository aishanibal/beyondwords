-- Complete Supabase Schema for BeyondWords Project
-- Converted from SQLite to PostgreSQL with RLS policies

-- Enable UUID extension for auth.users references
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 1. WAITLIST EMAILS TABLE
CREATE TABLE IF NOT EXISTS waitlist_emails (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  source VARCHAR(100) DEFAULT 'website',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for waitlist_emails
CREATE INDEX IF NOT EXISTS idx_waitlist_emails_email ON waitlist_emails(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_emails_created_at ON waitlist_emails(created_at);

-- Enable RLS for waitlist_emails
ALTER TABLE waitlist_emails ENABLE ROW LEVEL SECURITY;

-- Create policies for waitlist_emails
CREATE POLICY "Allow public insert" ON waitlist_emails
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated read" ON waitlist_emails
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create trigger for waitlist_emails
CREATE TRIGGER update_waitlist_emails_updated_at
  BEFORE UPDATE ON waitlist_emails
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 2. USERS TABLE (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  google_id VARCHAR(255) UNIQUE,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash TEXT,
  role VARCHAR(50) DEFAULT 'user',
  target_language VARCHAR(10),
  proficiency_level VARCHAR(50),
  talk_topics JSONB DEFAULT '[]',
  learning_goals JSONB DEFAULT '[]',
  practice_preference VARCHAR(100),
  motivation TEXT,
  preferences JSONB DEFAULT '{}',
  onboarding_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- Enable RLS for users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for users
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create trigger for users
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 3. SESSIONS TABLE
CREATE TABLE IF NOT EXISTS sessions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chat_history JSONB DEFAULT '[]',
  language VARCHAR(10) DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for sessions
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

-- Enable RLS for sessions
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for sessions
CREATE POLICY "Users can view their own sessions" ON sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions" ON sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions" ON sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for sessions
CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. LANGUAGE DASHBOARDS TABLE
CREATE TABLE IF NOT EXISTS language_dashboards (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  language VARCHAR(10) NOT NULL,
  proficiency_level VARCHAR(50),
  talk_topics JSONB DEFAULT '[]',
  learning_goals JSONB DEFAULT '[]',
  practice_preference VARCHAR(100),
  feedback_language VARCHAR(10) DEFAULT 'en',
  speak_speed REAL DEFAULT 1.0,
  romanization_display VARCHAR(20) DEFAULT 'both',
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, language)
);

-- Create indexes for language_dashboards
CREATE INDEX IF NOT EXISTS idx_language_dashboards_user_id ON language_dashboards(user_id);
CREATE INDEX IF NOT EXISTS idx_language_dashboards_user_language ON language_dashboards(user_id, language);

-- Enable RLS for language_dashboards
ALTER TABLE language_dashboards ENABLE ROW LEVEL SECURITY;

-- Create policies for language_dashboards
CREATE POLICY "Users can view their own language dashboards" ON language_dashboards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own language dashboards" ON language_dashboards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own language dashboards" ON language_dashboards
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own language dashboards" ON language_dashboards
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for language_dashboards
CREATE TRIGGER update_language_dashboards_updated_at
  BEFORE UPDATE ON language_dashboards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. PERSONAS TABLE
CREATE TABLE IF NOT EXISTS personas (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  topics JSONB DEFAULT '[]',
  formality VARCHAR(50) DEFAULT 'neutral',
  language VARCHAR(10) DEFAULT 'en',
  conversation_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for personas
CREATE INDEX IF NOT EXISTS idx_personas_user_id ON personas(user_id);
CREATE INDEX IF NOT EXISTS idx_personas_created_at ON personas(created_at);

-- Enable RLS for personas
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;

-- Create policies for personas
CREATE POLICY "Users can view their own personas" ON personas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own personas" ON personas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own personas" ON personas
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own personas" ON personas
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for personas
CREATE TRIGGER update_personas_updated_at
  BEFORE UPDATE ON personas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS conversations (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  language_dashboard_id BIGINT NOT NULL REFERENCES language_dashboards(id) ON DELETE CASCADE,
  title VARCHAR(255),
  topics JSONB DEFAULT '[]',
  formality VARCHAR(50),
  description TEXT,
  synopsis TEXT,
  message_count INTEGER DEFAULT 0,
  uses_persona BOOLEAN DEFAULT FALSE,
  persona_id BIGINT REFERENCES personas(id) ON DELETE SET NULL,
  progress_data JSONB DEFAULT '{}',
  learning_goals JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for conversations
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_language_dashboard_id ON conversations(language_dashboard_id);

-- Enable RLS for conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Create policies for conversations
CREATE POLICY "Users can view their own conversations" ON conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" ON conversations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations" ON conversations
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for conversations
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender VARCHAR(50) NOT NULL,
  text TEXT NOT NULL,
  romanized_text TEXT,
  message_type VARCHAR(20) DEFAULT 'text',
  audio_file_path TEXT,
  detailed_feedback TEXT,
  message_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Enable RLS for messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies for messages (users can only access messages from their conversations)
CREATE POLICY "Users can view messages from their conversations" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages to their conversations" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update messages from their conversations" ON messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages from their conversations" ON messages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id = auth.uid()
    )
  );

-- Create analytics view for waitlist
CREATE OR REPLACE VIEW waitlist_analytics AS
SELECT 
  DATE(created_at) as signup_date,
  source,
  COUNT(*) as signups
FROM waitlist_emails
GROUP BY DATE(created_at), source
ORDER BY signup_date DESC; 