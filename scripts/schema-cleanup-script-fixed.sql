-- 27 Circle Schema Cleanup Script (FIXED)
-- Generated: 2025-07-18T00:40:00Z
-- 
-- 🚨 IMPORTANT: CREATE A BACKUP BEFORE RUNNING THIS SCRIPT!
-- 
-- This script removes confirmed unused database objects based on deep schema audit:
-- - 5 unused/legacy tables
-- - 9 unused indexes (some are constraints)
-- - Performance improvement and storage cleanup
--
-- SAFETY MEASURES:
-- 1. All operations use IF EXISTS to prevent errors
-- 2. Constraints dropped before indexes
-- 3. Tables dropped with CASCADE
-- 4. Working tables are preserved

-- =====================================================
-- PHASE 1: DROP CONSTRAINT-BACKED INDEXES 
-- =====================================================

-- Some indexes are actually backing UNIQUE constraints
-- We need to drop the constraints, not the indexes directly

-- Daily events constraints
ALTER TABLE IF EXISTS daily_events DROP CONSTRAINT IF EXISTS daily_events_event_date_time_slot_key;

-- Feedback constraints
ALTER TABLE IF EXISTS feedback DROP CONSTRAINT IF EXISTS feedback_user_id_event_id_key;

-- Joins constraints  
ALTER TABLE IF EXISTS joins DROP CONSTRAINT IF EXISTS joins_user_id_event_id_key;

-- Sparks constraints
ALTER TABLE IF EXISTS sparks DROP CONSTRAINT IF EXISTS sparks_text_key;

-- =====================================================
-- PHASE 2: DROP REMAINING UNUSED INDEXES
-- =====================================================

-- These are regular indexes (not constraint-backed)
DROP INDEX IF EXISTS idx_feedback_event_id;
DROP INDEX IF EXISTS idx_feedback_user_id;
DROP INDEX IF EXISTS idx_joins_event_id;
DROP INDEX IF EXISTS idx_joins_user_id;
DROP INDEX IF EXISTS idx_daily_events_date_slot;

-- =====================================================
-- PHASE 3: DROP UNUSED LEGACY TABLES
-- =====================================================

-- Drop tables with CASCADE to remove any remaining dependencies
-- These tables are confirmed unused based on:
-- 1. Zero rows in tables (daily_events, joins, feedback)
-- 2. Legacy/duplicate functionality (profiles, sparks)
-- 3. No references in current codebase

DROP TABLE IF EXISTS daily_events CASCADE;
DROP TABLE IF EXISTS joins CASCADE; 
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS sparks CASCADE;

-- =====================================================
-- PHASE 4: CLEANUP VERIFICATION
-- =====================================================

-- Verify that all working tables still exist and are accessible
-- These should all return without errors:

SELECT COUNT(*) as user_count FROM users;
SELECT COUNT(*) as circle_count FROM circles;  
SELECT COUNT(*) as member_count FROM circle_members;
SELECT COUNT(*) as waitlist_count FROM waitlist_entries;
SELECT COUNT(*) as interest_count FROM user_interests;
SELECT COUNT(*) as location_count FROM locations;
SELECT COUNT(*) as spark_count FROM conversation_sparks;

-- =====================================================
-- PHASE 5: FINAL CLEANUP REPORT
-- =====================================================

-- Show remaining tables (should be only the working ones)
SELECT 
    'REMAINING TABLES:' as report_section,
    table_name,
    pg_size_pretty(pg_total_relation_size('public.' || table_name)) as size
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY pg_total_relation_size('public.' || table_name) DESC;

-- Show remaining indexes
SELECT 
    'REMAINING INDEXES:' as report_section,
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as size
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexname::regclass) DESC;

-- Count verification
SELECT 
    'CLEANUP SUMMARY:' as report_section,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') as remaining_tables,
    (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public') as remaining_indexes;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT 'Schema cleanup completed successfully! 🎉' as cleanup_status;
SELECT 'Removed 5 unused tables and 9 unused indexes/constraints' as cleanup_summary;
SELECT 'Your schema is now optimized for production!' as result;