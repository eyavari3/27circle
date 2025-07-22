# 27 Circle MVP Specification

## PROJECT OVERVIEW
Build a web application that facilitates spontaneous, in-person meetups for Stanford students through time-based circles. Users join waitlists for fixed daily time slots, discover meeting locations one hour before, and meet with 1-3 other students for meaningful 20-minute conversations.

**Target Users**: ~100 Stanford students seeking authentic connections
**Core Value**: Serendipitous, meaningful conversations with privacy and spontaneity

## CORE CONCEPTS & PRINCIPLES

### The Circle Philosophy
- **Anonymous Until Meeting**: No profiles, photos, or names visible before meeting
- **Small Groups**: 2-4 people per circle (optimal for deep conversation)
- **Time-Boxed**: Exactly 20 minutes to maintain energy and respect schedules
- **Location-Based**: Physical meetings at Stanford locations
- **Age-Based Matching**: Separation by age groups (18-35 vs 36+)
- **No Social Features**: No chat, no follows, no digital relationships

### Privacy & Trust Model
- Users only see who they've actually met in person
- No pre-meeting information about other participants
- No-shows and cancellations handled gracefully
- Feedback is private and constructive

## USER JOURNEY

### 1. First-Time User Flow

#### A. Landing Experience
**Route**: `/`
- Clean, minimal splash screen
- "27 Circle" branding with subtle logo animation
- Tagline: "Be Curious Together"
- Subtext: "20-minute conversations that matter"
- Single CTA: "Get Started" or auto-progress after 3 seconds

#### B. Interest Discovery
**Route**: `/onboarding/curiosity-1` and `/onboarding/curiosity-2`

**Screen 1 - Mind Curiosity**:
- "What draws your mind to connect?"
- Options (select 1+):
  - 🧠 Deep Conversations - "Philosophy, ideas, big questions"
  - 🎨 Creative Exchange - "Art, music, creative projects"

**Screen 2 - Heart Curiosity**:
- "And what actions call to your heart?"
- Options (select 1+):
  - 🚀 New Activities - "Adventure, exploration, growth"
  - 🌱 Community Service - "Giving back, helping others"

#### C. Authentication
**Route**: `/auth`
- Phone-first authentication for trust
- Clean form: "Enter your phone number"
- Subtext: "We'll text you a verification code"

**Route**: `/auth/verify`
- 6-digit code entry
- Auto-focus, auto-advance on completion
- Resend option after 30 seconds

#### D. Profile Essentials
**Route**: `/onboarding/profile`
- Minimal required info:
  - First name (for in-person introductions only)
  - Date of birth (for age-based matching - must be 18+)
  - Gender (for diversity tracking)
- Location confirmation: "Stanford University"
- Notification preferences (default: on)

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

**CRITICAL**: Times must display as 11:00 AM, 2:00 PM, 5:00 PM PST in all environments.

**Map Section**:
- "Today's general area: [Location Name]"
- Zoomed-out map showing approximate region
- "Exact spots revealed 1 hour before each circle"

#### B. Button States & Time Logic
**State Machine** (for each time slot):

