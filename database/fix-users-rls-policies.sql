-- Fix RLS policies for users table
-- Add policies to allow authenticated users to read and update their own profiles

-- Allow authenticated users to read their own user record
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT TO authenticated USING (auth.uid() = id);

-- Allow authenticated users to update their own user record
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Allow authenticated users to insert their own user record (for profile creation)
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

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