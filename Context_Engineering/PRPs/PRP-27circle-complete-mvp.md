# Product Requirements Prompt: 27 Circle Complete MVP Implementation

## Context & Background

**Project**: 27 Circle - Stanford student spontaneous meetup platform
**Target Users**: Stanford students (18+) seeking authentic in-person connections
**Core Value Proposition**: Serendipitous 20-minute conversations with privacy and spontaneity

## High-Level Architecture

### Technical Stack
- **Framework**: Next.js 14 (App Router) with TypeScript
- **Database**: Supabase (PostgreSQL + Auth)
- **Styling**: Tailwind CSS
- **Hosting**: Vercel
- **Authentication**: Phone (Twilio) + Google OAuth via Supabase
- **Maps**: Google Maps Static API
- **Timezone**: date-fns-tz for PST handling

### Core Principles
- **Anonymous Until Meeting**: No profiles/photos visible before in-person meeting
- **Time-Based Circles**: Fixed daily slots (11AM, 2PM, 5PM PST)
- **Small Groups**: 2-4 people per circle optimized for conversation
- **Privacy-First**: Users only see who they've actually met
- **No Social Features**: No chat, follows, or persistent digital relationships

## Data Architecture

### Database Schema Requirements

```sql
-- Core tables with exact structure
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

CREATE TABLE circles (
  id TEXT PRIMARY KEY, -- Format: YYYY-MM-DD_11AM_Circle_1
  time_slot TIMESTAMPTZ NOT NULL,
  location_id UUID NOT NULL REFERENCES locations(id),
  conversation_spark_id UUID NOT NULL REFERENCES conversation_sparks(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'past')),
  max_participants INTEGER DEFAULT 4,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE waitlist_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  time_slot TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ, -- Set when matched to circle
  UNIQUE(user_id, time_slot)
);

CREATE TABLE user_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, key)
);
```

**Critical Implementation**: No RLS - uses mixed client strategy for security

### Data Storage Strategy
- **Primary Storage**: Supabase for all user data (NO localStorage)
- **Storage Utility**: `/src/lib/storage.ts` with caching and optimistic updates
- **Pattern**: In-memory cache with 5-minute TTL for performance

## User Experience Requirements

### 1. Authentication Flow (Mandatory)

**Route Sequence**: `/` → `/onboarding/curiosity-1` → `/onboarding/curiosity-2` → `/auth` → `/auth/phone` OR `/auth/google` → `/onboarding/profile` → `/circles`

#### A. Landing Experience (`/`)
- Clean splash with "27 Circle" branding
- Tagline: "Be Curious Together"
- Auto-progress after 3 seconds OR "Get Started" CTA

#### B. Interest Discovery (Pre-Auth)
**Screen 1** (`/onboarding/curiosity-1`): Mind Curiosity
- "What sparks your curiosity?"
- Options: 🧠 Scientific Topics, 🕊️ Spiritual Discussions

**Screen 2** (`/onboarding/curiosity-2`): Heart Curiosity  
- "What goals are on your mind?"
- Options: 🚀 Personal Growth, 🌱 Community Service

#### C. Authentication Choice (`/auth`)
- **Two Options**: "Continue with Phone" OR "Continue with Google"
- **Implementation**: Both create user profiles in Supabase correctly

#### D. Profile Completion (`/onboarding/profile`)
- **Required Fields**: full_name, date_of_birth (18+ validation), gender
- **Persistence**: Incomplete profiles redirect here on login
- **Storage**: Save to users table via Supabase

### 2. Main Application Flow

#### Home Screen (`/circles`)

**Time Slots Display**: Three daily options with smart button states
```
┌─────────────────────────────────┐
│ 11:00 AM                        │
│ Morning energy, fresh perspectives│
│ [Button State + Middle Text]    │
└─────────────────────────────────┘
```

**Button State Logic** (Critical Implementation):
- **"Join"**: Before deadline (10AM/1PM/4PM), user not on waitlist
- **"Can't Go"**: Before deadline, user on waitlist (toggles instantly)
- **"Confirmed ✓"**: After deadline, user matched to circle
- **"Feedback >"**: 20 minutes after circle start (until 8PM)
- **"Past"**: Completed/missed circles (gray, disabled)

**Daily Reset**: 8:00 PM PST - all slots reset for next day

#### Circle Details Screen (`/circles/[circleId]`)
**Pre-Circle View**:
- Countdown timer: "Circle starts in 14:32"
- Exact location with map pin
- Conversation spark display
- "[N] others are confirmed" (no names)

**During Circle** (20-minute window):
- Live countdown timer
- Prominent conversation spark
- Emergency "Can't make it?" option

### 3. Feedback System (`/feedback/[circleId]`)

**Timing**: Available 20 minutes after circle start until 8PM
**Questions**:
1. "How many others were in your Circle?" [1, 2, 3] + "I couldn't make it" checkbox
2. "How would you rate your experience?" [5 stars] (if attended)
3. "What's one thing you'll remember?" [text] (if attended)

**Storage**: All feedback in user_feedback table with attendance tracking

## Time System Requirements

### Core Time Management (`/src/lib/time.ts`)

**Three Pure Phase Functions** (Critical):
```typescript
export function isBeforeDeadline(slot: TimeSlot, currentTime?: Date): boolean
export function isDuringEvent(slot: TimeSlot, currentTime?: Date): boolean  
export function isAfterEvent(slot: TimeSlot, currentTime?: Date): boolean
```

