# Timezone Debugging Journey: The Complete Chronicle

## The Core Problem

The 27 Circle app displays time slots that should show as **11:05 AM, 2:05 PM, 5:05 PM PST** consistently across all environments and user interactions. However, we're experiencing multiple interconnected issues:

1. **Wrong time display**: Shows 4:05 AM, 7:05 AM, 10:05 AM (7 hours off from target)
2. **Hydration mismatches**: Times change when refreshing page or switching tabs
3. **Environment differences**: Dev (local PST) works correctly, Production (Vercel UTC) doesn't
4. **Validation failures**: "Invalid Time slot" errors when trying to join waitlists

## Environment Analysis

### Development Environment
- **Timezone**: PST (local machine)
- **Date behavior**: `new Date(2025, 6, 21, 17, 0)` creates PST-interpreted date
- **Results**: ✅ Times display correctly as 11:05 AM, 2:05 PM, 5:05 PM
- **App Time**: ✅ Syncs with actual PST time
- **Validation**: ✅ Works properly

### Production Environment (Vercel)
From `/api/debug-timezone`:
```json
{
  "serverTime": {
    "now": "2025-07-21T04:28:49.858Z",
    "localString": "Mon Jul 21 2025 04:28:49 GMT+0000 (Coordinated Universal Time)",
    "timezoneOffset": 0,
    "timezoneName": "UTC"
  },
  "environmentVariables": {
    "TZ": ":UTC",
    "NODE_ENV": "production",
    "VERCEL": "1"
  },
  "dateConstructorTest": {
    "localDate": "2025-07-21T17:05:00.000Z",
    "utcDate": "2025-07-21T17:05:00.000Z"
  }
}
```

**Key Findings**:
- Server timezone is explicitly set to UTC (`TZ=":UTC"`)
- `new Date(year, month, date, hour, minute)` creates UTC-interpreted dates
- This causes the 7-8 hour offset when displayed in PST

## Detailed Problem Breakdown

### 1. Server-Side Rendering vs Client-Side Hydration

**The Hydration Mismatch**:
- **Server (Vercel UTC)**: `new Date(2025, 6, 21, 17, 0)` → `2025-07-21T17:00:00.000Z`
- **Client (Browser PST)**: Same constructor → Different UTC timestamp
- **React Hydration**: Detects mismatch, re-renders with client values
- **User Experience**: Times jump/change on page refresh or tab switches

### 2. Time Slot Creation Logic

Current `createTimeSlots()` function:
```typescript
const createPSTDate = (hour: number, minute: number = 0) => {
  const localDate = new Date(year, month, date, hour, minute, 0, 0);
  return localDate;
};
```

**Problem**: "Local" means different things on server vs client.

### 3. Time Display vs Storage Mismatch

**Display Logic**: Hardcoded strings in `formatSlotDisplayTime()`:
```typescript
case '11AM': return '11:05 AM';
case '2PM': return '2:05 PM';  
case '5PM': return '5:05 PM';
```

**Storage Logic**: Dynamic date creation that varies by environment.

### 4. Two-Time System Requirement

The app needs to handle two distinct time concepts:
- **App Time**: Adjustable via `NEXT_PUBLIC_APP_TIME_OFFSET` for testing (e.g., simulate 2:30 PM)
- **Real PST Time**: Fixed PST time for creating consistent time slots

## Attempted Solutions & Why They Failed

### Attempt 1: Manual UTC Offset Calculation
```typescript
const pstOffset = -8 * 60 * 60 * 1000; // PST is UTC-8
let pstTime = new Date(now.getTime() + pstOffset);
```

**Why it failed**: 
- Incorrect direction (should subtract 8 hours, not add)
- Doesn't handle PDT vs PST (UTC-7 vs UTC-8)
- Still creates hydration mismatches

### Attempt 2: UTC Date Creation with Hardcoded Offsets
```typescript
const utcDate = new Date(Date.UTC(year, month, date, hour + 7, minute, 0, 0));
```

**Why it failed**:
- Got close (12:05 PM instead of 11:05 AM) but still off by 1 hour
- Hardcoded offset doesn't account for DST transitions
- Validation logic expects local dates, not UTC

### Attempt 3: toLocaleString Approach
```typescript
const pstString = now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" });
let pstTime = new Date(pstString);
```

**Why it failed**:
- Fixed app time sync ✅
- But time slot creation still had server/client differences
- Date parsing from string is unreliable across environments

