# 27 Circle MVP Specification - Complete Production Guide

## PROJECT OVERVIEW
Build a web application that facilitates spontaneous, in-person meetups for Stanford students through time-based circles. Users join waitlists for fixed daily time slots, discover meeting locations one hour before, and meet with other students for meaningful 20-minute conversations.

**Target Users**: Stanford students seeking authentic connections
**Core Value**: Serendipitous, meaningful conversations with privacy and spontaneity
**Scale**: Designed to handle unlimited users and circles

## CORE CONCEPTS & PRINCIPLES

### The Circle Philosophy
- **Anonymous Until Meeting**: No profiles, photos, or names visible before meeting in person
- **Small Groups**: 2-4 people per circle (optimal for deep conversation)
- **Time-Boxed**: Exactly 20 minutes to maintain energy and respect schedules
- **Location-Based**: Physical meetings at Stanford campus locations only
- **Age-Based Matching**: Separation by age groups (18-35 vs 36+)
- **No Social Features**: No chat, no follows, no persistent digital relationships

### Privacy & Trust Model
- Users only see who they've actually met in person
- No pre-meeting information about other participants
- No-show tracking not implemented (MVP scope)
- Feedback is private and optional (skip button available)

### Authentication Requirements
- **Mandatory Authentication**: Users MUST authenticate to access any app features
- **No Anonymous Browsing**: Cannot view or interact without signing in
- **Two Auth Options**: Phone (via Twilio) OR Google OAuth (via Supabase)
- **Single Choice**: Users pick one auth method, not both

## USER JOURNEY

### 1. First-Time User Flow

#### A. Landing Experience
**Route**: `/`
- Clean, minimal splash screen
- "27 Circle" branding with subtle logo animation
- Tagline: "Be Curious Together"
- Subtext: "20-minute conversations that matter"
- Single CTA: "Get Started" or auto-progress after 3 seconds

#### B. Interest Discovery (Pre-Authentication)
**Route**: `/onboarding/curiosity-1` and `/onboarding/curiosity-2`

**Screen 1 - Mind Curiosity**:
- "What sparks your curiosity?"
- Options (select 1 or both):
  - 🧠 Scientific Topics - "Science, research, innovation"
  - 🕊️ Spiritual Discussions - "Philosophy, meaning, consciousness"

**Screen 2 - Heart Curiosity**:
- "What goals are on your mind?"
- Options (select 1 or both):
  - 🚀 Personal Growth - "Self-improvement, learning, development"
  - 🌱 Community Service - "Making a difference, helping others"

#### C. Authentication Choice
**Route**: `/auth`
After completing curiosity screens, users see:
- **Title**: "Join 27 Circle"
- **Two Options**:
  1. "Continue with Phone" → Phone auth flow
  2. "Continue with Google" → Google OAuth flow
- **Note**: Once chosen, user continues with that method

##### Phone Authentication Flow
**Route**: `/auth/phone`
- Clean form: "Enter your phone number"
- Subtext: "We'll text you a verification code"
- Phone number validation

**Route**: `/auth/verify`
- 6-digit code entry
- Auto-focus, auto-advance on completion
- Resend option after 30 seconds
- Creates user profile in Supabase upon success

##### Google OAuth Flow
**Route**: `/auth/google`
- Redirects to Google OAuth consent
- Handles callback at `/auth/callback`
- Creates user profile in Supabase upon success
- **Current Status**: ✅ Profiles are created and saved properly

#### D. Profile Completion
**Route**: `/onboarding/profile`
- **Required for all users** (phone or Google auth)
- Required info:
  - Full name (for in-person introductions only) - REQUIRED
  - Date of birth (for age-based matching - must be 18+) - REQUIRED
  - Gender (male/female/non-binary) - REQUIRED
- Location confirmation: "Stanford University" (pre-filled)
- Notification preferences (default: on)
- **Persistence**: If user doesn't complete, they return here on next login

