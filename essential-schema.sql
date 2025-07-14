-- Essential tables for testing the matching algorithm

-- 1. Users table (extends auth.users) - CODEBASE COMPATIBILITY
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT,
  gender TEXT,
  date_of_birth DATE,
  phone_number TEXT UNIQUE
);

-- 2. Locations table (Stanford campus locations)
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Conversation sparks table (alias for codebase compatibility)
CREATE TABLE conversation_sparks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spark_text TEXT NOT NULL UNIQUE
);

-- 4. Circles table (formed groups)
CREATE TABLE circles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  time_slot TIMESTAMPTZ NOT NULL,
  location_id UUID REFERENCES locations(id),
  conversation_spark_id UUID REFERENCES conversation_sparks(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('forming', 'active', 'completed', 'cancelled')),
  max_participants INTEGER DEFAULT 4,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Circle members table (who's in each circle)
CREATE TABLE circle_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(circle_id, user_id)
);

-- 6. Waitlist entries table (for existing codebase)
CREATE TABLE waitlist_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  time_slot TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, time_slot)
);

-- 7. User interests table (for existing codebase)
CREATE TABLE user_interests (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  interest_type TEXT NOT NULL,
  PRIMARY KEY (user_id, interest_type)
);

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