### Attempt 4: Environment Variable Override
**Plan**: Set `TZ=America/Los_Angeles` in Vercel environment variables

**Why it might fail**:
- Vercel explicitly sets `TZ=":UTC"` - may not be overridable
- Could affect other system components expecting UTC
- Unproven approach for this specific platform

### Attempt 5: Two-Time System Architecture
```typescript
// Real PST - for fixed time slots
function getRealPSTTime(): Date { /* ... */ }

// App Time - for testing simulation  
function getCurrentPSTTime(): Date { /* ... */ }
```

**Why it failed**:
- Changes were reverted (indicating implementation issues)
- Complexity increased without solving core hydration problem
- Still relied on problematic date creation methods

### Attempt 6: Client-Only Rendering
```typescript
const [isClient, setIsClient] = useState(false);
useEffect(() => setIsClient(true), []);
if (!isClient) return <TimeSlotSkeleton />;
```

**Why not pursued**:
- Eliminates SEO benefits of SSR
- Adds loading states and complexity
- Doesn't solve the underlying timezone logic

## What We Know DOESN'T Work

1. **Manual UTC offset math** - Too error-prone, doesn't handle DST
2. **toLocaleString for date creation** - Parsing issues across environments  
3. **Local Date constructor reliance** - Creates different UTC timestamps on server vs client
4. **Fighting the server timezone** - Vercel deliberately uses UTC
5. **Complex timezone libraries** - Overkill for this specific problem
6. **suppressHydrationWarning** - Hides the problem, doesn't solve it

## What We Know DOES Work

1. **toLocaleString for display** - Correctly converts any UTC time to PST display
2. **Environment variable for time offset simulation** - `NEXT_PUBLIC_APP_TIME_OFFSET` works properly
3. **Hardcoded display strings** - `formatSlotDisplayTime()` shows correct text
4. **UTC for consistency** - When done correctly, eliminates server/client differences

## The Need for External Clock Solution

### Why Internal Solutions Keep Failing

1. **Environment Dependency**: Every internal approach depends on server vs client timezone context
2. **Hydration Complexity**: React SSR/hydration adds another layer of complexity
3. **DST Handling**: Manual timezone math becomes complex with daylight saving transitions
4. **Validation Coupling**: Time creation and validation logic are tightly coupled

### External Clock Requirements

We need a solution that provides:

1. **Timezone-Agnostic Time Creation**: Creates identical UTC timestamps regardless of server timezone
2. **PST-Specific Logic**: Handles PST/PDT transitions automatically
3. **Hydration Safety**: Eliminates server/client date creation differences
4. **Testing Support**: Maintains ability to simulate different times via `NEXT_PUBLIC_APP_TIME_OFFSET`

### Three Timezone Testing Capability

The external solution must support testing in three scenarios:

1. **Before Deadline (e.g., 9 AM PST)**:
   - Time slots show "Join" buttons
   - Users can join/leave waitlists
   - App time: 9:00 AM, Slots: 11:05 AM, 2:05 PM, 5:05 PM

2. **During Event Window (e.g., 2:30 PM PST)**:
   - Past slots show "Past" state
   - Current slot shows "Confirmed" or "Cancelled"  
   - Future slots show appropriate states
   - App time: 2:30 PM, Slots: 11:05 AM (Past), 2:05 PM (Active), 5:05 PM (Future)

3. **After Hours (e.g., 9 PM PST)**:
   - All today's slots show "Past" 
   - Tomorrow's slots are created and shown
   - App time: 9:00 PM, Slots: Next day's 11:05 AM, 2:05 PM, 5:05 PM

### Potential External Solutions

1. **Timezone Library Integration**:
   - `date-fns-tz` with explicit Pacific timezone handling
   - Consistent date creation across all environments
   - Battle-tested DST handling

2. **World Clock API**:
   - External service that provides PST time
   - Eliminates all local timezone dependencies
   - Requires network dependency

3. **UTC-Based Architecture with Display Layer**:
   - Store all times as UTC
   - Convert to PST only for display
   - Requires refactoring existing validation logic

## Current Status

- **Problem**: Time slots display incorrectly and change on hydration
- **Root Cause**: Server (UTC) vs Client (PST) timezone context differences  
- **Blocker**: Need reliable timezone-agnostic date creation
- **Next Step**: Implement external clock solution with three-timezone testing capability

The journey has revealed that this is fundamentally a Next.js SSR hydration issue compounded by timezone complexity, not just a simple timezone conversion problem.