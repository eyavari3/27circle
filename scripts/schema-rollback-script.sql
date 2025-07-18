-- 27 Circle Schema Cleanup ROLLBACK Script
-- Generated: 2025-07-18T00:40:00Z
-- 
-- 🔄 EMERGENCY ROLLBACK: Run this if you need to restore removed objects
-- 
-- WARNING: This script recreates the table structures but NOT the data!
-- Only use this if the cleanup broke something unexpectedly.

-- =====================================================
-- ROLLBACK: RECREATE DROPPED TABLES
-- =====================================================

-- NOTE: You'll need to restore data from backup separately
-- This only recreates the table structures

-- Recreate profiles table (legacy user structure)
CREATE TABLE IF NOT EXISTS profiles (
    id uuid PRIMARY KEY,
    email text,
    name text,
    phone text,
    gender text,
    date_of_birth date,
    location text DEFAULT 'Stanford University',
    scientific_topics boolean DEFAULT false,
    spiritual_discussions boolean DEFAULT false,
    personal_growth boolean DEFAULT false,
    community_service boolean DEFAULT false,
    event_notifications_enabled boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT NOW(),
    updated_at timestamp with time zone DEFAULT NOW()
);

-- Recreate daily_events table (legacy event structure)
CREATE TABLE IF NOT EXISTS daily_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_date date NOT NULL,
    time_slot text NOT NULL,
    location_id uuid,
    created_at timestamp with time zone DEFAULT NOW(),
    UNIQUE(event_date, time_slot)
);

-- Recreate joins table (legacy join mechanism)
CREATE TABLE IF NOT EXISTS joins (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    event_id uuid NOT NULL,
    joined_at timestamp with time zone DEFAULT NOW(),
    UNIQUE(user_id, event_id)
);

-- Recreate feedback table (unused feedback structure)
CREATE TABLE IF NOT EXISTS feedback (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    event_id uuid NOT NULL,
    attendance_count integer,
    did_not_attend boolean DEFAULT false,
    rating integer,
    memorable_moment text,
    created_at timestamp with time zone DEFAULT NOW(),
    UNIQUE(user_id, event_id)
);

-- Recreate sparks table (duplicate of conversation_sparks)
CREATE TABLE IF NOT EXISTS sparks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    text text NOT NULL,
    created_at timestamp with time zone DEFAULT NOW(),
    UNIQUE(text)
);

-- =====================================================
-- ROLLBACK: RECREATE DROPPED INDEXES
-- =====================================================

-- Feedback table indexes
CREATE INDEX IF NOT EXISTS idx_feedback_event_id ON feedback(event_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS feedback_user_id_event_id_key ON feedback(user_id, event_id);

-- Joins table indexes  
CREATE INDEX IF NOT EXISTS idx_joins_event_id ON joins(event_id);
CREATE INDEX IF NOT EXISTS idx_joins_user_id ON joins(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS joins_user_id_event_id_key ON joins(user_id, event_id);

-- Daily events table indexes
CREATE INDEX IF NOT EXISTS idx_daily_events_date_slot ON daily_events(event_date, time_slot);
CREATE UNIQUE INDEX IF NOT EXISTS daily_events_event_date_time_slot_key ON daily_events(event_date, time_slot);

-- Sparks table indexes
CREATE UNIQUE INDEX IF NOT EXISTS sparks_text_key ON sparks(text);

-- =====================================================
-- ROLLBACK: RECREATE FOREIGN KEY CONSTRAINTS (if needed)
-- =====================================================

-- Add foreign key constraints if they existed
-- Note: Adjust these based on your specific requirements

-- Example foreign keys (uncomment and modify as needed):
-- ALTER TABLE daily_events ADD CONSTRAINT daily_events_location_id_fkey 
--   FOREIGN KEY (location_id) REFERENCES locations(id);
-- ALTER TABLE joins ADD CONSTRAINT joins_user_id_fkey 
--   FOREIGN KEY (user_id) REFERENCES users(id);
-- ALTER TABLE feedback ADD CONSTRAINT feedback_user_id_fkey 
--   FOREIGN KEY (user_id) REFERENCES users(id);

-- =====================================================
-- ROLLBACK VERIFICATION
-- =====================================================

-- Check that all tables exist again
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

SELECT 'Rollback completed - tables and indexes restored!' as rollback_status;
SELECT 'Remember to restore data from backup if needed' as important_note;