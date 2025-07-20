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

**Map Section**:
- "Today's general area: [Location Name]"
- Zoomed-out map showing approximate region
- "Exact spots revealed 1 hour before each circle"

#### B. Button States & Time Logic
**State Machine** (for each time slot):

**"Join"** (Primary Action)
- When: Before deadline (10AM/1PM/4PM)
- Button: Navy blue (#152B5C)
- Middle Text: "Decide by 10AM" / "Decide by 1PM" / "Decide by 4PM"
- User not on waitlist

**"Can't Go"** (Secondary Action)
- When: Before deadline
- Button: Gray with red text
- Middle Text: "Decide by 10AM" / "Decide by 1PM" / "Decide by 4PM"
- User already on waitlist

**"Confirmed ✓"** (Success State)
- When: After deadline, user matched to circle
- Button: Success green
- Middle Text: "Confirmed at 10AM" / "Confirmed at 1PM" / "Confirmed at 4PM"
- Clickable → Circle details

**"Past"** (Missed/Closed State)
- When: After deadline, user not matched OR never joined
- Button: Gray, disabled
- Middle Text: "Closed at 10AM" / "Closed at 1PM" / "Closed at 4PM"
- Non-interactive

**"In Progress"** (Active State)
- When: During circle time (20 min window)
- Shows countdown timer
- If matched: Shows "Join your circle →"

**"Feedback >"** (Post-Circle State)
- When: 20 minutes after circle start time (11:20am, 2:20pm, 5:20pm)
- Button: Orange/yellow
- Middle Text: "Confirmed at 10AM" / "Confirmed at 1PM" / "Confirmed at 4PM" (same as confirmed state)
- Behavior: Opens feedback modal/form
- Disappears when: User submits feedback OR at 8PM daily reset
- Skip behavior: Modal closes, returns to main page, "Feedback" button remains
- Auto-popup: Exactly 1hr after start time (12pm, 3pm, 6pm) - ONLY if feedback not already submitted
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

#### D. Feedback Flow (MVP: localStorage implementation)
**Route**: `/feedback/[circleId]`
- **Timing**: Button changes to orange "Feedback" 20 minutes after circle ends
- **Storage**: Development mode uses localStorage (no database table yet)
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
  time: '11AM' | '2PM' | '5PM'
  deadline: Date
}

type WaitlistEntry = {
  userId: string
  timeSlotId: string
  joinedAt: Date
}

type Circle = {
  id: string // Custom format: YYYY-MM-DD_11AM_Circle_1
  time_slot: string // TIMESTAMPTZ, not timeSlotId
  location_id: string
  // members stored in separate circle_members table
  status: 'forming' | 'active' | 'completed' | 'cancelled'
  conversation_spark_id: string
}

// Feedback type not implemented in current MVP
// Feedback data is handled via localStorage for development
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

