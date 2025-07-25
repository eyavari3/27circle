27 Circle MVP Specification - Complete Production Guide
PROJECT OVERVIEW
Build a web application that facilitates spontaneous, in-person meetups for Stanford students through time-based circles. Users join waitlists for fixed daily time slots, discover meeting locations one hour before, and meet with other students for meaningful 20-minute conversations.
Target Users: Stanford students seeking authentic connections Core Value: Serendipitous, meaningful conversations with privacy and spontaneity Scale: Designed to handle unlimited users and circles
CORE CONCEPTS & PRINCIPLES
The Circle Philosophy
* Anonymous Until Meeting: No profiles, photos, or names visible before meeting in person
* Small Groups: 2-4 people per circle (optimal for deep conversation)
* Time-Boxed: Exactly 20 minutes to maintain energy and respect schedules
* Location-Based: Physical meetings at Stanford campus locations only
* Age-Based Matching: Separation by age groups (18-35 vs 36+)
* No Social Features: No chat, no follows, no persistent digital relationships
Privacy & Trust Model
* Users only see who they've actually met in person
* No pre-meeting information about other participants
* No-show tracking not implemented (MVP scope)
* Feedback is private and optional (skip button available)
Authentication Requirements
* Mandatory Authentication: Users MUST authenticate to access any app features
* No Anonymous Browsing: Cannot view or interact without signing in
* Two Auth Options: Phone (via Twilio) OR Google OAuth (via Supabase)
* Single Choice: Users pick one auth method, not both
USER JOURNEY
1. First-Time User Flow
A. Landing Experience
Route: /
* Clean, minimal splash screen
* "27 Circle" branding with subtle logo animation
* Tagline: "Be Curious Together"
* Subtext: "20-minute conversations that matter"
* Single CTA: "Get Started" or auto-progress after 3 seconds
B. Interest Discovery (Pre-Authentication)
Route: /onboarding/curiosity-1 and /onboarding/curiosity-2
Screen 1 - Mind Curiosity:
* "What sparks your curiosity?"
* Options (select 1 or both):
    * 🧠 Scientific Topics
    * 🕊️ Spiritual Discussions
Screen 2 - Heart Curiosity:
* "What goals are on your mind?"
* Options (select 1 or both):
    * 🚀 Personal Growth
    * 🌱 Community Service
C. Authentication Choice
Route: /auth After completing curiosity screens, users see:
* Title: "Join 27 Circle"
* Two Options:
    1. "Continue with Phone" → Phone auth flow
    2. "Continue with Google" → Google OAuth flow
* Note: Once chosen, user continues with that method
Phone Authentication Flow
Route: /auth/phone
* Clean form: "Enter your phone number"
* Subtext: "We'll text you a verification code"
* Phone number validation
Route: /auth/verify
* 6-digit code entry
* Auto-focus, auto-advance on completion
* Resend option after 30 seconds
* Creates user profile in Supabase upon success
Google OAuth Flow
Route: /auth/google
* Redirects to Google OAuth consent
* Handles callback at /auth/callback
* Creates user profile in Supabase upon success
* Current Status: ✅ Profiles are created and saved properly
D. Profile Completion
Route: /onboarding/profile
* Required for all users (phone or Google auth)
* Required info:
    * Full name (for in-person introductions only) - REQUIRED
    * Date of birth (for age-based matching - must be 18+) - REQUIRED
    * Gender (male/female/non-binary) - REQUIRED
