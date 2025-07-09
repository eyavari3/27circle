-- BULLETPROOF DATABASE SEED SCRIPT
-- This script ensures all required data exists and is consistent

-- ====================================================================
-- STEP 1: CLEAN SLATE (Development only - remove for production)
-- ====================================================================
DELETE FROM circle_members;
DELETE FROM circles;
DELETE FROM waitlist_entries;
DELETE FROM user_interests;
DELETE FROM users WHERE id LIKE 'user-%';
DELETE FROM auth.users WHERE email LIKE 'test%@stanford.edu';

-- ====================================================================
-- STEP 2: ENSURE LOCATIONS EXIST
-- ====================================================================
INSERT INTO locations (name, description, address, latitude, longitude) VALUES
('Memorial Church', 'Historic Stanford Memorial Church', '450 Jane Stanford Way, Stanford, CA 94305', 37.4272, -122.1703),
('Main Quad', 'Central quadrangle of Stanford campus', '450 Jane Stanford Way, Stanford, CA 94305', 37.4274, -122.1716),
('Green Library', 'Cecil H. Green Library - main campus library', '557 Escondido Mall, Stanford, CA 94305', 37.4265, -122.1695),
('Cantor Arts Center', 'Iris & B. Gerald Cantor Center for Visual Arts', '328 Lomita Dr, Stanford, CA 94305', 37.4281, -122.1693),
('Tresidder Union', 'Student union building with dining and services', '459 Lagunita Dr, Stanford, CA 94305', 37.4265, -122.1709),
('White Plaza', 'Central campus gathering space', '557 Escondido Mall, Stanford, CA 94305', 37.4263, -122.1698),
('Hoover Tower', 'Iconic Stanford landmark and observation tower', '550 Serra Mall, Stanford, CA 94305', 37.4275, -122.1663),
('The Oval', 'Large grassy area near campus center', '450 Serra Mall, Stanford, CA 94305', 37.4281, -122.1685)
ON CONFLICT (name) DO UPDATE SET 
    description = EXCLUDED.description,
    address = EXCLUDED.address,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude;

-- ====================================================================
-- STEP 3: ENSURE CONVERSATION SPARKS EXIST
-- ====================================================================
INSERT INTO conversation_sparks (spark_text) VALUES
('What''s one topic you wish was taught at Stanford but isn''t?'),
('If you had one year fully funded to chase any idea, what would you build or research?'),
('What belief did you used to hold strongly that you no longer believe?'),
('What''s a moment when you felt most alive on campus?'),
('Which discipline outside your major do you think holds a key to solving a global problem?'),
('What''s a ''weird'' personal ritual or habit that actually helps you thrive?'),
('What''s one question you wish more people asked you?'),
('If everyone had to take a class on ''How to Be Human,'' what''s one lesson you''d teach?'),
('Who''s someone on campus you secretly admire and why?'),
('What''s a small act of courage you''ve done that no one noticed?')
ON CONFLICT (spark_text) DO NOTHING;