-- FEEDBACK TABLE: Not implemented in current MVP
-- Feedback functionality uses localStorage for development
-- Database table will be added in future iteration
```

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
- All times in PST (no timezone complexity)
- Daily schedule resets at 8:00 PM PST
- Deadlines: 10AM, 1PM, 4PM (1 hour before circles)
- Matching runs at deadlines via cron
- Development time override via APP_TIME_OFFSET

### Security & Privacy
#### Authentication
- Phone verification primary (trust + spam prevention)
- Session management via Supabase Auth
- No passwords stored

#### Data Access (RLS Policies)
- Users see only their own data by default
- Circle members visible only after meeting
- Waitlist counts are aggregated (no names)
- Feedback is anonymous to other users

#### Privacy Features
- No user discovery/search
- No public profiles
- Meeting history private by default
- Option to "forget" past meetings

## IMPLEMENTATION PRIORITIES

### Phase 1: Core Flow (Week 1-2)
**Goal**: Basic joining and circle formation
- Authentication (SMS only)
- Minimal onboarding (name + interests + age)
- Home screen with 3 time slots
- Join/leave waitlist functionality
- Simple matching (age-based groups of 2-4)
- Circle details reveal
- Manual testing framework

**Success Metric**: Can manually create and join circles

### Phase 2: Time-Based Features (Week 3)
**Goal**: Automated scheduling and matching
- Time-based button states
- Deadline enforcement
- Automated matching algorithm
- Single location assignment
- Cron job setup
- Real-time waitlist counts
- Development time controls

**Success Metric**: Fully automated daily circles

### Phase 3: Enhanced Experience (Week 4)
**Goal**: Polish and engagement features
- Conversation sparks system
- Feedback collection
- Meeting history
- Smart notifications
- Walk-to-location features
- Error handling

**Success Metric**: 80% feedback completion rate

### Phase 4: Production Readiness (Week 5)
**Goal**: Launch preparation
- Admin dashboard
- Monitoring/alerting
- Waitlist overflow handling
- Holiday/break scheduling
- Analytics (anonymous)
- Performance optimization

**Success Metric**: Handle 100+ daily users

## DESIGN PRINCIPLES

### Visual Design
- **Clean & Minimal**: Focus on content, not chrome
- **Stanford Palette**: Cardinal red accents on clean white
- **Accessible**: WCAG AA compliant
- **Mobile-First**: Optimized for phones
- **Subtle Animations**: Enhance, don't distract

### UX Principles
- **One-Tap Actions**: Minimize clicks
- **Clear Time Communication**: Always show deadlines
- **Graceful Degradation**: Handle edge cases elegantly
- **Predictable Patterns**: Consistent interactions
- **Forgiving Design**: Easy to undo/change

### Content Voice
- **Encouraging**: "Great choice!" not "Confirmed"
- **Clear**: "Join by 1:00 PM" not "Deadline approaching"
- **Human**: "3 others are excited to meet" not "3 users registered"
- **Stanford-Specific**: Use campus landmarks and lingo

## EDGE CASES & ERROR HANDLING

### Matching Edge Cases
- Only 1 person in age group → Create circle with 1 person (gets GPS location, rare edge case)
- Odd numbers → Use optimal group sizing (5 people = 3+2, not 4+1)
- No-shows → Quick feedback, affect future matching
- Over-capacity → Fair queue system
- Under 18 users → Not allowed to join

### Technical Edge Cases
- Lost connectivity → Optimistic UI with sync
- Time zone travelers → Force PST display
- Duplicate joins → Prevent at database level
- Crashed during circle → Rejoin grace period

### Content Edge Cases
- Inappropriate feedback → Auto-flag for review
- Repeat partnerships → Limit to 1/week
- Conversation spark repeats → 30-day rotation
- Location unavailable → Backup options ready

## DEVELOPMENT GUIDELINES

### Code Quality Standards
- TypeScript strict mode always
- 100% type coverage for core logic
- Component tests for interactions
- E2E tests for critical paths
- Accessibility audit on each screen

### Performance Targets
- Initial load: <3s on 3G
- Interaction response: <100ms
- Time accuracy: ±1 second
- Database queries: <50ms
- Real-time updates: <500ms

### Deployment Strategy
- Feature flags for gradual rollout
- Canary deployments (5% → 25% → 100%)
- Rollback plan for each feature
- Database migrations with backups
- Zero-downtime deployments

---

## METHOD 7 BUTTON SYSTEM IMPLEMENTATION

### Overview
This section documents the complete implementation of Method 7 - a bulletproof approach to fix the 5-button state system using three pure time functions and database as single source of truth.

### Problem Statement
The current button system has critical issues:
- Complex localStorage/database dual system creates sync bugs
- Button states don't match Template.png specifications
- Feedback buttons don't appear when they should
- Middle text is hardcoded instead of dynamic
- Development and production use different logic paths

### Method 7 Solution
**Core Principle**: Use three pure time functions to determine what phase each time slot is in, then query database for user participation to show correct button state.

#### Three Pure Time Functions:
1. `isBeforeDeadline(slot, currentTime)` - Can still join/leave waitlist
2. `isDuringEvent(slot, currentTime)` - Event is happening or confirmed
3. `isAfterEvent(slot, currentTime)` - Event finished, feedback available

#### Button State Logic:
- **Before Deadline**: Join/Can't Go based on waitlist status
- **During Event**: Confirmed/Past based on circle assignment
- **After Event**: Feedback/Past based on assignment + feedback status

### Implementation Phases

#### Phase 1: Database Foundation
**Changes:**
- Disable RLS on core tables: `users`, `waitlist_entries`, `circles`, `circle_members`, `feedback`
- Rationale: 100 trusted Stanford users don't need complex security for MVP
- Create development seed script with time-aware test scenarios
- Add feedback database integration (currently uses localStorage in production)

**Database Commands:**
```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE circles DISABLE ROW LEVEL SECURITY;
ALTER TABLE circle_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE feedback DISABLE ROW LEVEL SECURITY;
```

#### Phase 2: Core Backend Logic
**File: `/src/lib/time.ts`**
- Add three pure time functions using proper millisecond math (fixes DST issues)
- Replace complex `getSlotState()` with clean time boundary checks
- Add comprehensive error boundaries for null/undefined data

**File: `/src/app/circles/CirclesClient.tsx`**
- Create unified `getButtonState()` function
- Replace lines 208-259 (complex nested if-else) with Method 7 logic
- Add dynamic middle text generation based on button state

#### Phase 3: Data Source Migration
**Critical Changes:**
- Remove ALL localStorage from button logic (lines 104-123, 141-144, 310-318)
- Implement development user fallback: `userId = user?.id || 'dev-user-${process.pid}'`
- Migrate existing feedback data: localStorage → database before code deletion
- Use server data as single source of truth

**Migration Strategy:**
1. Run feedback migration script during deployment
2. Verify data transfer completeness
3. Remove localStorage code only after migration confirmed

#### Phase 4: Real-Time Updates
**Enhancements:**
- Add periodic refresh every 60 seconds for deadline transitions
- Implement optimistic updates for button clicks with database sync
- Maintain client-side computation for performance (not server-side)

### Top 10 Implementation Pitfalls

1. **RLS Disable Timing**: Schedule during maintenance window, test on staging first
2. **Feedback Data Loss**: Run migration script before deleting localStorage code
3. **Dev User Collisions**: Use process.pid for unique dev user per terminal session
4. **Database Query Performance**: Batch queries, avoid N+1 patterns
5. **Time Zone Edge Cases**: Use millisecond math only: `new Date(slot.time.getTime() + 20 * 60 * 1000)`
6. **Null Data Crashes**: Add null checks and fallback states in every function
7. **Real-Time State Staleness**: Implement client-side interval refresh
8. **Authentication Edge Cases**: Handle user logout gracefully
9. **Circle Assignment Gaps**: Validate circle existence before showing confirmed states
10. **Testing Time Dependencies**: Mock current time in tests, use APP_TIME_OFFSET patterns

### Development Testing Strategy

#### APP_TIME_OFFSET Integration
The existing `APP_TIME_OFFSET` system works perfectly with Method 7:
- Set `APP_TIME_OFFSET = 14.5` to test 2:30 PM scenarios
- All three time functions respect the offset through `useCurrentTime()` hook
- No changes needed to time management infrastructure

#### Test Scenarios:
```bash
# Test pre-deadline (9:30 AM)
APP_TIME_OFFSET = 9.5
# Expected: Join/Can't Go buttons, "Decide by [deadline]" middle text

