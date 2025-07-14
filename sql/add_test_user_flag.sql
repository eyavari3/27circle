-- Add is_test flag to users table for test user identification
-- Run this SQL in your Supabase SQL editor

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT false;

-- Add index for efficient test user queries
CREATE INDEX IF NOT EXISTS idx_users_is_test ON users(is_test) WHERE is_test = true;

-- Optional: Add cleanup function for test users
CREATE OR REPLACE FUNCTION cleanup_test_users()
RETURNS void AS $$
BEGIN
  -- Delete test users older than 7 days
  DELETE FROM users 
  WHERE is_test = true 
    AND created_at < NOW() - INTERVAL '7 days';
  
  RAISE NOTICE 'Cleaned up old test users';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: Create a view to easily see test users
CREATE OR REPLACE VIEW test_users AS 
SELECT 
  id,
  phone_number,
  full_name,
  created_at,
  EXTRACT(days FROM NOW() - created_at) as days_old
FROM users 
WHERE is_test = true 
ORDER BY created_at DESC;