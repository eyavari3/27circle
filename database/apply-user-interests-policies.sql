-- Apply RLS policies for user_interests table
-- Run this in Supabase SQL Editor

-- User interests policies for authenticated users
CREATE POLICY "Users can view all user interests" ON user_interests
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own user interests" ON user_interests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own user interests" ON user_interests
  FOR DELETE TO authenticated USING (auth.uid() = user_id); 