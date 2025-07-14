-- TABLES

-- 1. Users table (extends auth.users) - CODEBASE COMPATIBILITY
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  auth_id TEXT UNIQUE, -- For test users who don't have real auth.users entries
  full_name TEXT,
  gender TEXT,
  date_of_birth DATE,
  phone_number TEXT UNIQUE,
  location TEXT DEFAULT 'Stanford University',
  is_test BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1b. Profiles table (extends auth.users) - NEW SCHEMA
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT, -- Nullable for initial signup
  phone TEXT,
  gender TEXT,
  date_of_birth DATE,
  location TEXT DEFAULT 'Stanford University',
  scientific_topics BOOLEAN DEFAULT false,
  spiritual_discussions BOOLEAN DEFAULT false,
  personal_growth BOOLEAN DEFAULT false,
  community_service BOOLEAN DEFAULT false,
  event_notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Locations table (Stanford campus locations)
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Daily events table (3 time slots per day)
CREATE TABLE daily_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_date DATE NOT NULL,
  time_slot TEXT NOT NULL CHECK (time_slot IN ('11AM', '2PM', '5PM')),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_date, time_slot)
);

-- 4. Joins table (user event participation)
CREATE TABLE joins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES daily_events(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

-- 5. Sparks table (conversation starters)
CREATE TABLE sparks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5b. Conversation sparks table (alias for codebase compatibility)
CREATE TABLE conversation_sparks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spark_text TEXT NOT NULL UNIQUE
);

-- 6. Circles table (formed groups) - ENHANCED FOR CODEBASE COMPATIBILITY
CREATE TABLE circles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES daily_events(id) ON DELETE CASCADE,
  time_slot TIMESTAMPTZ NOT NULL, -- ADDED: For codebase compatibility
  location_id UUID REFERENCES locations(id), -- ADDED: For codebase compatibility  
  conversation_spark_id UUID REFERENCES conversation_sparks(id), -- ADDED: For codebase compatibility
  status TEXT DEFAULT 'active' CHECK (status IN ('forming', 'active', 'completed', 'cancelled')), -- ADDED: For codebase compatibility
  max_participants INTEGER DEFAULT 4, -- ADDED: For codebase compatibility
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Circle members table (who's in each circle)
CREATE TABLE circle_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(circle_id, user_id)
);

-- 8. SMS attempts table (rate limiting)
CREATE TABLE sms_attempts (
  phone TEXT PRIMARY KEY,
  attempts INTEGER DEFAULT 0,
  last_attempt TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Feedback table (post-event surveys)
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES daily_events(id) ON DELETE CASCADE,
  attendance_count INTEGER CHECK (attendance_count BETWEEN 0 AND 20),
  did_not_attend BOOLEAN DEFAULT false,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  memorable_moment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

-- CODEBASE COMPATIBILITY TABLES

-- 10. Waitlist entries table (for existing codebase)
CREATE TABLE waitlist_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  time_slot TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, time_slot)
);

-- 11. User interests table (for existing codebase)
CREATE TABLE user_interests (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  interest_type TEXT NOT NULL,
  PRIMARY KEY (user_id, interest_type)
);

-- INDEXES

CREATE INDEX idx_daily_events_date_slot ON daily_events(event_date, time_slot);
CREATE INDEX idx_joins_user_id ON joins(user_id);
CREATE INDEX idx_joins_event_id ON joins(event_id);
CREATE INDEX idx_circles_event_id ON circles(event_id);
CREATE INDEX idx_circle_members_circle_id ON circle_members(circle_id);
CREATE INDEX idx_circle_members_user_id ON circle_members(user_id);
CREATE INDEX idx_sms_attempts_phone ON sms_attempts(phone);
CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_event_id ON feedback(event_id);

-- CODEBASE COMPATIBILITY INDEXES
CREATE INDEX idx_waitlist_entries_user_id ON waitlist_entries(user_id);
CREATE INDEX idx_waitlist_entries_time_slot ON waitlist_entries(time_slot);
CREATE INDEX idx_user_interests_user_id ON user_interests(user_id);
CREATE INDEX idx_circles_location_id ON circles(location_id);
CREATE INDEX idx_circles_conversation_spark_id ON circles(conversation_spark_id);

