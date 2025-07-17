# Product Requirements Prompt: 27 Circle MVP Implementation

## EXECUTIVE SUMMARY
You are tasked with implementing a web application called "27 Circle" that facilitates spontaneous, in-person meetups for Stanford students. The app uses time-based circles where users join waitlists for fixed daily time slots (11AM, 2PM, 5PM), get matched with 1-3 other students using age-based algorithms, and meet for meaningful 20-minute conversations at revealed Stanford locations.

**Target Scale**: 100 Stanford students (MVP scope)
**Core Philosophy**: Anonymous until meeting, privacy-first, serendipitous connections

## VERIFIED TECHNICAL ARCHITECTURE

### Technology Stack (Confirmed Working)
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript exclusively (strict mode)
- **Styling**: Tailwind CSS only
- **Database**: Supabase (PostgreSQL + Auth)
- **SMS**: Twilio for phone verification
- **Maps**: Google Maps Static API
- **Hosting**: Vercel

### Database Schema (Verified Reality)
```sql
-- Core working tables (from essential-schema.sql)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT,
  gender TEXT,
  date_of_birth DATE,
  phone_number TEXT UNIQUE
);

CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE conversation_sparks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spark_text TEXT NOT NULL UNIQUE
);

CREATE TABLE circles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  time_slot TIMESTAMPTZ NOT NULL,
  location_id UUID REFERENCES locations(id),
  conversation_spark_id UUID REFERENCES conversation_sparks(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('forming', 'active', 'completed', 'cancelled')),
  max_participants INTEGER DEFAULT 4,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE circle_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(circle_id, user_id)
);

CREATE TABLE waitlist_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  time_slot TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, time_slot)
);

CREATE TABLE user_interests (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  interest_type TEXT NOT NULL,
  PRIMARY KEY (user_id, interest_type)
);

-- NOTE: Feedback table not implemented in current MVP
-- Feedback uses localStorage for development
```

### TypeScript Types (Verified Implementation)
```typescript
// From /src/lib/database/types.ts
export interface User {
  id: string;
  full_name: string | null;
  gender: 'male' | 'female' | 'non-binary' | null;
  date_of_birth: string | null;
  phone_number: string | null;
}

export interface Circle {
  id: string; // Custom format: YYYY-MM-DD_11AM_Circle_1
  time_slot: string; // TIMESTAMPTZ
  location_id: string | null;
  conversation_spark_id: string | null;
  status: 'forming' | 'active' | 'completed' | 'cancelled';
  max_participants: number;
  created_at: string;
}

export interface WaitlistEntry {
  id: string;
  user_id: string;
  time_slot: string; // TIMESTAMPTZ directly (no timeSlotId)
  created_at: string;
}

// Feedback type not implemented in current MVP
// Feedback data handled via localStorage for development
```

## CORE USER FLOWS

### 1. First-Time User Experience
#### A. Landing & Onboarding
- **Route**: `/` → Clean splash with "Be Curious Together" tagline
- **Route**: `/onboarding/curiosity-1` → Mind curiosity selection (Deep Conversations, Creative Exchange)
- **Route**: `/onboarding/curiosity-2` → Heart curiosity selection (New Activities, Community Service)
- **Route**: `/auth` → Phone-first authentication with SMS verification
- **Route**: `/onboarding/profile` → Minimal profile (name, date of birth for age matching, gender)

#### B. Main Experience
- **Route**: `/circles` → Three daily time slots with button state machine
- **Route**: `/circles/[circleId]` → Circle details with location reveal and conversation spark

### 2. Button State Machine (Critical Logic)
Each time slot (11AM, 2PM, 5PM) has these states:

