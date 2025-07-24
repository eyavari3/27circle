### Database Schema

**CRITICAL**: No RLS (Row Level Security) is implemented. Database client usage is intentionally mixed:
- `createServiceClient()` for administrative operations (matching, cron jobs)
- `createClient()` for user-scoped queries with auth context

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Stanford locations (must be created before circles table)
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL
);

-- Conversation sparks (must be created before circles table)
CREATE TABLE conversation_sparks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spark_text TEXT NOT NULL UNIQUE
);

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone_number TEXT UNIQUE,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'non-binary')),
  date_of_birth DATE NOT NULL,
  interests JSONB NOT NULL DEFAULT '[]',
  location TEXT DEFAULT 'Stanford University',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Circles (with junction table for members)
CREATE TABLE circles (
  id TEXT PRIMARY KEY, -- Format: YYYY-MM-DD_11AM_Circle_1
  time_slot TIMESTAMPTZ NOT NULL,
  location_id UUID NOT NULL REFERENCES locations(id),
  conversation_spark_id UUID NOT NULL REFERENCES conversation_sparks(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'past')),
  max_participants INTEGER DEFAULT 4,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Circle members (junction table)
CREATE TABLE circle_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id TEXT NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(circle_id, user_id)
);

-- Waitlist entries (archived after matching)
CREATE TABLE waitlist_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  time_slot TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ, -- Set when matched to circle
  UNIQUE(user_id, time_slot)
);

-- User feedback
CREATE TABLE user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  circle_id TEXT NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  attendance_count INTEGER NOT NULL CHECK (attendance_count BETWEEN 0 AND 3),
  quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
  memorable_moment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, circle_id)
);

-- User data (app state storage - KEPT SEPARATE)
CREATE TABLE user_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, key)
);

-- Create indexes for performance
CREATE INDEX idx_user_data_lookup ON user_data(user_id, key);
CREATE INDEX idx_waitlist_time_slot ON waitlist_entries(time_slot);
CREATE INDEX idx_waitlist_archived ON waitlist_entries(archived_at);
CREATE INDEX idx_circles_time_slot ON circles(time_slot);
CREATE INDEX idx_circle_members_circle ON circle_members(circle_id);
CREATE INDEX idx_circle_members_user ON circle_members(user_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_feedback_circle ON user_feedback(circle_id);
CREATE INDEX idx_feedback_user ON user_feedback(user_id);

-- Create updated_at trigger for user_data
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$ language 'plpgsql';

CREATE TRIGGER update_user_data_updated_at BEFORE UPDATE ON user_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Seed Data

**Conversation Sparks**:
```sql
INSERT INTO conversation_sparks (spark_text) VALUES
('What''s something you wish more people got excited about?'),
('What''s one small thing that always boosts your mood?'),
('If you could instantly master one hobby or skill, what would it be?'),
('What''s a movie, show, or song you''d make everyone try at least once?'),
('Would you rather explore space, the ocean, or your own mind?'),
('What''s a random fun fact you never forgot?'),
('If you could plan the perfect weekend, what would it include?'),
('What''s something small that instantly makes someone more likable?'),
('Would you rather have unlimited time, unlimited money, or unlimited energy?'),
('What''s the most spontaneous thing you''ve ever done?');
```

**Stanford Locations**:
```sql
INSERT INTO locations (name, latitude, longitude) VALUES
('Old Union Fountain Spot', 37.425444, -122.170111),
('White Plaza Center Point', 37.425222, -122.170028),
('Stanford Bookstore Front Door', 37.425111, -122.169611),
('Memorial Church Quad Center', 37.427472, -122.169694),
('Main Quad South Entrance', 37.426889, -122.169944),
('Green Library Front Steps', 37.425944, -122.172639),
('Tresidder Union Coffee Spot', 37.422083, -122.175361),
('Cantor Arts Sculpture Garden', 37.430194, -122.170611),
('Bing Concert Hall Plaza', 37.427778, -122.169306),
('The Oval Center Grass', 37.430278, -122.175278);
```