### 2. Returning User Flow

#### A. Home Screen
**Route**: `/circles`

**Header Section**:
- "Today's Circles" title
- Current time display (PST)
- Settings gear (top right)

**Time Slots Section** (3 daily slots):
```
┌─────────────────────────────────┐
│ 11:00 AM                        │
│ Morning energy, fresh perspectives│
│ [Button State]                  │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ 2:00 PM                         │
│ Afternoon break, recharge time   │
│ [Button State]                  │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ 5:00 PM                         │
│ End of day reflections          │
│ [Button State]                  │
└─────────────────────────────────┘
```

**CRITICAL**: 
- Times must display as 11:00 AM, 2:00 PM, 5:00 PM PST in all environments
- Users can join waitlists for ALL 3 time slots on the same day
- No limit on total participants per time slot

**Map Section**:
- "Today's general area: [Location Name]"
- Zoomed-out map showing approximate region
- "Exact spots revealed 1 hour before each circle"

#### B. Button States & Time Logic (Method 7)
**State Machine** (for each time slot):

**"Join"** (Primary Action)
- When: Before deadline (10:00 AM/1:00 PM/4:00 PM)
- Button: Navy blue (#152B5C)
- Middle Text: "Decide by 10:00 AM" / "Decide by 1:00 PM" / "Decide by 4:00 PM"
- User not on waitlist
- Can join/leave unlimited times before deadline

**"Can't Go"** (Secondary Action)
- When: Before deadline
- Button: Gray with red text
- Middle Text: "Decide by 10:00 AM" / "Decide by 1:00 PM" / "Decide by 4:00 PM"
- User already on waitlist
- Can toggle back to "Join" anytime before deadline
- Immediately removes user from waitlist when clicked

**"Confirmed ✓"** (Success State)
- When: After deadline, user matched to circle
- Button: Success green
- Middle Text: "Confirmed at 10:00 AM" / "Confirmed at 1:00 PM" / "Confirmed at 4:00 PM"
- Clickable → Circle details

**"Past"** (Missed/Closed State)
- When: After deadline, user not matched OR never joined
- Button: Gray, disabled
- Middle Text: "Closed at 10:00 AM" / "Closed at 1:00 PM" / "Closed at 4:00 PM"
- Non-interactive

**"In Progress"** (Active State)
- When: During circle time (20 min window)
- Shows countdown timer
- If matched: Shows "Join your circle →"

**"Feedback >"** (Post-Circle State)
- When: 20 minutes after circle start time (11:20am, 2:20pm, 5:20pm)
- Button: Orange/yellow
- Middle Text: "Confirmed at 10:00 AM" / "Confirmed at 1:00 PM" / "Confirmed at 4:00 PM"
- Behavior: Opens feedback modal/form
- Skip option available (feedback is optional)
- Disappears when: User submits/skips feedback OR at 8PM daily reset
- Reset timing: All buttons show "Past" at 7:59pm, switch to "Join" at 8:00pm

**"Past"** (Completed State) 
- When: After feedback submitted OR during 7:59pm transition period
- Button: Gray, disabled
- Middle Text: Dynamic based on user journey:
  - If user was matched: "Confirmed at [Time]"
  - If user was not matched: "Closed at [Time]"
- Behavior: Not clickable
- Transitions to "Join" at 8:00pm daily reset

**Daily Reset**: At 8:00 PM PST, all slots reset to "Join" state for next day

#### C. Circle Details Screen
**Route**: `/circles/[circleId]`
- Accessible only after matching
- Pre-Circle View (up to start time):
  - Countdown timer: "Circle starts in 14:32"
  - Exact location with map pin (randomly assigned from location pool)
  - Walking directions from current location
  - Today's conversation spark (randomly assigned)
  - "Who's coming?" → "[N] others are confirmed" (no names/details)
  - Tips: "Arrive 2 minutes early", "Look for others checking phones"

- During Circle (20-minute window):
  - Live timer: "18:45 remaining"
  - Conversation spark prominently displayed
  - "Can't make it?" button (emergency only)

- Post-Circle (after end time):
  - Redirects to feedback flow

#### D. Feedback Flow
**Route**: `/feedback/[circleId]`
- **Timing**: Available 20 minutes after circle starts
- **Storage**: All feedback stored in Supabase
- **Optional**: Users can skip feedback
- Quick 3-question form:
  - "How many others were in your Circle?" [Dropdown: 1, 2, 3] + ["I couldn't make it" checkbox]
    - If checkbox checked: attendance_count = 0
    - If unchecked: attendance_count = dropdown value (1-3)
  - "How would you rate your experience?" [5 stars] (only shown if attended)
  - "What's one thing you'll remember?" [text input] (only shown if attended)
- Skip button: Closes modal, no penalty
- No participant names revealed (maintains anonymity)

### 3. Additional Screens

#### Settings
**Route**: `/settings`
- Profile updates
- Notification preferences
- Circle history (shows past circles attended, stored indefinitely)
- Sign out
- Delete account

#### Error States
- No circles available (holidays, breaks)
- Matching failed (rare: only if literally 1 person in a slot)
- Location unavailable (construction, events)

## TECHNICAL ARCHITECTURE

### Stack Overview
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL + Auth)
- **Hosting**: Vercel
- **Authentication**: Supabase Auth (Phone via Twilio + Google OAuth)
- **Maps**: Google Maps Static API
- **Timezone Handling**: date-fns-tz

