# Database Table Analysis Report

## Summary of Tables Being Queried in Codebase

### Tables Found in Queries:

1. **users** ✅ (in schema)
   - Most frequently queried table
   - Used for user profile management
   
2. **waitlist_entries** ✅ (in schema)
   - Used for event signups
   - Second most common table
   
3. **circles** ✅ (in schema)
   - Used for group formation
   
4. **circle_members** ✅ (in schema)
   - Used for circle membership tracking
   
5. **locations** ✅ (in schema)
   - Used for assigning meeting locations
   
6. **conversation_sparks** ✅ (in schema)
   - Used for conversation starters
   
7. **user_interests** ✅ (in schema)
   - Used for storing user interests
   
8. **feedback** ❌ **MISMATCH!**
   - Being queried in `/src/app/feedback/actions.ts`
   - Schema defines this as **user_feedback** (line 95-105 in database_schema.md)
   - This is a critical mismatch!
   
9. **user_data** ❌ (NOT in current schema)
   - Being queried in `/src/lib/storage.ts` multiple times
   - Appears to be a table for storing user preferences/data
   - Referenced in initial.md and other files
   
10. **pg_tables** ⚠️ (PostgreSQL system table)
    - Used for debugging/RLS checks
    - Not a user table
    
11. **pg_policies** ⚠️ (PostgreSQL system table)
    - Used for debugging/RLS checks  
    - Not a user table
    
12. **_dummy** ⚠️ (Appears to be for connection warmup)
    - Only used in `/src/app/api/force-fix-rls/route.ts`
    - Not a real table

## Critical Findings:

### 1. **FEEDBACK TABLE MISMATCH** 🚨
- **Code expects**: `feedback`
- **Schema defines**: `user_feedback`
- **Files affected**:
  - `/src/app/feedback/actions.ts` (lines 41, 70, 111, 138)
  - All feedback functionality is broken!

### 2. **MISSING USER_DATA TABLE** 🚨
- **Code expects**: `user_data`
- **Schema**: Table not defined in current schema
- **Files affected**:
  - `/src/lib/storage.ts` (lines 70, 128, 169, 206, 240)
  - Storage functionality may be broken!

### 3. **Column Mismatches in Feedback**
- The schema shows `user_feedback` table has columns:
  - `id`, `user_id`, `circle_id`, `attendance_count`, `did_not_attend`, `rating`, `memorable_moment`, `created_at`
- Need to verify if the code is using the correct column names

## Recommendations:

1. **URGENT**: Either rename `user_feedback` to `feedback` in the database schema OR update all code references from `feedback` to `user_feedback`

2. **URGENT**: Either add the `user_data` table to the schema OR remove/update the storage.ts functionality

3. Consider creating a database types file to ensure type safety and prevent these mismatches

4. Add integration tests that verify table names match between code and database

## Additional Schema Observations:

### Tables Defined in Schema but NOT Used in Code:
1. **profiles** - Defined as the new schema replacement for users table (lines 26-42)
   - Not being queried anywhere in the codebase
   - The code still uses the old `users` table
   
2. **sms_attempts** - For rate limiting (lines 85-90)
   - Not being queried in the codebase
   - Likely managed by Edge Functions

### Schema Notes:
- The schema mentions both `users` (old/compatibility) and `profiles` (new) tables
- The `circle_members` table references `profiles(id)` in its foreign key (line 79)
- The `feedback` table in schema also references `profiles(id)` (line 97)
- This suggests a migration from `users` to `profiles` that hasn't been completed in the code

## Next Steps:

1. **CRITICAL**: Fix the feedback vs user_feedback table name mismatch
2. **CRITICAL**: Resolve the user_data table issue (add to schema or remove from code)
3. Decide on users vs profiles table strategy and complete migration if needed
4. Audit all column references to ensure they match the schema
5. Create TypeScript types from the database schema for compile-time safety
6. Add database integration tests to catch these mismatches early