**"Join"** (Primary Action)
- When: Before deadline (10AM/1PM/4PM)
- Button: Navy blue (#152B5C)
- Middle Text: "Decide by 10:00 AM" / "Decide by 1:00 PM" / "Decide by 4:00 PM"
- User not on waitlist

**"Can't Go"** (Secondary Action)
- When: Before deadline
- Button: Gray with red text
- Middle Text: "Decide by 10:00 AM" / "Decide by 1:00 PM" / "Decide by 4:00 PM"
- User already on waitlist

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
- Disappears when: User submits feedback OR at 8PM daily reset
- Skip behavior: Modal closes, returns to main page, "Feedback" button remains
- Reset timing: All buttons show "Past" at 7:59pm, switch to "Join" at 8:00pm

**"Past"** (Completed State) 
- When: After feedback submitted OR during 7:59pm transition period
- Button: Gray, disabled
- Middle Text: Dynamic based on user journey:
  - If user was matched: "Confirmed at [Time]"
  - If user was not matched: "Closed at [Time]"
- Behavior: Not clickable
- Transitions to "Join" at 8:00pm daily reset

#### C. Circle Details Screen
**Route**: `/circles/[circleId]`
- Accessible only after matching
- Pre-Circle View (up to start time):
  - Countdown timer: "Circle starts in 14:32"
  - Exact location with map pin
  - Walking directions from current location
  - Today's conversation spark
  - "Who's coming?" → "3 others are confirmed"
  - Tips: "Arrive 2 minutes early", "Look for others checking phones"

- During Circle (20-minute window):
  - Live timer: "18:45 remaining"
  - Conversation spark prominently displayed
  - "Can't make it?" button (emergency only)

- Post-Circle (after end time):
  - Redirects to feedback

#### D. Feedback Flow
**Route**: `/feedback/[circleId]`
- **Timing**: Button changes to orange "Feedback" 20 minutes after circle starts
- **Storage**: Uses database (see Data Persistence section)
- **Auto-Reset**: All states reset to "Join" at 8 PM daily
- Quick 3-question form:
  - "How many people showed up?" [1][2][3]["I couldn't make it"] 
  - "Rate the conversation quality" [5 stars] (only if attended)
  - "What's one thing you'll remember?" [text input] (only if attended)

- Skip option: Available for users who don't want to provide feedback
- No participant reveal: Names remain anonymous to preserve privacy

### 3. Additional Screens

#### Settings
**Route**: `/settings`
- Profile updates
- Notification preferences
- Circle history
- Sign out
- Delete account

#### Error States
- No circles available (holidays, breaks)
- Matching failed (not enough people)
- Location unavailable (construction, events)

## TECHNICAL ARCHITECTURE

### Stack Overview
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL + Auth)
- **Hosting**: Vercel
- **SMS**: Twilio
- **Maps**: Google Maps Static API
- **Timezone Handling**: date-fns-tz (see Critical Implementation section)

### Data Models
```typescript
// Core entities
type User = {
  id: string
  phone: string
  name: string
  date_of_birth: Date
  gender: string
  interests: Interest[]
  createdAt: Date
}

type Interest = {
  category: 'mind' | 'heart'
  value: string
}

type TimeSlot = {
  id: string
  date: Date
  time: Date
  slot: '11AM' | '2PM' | '5PM'  // Data format
  deadline: Date  // Calculated on-the-fly, not stored in DB
}

type WaitlistEntry = {
  userId: string
  timeSlotId: string
  joinedAt: Date
}

type Circle = {
  id: string // Format: YYYY-MM-DD_11AM (e.g., 2025-07-21_11AM)
  time_slot: string // TIMESTAMPTZ
  location_id: string
  status: 'forming' | 'active' | 'completed' | 'cancelled'
  conversation_spark_id: string
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
```sql
-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT,
  gender TEXT,
  date_of_birth DATE,
  phone_number TEXT UNIQUE,
  location TEXT DEFAULT 'Stanford University',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User interests (many-to-many)
CREATE TABLE user_interests (
  user_id UUID REFERENCES users(id),
  interest_type TEXT NOT NULL,
  PRIMARY KEY (user_id, interest_type)
);

-- Stanford locations (multiple locations for random assignment)
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Waitlist entries
CREATE TABLE waitlist_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  time_slot TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, time_slot)
);

-- Circles (formed groups)
CREATE TABLE circles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  time_slot TIMESTAMPTZ NOT NULL,
  location_id UUID REFERENCES locations(id),
  conversation_spark_id UUID REFERENCES conversation_sparks(id),
  status TEXT DEFAULT 'active',
  max_participants INTEGER DEFAULT 4,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Circle members
CREATE TABLE circle_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(circle_id, user_id)
);

-- Conversation sparks
CREATE TABLE conversation_sparks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spark_text TEXT NOT NULL UNIQUE
);

-- User data (replaces ALL localStorage usage)
CREATE TABLE user_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL, -- Can be auth ID or session ID
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, key)
);

