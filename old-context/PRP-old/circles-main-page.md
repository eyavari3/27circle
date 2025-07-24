# Product Requirements Document: Main Circles Page

## Feature Overview
The main `/circles` page is the central hub for authenticated users to interact with daily Circle meetups. Users can view three pre-defined time slots (11am, 2pm, 5pm) and join/leave waitlists through interactive buttons that change state based on time and user status.

## Core Requirements

### 1. Route Protection
- **Location**: `/src/app/circles/page.tsx`
- **Authentication Check**: Redirect unauthenticated users to login
- **Onboarding Check**: Redirect authenticated but non-onboarded users to their current onboarding step
- **Implementation**: Server component that validates user session and profile completion

### 2. Time Management System
- **useCurrentTime Hook**: ALL time logic must use this custom hook (never use `new Date()` directly)
- **APP_TIME_OFFSET Constant**: Defined in `/src/lib/constants.ts`
  - `null`: Real-world PST time
  - Number (e.g., 14.5): Simulated time (2:30 PM PST today)
- **Timezone**: All operations in PST (America/Los_Angeles)
- **Daily Reset**: At 8:00 PM PST, display switches to next calendar day's slots

### 3. Button State Machine
Each time slot button must follow these exact states:

#### State 1: Pre-Deadline (Before 10am/1pm/4pm)
- **Not Joined**: Blue "Join" button - clickable
- **Joined**: Gray "Can't Go" button - clickable
- **Behavior**: Toggles waitlist status on click

#### State 2: Post-Deadline, Not Joined
- **Display**: "Closed at [Time]" (e.g., "Closed at 10:00 AM")
- **Style**: Disabled, grayed out
- **Behavior**: Not clickable

#### State 3: Post-Deadline, Joined & Matched
- **Display**: "Confirmed ✓"
- **Style**: Green, enabled
- **Behavior**: Navigates to `/circles/[circleId]` on click

#### State 4: Past Event (After slot time + duration)
- **Display**: "Past"
- **Style**: Disabled, grayed out
- **Behavior**: Not clickable

### Special Case: Failed Match
- Users who joined waitlist but weren't matched show State 2 ("Closed at [Time]")

## Technical Architecture

### File Structure
```
src/
├── app/
│   └── circles/
│       ├── page.tsx          # Server component (route protection, data fetching)
│       ├── CirclesClient.tsx # Client component (UI interactions, time hook)
│       └── actions.ts        # Server Actions (join/leave waitlist)
├── components/
│   └── circles/
│       └── TimeSlotCard.tsx  # Individual slot component
├── lib/
│   ├── constants.ts          # APP_TIME_OFFSET definition
│   ├── types.ts             # Shared TypeScript types
│   └── hooks/
│       └── useCurrentTime.ts # Time management hook
```

### Data Flow
1. **Server Component** (`page.tsx`):
   - Validates authentication/onboarding
   - Fetches user's waitlist entries
   - Fetches user's circle memberships
   - Computes initial button states
   - Passes data to client component

2. **Client Component** (`CirclesClient.tsx`):
   - Uses `useCurrentTime` hook
   - Manages real-time button state updates
   - Handles user interactions
   - Calls Server Actions

3. **Server Actions** (`actions.ts`):
   - `joinWaitlist(timeSlot: Date)`: Adds user to waitlist
   - `leaveWaitlist(timeSlot: Date)`: Removes user from waitlist
   - Must handle race conditions and duplicate entries

### Type Definitions (`/src/lib/types.ts`)
```typescript
interface TimeSlot {
  time: Date;           // 11am, 2pm, or 5pm for current day
  deadline: Date;       // 10am, 1pm, or 4pm respectively
}

interface TimeSlotWithUserStatus {
  timeSlot: TimeSlot;
  isOnWaitlist: boolean;
  assignedCircleId: string | null;
  buttonState: 'join' | 'leave' | 'closed' | 'confirmed' | 'past';
  buttonText: string;
  isDisabled: boolean;
}
```

## Database Interactions

