27 Circle App Specification
PROJECT OVERVIEW
Build a web application that facilitates spontaneous, in-person meetups for Stanford students through anonymous time-based circles. Users join waitlists for fixed daily time slots, discover meeting locations one hour before, and meet with 1-3 other students for meaningful 20-minute conversations guided by thought-provoking prompts.
Target Users: ~20-50 Stanford students seeking authentic connections beyond typical social networks.
Core Value: Serendipitous, meaningful conversations with privacy and spontaneity at the core.
CORE CONCEPTS & PRINCIPLES
The Circle Philosophy

Anonymous Until Meeting: No profiles, photos, or names visible before meeting
Small Groups: 2-4 people per circle (optimal for deep conversation)
Time-Boxed: Exactly 20 minutes to maintain energy and respect schedules
Location-Based: Physical meetings at iconic Stanford locations
Interest-Aligned: Subtle matching based on conversation preferences
No Social Features: No chat, no follows, no digital relationships

Privacy & Trust Model

Users only see who they've actually met in person
No pre-meeting information about other participants
No-shows and cancellations handled gracefully
Feedback is private and constructive

USER JOURNEY
1. First-Time User Flow
A. Landing Experience
Route: /

Clean, minimal splash screen
"27 Circle" branding with subtle logo animation
Tagline: "Be Curious Together"
Subtext: "20-minute conversations that matter"
Single CTA: "Get Started" or auto-progress after 3 seconds

B. Interest Discovery
Route: /onboarding/interests

Screen 1 - Conversation Style:

"What sparks your curiosity?"
Options (select 1+):

🧠 Deep Conversations - "Philosophy, ideas, big questions"
🎨 Creative Exchange - "Art, music, creative projects"
🚀 Innovation & Tech - "Startups, technology, future"
🌱 Personal Growth - "Self-improvement, life experiences"




Screen 2 - Interaction Preference:

"How do you like to connect?"
Options (select 1+):

💬 Intellectual Debate - "Challenge ideas respectfully"
❤️ Emotional Support - "Share experiences, listen deeply"
🎯 Goal-Oriented - "Accountability, motivation"
🎲 Spontaneous - "Go wherever conversation leads"





C. Authentication
Route: /auth

Phone-first authentication for trust
Clean form: "Enter your phone number"
Subtext: "We'll text you a verification code"
Alternative: "Sign in with Stanford email" (OAuth)

Route: /auth/verify

6-digit code entry
Auto-focus, auto-advance on completion
Resend option after 30 seconds

D. Profile Essentials
Route: /onboarding/profile

Minimal required info:

First name (for in-person introductions only)
Year/Program (Undergrad/Grad/Staff)
Pronouns (optional)


Location confirmation: "Stanford University"
Notification preferences (default: on)

2. Returning User Flow
A. Home Screen
Route: /circles
Header Section:

"Today's Circles" title
Current time display (PST)
Settings gear (top right)

Time Slots Section (3 daily slots):
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
Map Section:

"Today's general area: [Location Name]"
Zoomed-out map showing approximate region
"Exact spots revealed 1 hour before each circle"

B. Button States & Time Logic
State Machine (for each time slot):

"Join Circle" (Primary Action)