-- ====================================================================
-- STEP 4: CREATE 38 BULLETPROOF TEST USERS
-- ====================================================================
-- First create auth users
INSERT INTO auth.users (id, email, phone, created_at, updated_at, email_confirmed_at, phone_confirmed_at, aud, role) VALUES
('user-001', 'test001@stanford.edu', '+14151234001', NOW(), NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
('user-002', 'test002@stanford.edu', '+14151234002', NOW(), NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
('user-003', 'test003@stanford.edu', '+14151234003', NOW(), NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
('user-004', 'test004@stanford.edu', '+14151234004', NOW(), NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
('user-005', 'test005@stanford.edu', '+14151234005', NOW(), NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
('user-006', 'test006@stanford.edu', '+14151234006', NOW(), NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
('user-007', 'test007@stanford.edu', '+14151234007', NOW(), NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
('user-008', 'test008@stanford.edu', '+14151234008', NOW(), NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
('user-009', 'test009@stanford.edu', '+14151234009', NOW(), NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
('user-010', 'test010@stanford.edu', '+14151234010', NOW(), NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
('user-011', 'test011@stanford.edu', '+14151234011', NOW(), NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
('user-012', 'test012@stanford.edu', '+14151234012', NOW(), NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
('user-013', 'test013@stanford.edu', '+14151234013', NOW(), NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
('user-014', 'test014@stanford.edu', '+14151234014', NOW(), NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
('user-015', 'test015@stanford.edu', '+14151234015', NOW(), NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
('user-016', 'test016@stanford.edu', '+14151234016', NOW(), NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
('user-017', 'test017@stanford.edu', '+14151234017', NOW(), NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
('user-018', 'test018@stanford.edu', '+14151234018', NOW(), NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
('user-019', 'test019@stanford.edu', '+14151234019', NOW(), NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
('user-020', 'test020@stanford.edu', '+14151234020', NOW(), NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
('user-021', 'test021@stanford.edu', '+14151234021', NOW(), NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
('user-022', 'test022@stanford.edu', '+14151234022', NOW(), NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
('user-023', 'test023@stanford.edu', '+14151234023', NOW(), NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
('user-024', 'test024@stanford.edu', '+14151234024', NOW(), NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
('user-025', 'test025@stanford.edu', '+14151234025', NOW(), NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
('user-026', 'test026@stanford.edu', '+14151234026', NOW(), NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
('user-027', 'test027@stanford.edu', '+14151234027', NOW(), NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
('user-028', 'test028@stanford.edu', '+14151234028', NOW(), NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
('user-029', 'test029@stanford.edu', '+14151234029', NOW(), NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
('user-030', 'test030@stanford.edu', '+14151234030', NOW(), NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
('user-031', 'test031@stanford.edu', '+14151234031', NOW(), NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
('user-032', 'test032@stanford.edu', '+14151234032', NOW(), NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
('user-033', 'test033@stanford.edu', '+14151234033', NOW(), NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
('user-034', 'test034@stanford.edu', '+14151234034', NOW(), NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
('user-035', 'test035@stanford.edu', '+14151234035', NOW(), NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
('user-036', 'test036@stanford.edu', '+14151234036', NOW(), NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
('user-037', 'test037@stanford.edu', '+14151234037', NOW(), NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
('user-038', 'test038@stanford.edu', '+14151234038', NOW(), NOW(), NOW(), NOW(), 'authenticated', 'authenticated')
ON CONFLICT (id) DO UPDATE SET 
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    updated_at = NOW();

-- Create public user profiles
INSERT INTO public.users (id, full_name, gender, date_of_birth, location, created_at, updated_at) VALUES
('user-001', 'Alice Chen', 'female', '2001-03-15', 'Stanford University', NOW(), NOW()),
('user-002', 'Bob Martinez', 'male', '2000-07-22', 'Stanford University', NOW(), NOW()),
('user-003', 'Charlie Kim', 'non-binary', '2002-01-10', 'Stanford University', NOW(), NOW()),
('user-004', 'Diana Rodriguez', 'female', '2001-11-05', 'Stanford University', NOW(), NOW()),
('user-005', 'Ethan Wilson', 'male', '2000-09-18', 'Stanford University', NOW(), NOW()),
('user-006', 'Fiona Li', 'female', '2002-04-12', 'Stanford University', NOW(), NOW()),
('user-007', 'Gabriel Santos', 'male', '2001-06-30', 'Stanford University', NOW(), NOW()),
('user-008', 'Hannah Patel', 'female', '2000-12-25', 'Stanford University', NOW(), NOW()),
('user-009', 'Isaac Johnson', 'male', '2002-02-14', 'Stanford University', NOW(), NOW()),
('user-010', 'Julia Thompson', 'female', '2001-08-08', 'Stanford University', NOW(), NOW()),
('user-011', 'Kevin Zhang', 'male', '2000-05-20', 'Stanford University', NOW(), NOW()),
('user-012', 'Luna Davis', 'female', '2002-10-03', 'Stanford University', NOW(), NOW()),
('user-013', 'Marcus Brown', 'male', '2001-01-28', 'Stanford University', NOW(), NOW()),
('user-014', 'Nina Garcia', 'female', '2000-04-16', 'Stanford University', NOW(), NOW()),
('user-015', 'Oscar Lee', 'male', '2002-07-09', 'Stanford University', NOW(), NOW()),
('user-016', 'Priya Sharma', 'female', '2001-12-01', 'Stanford University', NOW(), NOW()),
('user-017', 'Quinn Taylor', 'non-binary', '2000-10-14', 'Stanford University', NOW(), NOW()),
('user-018', 'Rachel Green', 'female', '2002-03-22', 'Stanford University', NOW(), NOW()),
('user-019', 'Sam Anderson', 'male', '2001-05-11', 'Stanford University', NOW(), NOW()),
('user-020', 'Tara Williams', 'female', '2000-08-27', 'Stanford University', NOW(), NOW()),
('user-021', 'Umar Hassan', 'male', '2002-11-19', 'Stanford University', NOW(), NOW()),
('user-022', 'Victoria Chen', 'female', '2001-02-06', 'Stanford University', NOW(), NOW()),
('user-023', 'William Jones', 'male', '2000-06-13', 'Stanford University', NOW(), NOW()),
('user-024', 'Xenia Popov', 'female', '2002-09-24', 'Stanford University', NOW(), NOW()),
('user-025', 'Yuki Tanaka', 'female', '2001-04-17', 'Stanford University', NOW(), NOW()),
('user-026', 'Zoe Miller', 'female', '2000-07-31', 'Stanford University', NOW(), NOW()),
('user-027', 'Alex Rivera', 'male', '2002-12-08', 'Stanford University', NOW(), NOW()),
('user-028', 'Bella Smith', 'female', '2001-10-21', 'Stanford University', NOW(), NOW()),
('user-029', 'Carlos Mendez', 'male', '2000-03-04', 'Stanford University', NOW(), NOW()),
('user-030', 'Dasha Kumar', 'female', '2002-05-26', 'Stanford University', NOW(), NOW()),
('user-031', 'Eli Foster', 'male', '2001-09-12', 'Stanford University', NOW(), NOW()),
('user-032', 'Freya Nelson', 'female', '2000-11-29', 'Stanford University', NOW(), NOW()),
('user-033', 'George Park', 'male', '2002-01-15', 'Stanford University', NOW(), NOW()),
('user-034', 'Hope Martinez', 'female', '2001-07-03', 'Stanford University', NOW(), NOW()),
('user-035', 'Ian Cooper', 'male', '2000-12-18', 'Stanford University', NOW(), NOW()),
('user-036', 'Jade Wong', 'female', '2002-08-07', 'Stanford University', NOW(), NOW()),
('user-037', 'Kai Thompson', 'male', '2001-03-25', 'Stanford University', NOW(), NOW()),
('user-038', 'Lila Rodriguez', 'female', '2000-06-10', 'Stanford University', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET 
    full_name = EXCLUDED.full_name,
    gender = EXCLUDED.gender,
    date_of_birth = EXCLUDED.date_of_birth,
    location = EXCLUDED.location,
    updated_at = NOW();

-- ====================================================================
-- STEP 5: CREATE DIVERSE USER INTERESTS
-- ====================================================================
-- Group 1: Deep Thinking + New Activities (10 users)
INSERT INTO user_interests (user_id, interest_type, created_at) VALUES
('user-001', 'deep_thinking', NOW()),
('user-001', 'new_activities', NOW()),
('user-002', 'deep_thinking', NOW()),
('user-002', 'new_activities', NOW()),
('user-003', 'deep_thinking', NOW()),
('user-003', 'new_activities', NOW()),
('user-004', 'deep_thinking', NOW()),
('user-004', 'new_activities', NOW()),
('user-005', 'deep_thinking', NOW()),
('user-005', 'new_activities', NOW()),
('user-006', 'deep_thinking', NOW()),
('user-006', 'new_activities', NOW()),
('user-007', 'deep_thinking', NOW()),
('user-007', 'new_activities', NOW()),
('user-008', 'deep_thinking', NOW()),
('user-008', 'new_activities', NOW()),
('user-009', 'deep_thinking', NOW()),
('user-009', 'new_activities', NOW()),
('user-010', 'deep_thinking', NOW()),
('user-010', 'new_activities', NOW()),

-- Group 2: Spiritual Growth + Community Service (10 users)
('user-011', 'spiritual_growth', NOW()),
('user-011', 'community_service', NOW()),
('user-012', 'spiritual_growth', NOW()),
('user-012', 'community_service', NOW()),
('user-013', 'spiritual_growth', NOW()),
('user-013', 'community_service', NOW()),
('user-014', 'spiritual_growth', NOW()),
('user-014', 'community_service', NOW()),
('user-015', 'spiritual_growth', NOW()),
('user-015', 'community_service', NOW()),
('user-016', 'spiritual_growth', NOW()),
('user-016', 'community_service', NOW()),
('user-017', 'spiritual_growth', NOW()),
('user-017', 'community_service', NOW()),
('user-018', 'spiritual_growth', NOW()),
('user-018', 'community_service', NOW()),
('user-019', 'spiritual_growth', NOW()),
('user-019', 'community_service', NOW()),
('user-020', 'spiritual_growth', NOW()),
('user-020', 'community_service', NOW()),

-- Group 3: All Four Interests (10 users)
('user-021', 'deep_thinking', NOW()),
('user-021', 'spiritual_growth', NOW()),
('user-021', 'new_activities', NOW()),
('user-021', 'community_service', NOW()),
('user-022', 'deep_thinking', NOW()),
('user-022', 'spiritual_growth', NOW()),
('user-022', 'new_activities', NOW()),
('user-022', 'community_service', NOW()),
('user-023', 'deep_thinking', NOW()),
('user-023', 'spiritual_growth', NOW()),
('user-023', 'new_activities', NOW()),
('user-023', 'community_service', NOW()),
('user-024', 'deep_thinking', NOW()),
('user-024', 'spiritual_growth', NOW()),
('user-024', 'new_activities', NOW()),
('user-024', 'community_service', NOW()),
('user-025', 'deep_thinking', NOW()),
('user-025', 'spiritual_growth', NOW()),
('user-025', 'new_activities', NOW()),
('user-025', 'community_service', NOW()),
('user-026', 'deep_thinking', NOW()),
('user-026', 'spiritual_growth', NOW()),
('user-026', 'new_activities', NOW()),
('user-026', 'community_service', NOW()),
('user-027', 'deep_thinking', NOW()),
('user-027', 'spiritual_growth', NOW()),
('user-027', 'new_activities', NOW()),
('user-027', 'community_service', NOW()),
('user-028', 'deep_thinking', NOW()),
('user-028', 'spiritual_growth', NOW()),
('user-028', 'new_activities', NOW()),
('user-028', 'community_service', NOW()),
('user-029', 'deep_thinking', NOW()),
('user-029', 'spiritual_growth', NOW()),
('user-029', 'new_activities', NOW()),
('user-029', 'community_service', NOW()),
('user-030', 'deep_thinking', NOW()),
('user-030', 'spiritual_growth', NOW()),
('user-030', 'new_activities', NOW()),
('user-030', 'community_service', NOW()),

-- Group 4: Single Interests (8 users)
('user-031', 'deep_thinking', NOW()),
('user-032', 'spiritual_growth', NOW()),
('user-033', 'new_activities', NOW()),
('user-034', 'community_service', NOW()),
('user-035', 'deep_thinking', NOW()),
('user-036', 'spiritual_growth', NOW()),
('user-037', 'new_activities', NOW()),
('user-038', 'community_service', NOW())
ON CONFLICT (user_id, interest_type) DO NOTHING;

-- ====================================================================
-- STEP 6: CREATE TODAY'S WAITLIST IN PST
-- ====================================================================
-- Clear existing waitlist entries for today
DELETE FROM waitlist_entries 
WHERE DATE(time_slot AT TIME ZONE 'America/Los_Angeles') = CURRENT_DATE;

-- Add precisely distributed waitlist entries for today
-- 11AM PST slot (13 users) - Should create 3 circles of 4,4,4 with 1 unmatched
INSERT INTO waitlist_entries (user_id, time_slot) VALUES
('user-001', (CURRENT_DATE AT TIME ZONE 'America/Los_Angeles' + INTERVAL '11 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-002', (CURRENT_DATE AT TIME ZONE 'America/Los_Angeles' + INTERVAL '11 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-003', (CURRENT_DATE AT TIME ZONE 'America/Los_Angeles' + INTERVAL '11 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-004', (CURRENT_DATE AT TIME ZONE 'America/Los_Angeles' + INTERVAL '11 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-005', (CURRENT_DATE AT TIME ZONE 'America/Los_Angeles' + INTERVAL '11 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-006', (CURRENT_DATE AT TIME ZONE 'America/Los_Angeles' + INTERVAL '11 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-007', (CURRENT_DATE AT TIME ZONE 'America/Los_Angeles' + INTERVAL '11 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-008', (CURRENT_DATE AT TIME ZONE 'America/Los_Angeles' + INTERVAL '11 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-009', (CURRENT_DATE AT TIME ZONE 'America/Los_Angeles' + INTERVAL '11 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-010', (CURRENT_DATE AT TIME ZONE 'America/Los_Angeles' + INTERVAL '11 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-011', (CURRENT_DATE AT TIME ZONE 'America/Los_Angeles' + INTERVAL '11 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-012', (CURRENT_DATE AT TIME ZONE 'America/Los_Angeles' + INTERVAL '11 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-013', (CURRENT_DATE AT TIME ZONE 'America/Los_Angeles' + INTERVAL '11 hours') AT TIME ZONE 'America/Los_Angeles'),

-- 2PM PST slot (12 users) - Should create 3 circles of 4,4,4 with 0 unmatched
('user-014', (CURRENT_DATE AT TIME ZONE 'America/Los_Angeles' + INTERVAL '14 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-015', (CURRENT_DATE AT TIME ZONE 'America/Los_Angeles' + INTERVAL '14 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-016', (CURRENT_DATE AT TIME ZONE 'America/Los_Angeles' + INTERVAL '14 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-017', (CURRENT_DATE AT TIME ZONE 'America/Los_Angeles' + INTERVAL '14 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-018', (CURRENT_DATE AT TIME ZONE 'America/Los_Angeles' + INTERVAL '14 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-019', (CURRENT_DATE AT TIME ZONE 'America/Los_Angeles' + INTERVAL '14 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-020', (CURRENT_DATE AT TIME ZONE 'America/Los_Angeles' + INTERVAL '14 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-021', (CURRENT_DATE AT TIME ZONE 'America/Los_Angeles' + INTERVAL '14 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-022', (CURRENT_DATE AT TIME ZONE 'America/Los_Angeles' + INTERVAL '14 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-023', (CURRENT_DATE AT TIME ZONE 'America/Los_Angeles' + INTERVAL '14 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-024', (CURRENT_DATE AT TIME ZONE 'America/Los_Angeles' + INTERVAL '14 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-025', (CURRENT_DATE AT TIME ZONE 'America/Los_Angeles' + INTERVAL '14 hours') AT TIME ZONE 'America/Los_Angeles'),

-- 5PM PST slot (13 users) - Should create 3 circles of 4,4,4 with 1 unmatched
('user-026', (CURRENT_DATE AT TIME ZONE 'America/Los_Angeles' + INTERVAL '17 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-027', (CURRENT_DATE AT TIME ZONE 'America/Los_Angeles' + INTERVAL '17 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-028', (CURRENT_DATE AT TIME ZONE 'America/Los_Angeles' + INTERVAL '17 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-029', (CURRENT_DATE AT TIME ZONE 'America/Los_Angeles' + INTERVAL '17 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-030', (CURRENT_DATE AT TIME ZONE 'America/Los_Angeles' + INTERVAL '17 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-031', (CURRENT_DATE AT TIME ZONE 'America/Los_Angeles' + INTERVAL '17 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-032', (CURRENT_DATE AT TIME ZONE 'America/Los_Angeles' + INTERVAL '17 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-033', (CURRENT_DATE AT TIME ZONE 'America/Los_Angeles' + INTERVAL '17 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-034', (CURRENT_DATE AT TIME ZONE 'America/Los_Angeles' + INTERVAL '17 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-035', (CURRENT_DATE AT TIME ZONE 'America/Los_Angeles' + INTERVAL '17 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-036', (CURRENT_DATE AT TIME ZONE 'America/Los_Angeles' + INTERVAL '17 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-037', (CURRENT_DATE AT TIME ZONE 'America/Los_Angeles' + INTERVAL '17 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-038', (CURRENT_DATE AT TIME ZONE 'America/Los_Angeles' + INTERVAL '17 hours') AT TIME ZONE 'America/Los_Angeles')
ON CONFLICT (user_id, time_slot) DO NOTHING;

-- ====================================================================
-- VALIDATION QUERIES
-- ====================================================================
-- Verify everything was created correctly
SELECT 'Locations' as table_name, COUNT(*) as count FROM locations
UNION ALL
SELECT 'Conversation Sparks' as table_name, COUNT(*) as count FROM conversation_sparks
UNION ALL
SELECT 'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'User Interests' as table_name, COUNT(*) as count FROM user_interests
UNION ALL
SELECT 'Waitlist Entries' as table_name, COUNT(*) as count FROM waitlist_entries
ORDER BY table_name;

-- Show waitlist distribution
SELECT 
    TO_CHAR(time_slot AT TIME ZONE 'America/Los_Angeles', 'HH12:MI AM') as slot_time,
    COUNT(*) as user_count
FROM waitlist_entries 
WHERE DATE(time_slot AT TIME ZONE 'America/Los_Angeles') = CURRENT_DATE
GROUP BY time_slot
ORDER BY time_slot;