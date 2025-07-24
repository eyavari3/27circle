-- Complete fix for users table RLS policies
-- This script drops ALL existing policies and creates new ones

-- First, drop ALL existing policies on the users table
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable update own profile" ON users;
DROP POLICY IF EXISTS "Service role bypass" ON users;
DROP POLICY IF EXISTS "Service role can do everything on users" ON users;

-- Now create the new policies
CREATE POLICY "Enable insert for authenticated users" ON users
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable select for authenticated users" ON users
FOR SELECT TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Enable update own profile" ON users
FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Ensure service role can bypass RLS
CREATE POLICY "Service role bypass" ON users
FOR ALL
USING (auth.role() = 'service_role');

-- Verify the policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname; 