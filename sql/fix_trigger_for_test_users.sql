-- Fix the handle_new_user trigger to work with new users table schema
-- Run this SQL in your Supabase SQL editor

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create updated function that handles new schema
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Create profile for new schema
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  
  -- Create user for codebase compatibility with new columns
  INSERT INTO public.users (id, phone_number, auth_id, is_test, created_at)
  VALUES (
    new.id, 
    new.phone,
    new.id,  -- auth_id is the same as id for real users
    COALESCE((new.user_metadata->>'is_test_user')::boolean, false),  -- Extract from metadata
    NOW()
  );
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();