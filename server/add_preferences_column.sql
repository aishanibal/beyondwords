-- Add preferences column to existing users table
-- Run this script if you have an existing database without the preferences column

ALTER TABLE users ADD COLUMN preferences TEXT;

-- Update existing users with default preferences
UPDATE users SET preferences = '{"theme": "light", "notifications_enabled": true, "email_notifications": true, "language": "en"}' WHERE preferences IS NULL; 