**Unified Button State Logic**:
```typescript
export function getButtonState(
  slot: { timeSlot: TimeSlot; isOnWaitlist: boolean; assignedCircleId: string | null },
  currentTime?: Date,
  feedbackSubmitted: boolean = false
): { buttonState, buttonText, middleText, isDisabled }
```

**Testing Infrastructure**:
- `NEXT_PUBLIC_APP_TIME_OFFSET` environment variable
- Format: Decimal hours (9.5 = 9:30 AM, 14.5 = 2:30 PM)
- **Test Cases**:
  - 9.5 (pre-deadline)
  - 10.17 (post-deadline confirmed) 
  - 11.17 (during event)
  - 11.42 (feedback window)
  - 20.5 (daily reset)

### Timezone Handling
- **Storage**: All times as UTC in database
- **Display**: Always PST using date-fns-tz
- **DST**: Automatic handling via date-fns-tz
- **Precision**: Millisecond-level calculations for accuracy

## Matching Algorithm Requirements

### Core Matching Logic

**Trigger**: Automated cron jobs at 10:00 AM, 1:00 PM, 4:00 PM PST

**Algorithm Steps**:
1. Fetch all waitlist_entries for time slot
2. Separate by age groups (18-35 vs 36+)
3. Apply optimal group sizing:
   - 1 person = 1 (single circle)
   - 2-4 people = single group
   - 5 people = 3 + 2 split
   - 6 people = 4 + 2 or 3 + 3
   - 7+ people = maximize 4s, then 3s, then 2s
4. Create circles with format: `YYYY-MM-DD_11AM_Circle_1`
5. Assign random location + conversation spark
6. Set archived_at on waitlist entries

**Scalability**: No limits - 100 people creates 25 circles of 4

### Location & Spark Assignment
- **Locations**: Random selection from pre-seeded Stanford locations
- **Sparks**: Random conversation starters (can repeat)
- **Duplicates**: Multiple circles can share locations/sparks

## Critical Implementation Details

### 1. Database Client Strategy
```typescript
// Administrative operations (matching, cron):
const serviceClient = await createServiceClient();

// User-scoped queries with auth:
const client = await createClient();
```

### 2. PostgREST Compatibility
**Problem**: `.single()` causes HTTP 406 errors
**Solution**: Use array queries, extract first result:
```typescript
// ❌ Don't use .single()
const { data } = await supabase.from('table').select('*').eq('id', id).single();

// ✅ Use array query
const { data } = await supabase.from('table').select('*').eq('id', id);
if (!data || data.length === 0) return null;
return data[0];
```

### 3. Storage Migration Pattern
**Current Status**: Core flows use Supabase, some dev tools use localStorage
**Required**: Complete migration to Storage utility for consistency

## Development & Testing Requirements

### Environment Variables (Production)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://szttdwmpwqvabtwbhzal.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[key]
SUPABASE_SERVICE_ROLE_KEY=[key]
NEXT_PUBLIC_GOOGLE_MAPS_KEY=[key]
TWILIO_ACCOUNT_SID=[sid]
TWILIO_AUTH_TOKEN=[token]
NEXT_PUBLIC_SITE_URL=https://27circle.co
NEXT_PUBLIC_APP_TIME_OFFSET= # Empty for production
```

### Testing Strategy
- **Local Development**: UI/UX testing only
- **Vercel Deployment**: All other testing
- **Time Simulation**: Use NEXT_PUBLIC_APP_TIME_OFFSET for all states
- **Authentication**: Test both phone and Google flows separately

### Debugging Pattern
```typescript
console.log(`⏰ TIME ANALYSIS for ${timeSlot.slot}:`, {
  input: { isOnWaitlist, assignedCircleId, currentTime },
  phases: { beforeDeadline, duringEvent, afterEvent },
  pathTaken: beforeDeadline ? 'BEFORE_DEADLINE' : 'AFTER_EVENT'
});
```

## Deployment Requirements

### 1. Database Setup
- Run schema creation statements
- Insert seed data for locations and conversation sparks
- Configure Supabase Auth for phone and Google OAuth

### 2. Cron Jobs Setup
- **Matching**: 10:00 AM, 1:00 PM, 4:00 PM PST daily
- **Status Updates**: 11:20 AM, 2:20 PM, 5:20 PM PST (active → past)
- **Daily Reset**: 8:00 PM PST (button states reset)

### 3. Performance Targets
- Initial load: <3s on 3G
- Interaction response: <100ms (optimistic updates)
- Database queries: <50ms (with caching)
- Time accuracy: ±1 second precision

## Success Criteria

### Functional Requirements ✅
- [x] Mandatory authentication (phone + Google OAuth)
- [x] Complete user onboarding flow
- [x] Three daily time slots with smart button states
- [x] Automated matching with age-based separation
- [x] Location and spark assignment
- [x] Feedback collection system
- [x] Daily reset at 8PM PST

### Technical Requirements ✅
- [x] Time system with timezone handling
- [x] Storage utility with Supabase integration
- [x] PostgREST compatibility (array queries)
- [x] Mixed database client strategy
- [x] Testing infrastructure with time offset

### Outstanding Work 🚧
- [ ] Complete localStorage to Storage utility migration
- [ ] Production environment setup
- [ ] Cron job implementation
- [ ] Performance optimization
- [ ] Comprehensive testing across all time states

## Implementation Priority

1. **Phase 1**: Complete storage migration and fix any remaining localStorage usage
2. **Phase 2**: Set up production environment and cron jobs
3. **Phase 3**: Performance optimization and comprehensive testing
4. **Phase 4**: Production deployment and monitoring

This PRP represents the complete, production-ready implementation of 27 Circle MVP based on the comprehensive specification document.