### Data Models
```typescript
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
  id: string // Format: YYYY-MM-DD_11AM_1 (e.g., 2025-07-21_11AM_1)
  time_slot: Date // TIMESTAMPTZ
  location_id: string // REQUIRED
  conversation_spark_id: string // REQUIRED
  status: 'active' | 'past'
  user_1?: string
  user_2?: string
  user_3?: string
  user_4?: string
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
  user_id: string // Auth ID or session ID
  key: string
  value: any // JSONB in database
  created_at: Date
  updated_at: Date
}
```

### Database Schema

**CRITICAL**: No RLS (Row Level Security) is implemented. Use service client for all operations.

```sql
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

-- Stanford locations (pre-seeded with GPS coordinates)
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL
);

-- Conversation sparks (pre-seeded questions)
CREATE TABLE conversation_sparks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spark_text TEXT NOT NULL UNIQUE
);

-- Waitlist entries (ARCHIVED after matching, not deleted)
CREATE TABLE waitlist_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  time_slot TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ, -- Set when transferred to circle
  UNIQUE(user_id, time_slot)
);

-- Circles (formed groups with embedded members)
CREATE TABLE circles (
  id TEXT PRIMARY KEY, -- Format: YYYY-MM-DD_11AM_1, YYYY-MM-DD_11AM_2, etc.
  time_slot TIMESTAMPTZ NOT NULL,
  location_id UUID NOT NULL REFERENCES locations(id),
  conversation_spark_id UUID NOT NULL REFERENCES conversation_sparks(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'past')),
  user_1 UUID REFERENCES users(id),
  user_2 UUID REFERENCES users(id),
  user_3 UUID REFERENCES users(id),
  user_4 UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(time_slot, location_id) -- Prevent duplicate locations per time slot
);

-- User feedback (optional after circles)
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

-- User data (stores all app state - KEPT SEPARATE)
CREATE TABLE user_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, key)
);

-- Indexes for performance
CREATE INDEX idx_user_data_lookup ON user_data(user_id, key);
CREATE INDEX idx_waitlist_time_slot ON waitlist_entries(time_slot);
CREATE INDEX idx_waitlist_archived ON waitlist_entries(archived_at);
CREATE INDEX idx_circles_time_slot ON circles(time_slot);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone_number);
```

### Seed Data

