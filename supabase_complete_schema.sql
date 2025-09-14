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
  role VARCHAR(50) DEFAULT 'user',
  preferences JSONB DEFAULT '{}',
  onboarding_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for users
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Enable RLS for users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for users
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create trigger for users
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 3. LANGUAGE DASHBOARDS TABLE
CREATE TABLE IF NOT EXISTS language_dashboards (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  language VARCHAR(10) NOT NULL,
  proficiency_level VARCHAR(50),
  talk_topics JSONB DEFAULT '[]',
  learning_goals JSONB DEFAULT '[]',
  practice_preference VARCHAR(100),
  feedback_language VARCHAR(10) DEFAULT 'en',
  speak_speed INTEGER DEFAULT 1,
  romanization_display VARCHAR(20) DEFAULT 'both',
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, language)
);

-- Create indexes for language_dashboards
CREATE INDEX IF NOT EXISTS idx_language_dashboards_user_id ON language_dashboards(user_id);
CREATE INDEX IF NOT EXISTS idx_language_dashboards_language ON language_dashboards(language);
CREATE INDEX IF NOT EXISTS idx_language_dashboards_is_primary ON language_dashboards(is_primary);

-- Enable RLS for language_dashboards
ALTER TABLE language_dashboards ENABLE ROW LEVEL SECURITY;

-- Create policies for language_dashboards
CREATE POLICY "Users can view own language dashboards" ON language_dashboards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own language dashboards" ON language_dashboards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own language dashboards" ON language_dashboards
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own language dashboards" ON language_dashboards
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for language_dashboards
CREATE TRIGGER update_language_dashboards_updated_at
  BEFORE UPDATE ON language_dashboards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. PERSONAS TABLE
