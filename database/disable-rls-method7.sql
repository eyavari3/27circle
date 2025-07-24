-- METHOD 7 IMPLEMENTATION: DISABLE RLS FOR MVP
-- 
-- Disabling Row Level Security for 100 trusted Stanford users
-- This simplifies development and eliminates localStorage complexity
-- RLS can be re-enabled when scaling beyond MVP

-- Disable RLS on core tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE circles DISABLE ROW LEVEL SECURITY;
ALTER TABLE circle_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE feedback DISABLE ROW LEVEL SECURITY;

-- Also disable on supporting tables for completeness
ALTER TABLE locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_sparks DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN (
        'users', 
        'waitlist_entries', 
        'circles', 
        'circle_members', 
        'feedback',
        'locations',
        'conversation_sparks',
        'user_interests'
    )
ORDER BY tablename;