**Conversation Sparks**:
```sql
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
```

**Stanford Locations**:
```sql
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
```

### Data Persistence Architecture

**CRITICAL**: The app uses NO localStorage for user data. All data is stored in Supabase for perfect dev/prod parity.

#### Storage Utility (`/src/lib/storage.ts`)
```typescript
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
```

Key features:
- In-memory caching for instant UI updates
- Debounced writes to reduce database calls
- Graceful error handling with fallbacks
- Anonymous user support via session IDs
- Preloading for critical data

**Implementation Summary**:
- ✅ Created `user_data` table with JSONB storage
- ✅ Built enhanced Storage utility (`/src/lib/storage.ts`)
- ✅ Migrated all core data flows: feedback, preferences, onboarding state, account data
- ✅ Added in-memory caching with 5-minute TTL
- ✅ Implemented optimistic updates for instant UI responses
- ✅ Fixed PostgREST `.single()` compatibility issue (406 error)

**Critical Implementation Detail**: Replaced `.single()` queries with array queries to resolve PostgREST HTTP 406 errors:
```typescript
// Instead of .single() (causes 406)
const { data, error } = await supabase
  .from('user_data')
  .select('value')
  .eq('user_id', userId)
  .eq('key', key); // Returns array

// Handle empty results
if (!data || data.length === 0) return defaultValue;
return data[0].value; // Extract single value
```

### Timezone Implementation (CRITICAL)

**Problem**: Vercel servers run in UTC, causing time display issues and hydration mismatches.

**Solution**: Use date-fns-tz for all timezone operations.

#### Installation
```bash
npm install date-fns date-fns-tz
```

#### Core Time Utilities (`/src/lib/time-utils.ts`)
```typescript
import { fromZonedTime, toZonedTime, format } from 'date-fns-tz';

const TIMEZONE = 'America/Los_Angeles';

// IMPORTANT: Use NEXT_PUBLIC_APP_TIME_OFFSET (not APP_TIME_OFFSET)
// Format: Decimal hours (14.5 = 2:30 PM, 9.0 = 9:00 AM)

// Get current time with APP_TIME_OFFSET support
export function getCurrentTime(): Date {
  const now = new Date();
  
  // Handle test time offset
  const offsetString = process.env.NEXT_PUBLIC_APP_TIME_OFFSET;
  if (offsetString) {
    const offsetHours = parseFloat(offsetString);
    if (!isNaN(offsetHours)) {
      // Create PST date at specific time
      const todayPST = toZonedTime(now, TIMEZONE);
      const hours = Math.floor(offsetHours);
      const minutes = Math.round((offsetHours - hours) * 60);
      todayPST.setHours(hours, minutes, 0, 0);
      return fromZonedTime(todayPST, TIMEZONE);
    }
  }
  
  return now;
}

// Create a UTC date that represents a specific PST/PDT time
// Handles DST automatically using the built-in timezone support
export function createPSTDateAsUTC(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number = 0
): Date {
  // Create date in PST/PDT timezone
  const pstDate = new Date(year, month - 1, day, hour, minute, 0, 0);
  
  // Convert to UTC (handles DST automatically)
  return fromZonedTime(pstDate, TIMEZONE);
}

// Create time slots that display correctly as 11:00 AM, 2:00 PM, 5:00 PM PST
export function createTimeSlots(date: Date): TimeSlot[] {
  const pstDate = toZonedTime(date, TIMEZONE);
  const year = pstDate.getFullYear();
  const month = pstDate.getMonth() + 1;
  const day = pstDate.getDate();
  
  const slots = [
    { slot: '11AM', hour: 11, minute: 0, deadlineHour: 10 },
    { slot: '2PM', hour: 14, minute: 0, deadlineHour: 13 },
    { slot: '5PM', hour: 17, minute: 0, deadlineHour: 16 }
  ];
  
  return slots.map(({ slot, hour, minute, deadlineHour }) => ({
    id: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}_${slot}`,
    slot,
    time: createPSTDateAsUTC(year, month, day, hour, minute),
    deadline: createPSTDateAsUTC(year, month, day, deadlineHour, 0)
  }));
}

