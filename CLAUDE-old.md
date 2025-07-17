Global Rules for 27 Circle App Development

Project Architecture & File Structure

Framework: Next.js 14 with App Router (App Directory) Language: TypeScript exclusively - no JavaScript files File Structure: Standard /src directory structure:
/src/app/: All routes and pages (App Router) /src/components/: Reusable React components /src/lib/: Database clients, helper functions, constants. Contains sub-directories like /hooks/. /src/context/: Human-written context files for AI collaboration /public/: Static assets (images, fonts, etc.) /PRPs/: Product Requirements Prompts (root level)
Import Paths: Use absolute imports with @ alias (e.g., @/components/..., @/lib/...)

Component Philosophy & Patterns

Server Components by Default: Only add 'use client' directive when you need:
React hooks (useState, useEffect, useContext, etc.)
Browser APIs (window, document, localStorage)
Event handlers (onClick, onChange, onSubmit, etc.)
Third-party client-only libraries
Component Structure:
One component per file
Export as default
TypeScript interfaces for all props
Co-locate sub-components only if used nowhere else
Naming Conventions:
Components: PascalCase (e.g., TimeSlotCard.tsx)
Functions/Variables: camelCase (e.g., handleSubmit)
Constants: UPPER_SNAKE_CASE (e.g., APP_TIME_OFFSET)
Types/Interfaces: PascalCase with descriptive names

Styling Guidelines

Tailwind CSS Only: No CSS modules, styled-components, or inline styles Class Organization: Logical order - layout → spacing → typography → colors → effects Responsive Design: Mobile-first using Tailwind breakpoints (sm:, md:, lg:, xl:) Dark Mode: Prepared with dark: variants but not currently implemented Custom Styles: Only in globals.css using @apply directive when absolutely necessary No Arbitrary Values: Prefer Tailwind's design system over arbitrary values

Database & Data Management

Database: Supabase Postgres with Row Level Security (RLS) Schema Authority: /src/context/database_schema.md is the single source of truth Core Tables:
users: Auth profiles (linked to auth.users)
user_interests: Onboarding selections
waitlist_entries: Pre-deadline slot joiners
circles: Formed groups with status
circle_members: User-circle relationships
locations & conversation_sparks: Static reference data
Data Operations:
Queries: Can be in Server Components or Server Actions
Mutations: MUST use Server Actions exclusively
Location: Co-locate actions in actions.ts files (e.g., /src/app/circles/actions.ts)
Security: All operations respect RLS policies automatically

Server Actions Pattern

Purpose: All database mutations (INSERT, UPDATE, DELETE) must use Server Actions Structure: Use 'use server' directive, import createClient from @/lib/supabase/server, validate inputs, check auth, perform operation, return standardized result Error Handling: Always return { error: string | null } for consistency Validation: Validate on both client AND server (defense in depth)

Authentication & Authorization

