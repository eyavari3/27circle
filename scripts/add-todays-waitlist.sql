-- Add waitlist entries for TODAY
-- This script automatically uses today's date

-- First, clear any existing entries for today
DELETE FROM waitlist_entries 
WHERE DATE(time_slot) = CURRENT_DATE;

-- Add users to today's slots
-- 11AM slot (13 users)
INSERT INTO waitlist_entries (user_id, time_slot) VALUES
('user-001', CURRENT_DATE + interval '11 hours'),
('user-002', CURRENT_DATE + interval '11 hours'),
('user-003', CURRENT_DATE + interval '11 hours'),
('user-004', CURRENT_DATE + interval '11 hours'),
('user-005', CURRENT_DATE + interval '11 hours'),
('user-006', CURRENT_DATE + interval '11 hours'),
('user-007', CURRENT_DATE + interval '11 hours'),
('user-008', CURRENT_DATE + interval '11 hours'),
('user-009', CURRENT_DATE + interval '11 hours'),
('user-010', CURRENT_DATE + interval '11 hours'),
('user-011', CURRENT_DATE + interval '11 hours'),
('user-012', CURRENT_DATE + interval '11 hours'),
('user-013', CURRENT_DATE + interval '11 hours');

-- 2PM slot (12 users)
INSERT INTO waitlist_entries (user_id, time_slot) VALUES
('user-014', CURRENT_DATE + interval '14 hours'),
('user-015', CURRENT_DATE + interval '14 hours'),
('user-016', CURRENT_DATE + interval '14 hours'),
('user-017', CURRENT_DATE + interval '14 hours'),
('user-018', CURRENT_DATE + interval '14 hours'),
('user-019', CURRENT_DATE + interval '14 hours'),
('user-020', CURRENT_DATE + interval '14 hours'),
('user-021', CURRENT_DATE + interval '14 hours'),
('user-022', CURRENT_DATE + interval '14 hours'),
('user-023', CURRENT_DATE + interval '14 hours'),
('user-024', CURRENT_DATE + interval '14 hours'),
('user-025', CURRENT_DATE + interval '14 hours');

-- 5PM slot (13 users)
INSERT INTO waitlist_entries (user_id, time_slot) VALUES
('user-026', CURRENT_DATE + interval '17 hours'),
('user-027', CURRENT_DATE + interval '17 hours'),
('user-028', CURRENT_DATE + interval '17 hours'),
('user-029', CURRENT_DATE + interval '17 hours'),
('user-030', CURRENT_DATE + interval '17 hours'),
('user-031', CURRENT_DATE + interval '17 hours'),
('user-032', CURRENT_DATE + interval '17 hours'),
('user-033', CURRENT_DATE + interval '17 hours'),
('user-034', CURRENT_DATE + interval '17 hours'),
('user-035', CURRENT_DATE + interval '17 hours'),
('user-036', CURRENT_DATE + interval '17 hours'),
('user-037', CURRENT_DATE + interval '17 hours'),
('user-038', CURRENT_DATE + interval '17 hours');

-- Verify the entries were created
SELECT 
    TO_CHAR(time_slot, 'YYYY-MM-DD HH12:MI AM') as slot_time,
    COUNT(*) as user_count
FROM waitlist_entries 
WHERE DATE(time_slot) = CURRENT_DATE
GROUP BY time_slot
ORDER BY time_slot;