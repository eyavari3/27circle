-- =================================================================
-- FINAL V2.0 SCHEMA for 27CIRCLE-JULY (Updated with all production changes)
-- =================================================================
-- Note: Circles are scheduled daily at 11AM, 2PM, and 5PM

-- 1. Create the Public Users Profile table
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    gender TEXT,
    date_of_birth DATE,
    phone_number TEXT UNIQUE
);

-- Function to create a public user profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute the function after a new user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. Create the User Interests table
CREATE TABLE user_interests (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    interest_type TEXT NOT NULL,
    PRIMARY KEY (user_id, interest_type)
);

-- 3. Locations, Sparks, Circles tables
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    address TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL
);

CREATE TABLE conversation_sparks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    spark_text TEXT NOT NULL UNIQUE
);

CREATE TABLE circles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    time_slot TIMESTAMPTZ NOT NULL, -- Daily circles at 11AM, 2PM, and 5PM
    location_id UUID REFERENCES locations(id),
    conversation_spark_id UUID REFERENCES conversation_sparks(id),
    status TEXT DEFAULT 'active' CHECK (status IN ('forming', 'active', 'completed', 'cancelled')),
    max_participants INTEGER DEFAULT 4,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Waitlist & Members tables
CREATE TABLE waitlist_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    time_slot TIMESTAMPTZ NOT NULL, -- Waitlist for 11AM, 2PM, or 5PM slots
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, time_slot)
);

CREATE TABLE circle_members (
    circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (circle_id, user_id)
);

-- =================================================================
-- PERFORMANCE: Add Indexes
-- =================================================================
CREATE INDEX idx_user_interests_user_id ON user_interests(user_id);
CREATE INDEX idx_waitlist_entries_user_id ON waitlist_entries(user_id);
CREATE INDEX idx_waitlist_entries_time_slot ON waitlist_entries(time_slot);
CREATE INDEX idx_circle_members_user_id ON circle_members(user_id);
CREATE INDEX idx_circle_members_circle_id ON circle_members(circle_id);
CREATE INDEX idx_circles_time_slot ON circles(time_slot);
CREATE INDEX idx_circles_status ON circles(status);

-- =================================================================
-- SECURITY: Enable Row Level Security (RLS)
-- =================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_sparks ENABLE ROW LEVEL SECURITY;
ALTER TABLE circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can see their own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view and manage their own interests" ON user_interests FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view and manage their own waitlist entries" ON waitlist_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can see circles they are a member of" ON circles FOR SELECT
    USING (id IN (SELECT circle_id FROM circle_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can see the members of circles they are in" ON circle_members FOR SELECT
    USING (circle_id IN (SELECT circle_id FROM circle_members WHERE user_id = auth.uid()));
CREATE POLICY "All authenticated users can see locations and sparks" ON locations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "All authenticated users can see sparks" ON conversation_sparks FOR SELECT USING (auth.role() = 'authenticated');

-- =================================================================
-- FUNCTIONS
-- =================================================================
-- Function to update circle statuses based on time
CREATE OR REPLACE FUNCTION update_past_circles()
RETURNS void AS $$
BEGIN
  UPDATE circles
  SET status = 'completed'
  WHERE status = 'active'
    AND time_slot AT TIME ZONE 'America/Los_Angeles' < NOW() AT TIME ZONE 'America/Los_Angeles';
END;
$$ LANGUAGE plpgsql;

-- =================================================================
-- VIEWS for Easy Management
-- =================================================================
-- Detailed view of circles with member information
CREATE OR REPLACE VIEW circle_details AS
SELECT 
  c.id as circle_id,
  TO_CHAR(c.time_slot AT TIME ZONE 'America/Los_Angeles', 'Mon DD, HH:MI AM') as meeting_time,
  l.name as location,
  SUBSTRING(cs.spark_text, 1, 60) || '...' as conversation_starter,
  u.full_name as member_name,
  u.phone_number as phone,
  u.gender,
  CASE 
    WHEN c.time_slot < NOW() THEN 'completed'
    ELSE c.status
  END as circle_status,
  c.created_at
FROM circles c
JOIN locations l ON c.location_id = l.id
JOIN conversation_sparks cs ON c.conversation_spark_id = cs.id
JOIN circle_members cm ON c.id = cm.circle_id
JOIN users u ON cm.user_id = u.id
ORDER BY c.time_slot DESC, c.id, u.full_name;

-- Summary view for circle statistics
CREATE OR REPLACE VIEW circle_summary AS
SELECT 
  TO_CHAR(c.time_slot AT TIME ZONE 'America/Los_Angeles', 'Mon DD, HH:MI AM') as time_slot,
  COUNT(DISTINCT c.id) as total_circles,
  COUNT(DISTINCT cm.user_id) as total_members,
  COUNT(DISTINCT c.location_id) as unique_locations,
  STRING_AGG(DISTINCT l.name, ', ' ORDER BY l.name) as locations_used
FROM circles c
JOIN locations l ON c.location_id = l.id
LEFT JOIN circle_members cm ON c.id = cm.circle_id
WHERE c.created_at > NOW() - INTERVAL '7 days'
GROUP BY c.time_slot
ORDER BY c.time_slot DESC;

-- =================================================================
-- SEED DATA
-- =================================================================
-- Insert Sample Location Data (8 Stanford locations)
INSERT INTO locations (name, description, address, latitude, longitude) VALUES
('Memorial Church', 'Historic Stanford Memorial Church', '450 Jane Stanford Way, Stanford, CA 94305', 37.4272, -122.1703),
('Main Quad', 'Central quadrangle of Stanford campus', '450 Jane Stanford Way, Stanford, CA 94305', 37.4274, -122.1716),
('Green Library', 'Cecil H. Green Library - main campus library', '557 Escondido Mall, Stanford, CA 94305', 37.4265, -122.1695),
('Cantor Arts Center', 'Iris & B. Gerald Cantor Center for Visual Arts', '328 Lomita Dr, Stanford, CA 94305', 37.4281, -122.1693),
('Tresidder Union', 'Student union building with dining and services', '459 Lagunita Dr, Stanford, CA 94305', 37.4265, -122.1709),
('White Plaza', 'Central campus gathering space', '557 Escondido Mall, Stanford, CA 94305', 37.4263, -122.1698),
('Hoover Tower', 'Iconic Stanford landmark and observation tower', '550 Serra Mall, Stanford, CA 94305', 37.4275, -122.1663),
('The Oval', 'Large grassy area near campus center', '450 Serra Mall, Stanford, CA 94305', 37.4281, -122.1685);

-- Insert Conversation Sparks (10 thoughtful prompts)
INSERT INTO conversation_sparks (spark_text) VALUES
('What's one topic you wish was taught at Stanford but isn't?'),
('If you had one year fully funded to chase any idea, what would you build or research?'),
('What belief did you used to hold strongly that you no longer believe?'),
('What's a moment when you felt most alive on campus?'),
('Which discipline outside your major do you think holds a key to solving a global problem?'),
('What's a 'weird' personal ritual or habit that actually helps you thrive?'),
('What's one question you wish more people asked you?'),
('If everyone had to take a class on 'How to Be Human,' what's one lesson you'd teach?'),
('Who's someone on campus you secretly admire and why?'),
('What's a small act of courage you've done that no one noticed?');