// Format any UTC date for PST display
export function formatToPST(date: Date, formatString: string = 'h:mm a'): string {
  return format(toZonedTime(date, TIMEZONE), formatString, { timeZone: TIMEZONE });
}

// Validate time slots
export function isValidTimeSlot(date: Date): boolean {
  const pstDate = toZonedTime(date, TIMEZONE);
  const hours = pstDate.getHours();
  const minutes = pstDate.getMinutes();
  
  const validSlots = [
    { hours: 11, minutes: 0 },
    { hours: 14, minutes: 0 },
    { hours: 17, minutes: 0 }
  ];
  
  return validSlots.some(slot => 
    slot.hours === hours && slot.minutes === minutes
  );
}
```

**CRITICAL NOTES**:
1. ALL times are stored as UTC in the database
2. ALL display uses `formatToPST()` for consistent PST display
3. The APP_TIME_OFFSET environment variable works on both server and client
4. No manual timezone offset calculations - let date-fns-tz handle DST

### Matching Algorithm

```typescript
function matchUsersForTimeSlot(timeSlotId: string) {
  // 1. Get all waitlist entries for this slot
  // 2. Separate users by age group (18-35 vs 36+)
  // 3. Create groups using optimal sizing:
  //    - 1 person: Gets own circle (very rare edge case)
  //    - 2 people: Single group of 2
  //    - 3 people: Single group of 3
  //    - 4 people: Single group of 4
  //    - 5 people: Split into 3 + 2
  //    - 6 people: Split into 4 + 2 (or 3 + 3)
  //    - 7+ people: Maximize groups of 4, then 3, then 2
  // 4. For 100 people: Creates 25 circles of 4
  // 5. Each circle gets:
  //    - Random location from locations table (no duplicates per time slot)
  //    - Random conversation spark (can repeat)
  //    - Unique ID: YYYY-MM-DD_11AM_1, _2, _3, etc.
  // 6. No limit on number of circles per time slot
  // 7. Users can be matched with same people multiple times (no restrictions)
  // 8. Set archived_at timestamp on all transferred waitlist entries
}
```

#### Edge Cases
- **Only 1 person in age group**: Create circle with 1 person (gets GPS location, rare edge case)
- **Odd numbers**: Use optimal group sizing (5 people = 3+2, not 4+1)
- **No-shows**: No tracking implemented (MVP scope)
- **Over-capacity**: No limit - 100 people creates 25 circles of 4
- **Under 18 users**: Not allowed to join (validation enforced)

### Location & Spark Assignment

```typescript
// Locations are pre-seeded in Supabase with Stanford GPS coordinates
function assignLocationToCircle(circleId: string, timeSlot: Date) {
  // Get all locations already assigned to this time slot
  const usedLocations = getUsedLocationsForTimeSlot(timeSlot);
  
  // Get available locations (not yet used for this time slot)
  const availableLocations = getAllLocations().filter(
    loc => !usedLocations.includes(loc.id)
  );
  
  // Random selection from available locations
  // Database constraint ensures no duplicates
  const location = getRandomFromArray(availableLocations);
  return location;
}