-- ROW LEVEL SECURITY (RLS) POLICIES

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE joins ENABLE ROW LEVEL SECURITY;
ALTER TABLE sparks ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_sparks ENABLE ROW LEVEL SECURITY;
ALTER TABLE circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;

-- Profiles policies (UPDATED FOR PRIVACY)
-- Users can only see profiles of people they've been in events with
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view co-attendee profiles" ON profiles
  FOR SELECT USING (
    id IN (
      SELECT DISTINCT j2.user_id
      FROM joins j1
      JOIN joins j2 ON j1.event_id = j2.event_id
      WHERE j1.user_id = auth.uid()
      AND j2.user_id != auth.uid()
    )
  );

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Locations policies
CREATE POLICY "Authenticated users can view locations" ON locations
  FOR SELECT TO authenticated USING (true);

-- Daily events policies
CREATE POLICY "Authenticated users can view daily events" ON daily_events
  FOR SELECT TO authenticated USING (true);

-- Joins policies
CREATE POLICY "Users can view all joins" ON joins
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own joins" ON joins
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own joins" ON joins
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Sparks policies
CREATE POLICY "Authenticated users can view sparks" ON sparks
  FOR SELECT TO authenticated USING (true);

-- Circles policies
CREATE POLICY "Users can view circles they're in" ON circles
  FOR SELECT USING (
    id IN (
      SELECT circle_id FROM circle_members 
      WHERE user_id = auth.uid()
    )
  );

-- Circle members policies  
CREATE POLICY "Users can view circle members in their circles" ON circle_members
  FOR SELECT USING (
    circle_id IN (
      SELECT circle_id FROM circle_members 
      WHERE user_id = auth.uid()
    )
  );

-- SMS attempts policies (no access needed - handled by Edge Functions)
-- This table is managed entirely by server-side functions

-- Feedback policies
CREATE POLICY "Users can view own feedback" ON feedback
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feedback" ON feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own feedback" ON feedback
  FOR UPDATE USING (auth.uid() = user_id); -- CORRECTED: Changed id to user_id

-- CODEBASE COMPATIBILITY POLICIES

-- Users table policies
CREATE POLICY "Users can view own user profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own user profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own user profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Waitlist entries policies
CREATE POLICY "Users can view all waitlist entries" ON waitlist_entries
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own waitlist entries" ON waitlist_entries
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own waitlist entries" ON waitlist_entries
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- User interests policies
CREATE POLICY "Users can view all user interests" ON user_interests
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own user interests" ON user_interests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own user interests" ON user_interests
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Conversation sparks policies
CREATE POLICY "Authenticated users can view conversation sparks" ON conversation_sparks
  FOR SELECT TO authenticated USING (true);

-- TRIGGERS

-- Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Create profile for new schema
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  
  -- Create user for codebase compatibility (minimal data)
  INSERT INTO public.users (id)
  VALUES (new.id);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp trigger for profiles
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- FUNCTIONS FOR EDGE FUNCTIONS

-- Service function to create daily events (called by Edge Function)
CREATE OR REPLACE FUNCTION create_tomorrow_events()
RETURNS void AS $$
DECLARE
  tomorrow DATE := CURRENT_DATE + INTERVAL '1 day';
  location_ids UUID[];
BEGIN
  -- Get 3 random locations
  SELECT ARRAY_AGG(id)
  INTO location_ids
  FROM (
    SELECT id FROM locations
    ORDER BY RANDOM()
    LIMIT 3
  ) randomized;

  -- Create events for each time slot
  INSERT INTO daily_events (event_date, time_slot, location_id)
  VALUES
    (tomorrow, '11AM', location_ids[1]),
    (tomorrow, '2PM', location_ids[2]),
    (tomorrow, '5PM', location_ids[3])
  ON CONFLICT (event_date, time_slot) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Service function to create gender-based circles
CREATE OR REPLACE FUNCTION create_circles_for_event(event_uuid UUID)
RETURNS void AS $$
DECLARE
  male_users UUID[];
  female_users UUID[];
  other_users UUID[];
  circle_uuid UUID;
  i INTEGER;