-- Performance index for user_data
CREATE INDEX idx_user_data_lookup ON user_data(user_id, key);

-- Note: RLS is disabled on all tables for MVP simplicity
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE circles DISABLE ROW LEVEL SECURITY;
ALTER TABLE circle_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_data DISABLE ROW LEVEL SECURITY;
```

### Data Persistence Architecture

**CURRENT STATUS**: localStorage migration is partially complete. Core user data flows (preferences, onboarding, feedback) now use Supabase storage via the Storage utility. However, localStorage remains active in development tools, authentication flows, and testing utilities. Perfect dev/prod parity requires completing the remaining localStorage elimination.

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

### Key Algorithms

#### Matching Algorithm
```typescript
function matchUsersForTimeSlot(timeSlotId: string) {
  // 1. Get all waitlist entries for this slot
  // 2. Separate users by age group (18-35 vs 36+)
  // 3. Create groups within each age group using optimal sizing:
  //    - 1 person: Gets their own circle (rare edge case)
  //    - 2-4 people: Single group of that size
  //    - 5 people: 3 + 2 (not 4 + 1)
  //    - 6+ people: Maximize groups of 4, then 3, then 2
  // 4. Assign random GPS location to each circle from locations table
  // 5. Select conversation spark for each circle
  // 6. Notify matched users
  // 7. Everyone gets matched (single users get their own circle)
}
```

#### Time Management
- All times in PST (no timezone complexity for users)
- Daily schedule resets at 8:00 PM PST
- Deadlines: 10:00 AM, 1:00 PM, 4:00 PM (1 hour before circles)
- Matching runs at deadlines via cron
- Development time override via NEXT_PUBLIC_APP_TIME_OFFSET (decimal hours format)

### Security & Privacy
#### Authentication
- Phone verification primary (trust + spam prevention)
- Session management via Supabase Auth
- Anonymous users via session IDs (sessionStorage)

#### Authentication Flow & Anonymous Users

**Progressive Enhancement Model**:
1. **Initial Visit**: Anonymous session ID created (stored in sessionStorage)
2. **Exploration**: Users can browse, complete onboarding interests as anonymous
3. **Auth Gate**: Phone verification required only when joining first waitlist
4. **Data Migration**: Anonymous data migrates to authenticated user upon phone verification

**Implementation**:
```typescript
// Anonymous session creation (automatic on first visit)
function getSessionId(): string {
  let sessionId = sessionStorage.getItem('session-id');
  if (!sessionId) {
    sessionId = `session-${crypto.randomUUID()}`;
    sessionStorage.setItem('session-id', sessionId);
  }
  return sessionId;
}

// Data is stored against session ID until auth
const userId = user?.id || getSessionId();
```

#### Data Access (RLS Policies)
- RLS disabled for MVP (100 trusted Stanford users)
- Will be re-enabled post-launch with proper policies

#### Privacy Features
- No user discovery/search
- No public profiles
- Meeting history private by default
- Option to "forget" past meetings

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
- Times display as 11:00 AM, 2:00 PM, 5:00 PM PST
- No hydration warnings on page refresh
- APP_TIME_OFFSET=14.5 shows 2:30 PM
- Button states change at correct times

**Pitfalls to avoid**:
- Don't modify button state logic - it's timezone-agnostic
- Test with both DST and standard time dates
- Ensure APP_TIME_OFFSET works on both server and client

### 2. localStorage Removal Implementation

**Status**: 🚧 PARTIALLY COMPLETED (core flows migrated)

The Storage utility is implemented and core user data flows have been successfully migrated to Supabase. However, localStorage usage remains in several areas of the codebase.

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

**Core localStorage flows migrated to Storage utility**:
```typescript
// OLD (localStorage)
localStorage.setItem('key', JSON.stringify(data));
const data = JSON.parse(localStorage.getItem('key') || 'null');

