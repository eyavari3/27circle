-- 27 CIRCLE DATABASE SCHEMA (ACTUAL WORKING STRUCTURE)
-- 
-- This schema reflects the actual database structure in use.
-- Key architectural decisions:
-- 1. Circles are created directly without daily_events intermediary
-- 2. Users join waitlist_entries, then matching creates circles
-- 3. Age-based matching separates users into 18-35 vs 36+ groups
-- 4. Feedback references circle_id directly
-- 
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
-- Each circle gets assigned a random location from this table
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. REMOVED: daily_events table (not used in current implementation)
-- 4. REMOVED: joins table (not used in current implementation)

-- 5. Conversation sparks table (conversation starters)
CREATE TABLE conversation_sparks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spark_text TEXT NOT NULL UNIQUE
);

-- 6. Circles table (formed groups) - ENHANCED FOR CODEBASE COMPATIBILITY
-- Each circle gets a random location and conversation spark assigned
-- Circle is the primary unit of experience in 27 Circle
CREATE TABLE circles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- 9. Feedback table (post-event surveys) - OPTIONAL
-- Users can submit feedback 20 minutes after circle ends
-- Button changes from "Confirmed" to orange "Feedback" then to "Past"
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  circle_id UUID NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  attendance_count INTEGER CHECK (attendance_count BETWEEN 0 AND 20),
  did_not_attend BOOLEAN DEFAULT false,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  memorable_moment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, circle_id)
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

-- REMOVED: Indexes for daily_events and joins tables (not used)
-- REMOVED: idx_circles_event_id (event_id column doesn't exist)
CREATE INDEX idx_circle_members_circle_id ON circle_members(circle_id);
CREATE INDEX idx_circle_members_user_id ON circle_members(user_id);
CREATE INDEX idx_sms_attempts_phone ON sms_attempts(phone);
CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_circle_id ON feedback(circle_id);

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
-- REMOVED: RLS for daily_events, joins, and sparks tables (not used)
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

-- REMOVED: Policies for daily_events, joins, and sparks tables (not used)

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
CREATE POLICY "Users can view own waitlist entries" ON waitlist_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own waitlist entries" ON waitlist_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own waitlist entries" ON waitlist_entries
  FOR DELETE USING (auth.uid() = user_id);

-- User interests policies
CREATE POLICY "Users can view own interests" ON user_interests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interests" ON user_interests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own interests" ON user_interests
  FOR DELETE USING (auth.uid() = user_id);

-- MATCHING ALGORITHM RULES
-- 
-- 1. AGE-BASED SEPARATION:
--    - Users under 18: Not allowed to join
--    - Users 18-35: One age group
--    - Users 36+: Second age group
--    - Matching happens within each age group separately
--
-- 2. GROUP SIZING LOGIC:
--    - 1 person: Gets their own circle (rare edge case)
--    - 2-4 people: Single group of that size
--    - 5 people: 3 + 2 (not 4 + 1)
--    - 6+ people: Maximize groups of 4, then 3, then 2
--    - Special case: Avoid leaving exactly 1 person
--
-- 3. LOCATION ASSIGNMENT:
--    - Each circle gets assigned a random location from locations table
--    - Different circles = different GPS coordinates
--    - Single users get their own circle with a location
--
-- 4. FEEDBACK SYSTEM:
--    - 20 minutes after circle ends: Button changes to orange "Feedback"
--    - User submits feedback: Button changes to "Past"
--    - 8 PM reset: All buttons return to "Join" for next day
--    - If user never submits feedback: Resets to "Join" at 8 PM anyway
--
-- 5. EVERYONE GETS MATCHED:
--    - No unmatched users
--    - Single users get their own circle
--    - All users get assigned a GPS location