# Test post-deadline confirmed (2:10 PM) 
APP_TIME_OFFSET = 14.17
# Expected: Confirmed ✓ button, "Confirmed at 1PM" middle text

# Test feedback window (2:25 PM)
APP_TIME_OFFSET = 14.42
# Expected: Feedback > button, "Confirmed at 1PM" middle text

# Test daily reset (8:30 PM)
APP_TIME_OFFSET = 20.5
# Expected: All slots reset to Join buttons for next day
```

#### Development Data Seeding
```bash
npm run dev:seed -- --time-offset=14.5
```
Creates realistic test data:
- Dev user with complete profile
- Waitlist entries for various time slots
- Mock circles and assignments
- Sample feedback data

### Code Changes Summary

#### Files Modified:
- `INITIAL.md` - This documentation
- `src/lib/time.ts` - Add three pure time functions
- `src/app/circles/CirclesClient.tsx` - Replace button logic
- `src/app/circles/page.tsx` - Use database for all data
- Database schema - Disable RLS policies

#### Lines of Code:
- **Deleted**: ~150 lines of localStorage complexity
- **Added**: ~80 lines of clean database logic
- **Net Result**: Simpler, more maintainable codebase

### Success Validation Checklist

#### Functional Requirements:
- ✅ All 5 button states display correctly: Join, Can't Go, Confirmed ✓, Feedback >, Past
- ✅ Dynamic middle text: "Decide by [time]", "Confirmed at [time]", "Closed at [time]"
- ✅ Feedback buttons appear exactly 20 minutes after event start
- ✅ Daily reset at 8PM PST works correctly
- ✅ APP_TIME_OFFSET testing covers all scenarios

#### Technical Requirements:
- ✅ Database queries work without authentication (RLS disabled)
- ✅ No localStorage references in button logic code
- ✅ Real-time updates work for deadline transitions
- ✅ Development seeding provides complete test scenarios
- ✅ Existing feedback data migrated without loss
- ✅ Error states handle null/undefined data gracefully
- ✅ Performance remains acceptable (no N+1 queries)

#### User Experience:
- ✅ Button states match Template.png design exactly
- ✅ Users see correct states based on their actual participation
- ✅ State transitions happen at correct times
- ✅ No confusion about button meanings or actions

### Critical Implementation Lessons & Pitfalls

#### The Database Permission Architecture Trap
**CRITICAL LESSON:** The most complex bug encountered was not a logic issue but a **database permission architecture split** that created a false debugging narrative.

**The Problem:**
- Server Actions (INSERT/DELETE) used `createServiceClient()` - always worked
- Server Queries (SELECT) used `createClient()` with user auth - always failed due to RLS
- This created a "permission paradox" where data could be written but not read
- Button state logic was perfect, but appeared broken due to wrong input data

**The Solution:**
```typescript
// WRONG: Mixed permission contexts
const authClient = await createClient();        // For queries (FAILS)
const serviceClient = await createServiceClient(); // For mutations (WORKS)

