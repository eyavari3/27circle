-- Add missing columns to users table
-- Run this SQL in your Supabase SQL editor

-- Add the missing columns if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_id TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS location TEXT DEFAULT 'Stanford University';
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Add index for efficient test user queries
CREATE INDEX IF NOT EXISTS idx_users_is_test ON users(is_test) WHERE is_test = true;
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);

-- Update existing users to have auth_id = id for consistency
UPDATE users SET auth_id = id WHERE auth_id IS NULL;