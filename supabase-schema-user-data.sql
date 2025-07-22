-- ===================================================================
-- USER DATA STORAGE TABLE - localStorage Replacement
-- ===================================================================
-- This replaces ALL localStorage usage with a simple, flexible table
-- Run this in your Supabase SQL Editor

-- Create the user_data table
CREATE TABLE user_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL, -- Can be auth ID or session ID for anonymous users
  key TEXT NOT NULL, -- Storage key (e.g., 'feedback-data', 'preferences', 'onboarding-state')
  value JSONB NOT NULL, -- Flexible JSON storage for any data type
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, key) -- One value per key per user
);

-- Disable RLS for MVP simplicity (following existing app pattern)
ALTER TABLE user_data DISABLE ROW LEVEL SECURITY;

-- Performance index for fast lookups
CREATE INDEX idx_user_data_lookup ON user_data(user_id, key);

-- Optional: Add index for cleanup queries by date
CREATE INDEX idx_user_data_created ON user_data(created_at);

-- ===================================================================
-- VERIFICATION QUERIES (Optional - for testing)
-- ===================================================================

-- Insert test data
INSERT INTO user_data (user_id, key, value) VALUES
  ('test-user-1', 'preferences', '{"theme": "dark", "notifications": true}'),
  ('test-user-1', 'feedback-2025-07-21_11AM', '{"rating": 5, "comment": "Great!"}'),
  ('session-abc123', 'onboarding-state', '{"step": 2, "completed": false}');

-- Verify data was inserted correctly
SELECT user_id, key, value, created_at FROM user_data ORDER BY created_at;

-- Test upsert functionality (should update existing records)
INSERT INTO user_data (user_id, key, value) VALUES
  ('test-user-1', 'preferences', '{"theme": "light", "notifications": false}')
ON CONFLICT (user_id, key) 
DO UPDATE SET 
  value = EXCLUDED.value,
  updated_at = NOW();

-- Verify upsert worked
SELECT user_id, key, value, updated_at FROM user_data WHERE user_id = 'test-user-1' AND key = 'preferences';

-- Clean up test data
DELETE FROM user_data WHERE user_id IN ('test-user-1', 'session-abc123');

-- ===================================================================
-- READY TO USE!
-- ===================================================================
-- Your user_data table is now ready to replace localStorage
-- Next step: Create the Storage utility class