### Queries Required
1. **Get user's waitlist entries**: 
   ```sql
   SELECT * FROM waitlist_entries 
   WHERE user_id = ? AND time_slot >= [current_display_date's first slot]
   ```
   Note: `current_display_date` considers the 8 PM PST reset - after 8 PM, queries fetch next day's slots

2. **Get user's circle memberships**:
   ```sql
   SELECT cm.circle_id, c.time_slot, c.location_id, c.conversation_spark_id,
          l.name as location_name, cs.spark_text
   FROM circle_members cm
   JOIN circles c ON cm.circle_id = c.id
   LEFT JOIN locations l ON c.location_id = l.id
   LEFT JOIN conversation_sparks cs ON c.conversation_spark_id = cs.id
   WHERE cm.user_id = ? AND c.time_slot >= [current_display_date's first slot]
   ```
   Note: This query also fetches location and spark data for confirmed circles

### Mutations (via Server Actions only)
1. **Join waitlist**: INSERT into `waitlist_entries`
2. **Leave waitlist**: DELETE from `waitlist_entries`

## UI/UX Specifications

### Layout
- Clean, minimal design with three cards (one per time slot)
- Each card shows:
  - Time (e.g., "11:00 AM")
  - Location (placeholder - actual assignment happens when circles are formed at deadline)
  - Conversation spark (placeholder - actual assignment happens when circles are formed at deadline)
  - Action button with appropriate state

### Location & Spark Assignment Logic
- **Pre-deadline**: Show generic placeholder text (e.g., "Location TBD" or a random preview location)
- **Post-deadline**: 
  - If matched to a circle: Show the actual assigned location and spark from the circle
  - If not matched: Continue showing placeholder
- **Assignment timing**: Locations and sparks are assigned when the matching engine creates circles at deadline (10am/1pm/4pm), NOT randomly on page load

### Visual States
- **Join**: Blue primary button
- **Can't Go**: Gray secondary button
- **Confirmed ✓**: Green success button
- **Closed/Past**: Disabled gray button

### Loading States
- Show loading spinner during Server Action execution
- Disable button during operation to prevent double-clicks

### Optimistic Updates
- **Join action**: Immediately switch button to "Can't Go" state while Server Action processes
- **Leave action**: Immediately switch button to "Join" state while Server Action processes
- **On error**: Revert to previous state and show error message
- **Implementation**: Update local state first, then sync with server response
- **Visual feedback**: Add subtle loading indicator (e.g., spinner overlay) while maintaining new button state

### Error Handling
- Display user-friendly error messages
- Handle network failures gracefully
- Log errors for debugging

## Testing Considerations

### Time-Based Testing
Use `APP_TIME_OFFSET` to test:
- Pre-deadline states (set to 9.5 for 9:30 AM)
- Post-deadline states (set to 10.5 for 10:30 AM)
- Past event states (set to 19 for 7:00 PM)
- Daily reset behavior (set to 20.5 for 8:30 PM)

### Edge Cases to Test
1. User joins at exactly deadline time
2. Multiple rapid clicks on join/leave
3. Network failure during Server Action
4. Page refresh after joining waitlist
5. Viewing page after daily reset

## Security Considerations
- All database queries must respect RLS policies
- Validate user authentication on every request
- Prevent users from joining past/closed slots
- Rate limit Server Actions to prevent abuse

## Performance Optimizations
- Use React Server Components for initial data fetch
- Minimize client-side JavaScript bundle
- Implement optimistic UI updates for better UX
- Cache location and spark data

## Success Criteria
1. Users can successfully join/leave waitlists before deadline
2. Button states update correctly based on time
3. Matched users can navigate to their circle page
4. No security vulnerabilities or data leaks
5. Page loads quickly and responds instantly to interactions
6. Time-based logic is fully testable via APP_TIME_OFFSET

## References
- Component Pattern: `/src/components/onboarding/InterestSelection.tsx`
- Global Rules: `CLAUDE.md` (V1.3)
- Database Schema: `/src/context/database_schema.md`
- Auth Documentation: @supabase/auth-helpers-nextjs