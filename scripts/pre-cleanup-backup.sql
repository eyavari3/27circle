-- 27 Circle Pre-Cleanup Backup Verification
-- Run this BEFORE executing the cleanup script
-- 
-- This script helps you verify what will be removed and ensures
-- you have a backup strategy in place

-- =====================================================
-- BACKUP VERIFICATION CHECKLIST
-- =====================================================

-- 1. VERIFY SUPABASE AUTOMATIC BACKUPS
-- Go to Supabase Dashboard > Settings > Database
-- Confirm that Point-in-Time Recovery is enabled
-- Note the backup retention period

-- 2. MANUAL BACKUP OPTION (if you want extra safety)
-- You can create a manual backup by running this in Supabase SQL Editor:
-- This creates a backup of all data in the tables we're about to remove

-- =====================================================
-- PRE-CLEANUP DATA INVENTORY
-- =====================================================

-- Check what data exists in tables we're planning to remove
SELECT 'PROFILES TABLE:' as table_name, COUNT(*) as row_count FROM profiles
UNION ALL
SELECT 'DAILY_EVENTS TABLE:', COUNT(*) FROM daily_events  
UNION ALL
SELECT 'JOINS TABLE:', COUNT(*) FROM joins
UNION ALL
SELECT 'FEEDBACK TABLE:', COUNT(*) FROM feedback
UNION ALL
SELECT 'SPARKS TABLE:', COUNT(*) FROM sparks;

-- =====================================================
-- SHOW ACTUAL DATA IN TABLES TO BE REMOVED
-- =====================================================

-- Profiles table data (if any)
SELECT 'Profiles data:' as info;
SELECT id, email, name, phone, created_at FROM profiles LIMIT 10;

-- Daily events data (if any)  
SELECT 'Daily events data:' as info;
SELECT * FROM daily_events LIMIT 10;

-- Joins data (if any)
SELECT 'Joins data:' as info;
SELECT * FROM joins LIMIT 10;

-- Feedback data (if any)
SELECT 'Feedback data:' as info;
SELECT * FROM feedback LIMIT 10;

-- Sparks data (check for duplicates with conversation_sparks)
SELECT 'Sparks data:' as info;
SELECT id, text, created_at FROM sparks LIMIT 10;

SELECT 'Conversation sparks data (for comparison):' as info;
SELECT id, spark_text FROM conversation_sparks LIMIT 10;

-- =====================================================
-- VERIFY WORKING TABLES WILL BE PRESERVED
-- =====================================================

-- These tables should NOT be affected by cleanup
SELECT 'WORKING TABLES (WILL BE PRESERVED):' as info;
SELECT 'USERS:' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'CIRCLES:', COUNT(*) FROM circles
UNION ALL  
SELECT 'CIRCLE_MEMBERS:', COUNT(*) FROM circle_members
UNION ALL
SELECT 'WAITLIST_ENTRIES:', COUNT(*) FROM waitlist_entries
UNION ALL
SELECT 'USER_INTERESTS:', COUNT(*) FROM user_interests
UNION ALL
SELECT 'LOCATIONS:', COUNT(*) FROM locations
UNION ALL
SELECT 'CONVERSATION_SPARKS:', COUNT(*) FROM conversation_sparks;

-- =====================================================
-- INDEX INVENTORY
-- =====================================================

-- Show all indexes that will be removed
SELECT 'INDEXES TO BE REMOVED:' as info;
SELECT schemaname, tablename, indexname, 
       pg_size_pretty(pg_relation_size(indexname::regclass)) as size
FROM pg_indexes 
WHERE schemaname = 'public'
  AND (
    indexname LIKE '%feedback%' OR
    indexname LIKE '%joins%' OR  
    indexname LIKE '%daily_events%' OR
    indexname LIKE 'sparks_text_key'
  )
ORDER BY tablename, indexname;

-- =====================================================
-- SAFETY CHECKLIST
-- =====================================================

SELECT '
🔒 SAFETY CHECKLIST BEFORE CLEANUP:
==================================

1. ✅ Supabase automatic backups enabled?
2. ✅ Point-in-time recovery available?
3. ✅ Reviewed data in tables to be removed?
4. ✅ Confirmed no critical data will be lost?
5. ✅ App is working correctly before changes?
6. ✅ Have rollback script ready?

If all checks pass, you can proceed with cleanup!

🚨 IMPORTANT: Test your app thoroughly after cleanup!

' as safety_checklist;

-- =====================================================
-- ESTIMATED STORAGE SAVINGS
-- =====================================================

-- Calculate approximate storage that will be freed
SELECT 
    'ESTIMATED STORAGE SAVINGS:' as info,
    pg_size_pretty(
        pg_total_relation_size('profiles') +
        pg_total_relation_size('daily_events') +
        pg_total_relation_size('joins') +
        pg_total_relation_size('feedback') +
        pg_total_relation_size('sparks')
    ) as storage_to_be_freed;

SELECT 'Ready for cleanup! 🚀' as status;