// Conversation sparks are pre-seeded in Supabase
function assignSparkToCircle(circleId: string) {
  // Random selection, can repeat (minimal effort approach)
  const spark = getRandomSpark();
  return spark;
}
```

### Time Management
- All times in PST (no timezone complexity for users)
- Daily schedule resets at 8:00 PM PST
- Deadlines: 10:00 AM, 1:00 PM, 4:00 PM (1 hour before circles)
- Matching runs at deadlines via cron
- Circle status changes from 'active' to 'past' 20 minutes after start time
- Development time override via NEXT_PUBLIC_APP_TIME_OFFSET (decimal hours format)

### Security & Privacy

#### Authentication
- Phone verification OR Google OAuth (trust + convenience)
- Session management via Supabase Auth
- NO anonymous users - authentication required for all features

#### Authentication Flow
**NO Progressive Enhancement**: Users MUST authenticate to access any features. No anonymous browsing or interaction allowed.

**Authentication Required For**:
- Viewing available time slots
- Joining waitlists
- Accessing any app functionality

#### Data Access
- No RLS enabled - trusted Stanford community
- Use service client for all database operations
- Consistent database client usage across all operations

#### Privacy Features
- No user discovery/search
- No public profiles
- Meeting history private by default (stored indefinitely)
- Option to "forget" past meetings
- Feedback is anonymous to other participants

### Development Configuration

**Development Shortcuts**: Keep all development utilities active:
- `dev-user-id` patterns for quick testing
- `NEXT_PUBLIC_APP_TIME_OFFSET` for time simulation
- Debug logging (existing console.log statements)

**Testing Strategy**:
- UI/UX testing: Local development only
- All other testing: Vercel deployment
- Time simulation via `NEXT_PUBLIC_APP_TIME_OFFSET` environment variable

### Validation Requirements

**Must-have validations**:
1. Age verification (18+ only)
2. Phone number format (if using phone auth)
3. Profile completion before joining waitlists (full_name, date_of_birth, gender required)
4. Time slot validity (can't join past slots)
5. Deadline enforcement (can't join/leave after deadline)

## CRITICAL IMPLEMENTATION DETAILS

### 1. Timezone Solution Implementation

**Timeline**: 2 hours

**Step 1**: Install dependencies
```bash
npm install date-fns date-fns-tz
```

**Step 2**: Replace core functions in `/src/lib/time.ts`:
- `getCurrentPSTTime()` - Use `toZonedTime()` instead of `toLocaleString()`
- `createTimeSlots()` - Use proper timezone conversion with minute: 0
- `toPST()` - Replace with `formatToPST()`
- Keep all button state logic unchanged (it uses millisecond math)

**Step 3**: Test critical paths:
- Times display as 11:00 AM, 2:00 PM, 5:00 PM PST (display format)
- No hydration warnings on page refresh
- NEXT_PUBLIC_APP_TIME_OFFSET=14.5 shows 2:30 PM
- Button states change at correct times

**Pitfalls to avoid**:
- Don't modify button state logic - it's timezone-agnostic
- Test with both DST and standard time dates
- Ensure NEXT_PUBLIC_APP_TIME_OFFSET works on both server and client
- Remember deadline times are calculated dynamically, not stored in DB

### 2. localStorage Removal Implementation

**Status**: 🚧 PARTIALLY COMPLETED (core flows migrated, 4 hours actual work)

The Storage utility is implemented and core user data flows have been successfully migrated to Supabase. However, localStorage usage remains in several areas of the codebase requiring future cleanup.

### Critical Implementation Lessons

#### The Database Permission Architecture Trap
**CRITICAL LESSON**: Server Actions (INSERT/DELETE) vs Server Queries (SELECT) can use different permission contexts, creating a "permission paradox" where data can be written but not read.

**The Problem**:
- Server Actions used `createServiceClient()` - always worked
- Server Queries used `createClient()` with user auth - failed due to RLS
- This created situations where data could be written but not read
- Button state logic appeared broken but was actually a permission issue

**Solution**: Use consistent database client across all operations:
```typescript
const serviceClient = await createServiceClient(); // For everything
```

**Prevention Strategies**:
1. Standardize database client usage across reads and writes
2. Create diagnostic API endpoints for permission testing
3. Add comprehensive database operation logging
4. Test with RLS enabled/disabled scenarios during development

#### Time-Based Logic Debugging
**Essential pattern for debugging time-based features**:
```typescript
console.log(`⏰ METHOD 7 ANALYSIS for ${timeSlot.slot}:`, {
  input: { isOnWaitlist, assignedCircleId, currentTime },
  phases: { beforeDeadline, duringEvent, afterEvent },
  pathTaken: beforeDeadline ? 'BEFORE_DEADLINE' : duringEvent ? 'DURING_EVENT' : 'AFTER_EVENT'
});
```

**Debugging Framework Required**:
- APP_TIME_OFFSET system for simulating different times
- Comprehensive state logging showing input → processing → output
- Phase detection logging (before deadline / during event / after event)
- Database state verification at each time transition

#### Infrastructure-First Debugging
**LESSON**: Modern applications require infrastructure-level debugging tools, not just application-level logging.

**Essential Diagnostic APIs**:
```typescript
// Create these endpoints for any complex app
/api/debug-time       // Time system validation  
/api/debug-state      // Application state verification
/api/force-fix-*      // Automated fixes for common issues
```

## DEVELOPMENT GUIDELINES

### Code Quality Standards
- TypeScript strict mode always
- 100% type coverage for core logic
- Component tests for interactions
- E2E tests for critical paths
- Accessibility audit on each screen

### Performance Targets
- Initial load: <3s on 3G
- Interaction response: <100ms (using optimistic updates)
- Time accuracy: ±1 second (millisecond precision for calculations)
- Database queries: <50ms (with caching)
- Real-time updates: Via client-side polling (10-second intervals)

### Performance Monitoring
- Database query performance tracking
- Time-sensitive operation monitoring
- Cache hit rates for user data
- Button state transition accuracy
- Hydration mismatch detection

### Deployment Strategy
- Feature flags for gradual rollout
- Test on staging environment first
- Database migrations with backups
- Zero-downtime deployments
- Rollback procedures for each major change

### Testing Time-Based Features
```bash
# Test pre-deadline (9:30 AM)
NEXT_PUBLIC_APP_TIME_OFFSET=9.5 npm run dev

