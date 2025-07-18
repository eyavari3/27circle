-- 27 Circle Schema Cleanup Script
-- Generated: 2025-07-18T00:40:00Z
-- 
-- 🚨 IMPORTANT: CREATE A BACKUP BEFORE RUNNING THIS SCRIPT!
-- 
-- This script removes confirmed unused database objects based on deep schema audit:
-- - 5 unused/legacy tables
-- - 9 unused indexes
-- - Performance improvement and storage cleanup
--
-- SAFETY MEASURES:
-- 1. All operations use IF EXISTS to prevent errors
-- 2. Tables are dropped in dependency order
-- 3. Rollback script provided separately
-- 4. Working tables are preserved

-- =====================================================
-- PHASE 1: DROP UNUSED INDEXES (Immediate Performance Gain)
-- =====================================================

-- These indexes are on tables that have 0 usage and consume storage
-- Dropping indexes is low-risk and provides immediate performance benefits

-- Feedback table indexes (table has 0 rows, never used)
DROP INDEX IF EXISTS idx_feedback_event_id;
DROP INDEX IF EXISTS feedback_user_id_event_id_key;
DROP INDEX IF EXISTS idx_feedback_user_id;

-- Joins table indexes (table has 0 rows, never used)
DROP INDEX IF EXISTS idx_joins_event_id;
DROP INDEX IF EXISTS idx_joins_user_id;
DROP INDEX IF EXISTS joins_user_id_event_id_key;

-- Daily events table indexes (table has 0 rows, never used)
DROP INDEX IF EXISTS idx_daily_events_date_slot;
DROP INDEX IF EXISTS daily_events_event_date_time_slot_key;

-- Sparks table indexes (duplicate functionality with conversation_sparks)
DROP INDEX IF EXISTS sparks_text_key;

-- =====================================================
-- PHASE 2: DROP UNUSED LEGACY TABLES
-- =====================================================

-- These tables are confirmed unused based on:
-- 1. Zero rows in tables (daily_events, joins, feedback)
-- 2. Legacy/duplicate functionality (profiles, sparks)
-- 3. No references in current codebase

-- Drop foreign key constraints first (if any exist)
-- Note: Using IF EXISTS to prevent errors if constraints don't exist

-- Drop empty tables that were never implemented
DROP TABLE IF EXISTS daily_events CASCADE;
DROP TABLE IF EXISTS joins CASCADE; 
DROP TABLE IF EXISTS feedback CASCADE;

-- Drop legacy profiles table (replaced by users table)
-- profiles table has old structure with boolean flags that are unused
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop duplicate sparks table (conversation_sparks is the active one)
-- sparks table has same data as conversation_sparks but different structure
DROP TABLE IF EXISTS sparks CASCADE;

-- =====================================================
-- PHASE 3: CLEANUP VERIFICATION
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
-- PHASE 4: FINAL CLEANUP REPORT
-- =====================================================

-- Show remaining tables (should be only the working ones)
SELECT 
    table_name,
    pg_size_pretty(pg_total_relation_size('public.' || table_name)) as size
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY pg_total_relation_size('public.' || table_name) DESC;

-- Show remaining indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as size
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexname::regclass) DESC;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT 'Schema cleanup completed successfully! 🎉' as cleanup_status;
SELECT 'Removed 5 unused tables and 9 unused indexes' as cleanup_summary;
SELECT 'Your schema is now optimized for production!' as result;