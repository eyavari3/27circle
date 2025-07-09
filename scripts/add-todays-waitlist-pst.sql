-- Add waitlist entries for TODAY in PST timezone
-- CRITICAL: This converts times to match what the app expects

-- First, clear any existing entries for today
DELETE FROM waitlist_entries 
WHERE DATE(time_slot AT TIME ZONE 'America/Los_Angeles') = CURRENT_DATE;

-- Get today's date at midnight PST, then convert to UTC for storage
-- 11AM PST = 18:00 UTC (or 19:00 during daylight saving)
INSERT INTO waitlist_entries (user_id, time_slot) VALUES
('user-001', (CURRENT_DATE::timestamp AT TIME ZONE 'America/Los_Angeles' + interval '11 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-002', (CURRENT_DATE::timestamp AT TIME ZONE 'America/Los_Angeles' + interval '11 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-003', (CURRENT_DATE::timestamp AT TIME ZONE 'America/Los_Angeles' + interval '11 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-004', (CURRENT_DATE::timestamp AT TIME ZONE 'America/Los_Angeles' + interval '11 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-005', (CURRENT_DATE::timestamp AT TIME ZONE 'America/Los_Angeles' + interval '11 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-006', (CURRENT_DATE::timestamp AT TIME ZONE 'America/Los_Angeles' + interval '11 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-007', (CURRENT_DATE::timestamp AT TIME ZONE 'America/Los_Angeles' + interval '11 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-008', (CURRENT_DATE::timestamp AT TIME ZONE 'America/Los_Angeles' + interval '11 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-009', (CURRENT_DATE::timestamp AT TIME ZONE 'America/Los_Angeles' + interval '11 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-010', (CURRENT_DATE::timestamp AT TIME ZONE 'America/Los_Angeles' + interval '11 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-011', (CURRENT_DATE::timestamp AT TIME ZONE 'America/Los_Angeles' + interval '11 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-012', (CURRENT_DATE::timestamp AT TIME ZONE 'America/Los_Angeles' + interval '11 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-013', (CURRENT_DATE::timestamp AT TIME ZONE 'America/Los_Angeles' + interval '11 hours') AT TIME ZONE 'America/Los_Angeles');

-- 2PM PST
INSERT INTO waitlist_entries (user_id, time_slot) VALUES
('user-014', (CURRENT_DATE::timestamp AT TIME ZONE 'America/Los_Angeles' + interval '14 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-015', (CURRENT_DATE::timestamp AT TIME ZONE 'America/Los_Angeles' + interval '14 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-016', (CURRENT_DATE::timestamp AT TIME ZONE 'America/Los_Angeles' + interval '14 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-017', (CURRENT_DATE::timestamp AT TIME ZONE 'America/Los_Angeles' + interval '14 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-018', (CURRENT_DATE::timestamp AT TIME ZONE 'America/Los_Angeles' + interval '14 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-019', (CURRENT_DATE::timestamp AT TIME ZONE 'America/Los_Angeles' + interval '14 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-020', (CURRENT_DATE::timestamp AT TIME ZONE 'America/Los_Angeles' + interval '14 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-021', (CURRENT_DATE::timestamp AT TIME ZONE 'America/Los_Angeles' + interval '14 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-022', (CURRENT_DATE::timestamp AT TIME ZONE 'America/Los_Angeles' + interval '14 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-023', (CURRENT_DATE::timestamp AT TIME ZONE 'America/Los_Angeles' + interval '14 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-024', (CURRENT_DATE::timestamp AT TIME ZONE 'America/Los_Angeles' + interval '14 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-025', (CURRENT_DATE::timestamp AT TIME ZONE 'America/Los_Angeles' + interval '14 hours') AT TIME ZONE 'America/Los_Angeles');

-- 5PM PST
INSERT INTO waitlist_entries (user_id, time_slot) VALUES
('user-026', (CURRENT_DATE::timestamp AT TIME ZONE 'America/Los_Angeles' + interval '17 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-027', (CURRENT_DATE::timestamp AT TIME ZONE 'America/Los_Angeles' + interval '17 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-028', (CURRENT_DATE::timestamp AT TIME ZONE 'America/Los_Angeles' + interval '17 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-029', (CURRENT_DATE::timestamp AT TIME ZONE 'America/Los_Angeles' + interval '17 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-030', (CURRENT_DATE::timestamp AT TIME ZONE 'America/Los_Angeles' + interval '17 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-031', (CURRENT_DATE::timestamp AT TIME ZONE 'America/Los_Angeles' + interval '17 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-032', (CURRENT_DATE::timestamp AT TIME ZONE 'America/Los_Angeles' + interval '17 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-033', (CURRENT_DATE::timestamp AT TIME ZONE 'America/Los_Angeles' + interval '17 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-034', (CURRENT_DATE::timestamp AT TIME ZONE 'America/Los_Angeles' + interval '17 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-035', (CURRENT_DATE::timestamp AT TIME ZONE 'America/Los_Angeles' + interval '17 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-036', (CURRENT_DATE::timestamp AT TIME ZONE 'America/Los_Angeles' + interval '17 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-037', (CURRENT_DATE::timestamp AT TIME ZONE 'America/Los_Angeles' + interval '17 hours') AT TIME ZONE 'America/Los_Angeles'),
('user-038', (CURRENT_DATE::timestamp AT TIME ZONE 'America/Los_Angeles' + interval '17 hours') AT TIME ZONE 'America/Los_Angeles');

-- Verify the entries with both UTC and PST times
SELECT 
    TO_CHAR(time_slot, 'YYYY-MM-DD HH24:MI TZ') as utc_time,
    TO_CHAR(time_slot AT TIME ZONE 'America/Los_Angeles', 'YYYY-MM-DD HH24:MI') as pst_time,
    COUNT(*) as user_count
FROM waitlist_entries 
GROUP BY time_slot
ORDER BY time_slot;