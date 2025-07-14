-- Safe schema creation - only creates tables that don't exist

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT,
  gender TEXT,
  date_of_birth DATE,
  phone_number TEXT UNIQUE
);

-- 2. Conversation sparks table
CREATE TABLE IF NOT EXISTS conversation_sparks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spark_text TEXT NOT NULL UNIQUE
);

-- 3. Circles table
CREATE TABLE IF NOT EXISTS circles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  time_slot TIMESTAMPTZ NOT NULL,
  location_id UUID REFERENCES locations(id),
  conversation_spark_id UUID REFERENCES conversation_sparks(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('forming', 'active', 'completed', 'cancelled')),
  max_participants INTEGER DEFAULT 4,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Circle members table
CREATE TABLE IF NOT EXISTS circle_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(circle_id, user_id)
);

-- 5. Waitlist entries table
CREATE TABLE IF NOT EXISTS waitlist_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  time_slot TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, time_slot)
);

-- 6. User interests table
CREATE TABLE IF NOT EXISTS user_interests (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  interest_type TEXT NOT NULL,
  PRIMARY KEY (user_id, interest_type)
);

-- Insert conversation sparks (ignore conflicts)
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