* Location confirmation: "Stanford University" (pre-filled)
* Persistence: If user doesn't complete, they return here on next login
2. Returning User Flow
A. Home Screen
Route: /circles
Header Section:
* "Today's Circles" title
* Current time display (PST)
* Settings gear (top right)
Time Slots Section (3 daily slots):
┌─────────────────────────────────┐
│ 11:00 AM                        │
│ [Button State]                  │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ 2:00 PM                         │
│ [Button State]                  │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ 5:00 PM                         │
│ [Button State]                  │
└─────────────────────────────────┘
CRITICAL:
* Times must display as 11:00 AM, 2:00 PM, 5:00 PM PST in all environments
* Users can join waitlists for ALL 3 time slots on the same day
* No limit on total participants per time slot
Map Section:
* "Today's general area: [Location Name]"
* Zoomed-out map showing approximate region
* "Exact spots revealed 1 hour before each circle"
B. Button States & Time Logic
State Machine (for each time slot):
"Join" (Primary Action)
* When: Before deadline (10:00 AM/1:00 PM/4:00 PM)
* Button: Navy blue (#152B5C)
* Middle Text: "Decide by 10:00 AM" / "Decide by 1:00 PM" / "Decide by 4:00 PM"
* User not on waitlist
* Can join/leave unlimited times before deadline
"Can't Go" (Secondary Action)
* When: Before deadline
* Button: Gray with red text
* Middle Text: "Decide by 10:00 AM" / "Decide by 1:00 PM" / "Decide by 4:00 PM"
* User already on waitlist
* Can toggle back to "Join" anytime before deadline
* Immediately removes user from waitlist when clicked
"Confirmed ✓" (Success State)
* When: After deadline, user matched to circle
* Button: Success green
* Middle Text: "Confirmed at 10:00 AM" / "Confirmed at 1:00 PM" / "Confirmed at 4:00 PM"
* Clickable → Circle details
"Past" (Missed/Closed State)
* When: After deadline, user not matched OR never joined OR After feedback submitted OR at 8PM reset 
* Button: Gray, disabled
* Middle Text: "Closed at 10:00 AM" / "Closed at 1:00 PM" / "Closed at 4:00 PM"
* Resets to “Join” at 8PM each day.
* Non-interactive
"Feedback >" (Post-Circle State)
* When: 20 minutes after circle start time (11:20am, 2:20pm, 5:20pm)
* Button: Orange/yellow
* Middle Text: "Confirmed at 10:00 AM" / "Confirmed at 1:00 PM" / "Confirmed at 4:00 PM"
* Behavior: Opens feedback modal/form
* Skip option available (feedback is optional)
* Available until: 8PM same day (daily reset)
* Skip behavior: Modal closes, returns to main page, "Feedback" button remains
C. Circle Details Screen
Route: /circles/[circleId]
* Accessible only after matching
* Pre-Circle View (up to start time):
    * Today's conversation spark (randomly assigned)
    * Exact location with map pin (randomly assigned from location pool)
* Post-Circle (after end time):
    * Redirects to feedback flow
D. Feedback Flow
Route: /feedback/[circleId]
* Timing: Available 20 minutes after circle starts
* Deadline: Must complete by 8PM same day
* Storage: All feedback stored in Supabase
* Optional: Users can skip feedback
* Quick 3-question form:
    * "How many others were in your Circle?" [Dropdown: 1, 2, 3] + ["I couldn't make it" checkbox]
        * If checkbox checked: attendance_count = 0
        * If unchecked: attendance_count = dropdown value (1-3)
    * "How would you rate your experience?" [5 stars] (only shown if attended)
    * "What's one thing you'll remember?" [text input] (only shown if attended)
* Skip button: Closes modal, no penalty
* No participant names revealed (maintains anonymity)
3. Additional Screens
Settings
Route: /settings
* Profile updates
* Notification preferences
* Sign out
* Delete account
TECHNICAL ARCHITECTURE
Stack Overview
* Framework: Next.js 14 (App Router)
* Language: TypeScript (strict mode)
* Styling: Tailwind CSS
* Database: Supabase (PostgreSQL + Auth)
* Hosting: Vercel
* Authentication: Supabase Auth (Phone via Twilio + Google OAuth)
* Maps: Google Maps Static API
* Timezone Handling: date-fns-tz
Data Models
// Core entities
type User = {
  id: string
  full_name: string // REQUIRED
  email?: string
  phone_number?: string
  gender: 'male' | 'female' | 'non-binary' // REQUIRED
  date_of_birth: Date // REQUIRED
  interests: string[] // ['scientific_topics', 'spiritual_discussions', 'personal_growth', 'community_service']
  location: string
  created_at: Date
}

type TimeSlot = {
  id: string
  date: Date
  time: Date
  slot: '11AM' | '2PM' | '5PM'  // Data format
  deadline: Date  // Calculated on-the-fly, not stored in DB
}

type WaitlistEntry = {
  id: string
  userId: string
  timeSlotId: string
  joinedAt: Date
  archivedAt?: Date // Set when transferred to circle
}

type Circle = {
  id: string // Format: YYYY-MM-DD_11AM_Circle_1 (e.g., 2025-07-21_11AM_Circle_1)
  time_slot: Date // TIMESTAMPTZ
  location_id: string // REQUIRED
  conversation_spark_id: string // REQUIRED
  status: 'active' | 'past'
  max_participants: number
  created_at: Date
}

type CircleMember = {
  id: string
  circle_id: string
  user_id: string
  created_at: Date
}

type UserFeedback = {
  id: string
  user_id: string
  circle_id: string
  attendance_count: 0 | 1 | 2 | 3 // 0 = didn't attend
  quality_rating?: 1 | 2 | 3 | 4 | 5
  memorable_moment?: string
  created_at: Date
}

type UserData = {
  id: string
  user_id: string // Auth ID
  key: string
  value: any // JSONB in database
  created_at: Date
  updated_at: Date
}
Database Schema
CRITICAL: No RLS (Row Level Security) is implemented. Database client usage is intentionally mixed:
* createServiceClient() for administrative operations (matching, cron jobs)
* createClient() for user-scoped queries with auth context
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Stanford locations (must be created before circles table)
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL
);