**"Join Circle"** (Pre-deadline)
- When: Before deadlines (10AM, 1PM, 4PM)
- Color: Navy blue (#152B5C)
- Action: Add to waitlist

**"Leave Waitlist"** (Pre-deadline, on waitlist)
- When: Before deadline, user already joined
- Color: Muted red
- Action: Remove from waitlist

**"Confirmed ✓"** (Post-deadline, matched)
- When: After deadline, user matched into circle
- Color: Success green
- Action: Navigate to circle details

**"Closed"** (Post-deadline, not matched)
- When: After deadline, user not on waitlist
- Color: Gray, disabled

**"Feedback"** (MVP: localStorage implementation)
- When: 20 minutes after circle end time
- Color: Orange
- Storage: localStorage (no database table)
- Auto-reset: 8 PM daily

**"Past"** (Completed)
- When: After feedback or 8 PM reset
- Color: Gray, disabled

### 3. Matching Algorithm (Verified Implementation)
```typescript
// Age-based matching (18-35 vs 36+) with optimal group sizing
function matchUsersForTimeSlot(timeSlot: Date) {
  // 1. Get waitlist entries for time slot
  // 2. Validate users (18+ required, complete profiles)
  // 3. Separate by age groups: 18-35 vs 36+
  // 4. Within each group, create optimal circles:
  //    - 1 person: Gets own circle
  //    - 2-4 people: Single group
  //    - 5 people: Split as 3+2 (not 4+1)
  //    - 6+ people: Maximize groups of 4, then 3, then 2
  // 5. Generate circle IDs: YYYY-MM-DD_11AM_Circle_1
  // 6. Assign random Stanford location
  // 7. Assign conversation spark
  // 8. Create database records atomically
  // Result: 100% matching efficiency (everyone gets placed)
}
```

## PIXEL-PERFECT UI DESIGN SYSTEM

### Design Philosophy (Verified from UX-guide.md)
- **Mobile-First**: Design for phone dimensions with no scrolling on any page
- **Responsive Sizing**: Use REM units throughout, with 1rem = 16px base
- **Fixed Height Pages**: Each screen must fit within viewport height
- **Font**: Inter font family across entire application
- **Performance**: 60fps animations using CSS transforms only

### Color Palette (Exact Hex Values)
```css
/* Primary Colors */
--navy-blue: #152B5C;      /* Headers, primary buttons, branding */
--white: #FFFFFF;          /* Primary text on dark backgrounds */

/* Button State Colors (Critical for State Machine) */
--join-button: #152B5C;    /* Navy blue */
--cant-go-button: #F8F9F8; /* Light gray background with #CA0000 text */
--confirmed-button: #4ADE80; /* Green */
--feedback-button: #FB923C;  /* Orange */
--past-disabled: #EBEBEB;   /* Medium gray */

/* Input & Background Colors */
--input-background: #F5F5F5;
--main-background: #FFFFFF;
--text-dark: #333333;
--border-color: #E5E5E5;
--error-color: #EF4444;
```

### Typography System (Inter Font)
```css
/* Font Sizes (rem-based) */
--header-large: 1.875rem;   /* 30px - "Today's Circles" */
--logo-text: 1.375rem;      /* 22px - "27 Circle" */
--section-header: 1.25rem;  /* 20px - Section titles */
--body-text: 1rem;          /* 16px - Default text */
--button-text: 1rem;        /* 16px - Button labels */
--caption: 0.875rem;        /* 14px - Small text */

/* Font Weights */
--weight-regular: 400;
--weight-medium: 500;
--weight-semibold: 600;
--weight-bold: 700;
```

### Spacing System (8px Grid)
```css
/* Base spacing unit: 0.5rem (8px) */
--spacing-xs: 0.25rem;  /* 4px */
--spacing-sm: 0.5rem;   /* 8px */
--spacing-md: 1rem;     /* 16px - Standard padding */
--spacing-lg: 1.5rem;   /* 24px - Section spacing */
--spacing-xl: 2rem;     /* 32px */

/* Specific measurements */
--screen-padding: 1rem;     /* Horizontal margins from edges */
--card-padding: 1rem;       /* Internal card padding */
--slot-gap: 1rem;          /* Gap between time slots */
```

### Component Specifications

#### Buttons (Critical for State Machine)
```css
.button {
  height: 2.75rem;                    /* 44px - Touch target */
  padding: 0 1.5rem;
  border-radius: 1.375rem;            /* Fully rounded */
  font-weight: 500;
  font-size: 1rem;
  border: none;
  cursor: pointer;
  width: 100%;
  transition: transform 100ms ease-out, filter 100ms ease-out;
}

/* Press Animation (Required for all interactive elements) */
.button:active {
  transform: scale(0.95);
  filter: brightness(0.9);
  transition: none; /* Instant press feedback */
}

/* Button State Variants */
.button-join { background: #152B5C; color: white; }
.button-cant-go { background: #F8F9F8; color: #CA0000; }
.button-confirmed { background: #4ADE80; color: white; }
.button-feedback { background: #FB923C; color: white; }
.button-past { background: #EBEBEB; color: #999; pointer-events: none; }
```

#### Input Fields
```css
.input-field {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;              /* 8px */
  border: 1px solid #E5E5E5;
  background: #F5F5F5;
  font-size: 1rem;
  font-family: 'Inter', sans-serif;
}

.input-field:focus {
  outline: none;
  border-color: #152B5C;              /* Navy focus */
  background: #FFFFFF;
}

.input-field.error {
  border-color: #EF4444;
  background: #FEF2F2;
}
```

#### Time Slot Cards
```css
.time-slot-card {
  padding: 1rem;
  margin-bottom: 1rem;                /* 16px gap maintains 8px grid */
  background: #FFFFFF;
  border-radius: 0.75rem;             /* 12px */
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
```

#### Navigation Elements
```css
.back-button {
  width: 2.5rem;                      /* 40px */
  height: 2.5rem;
  border-radius: 50%;
  background: #F5F5F5;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
}

.settings-icon {
  width: 1.5rem;                      /* 24px */
  height: 1.5rem;
  color: #FFFFFF;
}
```

### Layout Constraints (Critical for Mobile-First)
```css
.app-container {
  max-width: 100vw;
  height: 100vh;
  overflow: hidden;                   /* NO SCROLLING ALLOWED */
  display: flex;
  flex-direction: column;
}

.header {
  background: #152B5C;
  color: white;
  padding: 1rem;
  flex-shrink: 0;
}

.content {
  flex: 1;
  overflow: hidden;                   /* Content must fit viewport */
  padding: 1rem;
}

/* Tablet and up (optional) */
@media (min-width: 768px) {
  .app-container {
    max-width: 400px;
    margin: 0 auto;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
  }
}
```

### Special Components

#### Logo & Branding
- **Logo SVG**: 3rem (48px) height with motion lines
- **"27 Circle" text**: 1.375rem (22px), bold weight
- **Tagline**: "Be Curious Together" - 1rem regular

#### Brain/Heart Illustrations (Onboarding)
- **Format**: PNG images (not SVG)
- **Blue brain**: Scientific topics selection
- **Gold heart**: Personal growth selection
- **Size**: 8rem (128px) width, center aligned

#### Map Component
```css
.map-container {
  height: 12rem;                      /* 192px */
  border-radius: 0.75rem;             /* 12px */
  overflow: hidden;
}
```

#### Rating Component (Feedback)
```css
.rating-container {
  display: flex;
  gap: 0.5rem;
}

.rating-button {
  width: 3rem;
  height: 3rem;
  border: 1px solid #E5E5E5;
  background: #FFFFFF;
  border-radius: 0.5rem;
  font-size: 1rem;
  cursor: pointer;
}

.rating-button.selected {
  background: #152B5C;
  color: white;
  border-color: #152B5C;
}
```

### Loading & Error States
```css
/* Loading state for buttons */
.button.loading {
  opacity: 0.7;
  pointer-events: none;
}

.button.loading::after {
  content: '';
  width: 1rem;
  height: 1rem;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-left: 0.5rem;
}

/* Error messages */
.error-message {
  color: #EF4444;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

/* Empty states */
.empty-state {
  text-align: center;
  padding: 2rem;
  color: #666;
}
```

### Critical UI Rules
1. **No Scrolling**: Every page must fit within viewport - reduce spacing if needed
2. **Press States**: All interactive elements need scale(0.95) + brightness(0.9) on press
3. **Touch Targets**: Minimum 44px height for accessibility
4. **Asset Management**: Keep PNG images, don't convert to SVG
5. **Performance**: Use CSS transforms for 60fps animations

## CRITICAL IMPLEMENTATION REQUIREMENTS

### 1. Time Management System
- **All times in PST** (America/Los_Angeles timezone)
- **Daily reset**: 8:00 PM PST
- **Deadlines**: 10AM, 1PM, 4PM (1 hour before circles)
- **Development override**: APP_TIME_OFFSET constant for testing
- **Custom hook**: useCurrentTime() for all time-dependent logic

### 2. Circle ID Generation (Verified Pattern)
```typescript
// Custom format overrides database UUID
function generateCircleId(timeSlot: Date, circleIndex: number): string {
  // Returns: "2024-01-15_2PM_Circle_3"
  const dateStr = timeSlot.toISOString().split('T')[0];
  const hour = timeSlot.getHours();
  const timeSlotStr = hour === 11 ? '11AM' : hour === 14 ? '2PM' : '5PM';
  return `${dateStr}_${timeSlotStr}_Circle_${circleIndex}`;
}
```

### 3. Authentication & Development Mode
- **Production**: Phone + SMS verification via Twilio
- **Development**: Auth bypass with localStorage persistence
- **Test users**: 38 pre-seeded users for testing
- **RLS policies**: User-specific data access control

### 4. Feedback System (MVP Limitation)
- **Current state**: localStorage implementation only
- **Database**: No feedback table exists in current schema
- **UI**: Feedback button appears 20 minutes after circle end
- **Storage**: Client-side only for development testing
- **Future**: Database table implementation planned

## FILE STRUCTURE & PATTERNS

### Directory Organization
```
/src
  /app              # Next.js App Router pages
    /circles        # Main circles page and individual circle
    /feedback       # Feedback flow (localStorage)
    /onboarding     # User registration flow
    /auth           # Authentication pages
  /components       # Reusable React components
  /lib
    /database       # Supabase client and types
    /matching       # Age-based matching algorithm
    /hooks          # Custom React hooks (useCurrentTime)
    /time           # Time management utilities
  /context          # Documentation and schema files
```

### Component Patterns
- **Server Components by default** (add 'use client' only when needed)
- **One component per file** with default export
- **TypeScript interfaces** for all props
- **Co-locate sub-components** only if used nowhere else

### Styling Guidelines
- **Tailwind CSS only** (no CSS modules or styled-components)
- **Mobile-first responsive design**
- **Dark mode prepared** but not implemented
- **Stanford branding** with cardinal red accents

## DEVELOPMENT WORKFLOW

### 1. Environment Setup
```bash
# Required environment variables
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=  # Server-side only!
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
NEXT_PUBLIC_GOOGLE_MAPS_KEY=
```

### 2. Development Commands
```bash
npm run dev      # Development server
npm run build    # Production build (must compile without errors)
npm run lint     # Code linting
npm run typecheck # TypeScript validation
```

### 3. Testing Strategy
- **Time-based testing**: Use APP_TIME_OFFSET to simulate different times
- **Edge cases**: Test with 0 users, 1 user, many users
- **Age boundaries**: Test exactly 18, exactly 35, missing birthdates
- **Button states**: Test all state transitions

## SUCCESS CRITERIA

### Phase 1: Core Flow (Weeks 1-2)
- ✅ Authentication with SMS verification
- ✅ Minimal onboarding (name, interests, age)
- ✅ Three time slots with join/leave functionality
- ✅ Age-based matching (18-35 vs 36+)
- ✅ Circle details with location reveal
- ✅ Manual testing capability

### Phase 2: Time-Based Features (Week 3)
- ✅ Automated time-based button states
- ✅ Deadline enforcement
- ✅ Cron job matching at deadlines
- ✅ Location assignment
- ✅ Development time controls

### Phase 3: Enhanced Experience (Week 4)
- ✅ Conversation sparks system
- ⚠️ Feedback collection (localStorage only)
- ✅ Circle history access
- ✅ Error handling

### Current Status: Ready for 100-user deployment
- **Database**: Verified working schema
- **Matching**: Age-based algorithm implemented
- **UI**: Complete button state machine
- **Auth**: Phone verification working
- **Limitations**: Feedback uses localStorage (not database)

## CRITICAL CONSTRAINTS

### MVP Limitations (Intentional)
- **No database feedback table** (localStorage only)
- **No profiles table** (uses users table only)
- **No chat features** (by design)
- **No social features** (anonymous until meeting)
- **100 user limit** (don't over-engineer)

### Security Requirements
- **No secrets in code** (use environment variables)
- **RLS policies** handle data access
- **Phone verification** prevents spam
- **No participant reveal** before meetings

### Performance Targets
- **Initial load**: <3s on 3G
- **Interaction response**: <100ms
- **Time accuracy**: ±1 second
- **Database queries**: <50ms

## IMPLEMENTATION NOTES

### Code Quality Standards
- **TypeScript strict mode** always
- **No 'any' types** (use 'unknown' or proper types)
- **Component tests** for critical interactions
- **Error handling** in all async operations

## PAGE-SPECIFIC UI REQUIREMENTS (From Mockups)

### 1. Splash Screen (`/`) - ACTUAL IMPLEMENTATION DOCUMENTED

#### Complete Animation Timeline (4.8 seconds total)
```
0ms     → Component mounts, shows dark navy background (#0A192F)
100ms   → Animations begin (setAnimate(true))
200ms   → Logo animation starts (animate-logo-draw with 200ms delay)
500ms   → Title animation starts (1000ms duration with 500ms delay)
1500ms  → Tagline animation starts (1000ms duration with 1500ms delay)  
1800ms  → Subtext animation starts (1000ms duration with 1800ms delay)
2800ms  → Animations settle (setSettled(true)) - crisp edges applied
4800ms  → Container initiates fade out (500ms duration)
5300ms  → Complete transition to curiosity page
```

#### Actual Component Structure
```jsx
// Full-screen container with gradient background animation
<main 
  className="min-h-screen flex flex-col text-white relative overflow-hidden"
  style={{
    background: animate 
      ? 'linear-gradient(180deg, #152B5C 0%, #142959 100%)' 
      : '#0A192F',
    transition: 'background 1.5s ease-out'
  }}
>
  <div className="flex-1 flex flex-col justify-center text-center px-6 relative z-10 max-w-lg mx-auto pt-[10vh] pb-[8vh]">
    
    {/* "27 Circle" Title - Responsive clamp sizing */}
    <h1 
      className="text-[clamp(2.5rem,8vw,3.5rem)] font-bold tracking-wide mb-[clamp(1rem,4vw,2rem)]"
      style={{
        opacity: animate ? 1 : 0,
        transform: animate ? 'scale(1)' : 'scale(0.9)',
        transition: 'all 1000ms cubic-bezier(0.34, 1.56, 0.64, 1) 500ms',
        filter: settled ? 'contrast(1.02)' : 'none'
      }}
    >
      27 Circle
    </h1>
    
    {/* Logo with Complex Animation */}
    <div className="w-32 h-20 md:w-40 md:h-24 mx-auto relative mb-[clamp(1.5rem,6vw,3rem)]">
      <Image
        src="/Images/PNG/white-logo.svg"
        className={animate ? 'animate-logo-draw' : ''}
        style={{
          filter: animate && settled 
            ? 'drop-shadow(0 0 8px rgba(255,255,255,0.6))' 
            : animate 
              ? 'drop-shadow(0 0 4px rgba(255,255,255,0.3))'
              : 'none'
        }}
      />
      
      {/* Glow overlay - appears only after settled */}
      {animate && settled && (
        <div 
          className="absolute inset-0 pointer-events-none animate-glow-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
            borderRadius: '50%'
          }}
        />
      )}
    </div>
    
    {/* "Be Curious Together" - Blur animation */}
    <p 
      className="text-[clamp(1.25rem,5vw,1.75rem)] font-light tracking-wide mb-[clamp(1rem,3vw,1.5rem)]"
      style={{
        opacity: animate ? 1 : 0,
        filter: animate ? 'blur(0)' : 'blur(8px)',
        transition: 'all 1000ms ease-out 1500ms',
        fontWeight: '300'
      }}
    >
      Be Curious Together
    </p>
    
    {/* Subtext - Slide up animation */}
    <p 
      className="text-[clamp(0.875rem,3.5vw,1rem)] font-light tracking-wide"
      style={{
        opacity: animate ? 0.8 : 0,
        transform: animate ? 'translateY(0)' : 'translateY(0.5rem)',
        transition: 'all 1000ms cubic-bezier(0.34, 1.56, 0.64, 1) 1800ms',
        fontWeight: '300'
      }}
    >
      Hang out for 20 minutes on campus
    </p>
  </div>
</main>
```

#### CSS Animations (Exact Keyframes)
```css
/* Logo Draw Animation - 1.2s duration, 200ms delay */
@keyframes logo-draw {
  0% {
    opacity: 0;
    filter: brightness(0) drop-shadow(0 0 4px rgba(255,255,255,0.3));
    transform: scale(0.95);
  }
  30% {
    opacity: 0.3;
    filter: brightness(0.3) drop-shadow(0 0 6px rgba(255,255,255,0.4));
    transform: scale(0.98);
  }
  60% {
    opacity: 0.7;
    filter: brightness(0.7) drop-shadow(0 0 8px rgba(255,255,255,0.5));
    transform: scale(1.02);
  }
  100% {
    opacity: 1;
    filter: brightness(1) drop-shadow(0 0 4px rgba(255,255,255,0.3));
    transform: scale(1);
  }
}

/* Glow Pulse Animation - 1s duration, 400ms delay */
@keyframes glow-pulse {
  0% {
    opacity: 0;
    transform: scale(1);
  }
  50% {
    opacity: 0.3;
    transform: scale(1.05);
  }
  100% {
    opacity: 0.1;
    transform: scale(1);
  }
}
```

#### Container Transition Logic
```jsx
// TransitionContainer handles page transitions
const fadeOutTimer = setTimeout(() => {
  setSplashFading(true);
  setTimeout(() => setCuriosityVisible(true), 300);
  setTimeout(() => setShowSplash(false), 500);
}, 4800); // Total splash duration

// Click-to-skip functionality
const handleSkip = () => {
  setSplashFading(true);
  setTimeout(() => setCuriosityVisible(true), 150);
  setTimeout(() => setShowSplash(false), 300);
};
```

#### Responsive Design Features
- **Clamp-based sizing**: All text uses `clamp()` for fluid responsiveness
- **Viewport-relative spacing**: Uses `vh` units for vertical positioning
- **Mobile-optimized**: Smaller base font size (14px) on mobile
- **No scrolling**: Content fits within viewport constraints
- **Click-to-skip**: Entire screen is clickable for immediate transition

### 2. Login/Auth Screen (`/auth`)
```jsx
// Layout: White background, logo at top, form centered
<div className="app-container">
  <div className="content flex-col justify-center">
    <div className="text-center mb-8">
      <LogoComponent size="2.5rem" className="mx-auto" />
      <h1 className="text-logo-text font-bold mt-4">27 Circle</h1>
      <p className="text-body-text mt-2">Be Curious Together</p>
      <p className="text-caption">Hang out for 20 minutes on campus</p>
    </div>
    
    <div className="space-y-4">
      <div>
        <label className="text-body-text font-medium">Phone Number</label>
        <input className="input-field mt-2" placeholder="Enter your phone number" />
      </div>
      <button className="button button-join">Send verification code</button>
      <div className="text-center">
        <span className="text-caption">Or</span>
        <button className="google-signin-button mt-2">
          <GoogleIcon /> Sign in with Google
        </button>
      </div>
    </div>
  </div>
</div>
```

### 3. Main Circles Page (`/circles`)
```jsx
// Layout: Navy header + white content, no scrolling
<div className="app-container">
  <header className="header flex justify-between items-center">
    <h1 className="text-header-large font-semibold">Today's Circles</h1>
    <button className="settings-icon">⚙</button>
  </header>
  
  <div className="content">
    <p className="text-body-text text-center mb-6">
      New conversations waiting to happen
    </p>
    
    <section className="mb-6">
      <h2 className="text-section-header font-medium mb-4">Upcoming Times</h2>
      
      {/* Time slot cards - exactly 3, must fit without scrolling */}
      <div className="space-y-4">
        <TimeSlotCard time="11:05 AM" deadline="Decide by 10AM" state="join" />
        <TimeSlotCard time="2:05 PM" deadline="Decide by 1PM" state="cant-go" />
        <TimeSlotCard time="5:05 PM" deadline="Decide by 4PM" state="confirmed" />
      </div>
    </section>
    
    <section>
      <p className="text-caption text-center mb-4">
        Availability resets at 8PM each day
      </p>
      
      <div className="space-y-4">
        <PreferencesLink />
        <LocationPreview />
      </div>
    </section>
  </div>
</div>
```

### 4. Onboarding Curiosity Screens
```jsx
// Screen 1: Brain selection (/onboarding/curiosity-1)
<div className="app-container">
  <BackButton />
  <div className="content flex-col justify-center text-center">
    <h1 className="text-header-large font-semibold mb-4">
      What sparks your curiosity?
    </h1>
    <p className="text-body-text mb-2">Select one or both themes.</p>
    <p className="text-body-text mb-8">
      Then meet and chat with up to 3 others today!
    </p>
    
    <div className="flex justify-center gap-8 mb-8">
      <SelectionCard 
        image="/images/curiosity/Deep_Brain.png"
        title="Scientific Topics"
        selected={scientificSelected}
      />
      <SelectionCard 
        image="/images/curiosity/Spiritual_Brain.png" 
        title="Spiritual Discussions"
        selected={spiritualSelected}
      />
    </div>
    
    <button className="button button-join">Next</button>
    <p className="text-caption mt-4">Step 1 of 2</p>
  </div>
</div>
```

### 5. Individual Circle Page (`/circles/[circleId]`)
```jsx
<div className="app-container">
  <header className="header flex justify-between items-center">
    <BackButton color="white" />
    <h1 className="text-header-large font-semibold">Upcoming Circle</h1>
    <button className="settings-icon">⚙</button>
  </header>
  
  <div className="content">
    <div className="text-center mb-6">
      <p className="text-section-header font-medium">02:00 PM - 02:20 PM</p>
    </div>
    
    <div className="space-y-6">
      <ConversationSpark 
        icon="💡"
        text="What's one of the major problems that you see on campus?"
      />
      
      <LocationDetails 
        name="Stanford University - Old Union"
        action="View the exact spot"
      />
      
      <MapComponent 
        height="12rem"
        location={{ lat: 37.4419, lng: -122.1430 }}
      />
    </div>
  </div>
</div>
```

### 6. Feedback Screen (`/feedback/[circleId]`)
```jsx
<div className="app-container">
  <header className="header flex justify-between items-center">
    <BackButton color="white" />
    <h1 className="text-header-large font-semibold">How did the 2PM Circle Go?</h1>
    <button className="settings-icon">⚙</button>
  </header>
  
  <div className="content space-y-6">
    <div>
      <label className="text-body-text font-medium mb-3 block">
        How many others were in your Circle?*
      </label>
      <AttendanceSelector />
      <label className="flex items-center mt-2">
        <input type="checkbox" className="mr-2" />
        <span className="text-body-text">I couldn't make it</span>
      </label>
    </div>
    
    <div>
      <label className="text-body-text font-medium mb-3 block">
        How would you rate your experience?*
      </label>
      <RatingComponent />
    </div>
    
    <div>
      <label className="text-body-text font-medium mb-3 block">
        What's one thing you'll remember?
      </label>
      <textarea 
        className="input-field resize-none h-24"
        placeholder="e.g., A great conversation, an issue, a new idea, or an inspiration"
      />
    </div>
    
    <div className="space-y-3">
      <button className="button button-join">Share Experience</button>
      <button className="text-button">Skip</button>
    </div>
  </div>
</div>
```

## COMPONENT BEHAVIOR SPECIFICATIONS

### Time Slot Card State Machine
```jsx
interface TimeSlotCardProps {
  time: string;           // "11:05 AM"
  deadline: string;       // "Decide by 10AM" 
  state: ButtonState;     // Determines styling and behavior
}

// State-specific rendering
switch (state) {
  case 'join':
    return <Button className="button-join">Join</Button>;
  case 'cant-go': 
    return <Button className="button-cant-go">Can't Go</Button>;
  case 'confirmed':
    return <Button className="button-confirmed" onClick={navigateToCircle}>
      Confirmed ✓
    </Button>;
  case 'feedback':
    return <Button className="button-feedback" onClick={navigateToFeedback}>
      Feedback
    </Button>;
  case 'past':
    return <Button className="button-past" disabled>Past</Button>;
}
```

### Loading State Management
```jsx
// All async operations must show loading states
const [isLoading, setIsLoading] = useState(false);

const handleJoinCircle = async () => {
  setIsLoading(true);
  try {
    await joinWaitlist(timeSlot);
    // Update UI state
  } catch (error) {
    // Show error toast/message
  } finally {
    setIsLoading(false);
  }
};

return (
  <button 
    className={`button button-join ${isLoading ? 'loading' : ''}`}
    disabled={isLoading}
  >
    {isLoading ? 'Joining...' : 'Join'}
  </button>
);
```

### Animation Requirements
```css
/* Required for all interactive elements */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Page transitions (optional enhancement) */
.page-enter {
  opacity: 0;
  transform: translateX(20px);
}

.page-enter-active {
  opacity: 1;
  transform: translateX(0);
  transition: opacity 200ms, transform 200ms;
}
```

### Error Handling UI Patterns
```jsx
// Toast notifications for user feedback
const showToast = (message: string, type: 'success' | 'error') => {
  // Implementation depends on chosen toast library
};

// Form validation display
const [errors, setErrors] = useState<Record<string, string>>({});

return (
  <div>
    <input 
      className={`input-field ${errors.phone ? 'error' : ''}`}
      {...register('phone')}
    />
    {errors.phone && (
      <p className="error-message">{errors.phone}</p>
    )}
  </div>
);
```

## TAILWIND CSS CONFIGURATION

### Custom Design Tokens
```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'navy-blue': '#152B5C',
        'cant-go-red': '#CA0000',
        'confirmed-green': '#4ADE80', 
        'feedback-orange': '#FB923C',
        'disabled-gray': '#EBEBEB',
        'input-bg': '#F5F5F5',
        'error': '#EF4444',
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
      fontSize: {
        'header-large': '1.875rem',
        'logo-text': '1.375rem', 
        'section-header': '1.25rem',
      },
      spacing: {
        '18': '4.5rem',  // For logo sizes
      },
      borderRadius: {
        'button': '1.375rem',
      }
    }
  }
};
```

### Common Pitfalls to Avoid

#### Backend Pitfalls
- **Don't use new Date() directly** (use useCurrentTime hook)
- **Don't assume feedback table exists** (localStorage only)
- **Don't mix UUID and custom circle IDs** (circles use custom format)
- **Don't reference profiles table** (use users table)
- **Don't over-engineer for scale** (100 users, not 10,000)

#### UI Pitfalls (Critical for Pixel-Perfect Implementation)
- **Don't allow page scrolling** (every screen must fit viewport)
- **Don't skip press animations** (scale + brightness required on all buttons)
- **Don't use arbitrary spacing** (stick to 8px grid system)
- **Don't convert PNG assets to SVG** (brain/heart illustrations must stay PNG)
- **Don't mix font families** (Inter only throughout app)
- **Don't use non-standard button heights** (44px minimum for touch targets)
- **Don't approximate colors** (use exact hex values from design system)
- **Don't forget loading states** (all async operations need loading UI)
- **Don't use hover states on mobile** (focus on press/tap feedback)
- **Don't break the state machine** (button states must match backend reality)

## FINAL IMPLEMENTATION CHECKLIST

### Before Starting Development
- [ ] Set up environment variables (Supabase, Twilio, Google Maps)
- [ ] Install Inter font family
- [ ] Configure Tailwind with custom design tokens
- [ ] Verify database schema matches essential-schema.sql

### During Development
- [ ] Use useCurrentTime() hook for all time operations
- [ ] Reference exact hex colors from design system
- [ ] Test all button states with real backend data
- [ ] Ensure pages fit viewport without scrolling
- [ ] Add press animations to all interactive elements
- [ ] Implement loading states for async operations
- [ ] Test with APP_TIME_OFFSET for time-based features

### Quality Assurance
- [ ] All buttons have 44px minimum height
- [ ] No page requires scrolling on mobile
- [ ] Press animations work on all interactive elements
- [ ] Color values match design system exactly
- [ ] Inter font family loads correctly
- [ ] State machine reflects backend reality
- [ ] Error handling shows user-friendly messages

---

**This PRP represents the complete, verified implementation guide for the 27 Circle MVP.** 

✅ **Backend architecture**: Cross-referenced against working codebase  
✅ **UI design system**: Based on verified UX-guide.md specifications  
✅ **Page layouts**: Derived from actual mockup analysis  
✅ **Component behavior**: Aligned with state machine reality  
✅ **Implementation pitfalls**: Learned from codebase audit  

**Ready for pixel-perfect solo development of a 100-user MVP.**