# Test post-deadline confirmed (2:10 PM)
NEXT_PUBLIC_APP_TIME_OFFSET=14.17 npm run dev

# Test feedback window (2:25 PM)
NEXT_PUBLIC_APP_TIME_OFFSET=14.42 npm run dev

# Test daily reset (8:30 PM)
NEXT_PUBLIC_APP_TIME_OFFSET=20.5 npm run dev

# Edge case: Test midnight (12:00 AM)
NEXT_PUBLIC_APP_TIME_OFFSET=0.0 npm run dev

# Edge case: Test during DST transition
# Set date to March/November and test time slots
```

### Development Workflow
- No RLS during development - use service client for all operations
- Implement comprehensive logging before complex features
- Create time simulation tools for time-dependent features
- Test authentication flows separately (phone vs Google)

## DATA FORMAT CLARIFICATIONS

### Time Slot Formats
- **Data Layer**: Use `'11AM'`, `'2PM'`, `'5PM'` (compact format for storage/logic)
- **Display Layer**: Show as `"11:00 AM"`, `"2:00 PM"`, `"5:00 PM"` (user-friendly)
- **Deadlines**: Always display as `"10:00 AM"`, `"1:00 PM"`, `"4:00 PM"`

### Circle ID Format
- Standard format: `YYYY-MM-DD_SLOT_N` where N is incrementing number
- Examples: `2025-07-21_11AM_1`, `2025-07-21_11AM_2`, ... `2025-07-21_11AM_25`
- No cap on circle numbers (scales with demand)

### Circle Member Assignment
- Optimal group sizing algorithm:
  - 1 = 1 (single person circle, rare)
  - 2 = 2 (pair)
  - 3 = 3 (trio)
  - 4 = 4 (quad)
  - 5 = 3 + 2 (split for better dynamics)
  - 6 = 4 + 2 or 3 + 3
  - 7+ = Maximize 4s, then 3s, then 2s
- Store in user_1, user_2, user_3, user_4 columns

### Environment Variables
- Always use `NEXT_PUBLIC_APP_TIME_OFFSET` (not `APP_TIME_OFFSET`)
- Format: Decimal hours (9.0 = 9:00 AM, 14.5 = 2:30 PM, 20.0 = 8:00 PM)
- Works on both server and client due to `NEXT_PUBLIC_` prefix

## CRITICAL IMPLEMENTATION STATUS

### ✅ Completed Features
1. **Core user flows**: Authentication (Phone + Google OAuth), onboarding, circles, feedback
2. **Time system**: Timezone-aware with date-fns-tz
3. **Button state logic**: Method 7 implementation
4. **Storage migration**: Core flows use Supabase (some dev tools still use localStorage)
5. **Google OAuth**: Implemented and profiles save correctly
6. **Waitlist system**: Users can join all 3 slots per day
7. **PostgREST Compatibility**: Fixed HTTP 406 errors with array queries
8. **Database schema**: Updated with embedded circle members and location uniqueness

### 🚧 Known Issues to Fix

1. **Database Client Inconsistency**:
   - Problem: Mixed usage of `createClient()` vs `createServiceClient()`
   - Solution: Standardize on `createServiceClient()` for all operations

2. **Hardcoded Development IDs**:
   - Problem: 24 instances of 'dev-user-id' in production code
   - Solution: Replace with proper user context while keeping dev shortcuts

3. **Multiple Storage Systems**:
   - Current: sessionStorage (5), localStorage (9), Storage utility (10)
   - Solution: Complete migration to Storage utility

4. **Console.log Cleanup**:
   - 195 console.log statements remain
   - Keep for development, consider log levels for production

## FUTURE CONSIDERATIONS

### Maintenance
- **Monitor database performance** as user base grows
- **Maintain diagnostic API endpoints** for ongoing troubleshooting
- **Create automated testing** for time-based edge cases with APP_TIME_OFFSET
- **Document operational procedures** for database management
- **Implement database backup/restore** procedures for development
- **Monitor location availability** for time slot conflicts

### Environment Variables

[HISTORICAL NOTE: Sensitive credentials removed for security]
```
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

