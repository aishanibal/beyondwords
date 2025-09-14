-- Migration: add language column to conversations table (Supabase/PostgREST)
-- Run this in your Supabase SQL editor

ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS language TEXT;

CREATE INDEX IF NOT EXISTS idx_conversations_language ON conversations(language);





