-- Comprehensive RLS Status Check for Users Table

-- 1. Check if RLS is enabled/disabled on users table
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'users'
  AND schemaname = 'public';

-- 2. List all existing policies on users table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as operation,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- 3. Check if service role can bypass RLS
SELECT 
  rolname,
  rolbypassrls
FROM pg_roles
WHERE rolname IN ('service_role', 'authenticated', 'anon');

-- 4. Test query to see if we can query users table
-- This will help determine if RLS is blocking access
SELECT COUNT(*) as user_count FROM users;

-- 5. Check for any triggers on the users table that might affect updates
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users';