// NEW (Storage utility)
import { Storage } from '@/lib/storage';
await Storage.set('key', data);
const data = await Storage.get('key', defaultValue);
```

**Loading states implemented**:
```typescript
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  Storage.get('key', defaultValue)
    .then(value => setData(value))
    .finally(() => setLoading(false));
}, []);
```

**Successfully migrated data flows**:
- ✅ Feedback records (`/src/lib/feedback-keys.ts`)
- ✅ User preferences (`/src/app/settings/preferences/`)
- ✅ Onboarding state (`/src/lib/onboarding-state.ts`)
- ✅ Account data (`/src/app/settings/account/`)
- ✅ Waitlist checking (`/src/lib/hooks/useFeedbackCheck.ts`)

**Remaining localStorage usage** (requires future cleanup):
- 🔄 Development/debug tools (`/src/lib/hooks/useCurrentTime.ts`)
- 🔄 Authentication flow storage (`/src/app/auth/verify/VerifyClient.tsx`)
- 🔄 Testing utilities (`/src/app/settings/SettingsClient.tsx`)
- 🔄 Onboarding phone storage (`/src/app/onboarding/verify/page.tsx`)
- 🔄 Legacy migration functions (active in migration code)

**Common issues resolved during migration**:
- HTTP 406 errors with `.single()` queries → Fixed with array queries
- TypeScript null safety → Added proper null coalescing
- Async state management → Implemented loading patterns
- Cache performance → 5-minute TTL with optimistic updates

## METHOD 7 BUTTON SYSTEM IMPLEMENTATION

### Overview
This section documents the complete implementation of Method 7 - a bulletproof approach to fix the 5-button state system using three pure time functions and database as single source of truth.

### Three Pure Time Functions:
1. `isBeforeDeadline(slot, currentTime)` - Can still join/leave waitlist
2. `isDuringEvent(slot, currentTime)` - Event is happening or confirmed
3. `isAfterEvent(slot, currentTime)` - Event finished, feedback available

### Button State Logic:
- **Before Deadline**: Join/Can't Go based on waitlist status
- **During Event**: Confirmed/Past based on circle assignment
- **After Event**: Feedback/Past based on assignment + feedback status

### Critical Implementation Lessons

#### The Database Permission Architecture Trap
**CRITICAL LESSON**: Server Actions (INSERT/DELETE) vs Server Queries (SELECT) can use different permission contexts, creating a "permission paradox" where data can be written but not read.

**Solution**: Use consistent database client across all operations:
```typescript
const serviceClient = await createServiceClient(); // For everything
```

#### Time-Based Logic Debugging
**Essential pattern**:
```typescript
console.log(`⏰ METHOD 7 ANALYSIS for ${timeSlot.slot}:`, {
  input: { isOnWaitlist, assignedCircleId, currentTime },
  phases: { beforeDeadline, duringEvent, afterEvent },
  pathTaken: beforeDeadline ? 'BEFORE_DEADLINE' : duringEvent ? 'DURING_EVENT' : 'AFTER_EVENT'
});
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
- Time accuracy: ±1 second
- Database queries: <50ms (with caching)
- Real-time updates: Via client-side polling

### Deployment Strategy
- Feature flags for gradual rollout
- Test on staging environment first
- Database migrations with backups
- Zero-downtime deployments

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
```

## IMPLEMENTATION PRIORITIES

### Pre-Launch Critical (Status: 🚧 PARTIALLY COMPLETED)
1. ✅ **Timezone Fix** (2 hours) - Ensures correct time display
2. 🚧 **localStorage Removal** (4 hours actual) - Core flows migrated, dev/testing tools remain
3. ✅ **Basic Testing** (1 hour) - Verify core flows work
4. ✅ **PostgREST Compatibility** (1 hour) - Fixed HTTP 406 errors

### Remaining Pre-Launch Work
5. 🔄 **Complete localStorage Elimination** (2 hours estimated) - Remove remaining localStorage usage for perfect dev/prod parity

### Post-Launch Improvements
1. Enhanced matching algorithm
2. Push notifications
3. Advanced analytics
4. Admin dashboard
5. Cross-device features

---

This specification represents the complete MVP vision for 27 Circle, incorporating all critical implementation details from our timezone and storage discussions. Build with confidence knowing all edge cases and pitfalls have been identified and addressed.