When: Before deadline (10AM/1PM/4PM)
Color: Navy blue (#152B5C)
User not on waitlist


"Leave Waitlist" (Secondary Action)

When: Before deadline
Color: Muted red
User already on waitlist


"Confirmed ✓" (Success State)

When: After deadline, user on waitlist, matched
Color: Success green
Clickable → Circle details


"On Waitlist" (Pending State)

When: After deadline, user on waitlist, not matched
Color: Muted blue
Shows: "2 others waiting"


"Closed" (Missed State)

When: After deadline, user not on waitlist
Color: Gray
Non-interactive


"In Progress" (Active State)

When: During circle time (20 min window)
Shows countdown timer
If matched: Shows "Join your circle →"


"Completed" (Past State)

When: After circle end time
Shows: "Tap for feedback" if attended
Or: "Past" if not attended



C. Circle Details Screen
Route: /circles/[circleId]
Accessible only after matching
Pre-Circle View (up to start time):

Countdown timer: "Circle starts in 14:32"
Exact location with map pin
Walking directions from current location
Today's conversation spark
"Who's coming?" → "3 others are confirmed"
Tips: "Arrive 2 minutes early", "Look for others checking phones"

During Circle (20-minute window):

Live timer: "18:45 remaining"
Conversation spark prominently displayed
"Can't make it?" button (emergency only)

Post-Circle (after end time):

Redirects to feedback

D. Feedback Flow
Route: /feedback/[circleId]
Mandatory after attended circles
Quick 3-question form:

"How many people showed up?" [1][2][3][4+]
"Rate the conversation quality" [5 stars]
"One word to describe it?" [text input]

Then reveals:

Who you met (names + option to connect)
Past conversation history with any repeat members

3. Additional Screens
Settings
Route: /settings

Profile updates
Notification preferences
Circle history
Sign out
Delete account

Error States

No circles available (holidays, breaks)
Matching failed (not enough people)
Location unavailable (construction, events)

TECHNICAL ARCHITECTURE
Stack Overview

Framework: Next.js 14 (App Router)
Language: TypeScript (strict mode)
Styling: Tailwind CSS
Database: Supabase (PostgreSQL + Auth)
Hosting: Vercel
SMS: Twilio
Maps: Google Maps Static API

Data Models
typescript// Core entities
type User = {
  id: string
  phone: string
  name: string
  year: 'undergrad' | 'grad' | 'staff'
  pronouns?: string
  interests: Interest[]
  createdAt: Date
}

type Interest = {
  category: 'conversation_style' | 'interaction_preference'
  value: string
}

type TimeSlot = {
  id: string
  date: Date
  time: '11AM' | '2PM' | '5PM'
  deadline: Date
  locationId: string
}

type WaitlistEntry = {
  userId: string
  timeSlotId: string
  joinedAt: Date
}

type Circle = {
  id: string
  timeSlotId: string
  locationId: string
  members: string[] // user IDs
  status: 'pending' | 'confirmed' | 'completed'
  conversationSpark: string
}

type Feedback = {
  circleId: string
  userId: string
  attendanceCount: number
  rating: 1 | 2 | 3 | 4 | 5
  wordDescription: string
}
Database Schema
sql-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  phone TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  year TEXT NOT NULL,
  pronouns TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User interests (many-to-many)
CREATE TABLE user_interests (
  user_id UUID REFERENCES users(id),
  category TEXT NOT NULL,
  value TEXT NOT NULL,
  PRIMARY KEY (user_id, category, value)
);

-- Stanford locations
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  walking_instructions TEXT
);

-- Daily time slots
CREATE TABLE time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  time TEXT NOT NULL CHECK (time IN ('11AM', '2PM', '5PM')),
  deadline TIMESTAMPTZ NOT NULL,
  location_id UUID REFERENCES locations(id),
  UNIQUE(date, time)
);

-- Waitlist entries
CREATE TABLE waitlist_entries (
  user_id UUID REFERENCES users(id),
  time_slot_id UUID REFERENCES time_slots(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, time_slot_id)
);

-- Circles (formed groups)
CREATE TABLE circles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  time_slot_id UUID REFERENCES time_slots(id),
  location_id UUID REFERENCES locations(id),
  conversation_spark TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Circle members
CREATE TABLE circle_members (
  circle_id UUID REFERENCES circles(id),
  user_id UUID REFERENCES users(id),
  attended BOOLEAN DEFAULT NULL,
  PRIMARY KEY (circle_id, user_id)
);

-- Feedback
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID REFERENCES circles(id),
  user_id UUID REFERENCES users(id),
  attendance_count INTEGER,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  word_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(circle_id, user_id)
);

-- Conversation sparks pool
CREATE TABLE conversation_sparks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  category TEXT,
  used_count INTEGER DEFAULT 0
);
Key Algorithms
Matching Algorithm
typescriptfunction matchUsersForTimeSlot(timeSlotId: string) {
  // 1. Get all waitlist entries for this slot
  // 2. Filter by users who have been matched least recently
  // 3. Group by shared interests (soft preference)
  // 4. Create circles of 2-4 people
  // 5. Assign varied locations to each circle
  // 6. Select conversation spark based on group interests
  // 7. Notify matched users
  // 8. Move unmatched to next available slot (optional)
}
Time Management

All times in PST (no timezone complexity)
Daily schedule resets at midnight
Deadlines: 10AM, 1PM, 4PM (1 hour before circles)
Matching runs at deadlines via cron
Development time override via APP_TIME_OFFSET

Security & Privacy
Authentication

Phone verification primary (trust + spam prevention)
Stanford email as backup option
Session management via Supabase Auth
No passwords stored

Data Access (RLS Policies)