BEGIN
  -- Get users grouped by gender
  SELECT ARRAY_AGG(j.user_id)
  INTO male_users
  FROM joins j
  JOIN profiles p ON j.user_id = p.id
  WHERE j.event_id = event_uuid AND p.gender = 'male';

  SELECT ARRAY_AGG(j.user_id)
  INTO female_users
  FROM joins j
  JOIN profiles p ON j.user_id = p.id
  WHERE j.event_id = event_uuid AND p.gender = 'female';

  SELECT ARRAY_AGG(j.user_id)
  INTO other_users
  FROM joins j
  JOIN profiles p ON j.user_id = p.id
  WHERE j.event_id = event_uuid AND p.gender = 'non-binary';

  -- Create male circles (groups of 2-4)
  IF male_users IS NOT NULL THEN
    FOR i IN 1..array_length(male_users, 1) BY 4 LOOP
      circle_uuid := gen_random_uuid();
      INSERT INTO circles (id, event_id, created_at) 
      VALUES (circle_uuid, event_uuid, NOW());
      
      -- Add up to 4 users to this circle
      INSERT INTO circle_members (circle_id, user_id)
      SELECT circle_uuid, unnest(male_users[i:LEAST(i+3, array_length(male_users, 1))]);
    END LOOP;
  END IF;

  -- Create female circles (groups of 2-4)
  IF female_users IS NOT NULL THEN
    FOR i IN 1..array_length(female_users, 1) BY 4 LOOP
      circle_uuid := gen_random_uuid();
      INSERT INTO circles (id, event_id, created_at) 
      VALUES (circle_uuid, event_uuid, NOW());
      
      -- Add up to 4 users to this circle
      INSERT INTO circle_members (circle_id, user_id)
      SELECT circle_uuid, unnest(female_users[i:LEAST(i+3, array_length(female_users, 1))]);
    END LOOP;
  END IF;

  -- Create non-binary circles (groups of 2-4)
  IF other_users IS NOT NULL THEN
    FOR i IN 1..array_length(other_users, 1) BY 4 LOOP
      circle_uuid := gen_random_uuid();
      INSERT INTO circles (id, event_id, created_at) 
      VALUES (circle_uuid, event_uuid, NOW());
      
      -- Add up to 4 users to this circle
      INSERT INTO circle_members (circle_id, user_id)
      SELECT circle_uuid, unnest(other_users[i:LEAST(i+3, array_length(other_users, 1))]);
    END LOOP;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- SEED DATA WITH CONFLICT HANDLING

-- Insert Stanford locations
INSERT INTO locations (name, latitude, longitude) VALUES
  ('Old Union', 37.424946, -122.170571),
  ('Terman Engineering', 37.426078, -122.172823),
  ('Green Library', 37.426826, -122.167922),
  ('Hoover Tower', 37.427467, -122.166698),
  ('Cantor Arts Center', 37.432139, -122.170693),
  ('Memorial Court', 37.427475, -122.170290),
  ('The Oval', 37.428045, -122.169052),
  ('Rodin Sculpture Garden', 37.432301, -122.170914),
  ('Lake Lagunita', 37.423732, -122.175142),
  ('Stanford Bookstore', 37.424411, -122.169165)
ON CONFLICT (name) DO NOTHING;

-- Insert conversation sparks
INSERT INTO sparks (text) VALUES
  ('What''s one of the major problems that you see on campus?'),
  ('What''s a belief you hold that most people disagree with?'),
  ('What''s the most interesting thing you''ve learned this week?'),
  ('If you could change one thing about Stanford, what would it be?'),
  ('What''s a skill you''re currently trying to develop?'),
  ('What''s the best advice you''ve received recently?'),
  ('What project are you most excited about right now?'),
  ('What''s something you''ve changed your mind about lately?'),
  ('What''s an unpopular opinion you have about technology?'),
  ('What would you work on if resources weren''t a constraint?')
ON CONFLICT (text) DO NOTHING;

-- Insert conversation sparks for codebase compatibility
INSERT INTO conversation_sparks (spark_text) VALUES
  ('What''s one of the major problems that you see on campus?'),
  ('What''s a belief you hold that most people disagree with?'),
  ('What''s the most interesting thing you''ve learned this week?'),
  ('If you could change one thing about Stanford, what would it be?'),
  ('What''s a skill you''re currently trying to develop?'),
  ('What''s the best advice you''ve received recently?'),
  ('What project are you most excited about right now?'),
  ('What''s something you''ve changed your mind about lately?'),
  ('What''s an unpopular opinion you have about technology?'),
  ('What would you work on if resources weren''t a constraint?')
ON CONFLICT (spark_text) DO NOTHING;