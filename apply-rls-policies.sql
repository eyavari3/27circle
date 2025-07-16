-- Apply RLS Policies to Fix Permission Errors
-- Execute this in Supabase Dashboard > SQL Editor

-- Enable RLS on all tables (if not already enabled)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_sparks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Service role can do everything on users" ON users;
DROP POLICY IF EXISTS "Service role can do everything on waitlist_entries" ON waitlist_entries;
DROP POLICY IF EXISTS "Service role can do everything on user_interests" ON user_interests;
DROP POLICY IF EXISTS "Service role can do everything on circles" ON circles;
DROP POLICY IF EXISTS "Service role can do everything on circle_members" ON circle_members;
DROP POLICY IF EXISTS "Service role can do everything on conversation_sparks" ON conversation_sparks;
DROP POLICY IF EXISTS "Authenticated users can view conversation_sparks" ON conversation_sparks;

-- Create service role policies (these allow service role to bypass RLS)
CREATE POLICY "Service role can do everything on users" ON users
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything on waitlist_entries" ON waitlist_entries
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything on user_interests" ON user_interests
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything on circles" ON circles
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything on circle_members" ON circle_members
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything on conversation_sparks" ON conversation_sparks
  FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to read conversation_sparks
CREATE POLICY "Authenticated users can view conversation_sparks" ON conversation_sparks
  FOR SELECT TO authenticated USING (true);

-- Verify policies were created
SELECT schemaname, tablename, policyname, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;