-- Conversation sparks (must be created before circles table)
CREATE TABLE conversation_sparks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spark_text TEXT NOT NULL UNIQUE
);

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone_number TEXT UNIQUE,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'non-binary')),
  date_of_birth DATE NOT NULL,
  interests JSONB NOT NULL DEFAULT '[]',
  location TEXT DEFAULT 'Stanford University',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User interests
CREATE TABLE user_interests (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  interest_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, interest_type)
);

-- Circles (with junction table for members)
CREATE TABLE circles (
  id TEXT PRIMARY KEY, -- Format: YYYY-MM-DD_11AM_Circle_1
  time_slot TIMESTAMPTZ NOT NULL,
  location_id UUID NOT NULL REFERENCES locations(id),
  conversation_spark_id UUID NOT NULL REFERENCES conversation_sparks(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'past')),
  max_participants INTEGER DEFAULT 4,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Circle members (junction table)
CREATE TABLE circle_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id TEXT NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(circle_id, user_id)
);

-- Waitlist entries (archived after matching)
CREATE TABLE waitlist_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  time_slot TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ, -- Set when matched to circle
  UNIQUE(user_id, time_slot)
);

-- User feedback
CREATE TABLE user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  circle_id TEXT NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  attendance_count INTEGER NOT NULL CHECK (attendance_count BETWEEN 0 AND 3),
  quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
  memorable_moment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, circle_id)
);

-- User data (app state storage - KEPT SEPARATE)
CREATE TABLE user_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, key)
);

