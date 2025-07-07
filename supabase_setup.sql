-- Create the waitlist_emails table
CREATE TABLE IF NOT EXISTS waitlist_emails (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  source VARCHAR(100) DEFAULT 'website',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_waitlist_emails_email ON waitlist_emails(email);

-- Create an index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_waitlist_emails_created_at ON waitlist_emails(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE waitlist_emails ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anyone to insert (for waitlist signups)
CREATE POLICY "Allow public insert" ON waitlist_emails
  FOR INSERT WITH CHECK (true);

-- Create a policy that allows authenticated users to read (for admin purposes)
CREATE POLICY "Allow authenticated read" ON waitlist_emails
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create a function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update updated_at
CREATE TRIGGER update_waitlist_emails_updated_at
  BEFORE UPDATE ON waitlist_emails
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Optional: Create a view for analytics
CREATE OR REPLACE VIEW waitlist_analytics AS
SELECT 
  DATE(created_at) as signup_date,
  source,
  COUNT(*) as signups
FROM waitlist_emails
GROUP BY DATE(created_at), source
ORDER BY signup_date DESC; 