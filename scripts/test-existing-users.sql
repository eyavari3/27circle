-- Testing Script for Existing 14 Waitlisted Users
-- Run these queries to test the matching algorithm

-- 1. First, check current waitlist status
SELECT 
    TO_CHAR(time_slot, 'Day DD Mon HH12:MI AM') as slot,
    COUNT(*) as users_waiting,
    ARRAY_AGG(user_id) as user_ids
FROM waitlist_entries 
WHERE DATE(time_slot) = CURRENT_DATE
GROUP BY time_slot
ORDER BY time_slot;

-- 2. See detailed user information for today's waitlist
SELECT 
    we.user_id,
    u.full_name,
    TO_CHAR(we.time_slot, 'HH12:MI AM') as slot_time,
    u.gender,
    STRING_AGG(ui.interest_type, ', ' ORDER BY ui.interest_type) as interests
FROM waitlist_entries we
JOIN users u ON we.user_id = u.id
LEFT JOIN user_interests ui ON u.id = ui.user_id
WHERE DATE(we.time_slot) = CURRENT_DATE
GROUP BY we.user_id, u.full_name, we.time_slot, u.gender
ORDER BY we.time_slot, u.full_name;

-- 3. Add more test users to reach 38 total (add 24 more)
-- Replace CURRENT_DATE with today's date in YYYY-MM-DD format
INSERT INTO waitlist_entries (user_id, time_slot) VALUES
-- Add to 11AM slot (assuming some already there)
('user-015', CURRENT_DATE::date + interval '11 hours'),
('user-016', CURRENT_DATE::date + interval '11 hours'),
('user-017', CURRENT_DATE::date + interval '11 hours'),
('user-018', CURRENT_DATE::date + interval '11 hours'),
('user-019', CURRENT_DATE::date + interval '11 hours'),
('user-020', CURRENT_DATE::date + interval '11 hours'),
('user-021', CURRENT_DATE::date + interval '11 hours'),
('user-022', CURRENT_DATE::date + interval '11 hours'),

-- Add to 2PM slot
('user-023', CURRENT_DATE::date + interval '14 hours'),
('user-024', CURRENT_DATE::date + interval '14 hours'),
('user-025', CURRENT_DATE::date + interval '14 hours'),
('user-026', CURRENT_DATE::date + interval '14 hours'),
('user-027', CURRENT_DATE::date + interval '14 hours'),
('user-028', CURRENT_DATE::date + interval '14 hours'),
('user-029', CURRENT_DATE::date + interval '14 hours'),
('user-030', CURRENT_DATE::date + interval '14 hours'),

-- Add to 5PM slot
('user-031', CURRENT_DATE::date + interval '17 hours'),
('user-032', CURRENT_DATE::date + interval '17 hours'),
('user-033', CURRENT_DATE::date + interval '17 hours'),
('user-034', CURRENT_DATE::date + interval '17 hours'),
('user-035', CURRENT_DATE::date + interval '17 hours'),
('user-036', CURRENT_DATE::date + interval '17 hours'),
('user-037', CURRENT_DATE::date + interval '17 hours'),
('user-038', CURRENT_DATE::date + interval '17 hours')
ON CONFLICT (user_id, time_slot) DO NOTHING;

-- 4. After running matching algorithm, verify results
WITH circle_stats AS (
    SELECT 
        c.id as circle_id,
        TO_CHAR(c.time_slot, 'HH12:MI AM') as meeting_time,
        l.name as location_name,
        l.latitude,
        l.longitude,
        cs.spark_text,
        COUNT(cm.user_id) as member_count
    FROM circles c
    JOIN locations l ON c.location_id = l.id
    JOIN conversation_sparks cs ON c.conversation_spark_id = cs.id
    LEFT JOIN circle_members cm ON c.id = cm.circle_id
    WHERE DATE(c.time_slot) = CURRENT_DATE
    GROUP BY c.id, c.time_slot, l.name, l.latitude, l.longitude, cs.spark_text
)
SELECT * FROM circle_stats ORDER BY meeting_time, circle_id;

-- 5. Check for location conflicts (CRITICAL - should return 0 rows)
SELECT 
    l.name,
    TO_CHAR(c.time_slot, 'HH12:MI AM') as time_slot,
    COUNT(*) as circles_at_location
FROM circles c
JOIN locations l ON c.location_id = l.id
WHERE DATE(c.time_slot) = CURRENT_DATE
GROUP BY l.name, c.time_slot
HAVING COUNT(*) > 1;

-- 6. See complete circle assignments with all members
SELECT 
    c.id as circle_id,
    TO_CHAR(c.time_slot, 'HH12:MI AM') as meeting_time,
    l.name as location_name,
    l.latitude || ', ' || l.longitude as gps_coordinates,
    cs.spark_text as conversation_starter,
    u.full_name as member_name,
    u.gender as member_gender,
    STRING_AGG(ui.interest_type, ', ' ORDER BY ui.interest_type) as member_interests
FROM circles c
JOIN circle_members cm ON c.id = cm.circle_id
JOIN users u ON cm.user_id = u.id
JOIN locations l ON c.location_id = l.id
JOIN conversation_sparks cs ON c.conversation_spark_id = cs.id
LEFT JOIN user_interests ui ON u.id = ui.user_id
WHERE DATE(c.time_slot) = CURRENT_DATE
GROUP BY c.id, c.time_slot, l.name, l.latitude, l.longitude, cs.spark_text, u.full_name, u.gender
ORDER BY c.time_slot, c.id, u.full_name;

-- 7. Summary statistics
SELECT 
    'Total Users in Waitlist' as metric,
    COUNT(*) as value
FROM waitlist_entries
WHERE DATE(time_slot) = CURRENT_DATE
UNION ALL
SELECT 
    'Total Users Matched' as metric,
    COUNT(DISTINCT user_id) as value
FROM circle_members cm
JOIN circles c ON cm.circle_id = c.id
WHERE DATE(c.time_slot) = CURRENT_DATE
UNION ALL
SELECT 
    'Total Circles Created' as metric,
    COUNT(DISTINCT id) as value
FROM circles
WHERE DATE(time_slot) = CURRENT_DATE
UNION ALL
SELECT 
    'Unique Locations Used' as metric,
    COUNT(DISTINCT location_id) as value
FROM circles
WHERE DATE(time_slot) = CURRENT_DATE
UNION ALL
SELECT 
    'Unique Conversation Sparks Used' as metric,
    COUNT(DISTINCT conversation_spark_id) as value
FROM circles
WHERE DATE(time_slot) = CURRENT_DATE;

-- 8. Find unmatched users
SELECT 
    u.full_name,
    TO_CHAR(we.time_slot, 'HH12:MI AM') as intended_slot,
    u.gender,
    STRING_AGG(ui.interest_type, ', ' ORDER BY ui.interest_type) as interests
FROM waitlist_entries we
JOIN users u ON we.user_id = u.id
LEFT JOIN user_interests ui ON u.id = ui.user_id
WHERE DATE(we.time_slot) = CURRENT_DATE
AND we.user_id NOT IN (
    SELECT cm.user_id 
    FROM circle_members cm
    JOIN circles c ON cm.circle_id = c.id
    WHERE DATE(c.time_slot) = CURRENT_DATE
)
GROUP BY u.full_name, we.time_slot, u.gender
ORDER BY we.time_slot, u.full_name;