-- Create indexes for performance
CREATE INDEX idx_user_data_lookup ON user_data(user_id, key);
CREATE INDEX idx_waitlist_time_slot ON waitlist_entries(time_slot);
CREATE INDEX idx_waitlist_archived ON waitlist_entries(archived_at);
CREATE INDEX idx_circles_time_slot ON circles(time_slot);
CREATE INDEX idx_circle_members_circle ON circle_members(circle_id);
CREATE INDEX idx_circle_members_user ON circle_members(user_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_feedback_circle ON user_feedback(circle_id);
CREATE INDEX idx_feedback_user ON user_feedback(user_id);

-- Create updated_at trigger for user_data
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_data_updated_at BEFORE UPDATE ON user_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
Seed Data
Conversation Sparks:
INSERT INTO conversation_sparks (spark_text) VALUES
('What''s something you wish more people got excited about?'),
('What''s one small thing that always boosts your mood?'),
('If you could instantly master one hobby or skill, what would it be?'),
('What''s a movie, show, or song you''d make everyone try at least once?'),
('Would you rather explore space, the ocean, or your own mind?'),
('What''s a random fun fact you never forgot?'),
('If you could plan the perfect weekend, what would it include?'),
('What''s something small that instantly makes someone more likable?'),
('Would you rather have unlimited time, unlimited money, or unlimited energy?'),
('What''s the most spontaneous thing you''ve ever done?');
Stanford Locations:
INSERT INTO locations (name, latitude, longitude) VALUES
('Old Union Fountain Spot', 37.425444, -122.170111),
('White Plaza Center Point', 37.425222, -122.170028),
('Stanford Bookstore Front Door', 37.425111, -122.169611),
('Memorial Church Quad Center', 37.427472, -122.169694),
('Main Quad South Entrance', 37.426889, -122.169944),
('Green Library Front Steps', 37.425944, -122.172639),
('Tresidder Union Coffee Spot', 37.422083, -122.175361),
('Cantor Arts Sculpture Garden', 37.430194, -122.170611),
('Bing Concert Hall Plaza', 37.427778, -122.169306),
('The Oval Center Grass', 37.430278, -122.175278);
Data Persistence Architecture
CRITICAL: The app uses NO localStorage for user data. All data is stored in Supabase for perfect dev/prod parity.
Storage Utility (/src/lib/storage.ts)
class Storage {
  private userId: string;
  private cache = new Map<string, any>();
  private pendingWrites = new Map<string, Promise<void>>();
  
  constructor(userId: string) {
    this.userId = userId;
  }
  
  async set(key: string, value: any): Promise<void> {
    // Optimistic cache update for instant UI
    this.cache.set(key, value);
    // Debounced database write
  }
  
  async get(key: string): Promise<any> {
    // Return cached value if available
    // Otherwise fetch from database
  }
  
  async preload(keys: string[]): Promise<void> {
    // Preload multiple keys for performance
  }
}
Key features:
* In-memory caching for instant UI updates
* Debounced writes to reduce database calls
* Graceful error handling with fallbacks
* Preloading for critical data
Implementation Summary:
* ✅ Created user_data table with JSONB storage
* ✅ Built enhanced Storage utility (/src/lib/storage.ts)
* ✅ Migrated all core data flows: feedback, preferences, onboarding state, account data
* ✅ Added in-memory caching with 5-minute TTL
* ✅ Implemented optimistic updates for instant UI responses
* ✅ Fixed PostgREST .single() compatibility issue (406 error)
Critical Implementation Detail: Replaced .single() queries with array queries to resolve PostgREST HTTP 406 errors:
// Instead of .single() (causes 406)
const { data, error } = await supabase
  .from('user_data')
  .select('value')
  .eq('user_id', userId)
  .eq('key', key); // Returns array

// Handle empty results
if (!data || data.length === 0) return defaultValue;
return data[0].value; // Extract single value
Time System Architecture
The app uses a sophisticated 790-line time management system (/src/lib/time.ts) that handles all timezone complexities and button state logic.
Core Components:
1. Timezone Handling
* All times stored as UTC in database
* Display always in PST using date-fns-tz
* No manual offset calculations
* Automatic DST handling
2. Three Pure Phase Functions
// Check if before deadline (can join/leave waitlist)
export function isBeforeDeadline(slot: TimeSlot, currentTime?: Date): boolean

// Check if during event (confirmed users see circle details)
export function isDuringEvent(slot: TimeSlot, currentTime?: Date): boolean

// Check if after event (feedback available)
export function isAfterEvent(slot: TimeSlot, currentTime?: Date): boolean
3. Unified Button State Logic
export function getButtonState(
  slot: {
    timeSlot: TimeSlot;
    isOnWaitlist: boolean;
    assignedCircleId: string | null;
  },
  currentTime?: Date,
  feedbackSubmitted: boolean = false
): {
  buttonState: 'join' | 'leave' | 'confirmed' | 'feedback' | 'past';
  buttonText: string;
  middleText: string;
  isDisabled: boolean;
}
4. Critical Time Utilities
// Create UTC date representing specific PST time (production-critical)
export function createPSTDateAsUTC(
  year: number,
  month: number,  // 1-indexed
  day: number,
  hour: number,
  minute: number = 0
): Date

// Get current PST time with test offset support
export function getCurrentPSTTime(): Date

// Create daily time slots
export function createTimeSlots(displayDate?: Date): TimeSlot[]
5. Testing Infrastructure
* NEXT_PUBLIC_APP_TIME_OFFSET environment variable
* Format: Decimal hours (9.5 = 9:30 AM, 14.5 = 2:30 PM)
* Allows simulation of any time for testing
6. Debugging Pattern
console.log(`⏰ TIME SYSTEM ANALYSIS for ${timeSlot.slot}:`, {
  input: { isOnWaitlist, assignedCircleId, currentTime },
  phases: { beforeDeadline, duringEvent, afterEvent },
  pathTaken: beforeDeadline ? 'BEFORE_DEADLINE' : duringEvent ? 'DURING_EVENT' : 'AFTER_EVENT'
});
Matching Algorithm
function matchUsersForTimeSlot(timeSlotId: string) {
  // 1. Get all waitlist entries for this slot
  // 2. Separate users by age group (18-35 vs 36+)
  // 3. Create groups using optimal sizing:
  //    - 1 person: Gets own circle (very rare edge case)
  //    - 2-4 people: Single group of that size
  //    - 5 people: Split into 3 + 2 (not 4 + 1)
  //    - 6 people: Split into 4 + 2 (or 3 + 3)
  //    - 7+ people: Maximize groups of 4, then 3, then 2
  // 4. For 100 people: Creates 25 circles of 4
  // 5. Each circle gets:
  //    - Random location from locations table (duplicates allowed)
  //    - Random conversation spark (can repeat)
  //    - Unique ID: YYYY-MM-DD_11AM_Circle_1, _Circle_2, _Circle_3, etc.
  // 6. No limit on number of circles per time slot
  // 7. Users can be matched with same people multiple times (no restrictions)
  // 8. Set archived_at timestamp on all transferred waitlist entries
}
Edge Cases
* Only 1 person in age group: Create circle with 1 person if no mixed-age option
* Odd numbers: Use optimal group sizing (5 people = 3+2, not 4+1)
* No-shows: No tracking implemented (MVP scope)
* Over-capacity: No limit - 100 people creates 25 circles of 4
* Under 18 users: Not allowed to join (validation enforced)
Location & Spark Assignment
// Locations are pre-seeded in Supabase with Stanford GPS coordinates
function assignLocationToCircle(circleId: string) {
  // Random selection from all locations
  // Multiple circles can have same location
  const location = getRandomLocation();
  return location;
}

// Conversation sparks are pre-seeded in Supabase
function assignSparkToCircle(circleId: string) {
  // Random selection, can repeat
  const spark = getRandomSpark();
  return spark;
}
Time Management
* All times in PST (no timezone complexity for users)
* Daily schedule resets at 8:00 PM PST
* Deadlines: 10:00 AM, 1:00 PM, 4:00 PM (1 hour before circles)
* Matching runs at deadlines via cron
* Circle status changes from 'active' to 'past' 20 minutes after start time
* Development time override via NEXT_PUBLIC_APP_TIME_OFFSET (decimal hours format)
Security & Privacy
Authentication
* Phone verification OR Google OAuth (trust + convenience)
* Session management via Supabase Auth
* NO anonymous users - authentication required for all features
Data Access
* No RLS enabled - trusted Stanford community
* Mixed client strategy:
    * createServiceClient() for admin operations
    * createClient() for user-scoped queries
* This separation is intentional for security
Privacy Features
* No user discovery/search
* No public profiles
* Meeting history private by default (stored indefinitely)
* Option to "forget" past meetings
* Feedback is anonymous to other participants
Development Configuration
Development Shortcuts: Keep all development utilities active:
* dev-user-id patterns for quick testing
* NEXT_PUBLIC_APP_TIME_OFFSET for time simulation
* Debug logging (existing console.log statements)
Testing Strategy:
* UI/UX testing: Local development only
* All other testing: Vercel deployment
* Time simulation via NEXT_PUBLIC_APP_TIME_OFFSET environment variable
Validation Requirements
Must-have validations:
1. Age verification (18+ only)
2. Phone number format (if using phone auth)
3. Profile completion before joining waitlists (full_name, date_of_birth, gender required)
4. Time slot validity (can't join past slots)
5. Deadline enforcement (can't join/leave after deadline)
CRITICAL IMPLEMENTATION DETAILS
1. Database Permission Architecture
CRITICAL LESSON: Always use the appropriate database client for the operation type to avoid permission issues.
The Solution:
// For administrative operations (matching, cron jobs):
const serviceClient = await createServiceClient();

// For user-scoped queries with auth context:
const client = await createClient();
This intentional separation provides security while maintaining flexibility.
2. PostgREST Array Query Pattern
Problem: .single() queries cause HTTP 406 errors with PostgREST.
Solution: Use array queries and extract the first result:
// ❌ Don't use .single()
const { data, error } = await supabase
  .from('table')
  .select('*')
  .eq('id', id)
  .single(); // Causes 406 error

// ✅ Use array query
const { data, error } = await supabase
  .from('table')
  .select('*')
  .eq('id', id);

// Handle the result
if (!data || data.length === 0) return null;
return data[0];
3. Time System Debugging
Essential pattern for debugging time-based features:
console.log(`⏰ TIME ANALYSIS for ${timeSlot.slot}:`, {
  input: { isOnWaitlist, assignedCircleId, currentTime },
  phases: { beforeDeadline, duringEvent, afterEvent },
  pathTaken: beforeDeadline ? 'BEFORE_DEADLINE' : duringEvent ? 'DURING_EVENT' : 'AFTER_EVENT',
  times: {
    current: currentTime.toLocaleTimeString(),
    deadline: timeSlot.deadline.toLocaleTimeString(),
    eventStart: timeSlot.time.toLocaleTimeString(),
    eventEnd: new Date(timeSlot.time.getTime() + 20 * 60 * 1000).toLocaleTimeString()
  }
});
4. Testing Time-Based Features
# Test pre-deadline (9:30 AM)
NEXT_PUBLIC_APP_TIME_OFFSET=9.5 npm run dev

# Test post-deadline confirmed (10:10 AM for 11AM slot)
NEXT_PUBLIC_APP_TIME_OFFSET=10.17 npm run dev

# Test during event (11:10 AM)
NEXT_PUBLIC_APP_TIME_OFFSET=11.17 npm run dev

# Test feedback window (11:25 AM - 20 mins after start)
NEXT_PUBLIC_APP_TIME_OFFSET=11.42 npm run dev

# Test daily reset (8:30 PM)
NEXT_PUBLIC_APP_TIME_OFFSET=20.5 npm run dev

# Edge case: Test midnight (12:00 AM)
NEXT_PUBLIC_APP_TIME_OFFSET=0.0 npm run dev
DEVELOPMENT GUIDELINES
Code Quality Standards
* TypeScript strict mode always
* 100% type coverage for core logic
* Component tests for interactions
* E2E tests for critical paths
* Accessibility audit on each screen
Performance Targets
* Initial load: <3s on 3G
* Interaction response: <100ms (using optimistic updates)
* Time accuracy: ±1 second (millisecond precision for calculations)
* Database queries: <50ms (with caching)
* Real-time updates: Via client-side polling (10-second intervals)
Performance Monitoring
* Database query performance tracking
* Time-sensitive operation monitoring
* Cache hit rates for user data
* Button state transition accuracy
* Hydration mismatch detection
Deployment Strategy
* Feature flags for gradual rollout
* Test on staging environment first
* Database migrations with backups
* Zero-downtime deployments
* Rollback procedures for each major change
Development Workflow
* No RLS during development - mixed client usage is intentional
* Use appropriate client based on operation type
* Implement comprehensive logging before complex features
* Create time simulation tools for time-dependent features
* Test authentication flows separately (phone vs Google)
DATA FORMAT CLARIFICATIONS
Time Slot Formats
* Data Layer: Use '11AM', '2PM', '5PM' (compact format for storage/logic)
* Display Layer: Show as "11:00 AM", "2:00 PM", "5:00 PM" (user-friendly)
* Deadlines: Always display as "10:00 AM", "1:00 PM", "4:00 PM"
Circle ID Format
* Standard format: YYYY-MM-DD_SLOT_Circle_N where N is incrementing number
* Examples: 2025-07-21_11AM_Circle_1, 2025-07-21_11AM_Circle_2, ... 2025-07-21_11AM_Circle_25
* No cap on circle numbers (scales with demand)
Circle Member Assignment
* Uses junction table (circle_members)
* Optimal group sizing algorithm:
    * 1 = 1 (single person circle, rare)
    * 2 = 2 (pair)
    * 3 = 3 (trio)
    * 4 = 4 (quad)
    * 5 = 3 + 2 (split for better dynamics)
    * 6 = 4 + 2 or 3 + 3
    * 7+ = Maximize 4s, then 3s, then 2s
Environment Variables
* Always use NEXT_PUBLIC_APP_TIME_OFFSET (not APP_TIME_OFFSET)
* Format: Decimal hours (9.0 = 9:00 AM, 14.5 = 2:30 PM, 20.0 = 8:00 PM)
* Works on both server and client due to NEXT_PUBLIC_ prefix
CRITICAL IMPLEMENTATION STATUS
✅ Completed Features
1. Core user flows: Authentication (Phone + Google OAuth), onboarding, circles, feedback
2. Time system: Sophisticated 790-line system with timezone handling
3. Button state logic: Three-phase pure functions with unified state
4. Storage migration: Core flows use Supabase (some dev tools still use localStorage)
5. Google OAuth: Implemented and profiles save correctly
6. Waitlist system: Users can join all 3 slots per day
7. PostgREST Compatibility: Fixed HTTP 406 errors with array queries
8. Database schema: Junction table for circle members
9. Matching algorithm: Full age-based separation with optimal grouping
10. Cron jobs: Automated matching at deadlines
🚧 Known Issues to Address
1. Multiple Storage Systems:
    * Current: Some dev tools still use localStorage
    * Solution: Complete migration to Storage utility
2. Console.log Cleanup:
    * Many console.log statements remain
    * Keep for development, consider log levels for production
FEATURE
The authentication and onboarding flow must work end-to-end without errors:
* Full user journey: Splash → Curiosity 1 → Curiosity 2 → Auth (Google/Phone) → Profile → Circles
* Anonymous users (pre-auth) must be able to complete curiosity screens without database errors
* OAuth must redirect to profile completion, not back to splash screen
* Profile data must save successfully to Supabase after authentication
* All time displays must show as "11:00 AM", "2:00 PM", "5:00 PM" (not 11:05 AM, etc.)
* Production environment must block anonymous access while preserving dev utilities
EXAMPLES
The Storage utility pattern for handling anonymous vs authenticated users:
// Pre-auth: Use sessionStorage only
if (userId.startsWith('anon-')) {
  sessionStorage.setItem(`temp_${key}`, value);
}

// Post-auth: Use Supabase
const { data } = await supabase.from('user_data').select('*').eq('user_id', userId);
// Note: Never use .single() - always use array queries
DOCUMENTATION
Critical Implementation Notes:
* PostgREST .single() queries cause HTTP 406 errors - always use array queries and extract first element
* Service client (createServiceClient()) cannot see user auth sessions - use createClient() for user operations
* Anonymous user IDs (format: anon-timestamp-random) must never make direct Supabase calls
* OAuth redirect URLs must exactly match between code, environment variables, and provider configuration
* The Storage utility must be used for ALL pre-auth data storage, not just onboarding keys
* Console logging should follow the strategic pattern: 🔐 AUTH, 🧭 NAV, 💾 DATA, 🎯 CHECK
OTHER CONSIDERATIONS
* Environment Configuration:
    * NEXT_PUBLIC_SITE_URL must exactly match your production domain (include www. if your domain uses it)
    * Keep NEXT_PUBLIC_APP_TIME_OFFSET empty for production (testing only)
    * Ensure all Twilio variables are set for phone auth
* Storage Architecture:
    * Pre-auth users use sessionStorage exclusively for ALL operations
    * Data migrates to Supabase after authentication
    * Never use localStorage (spec requirement)
    * Storage utility handles the anonymous/authenticated split automatically
* Database Client Selection:
    * Use createClient() when you need access to the user's auth session
    * Use createServiceClient() only for administrative operations that bypass RLS
    * Profile save MUST use regular client or it won't see the user session
* Production vs Development:
    * Anonymous access blocked in production via environment checks
    * Dev utilities (dev-user-id) preserved for local development
    * Test mode disabled in production (NEXT_PUBLIC_ENABLE_TEST_USERS=false)
* Common Pitfalls:
    * Anonymous users attempting database operations will get 400/401 errors
    * OAuth callbacks fail if redirect URL doesn't match exactly (check www vs non-www)
    * Profile save operations need the regular client, not service client
    * Time displays must use :00 format, not :05
    * The key 'onboarding-state' vs 'onboarding_state' mismatch can cause storage failures
Maintenance
* Monitor database performance as user base grows
* Maintain diagnostic API endpoints for ongoing troubleshooting
* Create automated testing for time-based edge cases with APP_TIME_OFFSET
* Document operational procedures for database management
* Implement database backup/restore procedures for development
* Monitor location usage patterns for possible expansion
Environment Variables
Required for production:
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

NEXT_PUBLIC_GOOGLE_MAPS_KEY=your_google_maps_api_key

TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_SERVICE_SID=your_twilio_service_sid
TWILIO_SERVICE_SECRET=your_twilio_service_secret
TWILIO_PHONE_NUMBER=your_twilio_phone_number

RESEND_API_CODE=your_resend_api_key

SUPABASE_JWT_SECRET=your_supabase_jwt_secret

# Production: Set this to your production domain
NEXT_PUBLIC_SITE_URL=https://your-domain.com

# Test User System
# Set to 'false' in production, 'true' for development testing
NEXT_PUBLIC_ENABLE_TEST_USERS=false

# Time Testing (leave empty for production)
NEXT_PUBLIC_APP_TIME_OFFSET=
DEPLOYMENT REQUIREMENTS
1. Database Setup:
    * Run all CREATE TABLE statements
    * Run seed data INSERT statements
    * No RLS setup needed
2. Authentication Setup:
    * Configure Twilio in Supabase (for phone auth)
    * Configure Google OAuth in Supabase Console
    * Set redirect URLs for both auth methods
3. Cron Jobs:
    * Set up matching algorithm to run at 10:00 AM, 1:00 PM, 4:00 PM PST daily
    * Matching algorithm: Create circles, assign locations/sparks, archive waitlist entries
    * Status update job: Change circle status from 'active' to 'past' at 11:20 AM, 2:20 PM, 5:20 PM PST
4. Environment Configuration:
    * Set all required environment variables on Vercel
    * Keep NEXT_PUBLIC_APP_TIME_OFFSET empty for production (only for testing)
DAILY OPERATIONS
* Circles run every day (including weekends/holidays)
* Matching at: 10:00 AM, 1:00 PM, 4:00 PM PST
* Status changes: 11:20 AM, 2:20 PM, 5:20 PM PST (active → past)
* System reset: 8:00 PM PST (all buttons reset for next day)
* Feedback window: 20 minutes after start until 8:00 PM PST
* Data retention: All data stored indefinitely
* No user cap: System scales to any number of users/circles
VALIDATION CHECKLIST
Before considering the implementation complete, verify:
* [ ] Complete auth flow works: Splash → Curiosity → Auth → Profile → Circles
* [ ] Zero 400/401 errors in browser console for anonymous users
* [ ] Google OAuth successfully redirects to /onboarding/profile
* [ ] Phone auth successfully redirects to /onboarding/profile
* [ ] Profile form data saves to Supabase users table
* [ ] Settings page doesn't cause immediate logout
* [ ] No infinite redirect loops at any stage
* [ ] Session persists across page navigations after authentication
* [ ] Times display as "11:00 AM", "2:00 PM", "5:00 PM" everywhere
* [ ] Feedback saves to user_feedback table (not user_data)
* [ ] Production blocks anonymous access but development allows it
* [ ] No console spam - only strategic logging patterns remain

This specification represents the complete MVP implementation for 27 Circle, reflecting the actual codebase architecture and all critical implementation details. Build with confidence knowing this document matches reality.