Provider: Supabase Auth with phone/SMS via Twilio User Flow: Enter phone → SMS verification → Profile setup → Curiosity selections → Access granted Route Protection:
Public routes: /, /auth/*
Protected routes: All others require completed onboarding
Redirect logic: No auth → /, Incomplete onboarding → next step
Session Management: Use Supabase's built-in session handling

Time Management System (CRITICAL)

Golden Rule: NEVER use new Date() directly in components useCurrentTime Hook: ALL time-dependent logic must use this custom hook APP_TIME_OFFSET Constant: Located in /src/lib/constants.ts
null value: Uses real PST time
number value: Simulates that hour today (e.g., 14.5 = 2:30 PM)
Timezone: All operations in PST (America/Los_Angeles) Daily Reset: 8:00 PM PST - all slots switch to next day Testing: Use APP_TIME_OFFSET to test all time-based states

Button State Machine (Circles Page)

The /circles page has THREE time slots (11:00 AM, 2:00 PM, 5:00 PM) with these EXACT states:
State 1 - Pre-Deadline (Toggleable):
Not in waitlist: Blue "Join" button
In waitlist: Gray "Can't Go" button
Clicking toggles between states
State 2 - Post-Deadline, Not Joined:
Display: "Closed at [10AM/1PM/5PM]"
Style: Disabled, grayed out
State 3 - Post-Deadline, Joined & Matched:
Display: "Confirmed ✓"
Style: Green, clickable
Action: Navigates to /circles/[circleId]
State 4 - Past Event:
Display: "Past"
Style: Disabled for all users
Triggers: 20 minutes after slot time
Deadlines: 1 hour before slots (10AM, 1PM, 4PM) Failed Match Edge Case: Shows "Closed at [Time]" (same as State 2)

Matching Engine Rules

Execution Time: Exactly at deadlines (10:00:00, 13:00:00, 16:00:00) Algorithm: Random grouping for MVP (interests saved but unused) Group Sizes: 2-4 people, optimize for 4 Process: Query waitlist → Create circles → Assign members Unmatched Users: No special handling, see "Closed" state

Static Assets & Images (Corrected & Hardened)

Root Location: All user-facing images MUST be stored in the /public/images/ directory.
Organization: Use the following logical sub-directories:
/public/images/onboarding/: For images used in the onboarding flow.
/public/images/curiosity/: For images used in the curiosity selection screens.
/public/images/circles/: For images related to the main circles page or its components.
/public/images/mockups/: For internal reference screenshots only. These MUST NOT be used in the application UI.
Usage in Code: Images MUST be referenced in components using an absolute path from the /public directory (e.g., <Image src="/images/onboarding/Friends_Seated.png" ... />).
Image Component: The next/image component MUST be used for all images.
Key Application Images:
Curiosity (Mind): /images/curiosity/Deep_Brain.png, /images/curiosity/Spiritual_Brain.png
Curiosity (Heart): /images/curiosity/Heart_Left.png, /images/curiosity/Heart_Right.png
Circles Template: /images/circles/Template.png

Development Workflow

Context Engineering: Follow formal workflow
Write INITIAL.md with clear requirements
Generate PRP using /generate-prp command
Execute PRP using /execute-prp command
Reference Examples: Always check existing patterns in codebase Documentation: Keep PRPs as living documentation

Code Quality Standards

TypeScript Strictness:
No 'any' types - use 'unknown' or proper types
Define interfaces for all data structures
Use discriminated unions for state management
Error Handling:
Try-catch in all async operations
User-friendly error messages
Log technical details for debugging
Comments:
Explain complex business logic
Document "why" not "what"
Add TODO comments with context

UI/UX Principles

Brand Voice:
Thoughtful and introspective tone
Encouraging, not commanding
Examples: "Lead with Curiosity" not "Submit"
Visual Hierarchy:
Clean, minimal interfaces
Consistent spacing (use Tailwind's scale)
Clear interactive states
Loading & Error States:
Always show loading indicators
Graceful error messages with actions
Optimistic updates where appropriate

Performance Guidelines

Images: Optimize with Next.js Image component Database Queries:
Use indexes (defined in schema)
Avoid N+1 queries
Implement pagination for lists
Client-Server Split:
Heavy logic in Server Components
Minimal client-side JavaScript
Strategic use of Suspense boundaries

Security Best Practices

Input Validation: Always validate on server Authentication: Check auth state in Server Components Data Access: Let RLS handle permissions Environment Variables:
NEXT_PUBLIC_* for client-safe values
Server-only for sensitive keys
No Secrets in Code: Use environment variables

Testing Strategy

Time-Based Testing: Use APP_TIME_OFFSET to test all states Edge Cases: Document and test boundary conditions User Flows: Test complete paths through app Error Scenarios: Test network failures, auth issues

Deployment Readiness (Clarified)

Environment Variables Required:
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY // CRITICAL: SERVER-SIDE ONLY. NEVER EXPOSE TO CLIENT.
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER
NEXT_PUBLIC_GOOGLE_MAPS_KEY
Platform: Optimized for Vercel deployment.
Build Checks: TypeScript MUST compile without errors.

Critical Reminders

Single Source of Truth: This document and /src/context/database_schema.md Ask Questions: When requirements unclear, ask for clarification Follow Patterns: Use existing code as reference Test Everything: Especially time-based logic Document Deviations: If you must deviate from these rules, explain why