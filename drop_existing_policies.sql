-- Drop existing policies to avoid conflicts
-- Run this first before running the main schema

-- Drop waitlist_emails policies
DROP POLICY IF EXISTS "Allow public insert" ON waitlist_emails;
DROP POLICY IF EXISTS "Allow authenticated read" ON waitlist_emails;

-- Drop users policies
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;

-- Drop language_dashboards policies
DROP POLICY IF EXISTS "Users can view their own language dashboards" ON language_dashboards;
DROP POLICY IF EXISTS "Users can insert their own language dashboards" ON language_dashboards;
DROP POLICY IF EXISTS "Users can update their own language dashboards" ON language_dashboards;
DROP POLICY IF EXISTS "Users can delete their own language dashboards" ON language_dashboards;

-- Drop personas policies
DROP POLICY IF EXISTS "Users can view their own personas" ON personas;
DROP POLICY IF EXISTS "Users can insert their own personas" ON personas;
DROP POLICY IF EXISTS "Users can update their own personas" ON personas;
DROP POLICY IF EXISTS "Users can delete their own personas" ON personas;

-- Drop conversations policies
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can insert their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can delete their own conversations" ON conversations;

-- Drop messages policies
DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;

-- Disable RLS on all tables
ALTER TABLE waitlist_emails DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE language_dashboards DISABLE ROW LEVEL SECURITY;
ALTER TABLE personas DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY; 