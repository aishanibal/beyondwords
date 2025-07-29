-- Create personas table
CREATE TABLE IF NOT EXISTS personas (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  topics TEXT[] DEFAULT '{}',
  formality VARCHAR(50) DEFAULT 'neutral',
  language VARCHAR(10) DEFAULT 'en',
  conversation_summary TEXT,
  conversation_id VARCHAR(255),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_personas_user_id ON personas(user_id);
CREATE INDEX IF NOT EXISTS idx_personas_created_at ON personas(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to only see their own personas
CREATE POLICY "Users can view their own personas" ON personas
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own personas
CREATE POLICY "Users can insert their own personas" ON personas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own personas
CREATE POLICY "Users can update their own personas" ON personas
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own personas
CREATE POLICY "Users can delete their own personas" ON personas
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_personas_updated_at 
  BEFORE UPDATE ON personas 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column(); 