Users see only their own data by default
Circle members visible only after meeting
Waitlist counts are aggregated (no names)
Feedback is anonymous to other users
Admin panel for moderation (separate auth)

Privacy Features

No user discovery/search
No public profiles
Meeting history private by default
Option to "forget" past meetings
FERPA compliant for student data

IMPLEMENTATION PRIORITIES
Phase 1: Core Flow (Week 1-2)
Goal: Basic joining and circle formation

Authentication (SMS only)
Minimal onboarding (name + interests)
Home screen with 3 time slots
Join/leave waitlist functionality
Basic matching (random groups of 2-3)
Circle details reveal
Manual testing framework

Success Metric: Can manually create and join circles
Phase 2: Time-Based Features (Week 3)
Goal: Automated scheduling and matching

Time-based button states
Deadline enforcement
Automated matching algorithm
Location assignment logic
Cron job setup
Real-time waitlist counts
Development time controls

Success Metric: Fully automated daily circles
Phase 3: Enhanced Experience (Week 4)
Goal: Polish and engagement features

Conversation sparks system
Feedback collection
Meeting history
Smart notifications
Interest-based matching
Walk-to-location features
Error handling

Success Metric: 80% feedback completion rate
Phase 4: Scale & Monitor (Week 5)
Goal: Production readiness

Admin dashboard
Monitoring/alerting
Waitlist overflow handling
Holiday/break scheduling
Analytics (anonymous)
Performance optimization
Launch preparation

Success Metric: Handle 50+ daily users
SUCCESS METRICS
User Engagement

Daily Active %: >40% of registered users
Circle Completion: >70% of matched users attend
Feedback Rate: >80% complete post-circle survey
Retention: >60% return within a week

Quality Metrics

Conversation Rating: Average >4.0 stars
Match Satisfaction: >75% "good match"
Technical Reliability: >99% successful matches
Response Time: <200ms for all interactions

Growth Metrics

Week 1: 10 beta users
Week 2: 25 users
Week 4: 50 users
Target: 100 active users by end of quarter

DESIGN PRINCIPLES
Visual Design

Clean & Minimal: Focus on content, not chrome
Stanford Palette: Cardinal red accents on clean white
Accessible: WCAG AA compliant
Mobile-First: Optimized for phones
Subtle Animations: Enhance, don't distract

UX Principles

One-Tap Actions: Minimize clicks
Clear Time Communication: Always show deadlines
Graceful Degradation: Handle edge cases elegantly
Predictable Patterns: Consistent interactions
Forgiving Design: Easy to undo/change

Content Voice

Encouraging: "Great choice!" not "Confirmed"
Clear: "Join by 1:00 PM" not "Deadline approaching"
Human: "3 others are excited to meet" not "3 users registered"
Stanford-Specific: Use campus landmarks and lingo

EDGE CASES & ERROR HANDLING
Matching Edge Cases

Only 1 person in waitlist → Notify and suggest next slot
Odd numbers → Create one group of 3
No-shows → Quick feedback, affect future matching
Over-capacity → Fair queue system

Technical Edge Cases

Lost connectivity → Optimistic UI with sync
Time zone travelers → Force PST display
Duplicate joins → Prevent at database level
Crashed during circle → Rejoin grace period

Content Edge Cases

Inappropriate feedback → Auto-flag for review
Repeat partnerships → Limit to 1/week
Conversation spark repeats → 30-day rotation
Location unavailable → Backup options ready

FUTURE ENHANCEMENTS
V2 Features (Not in MVP)

Circle themes (study groups, fitness, etc.)
Preferred meeting times learning
Cross-campus partnerships
Virtual circle options
Achievement system (private)
Apple/Google Wallet passes

Long-Term Vision

Expand beyond Stanford
Corporate/conference versions
AI-powered conversation coaching
Research partnerships on connection
Open-source core technology

DEVELOPMENT GUIDELINES
Code Quality Standards

TypeScript strict mode always
100% type coverage for core logic
Component tests for interactions
E2E tests for critical paths
Accessibility audit on each screen

Performance Targets

Initial load: <3s on 3G
Interaction response: <100ms
Time accuracy: ±1 second
Database queries: <50ms
Real-time updates: <500ms

Deployment Strategy

Feature flags for gradual rollout
Canary deployments (5% → 25% → 100%)
Rollback plan for each feature
Database migrations with backups
Zero-downtime deployments


This specification represents the complete vision for 27 Circle. Build iteratively, validate with users, and maintain focus on fostering meaningful connections.