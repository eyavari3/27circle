-- 27 Circle Database Schema Audit
-- IMPORTANT: This script is READ-ONLY and makes no changes
-- Run this to understand current database state vs documentation

\echo '=== 27 CIRCLE DATABASE AUDIT ==='
\echo 'Timestamp:' `date`
\echo ''

-- 1. TABLE SIZES AND ROW COUNTS
\echo '1. TABLE INVENTORY AND SIZES'
\echo '============================='
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as data_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

\echo ''
\echo '2. ROW COUNTS FOR ALL TABLES'
\echo '============================'

-- Safe way to get row counts without touching data
SELECT 
    schemaname,
    tablename,
    n_tup_ins as rows_inserted,
    n_tup_upd as rows_updated,
    n_tup_del as rows_deleted,
    n_live_tup as estimated_live_rows,
    n_dead_tup as dead_rows,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;

\echo ''
\echo '3. SUSPECTED UNUSED TABLES (0 rows)'
\echo '==================================='

-- Check specific tables mentioned in problem statement
SELECT 'daily_events' as table_name, 
       CASE WHEN EXISTS (SELECT 1 FROM daily_events LIMIT 1) THEN 'HAS_DATA' ELSE 'EMPTY' END as status
UNION ALL
SELECT 'joins' as table_name,
       CASE WHEN EXISTS (SELECT 1 FROM joins LIMIT 1) THEN 'HAS_DATA' ELSE 'EMPTY' END as status
UNION ALL
SELECT 'sparks' as table_name,
       CASE WHEN EXISTS (SELECT 1 FROM sparks LIMIT 1) THEN 'HAS_DATA' ELSE 'EMPTY' END as status;

\echo ''
\echo '4. INDEX ANALYSIS'
\echo '================='

SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size,
    idx_tup_read as times_used,
    idx_tup_fetch as tuples_fetched,
    CASE 
        WHEN idx_tup_read = 0 AND idx_tup_fetch = 0 THEN 'UNUSED'
        WHEN idx_tup_read < 10 THEN 'RARELY_USED' 
        ELSE 'ACTIVE'
    END as usage_status
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_tup_read DESC;

\echo ''
\echo '5. FOREIGN KEY RELATIONSHIPS'
\echo '============================'

SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

\echo ''
\echo '6. CRITICAL DATA COMPLETENESS CHECK'
\echo '=================================='

-- Check users table for missing critical data
SELECT 
    COUNT(*) as total_users,
    COUNT(full_name) as users_with_name,
    COUNT(date_of_birth) as users_with_birthdate,
    COUNT(gender) as users_with_gender,
    COUNT(phone_number) as users_with_phone,
    COUNT(*) - COUNT(full_name) as missing_names,
    COUNT(*) - COUNT(date_of_birth) as missing_birthdates,
    COUNT(*) - COUNT(gender) as missing_genders,
    COUNT(*) - COUNT(phone_number) as missing_phones
FROM users;

\echo ''
\echo '7. CONVERSATION SPARKS vs SPARKS COMPARISON'
\echo '=========================================='

-- Check for potential duplication
SELECT 'conversation_sparks' as table_name, COUNT(*) as row_count FROM conversation_sparks
UNION ALL
SELECT 'sparks' as table_name, COUNT(*) as row_count FROM sparks;

-- Sample data to check for duplication
\echo ''
\echo 'Sample conversation_sparks data:'
SELECT id, spark_text FROM conversation_sparks LIMIT 3;

\echo ''
\echo 'Sample sparks data (if any):'
SELECT * FROM sparks LIMIT 3;

\echo ''
\echo '8. CIRCLES AND MATCHING ANALYSIS'
\echo '=============================='

-- Verify how circles are actually created
SELECT 
    COUNT(*) as total_circles,
    COUNT(DISTINCT time_slot::date) as unique_dates,
    COUNT(location_id) as circles_with_location,
    COUNT(conversation_spark_id) as circles_with_sparks,
    MIN(created_at) as oldest_circle,
    MAX(created_at) as newest_circle
FROM circles;

-- Check circle membership
SELECT 
    COUNT(*) as total_memberships,
    COUNT(DISTINCT circle_id) as circles_with_members,
    COUNT(DISTINCT user_id) as users_in_circles,
    AVG(members_per_circle) as avg_members_per_circle
FROM (
    SELECT circle_id, COUNT(*) as members_per_circle 
    FROM circle_members 
    GROUP BY circle_id
) subq;

\echo ''
\echo '9. WAITLIST ANALYSIS'
\echo '=================='

SELECT 
    COUNT(*) as total_waitlist_entries,
    COUNT(DISTINCT user_id) as unique_users_in_waitlist,
    COUNT(DISTINCT time_slot::date) as unique_dates_in_waitlist,
    MIN(time_slot) as earliest_slot,
    MAX(time_slot) as latest_slot
FROM waitlist_entries;

\echo ''
\echo '10. SCHEMA vs DOCUMENTED TABLES'
\echo '=============================='

-- List all tables that exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

\echo ''
\echo '11. POTENTIAL ORPHANED DATA'
\echo '=========================='

-- Check for data that might reference non-existent records
-- Users without interests
SELECT 
    COUNT(DISTINCT u.id) as users_total,
    COUNT(DISTINCT ui.user_id) as users_with_interests,
    COUNT(DISTINCT u.id) - COUNT(DISTINCT ui.user_id) as users_without_interests
FROM users u
LEFT JOIN user_interests ui ON u.id = ui.user_id;

-- Circles without members
SELECT 
    COUNT(DISTINCT c.id) as circles_total,
    COUNT(DISTINCT cm.circle_id) as circles_with_members,
    COUNT(DISTINCT c.id) - COUNT(DISTINCT cm.circle_id) as empty_circles
FROM circles c
LEFT JOIN circle_members cm ON c.id = cm.circle_id;

\echo ''
\echo '12. PERFORMANCE INDICATORS'
\echo '========================'

-- Check for tables that might need maintenance
SELECT 
    schemaname,
    tablename,
    n_tup_ins + n_tup_upd + n_tup_del as total_operations,
    n_dead_tup as dead_tuples,
    CASE 
        WHEN n_live_tup > 0 THEN ROUND((n_dead_tup::float / n_live_tup::float) * 100, 2)
        ELSE 0 
    END as dead_tuple_percentage
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND (n_dead_tup > 100 OR (n_live_tup > 0 AND n_dead_tup::float / n_live_tup::float > 0.1))
ORDER BY dead_tuple_percentage DESC;

\echo ''
\echo '=== AUDIT COMPLETE ==='
\echo 'Review the output above to identify:'
\echo '- Tables with 0 rows (candidates for removal)'
\echo '- Unused indexes (performance impact)'
\echo '- Missing critical data (date_of_birth for matching)'
\echo '- Duplicate functionality (sparks vs conversation_sparks)'
\echo '- Schema bloat and performance issues'