# Time Testing
NEXT_PUBLIC_APP_TIME_OFFSET=
```
```

## DEPLOYMENT REQUIREMENTS

1. **Database Setup**:
   - Run all CREATE TABLE statements
   - Seed locations table with Stanford GPS coordinates
   - Seed conversation_sparks table with questions
   - No RLS setup needed

2. **Authentication Setup**:
   - Configure Twilio in Supabase (for phone auth)
   - Configure Google OAuth in Supabase Console
   - Set redirect URLs for both auth methods

3. **Cron Jobs**:
   - Set up matching algorithm to run at 10:00 AM, 1:00 PM, 4:00 PM PST daily
   - Matching algorithm: Create circles, assign locations (no duplicates), archive waitlist entries
   - Status update job: Change circle status from 'active' to 'past' at 11:20 AM, 2:20 PM, 5:20 PM PST

4. **Environment Configuration**:
   - Set all required environment variables on Vercel
   - Keep `NEXT_PUBLIC_APP_TIME_OFFSET` empty for production (only for testing)

## DAILY OPERATIONS

- **Circles run every day** (including weekends/holidays)
- **Matching at**: 10:00 AM, 1:00 PM, 4:00 PM PST
- **Status changes**: 11:20 AM, 2:20 PM, 5:20 PM PST (active → past)
- **System reset**: 8:00 PM PST (all buttons reset for next day)
- **Data retention**: All data stored indefinitely
- **No user cap**: System scales to any number of users/circles

---

This specification represents the complete MVP vision for 27 Circle, incorporating the updated schema design and all critical implementation details. Build with confidence knowing all edge cases and pitfalls have been identified and addressed.