CREATE TABLE IF NOT EXISTS personas (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  language VARCHAR(10) NOT NULL,
  personality_traits JSONB DEFAULT '[]',
  communication_style VARCHAR(100),
  expertise_areas JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for personas
CREATE INDEX IF NOT EXISTS idx_personas_user_id ON personas(user_id);
CREATE INDEX IF NOT EXISTS idx_personas_language ON personas(language);
CREATE INDEX IF NOT EXISTS idx_personas_is_active ON personas(is_active);

-- Enable RLS for personas
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;

-- Create policies for personas
CREATE POLICY "Users can view own personas" ON personas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own personas" ON personas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own personas" ON personas
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own personas" ON personas
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for personas
CREATE TRIGGER update_personas_updated_at
  BEFORE UPDATE ON personas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS conversations (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  language VARCHAR(10) NOT NULL,
  persona_id BIGINT REFERENCES personas(id) ON DELETE SET NULL,
  title VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for conversations
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_language ON conversations(language);
CREATE INDEX IF NOT EXISTS idx_conversations_persona_id ON conversations(persona_id);
CREATE INDEX IF NOT EXISTS idx_conversations_is_active ON conversations(is_active);

-- Enable RLS for conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Create policies for conversations
CREATE POLICY "Users can view own conversations" ON conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON conversations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations" ON conversations
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for conversations
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  text TEXT NOT NULL,
  romanized_text TEXT,
  audio_url VARCHAR(500),
  feedback TEXT,
  translation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_role ON messages(role);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Enable RLS for messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies for messages
CREATE POLICY "Users can view own messages" ON messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own messages" ON messages
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own messages" ON messages
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for messages
CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. SESSIONS TABLE
CREATE TABLE IF NOT EXISTS sessions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  language VARCHAR(10) NOT NULL,
  persona_id BIGINT REFERENCES personas(id) ON DELETE SET NULL,
  chat_history JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for sessions
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_language ON sessions(language);
CREATE INDEX IF NOT EXISTS idx_sessions_persona_id ON sessions(persona_id);
CREATE INDEX IF NOT EXISTS idx_sessions_is_active ON sessions(is_active);

-- Enable RLS for sessions
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for sessions
CREATE POLICY "Users can view own sessions" ON sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for sessions
CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 8. USER PROGRESS TABLE
CREATE TABLE IF NOT EXISTS user_progress (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  language VARCHAR(10) NOT NULL,
  total_sessions INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  total_time_minutes INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, language)
);

-- Create indexes for user_progress
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_language ON user_progress(language);
CREATE INDEX IF NOT EXISTS idx_user_progress_last_activity ON user_progress(last_activity_date);

-- Enable RLS for user_progress
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Create policies for user_progress
CREATE POLICY "Users can view own progress" ON user_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON user_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON user_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- Create trigger for user_progress
CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON user_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 9. FEEDBACK TABLE
CREATE TABLE IF NOT EXISTS feedback (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_id BIGINT REFERENCES messages(id) ON DELETE CASCADE,
  feedback_type VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for feedback
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_message_id ON feedback(message_id);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON feedback(rating);

-- Enable RLS for feedback
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Create policies for feedback
CREATE POLICY "Users can view own feedback" ON feedback
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feedback" ON feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own feedback" ON feedback
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own feedback" ON feedback
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for feedback
CREATE TRIGGER update_feedback_updated_at
  BEFORE UPDATE ON feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 10. SYSTEM SETTINGS TABLE
CREATE TABLE IF NOT EXISTS system_settings (
  id BIGSERIAL PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for system_settings
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);

-- Enable RLS for system_settings
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for system_settings (admin only)
CREATE POLICY "Only admins can view system settings" ON system_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Only admins can update system settings" ON system_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Create trigger for system_settings
CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('default_languages', '["en", "es", "fr", "zh", "ja", "ko", "tl", "hi", "ml", "ta", "or"]', 'Default supported languages'),
('max_sessions_per_user', '100', 'Maximum number of active sessions per user'),
('max_messages_per_conversation', '1000', 'Maximum number of messages per conversation'),
('session_timeout_minutes', '30', 'Session timeout in minutes'),
('feedback_enabled', 'true', 'Whether feedback collection is enabled'),
('analytics_enabled', 'true', 'Whether analytics collection is enabled')
ON CONFLICT (setting_key) DO NOTHING;

-- Create views for common queries
CREATE OR REPLACE VIEW user_dashboard_summary AS
SELECT 
  u.id,
  u.name,
  u.email,
  u.role,
  u.onboarding_complete,
  COUNT(DISTINCT ld.id) as language_count,
  COUNT(DISTINCT c.id) as conversation_count,
  COUNT(DISTINCT s.id) as session_count,
  MAX(s.updated_at) as last_activity
FROM users u
LEFT JOIN language_dashboards ld ON u.id = ld.user_id
LEFT JOIN conversations c ON u.id = c.user_id
LEFT JOIN sessions s ON u.id = s.user_id
GROUP BY u.id, u.name, u.email, u.role, u.onboarding_complete;

-- Create view for language statistics
CREATE OR REPLACE VIEW language_stats AS
SELECT 
  ld.language,
  COUNT(DISTINCT ld.user_id) as user_count,
  COUNT(DISTINCT c.id) as conversation_count,
  COUNT(DISTINCT m.id) as message_count,
  AVG(up.current_streak) as avg_streak
FROM language_dashboards ld
LEFT JOIN conversations c ON ld.user_id = c.user_id AND ld.language = c.language
LEFT JOIN messages m ON c.id = m.conversation_id
LEFT JOIN user_progress up ON ld.user_id = up.user_id AND ld.language = up.language
GROUP BY ld.language;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, name, role)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name', 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create function to get user streak
CREATE OR REPLACE FUNCTION get_user_streak(user_uuid UUID, lang VARCHAR(10))
RETURNS INTEGER AS $$
DECLARE
  streak_count INTEGER := 0;
  current_date DATE := CURRENT_DATE;
  last_activity DATE;
BEGIN
  -- Get last activity date for the user and language
  SELECT last_activity_date INTO last_activity
  FROM user_progress
  WHERE user_id = user_uuid AND language = lang;
  
  -- If no activity, return 0
  IF last_activity IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Calculate streak
  WHILE last_activity >= current_date - INTERVAL '1 day' * streak_count LOOP
    streak_count := streak_count + 1;
  END LOOP;
  
  RETURN streak_count - 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update user progress
CREATE OR REPLACE FUNCTION update_user_progress(
  user_uuid UUID,
  lang VARCHAR(10),
  session_duration INTEGER DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_progress (user_id, language, total_sessions, total_messages, total_time_minutes, current_streak, longest_streak, last_activity_date)
  VALUES (user_uuid, lang, 1, 0, session_duration, 1, 1, CURRENT_DATE)
  ON CONFLICT (user_id, language)
  DO UPDATE SET
    total_sessions = user_progress.total_sessions + 1,
    total_time_minutes = user_progress.total_time_minutes + session_duration,
    current_streak = get_user_streak(user_uuid, lang),
    longest_streak = GREATEST(user_progress.longest_streak, get_user_streak(user_uuid, lang)),
    last_activity_date = CURRENT_DATE,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

