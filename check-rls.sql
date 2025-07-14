-- Check RLS status for all tables
SELECT 
  schemaname,
  tablename,
  rowsecurity 
FROM pg_tables 
WHERE tablename IN (
  'users', 
  'waitlist_entries', 
  'user_interests', 
  'circles', 
  'circle_members', 
  'conversation_sparks'
);

-- Also check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'users', 
  'waitlist_entries', 
  'user_interests', 
  'circles', 
  'circle_members', 
  'conversation_sparks'
);