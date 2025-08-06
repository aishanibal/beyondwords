-- Update Supabase Schema for BeyondWords Project
-- Run this after the previous scripts to update existing tables

-- 1. Update users table to use integer IDs instead of UUIDs
-- First, create a new users table with the correct structure
CREATE TABLE IF NOT EXISTS users_new (
  id BIGSERIAL PRIMARY KEY,
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

-- 2. Copy data from old users table to new one (if it exists)
-- This will preserve existing user data
INSERT INTO users_new (google_id, email, name, password_hash, role, target_language, proficiency_level, talk_topics, learning_goals, practice_preference, motivation, preferences, onboarding_complete, created_at, updated_at)
SELECT google_id, email, name, password_hash, role, target_language, proficiency_level, talk_topics, learning_goals, practice_preference, motivation, preferences, onboarding_complete, created_at, updated_at
FROM users
ON CONFLICT (email) DO NOTHING;

-- 3. Drop the old users table and rename the new one
DROP TABLE IF EXISTS users CASCADE;
ALTER TABLE users_new RENAME TO users;

-- 4. Update foreign key references in other tables with proper type casting
-- Update sessions table
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_user_id_fkey;
ALTER TABLE sessions ALTER COLUMN user_id TYPE BIGINT USING user_id::BIGINT;
ALTER TABLE sessions ADD CONSTRAINT sessions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Update language_dashboards table
ALTER TABLE language_dashboards DROP CONSTRAINT IF EXISTS language_dashboards_user_id_fkey;
ALTER TABLE language_dashboards ALTER COLUMN user_id TYPE BIGINT USING user_id::BIGINT;
ALTER TABLE language_dashboards ADD CONSTRAINT language_dashboards_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Update personas table
ALTER TABLE personas DROP CONSTRAINT IF EXISTS personas_user_id_fkey;
ALTER TABLE personas ALTER COLUMN user_id TYPE BIGINT USING user_id::BIGINT;
ALTER TABLE personas ADD CONSTRAINT personas_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Update conversations table
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_user_id_fkey;
ALTER TABLE conversations ALTER COLUMN user_id TYPE BIGINT USING user_id::BIGINT;
ALTER TABLE conversations ADD CONSTRAINT conversations_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 5. Disable RLS on all tables since we're handling auth ourselves
ALTER TABLE waitlist_emails DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE language_dashboards DISABLE ROW LEVEL SECURITY;
ALTER TABLE personas DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- 6. Create/update triggers for updated_at columns
CREATE OR REPLACE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_language_dashboards_updated_at
  BEFORE UPDATE ON language_dashboards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_personas_updated_at
  BEFORE UPDATE ON personas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_language_dashboards_user_id ON language_dashboards(user_id);
CREATE INDEX IF NOT EXISTS idx_language_dashboards_user_language ON language_dashboards(user_id, language);
CREATE INDEX IF NOT EXISTS idx_personas_user_id ON personas(user_id);
CREATE INDEX IF NOT EXISTS idx_personas_created_at ON personas(created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_language_dashboard_id ON conversations(language_dashboard_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- 8. Update the analytics view
CREATE OR REPLACE VIEW waitlist_analytics AS
SELECT 
  DATE(created_at) as signup_date,
  source,
  COUNT(*) as signups
FROM waitlist_emails
GROUP BY DATE(created_at), source
ORDER BY signup_date DESC;

-- 9. Verify the changes
SELECT 'Schema update completed successfully' as status; 