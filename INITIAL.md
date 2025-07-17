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

**"Join Circle"** (Primary Action)
- When: Before deadline (10AM/1PM/4PM)
- Color: Navy blue (#152B5C)
- User not on waitlist

**"Leave Waitlist"** (Secondary Action)
- When: Before deadline
- Color: Muted red
- User already on waitlist

**"Confirmed ✓"** (Success State)
- When: After deadline, user on waitlist, matched
- Color: Success green
- Clickable → Circle details

**"Closed"** (Missed State)
- When: After deadline, user not on waitlist
- Color: Gray
- Non-interactive

**"In Progress"** (Active State)
- When: During circle time (20 min window)
- Shows countdown timer
- If matched: Shows "Join your circle →"

**"Feedback"** (Optional State)
- When: 20 minutes after circle end time
- Color: Orange
- Behavior: Can submit feedback or skip
- Auto-popup: 60 minutes after circle start time (separate from button state)
- Reset: Button remains "Feedback" until 8 PM reset (even if skipped)

**"Past"** (Completed State)
- When: After feedback submitted OR at 8 PM reset
- Color: Gray, disabled
- Behavior: Not clickable

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

This specification represents the MVP vision for 27 Circle. Build iteratively, validate with users, and maintain focus on fostering meaningful connections through simplicity and reliability. 