// RIGHT: Consistent permission context  
const serviceClient = await createServiceClient(); // For everything (WORKS)
```

**Prevention Strategies:**
1. **Standardize database client usage** across reads and writes
2. **Create diagnostic API endpoints** for permission testing
3. **Add comprehensive database operation logging** to catch permission failures early
4. **Test with RLS enabled/disabled scenarios** during development

#### Time-Based Logic Debugging Complexity
**LESSON:** Time-based features create multi-dimensional debugging challenges that require specialized approaches.

**Debugging Framework Required:**
- **APP_TIME_OFFSET system** for simulating different times
- **Comprehensive state logging** showing input → processing → output
- **Phase detection logging** (before deadline / during event / after event)
- **Database state verification** at each time transition

**Example Implementation:**
```typescript
// Essential debugging pattern for time-based logic
console.log(`⏰ METHOD 7 DETAILED ANALYSIS for ${timeSlot.slot}:`, {
  input: { isOnWaitlist, assignedCircleId, currentTime },
  phases: { beforeDeadline, duringEvent, afterEvent },
  pathTaken: beforeDeadline ? 'BEFORE_DEADLINE' : duringEvent ? 'DURING_EVENT' : 'AFTER_EVENT'
});
```

#### Anonymous User System Architecture
**LESSON:** Anonymous users require careful consideration of authentication contexts and data persistence.

**Key Implementation Points:**
- Use sessionStorage (not localStorage) for anonymous ID persistence
- Implement merge functionality for anonymous → authenticated user transitions
- Consider database constraints (foreign keys, RLS policies) for anonymous users
- Plan for cleanup of expired anonymous data

#### RLS Policy Granularity Issues
**CRITICAL PITFALL:** RLS policies can have different permissions for different operations (SELECT vs INSERT vs DELETE), creating subtle permission splits.

**Diagnostic Approach:**
```typescript
// Test all operation types separately
const selectTest = await supabase.from('table').select('*');
const insertTest = await supabase.from('table').insert({...});
const deleteTest = await supabase.from('table').delete().eq('id', 'test');

console.log('Permission Test Results:', {
  select: !selectTest.error,
  insert: !insertTest.error, 
  delete: !deleteTest.error
});
```

#### Infrastructure-First Debugging
**LESSON:** Modern applications require infrastructure-level debugging tools, not just application-level logging.

**Essential Diagnostic APIs:**
```typescript
// Create these endpoints for any complex app
/api/debug-rls        // Database permission analysis
/api/debug-time       // Time system validation  
/api/debug-state      // Application state verification
/api/force-fix-*      // Automated fixes for common issues
```

### Future Considerations

#### Post-MVP Scaling:
- **Re-enable RLS carefully** - test all operation types (SELECT/INSERT/DELETE) 
- **Implement user-specific RLS policies** instead of disabling completely
- **Add database connection pooling** for performance
- **Create comprehensive permission testing suite**
- **Implement WebSocket for real-time updates** instead of polling
- **Add analytics tracking** for button interaction patterns

#### Maintenance:
- **Monitor database performance** as user base grows
- **Maintain diagnostic API endpoints** for ongoing troubleshooting  
- **Create automated testing** for time-based edge cases with APP_TIME_OFFSET
- **Document operational procedures** for RLS policy management
- **Implement database backup/restore** procedures for development
- **Create permission audit logging** for security compliance

#### Development Workflow:
- **Always test with RLS enabled** during development
- **Use service client sparingly** - prefer proper RLS policies in production
- **Implement comprehensive logging** before implementing complex features
- **Create time simulation tools** for any time-dependent features
- **Test anonymous user flows** separately from authenticated flows

---

This specification represents the MVP vision for 27 Circle, enhanced with critical implementation learnings. The database permission architecture lesson is particularly important - what appears to be application logic bugs may actually be infrastructure permission issues. Always diagnose the full stack before assuming UI logic problems.

Build iteratively, validate with users, maintain comprehensive debugging capabilities, and focus on fostering meaningful connections through simplicity and reliability. 
