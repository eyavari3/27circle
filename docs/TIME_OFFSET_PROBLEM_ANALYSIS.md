# Time Offset Problem Analysis & Solution Attempts

## Problem Statement

**Core Issue**: The 27 Circle app needs a way to test different time scenarios (11 AM, 2 PM, 5 PM PST slots) without rebuilding or redeploying the application. Currently, changing the time offset requires code changes and rebuilds, creating friction in the testing workflow.

**Current State**: 
- Time offset is hardcoded as `APP_TIME_OFFSET: number | null = null` in `/src/lib/constants.ts`
- Changing this value requires code modification → commit → rebuild → deploy cycle
- This creates 5-10 minute delays for testing different time scenarios
- The app has complex time-dependent UI states that need rapid testing

## Technical Requirements

1. **Runtime Configuration**: Change time offset without code changes or rebuilds
2. **Server-Client Consistency**: Both server-side rendering and client-side JavaScript must use identical time
3. **Synchronous Access**: Time functions are called in React renders and must remain synchronous
4. **Performance**: Time calculations happen frequently and cannot involve database calls in hot paths
5. **Fallback Safety**: Must gracefully handle configuration failures and default to real time
6. **Testing Scenarios**: Need to simulate different times to test:
   - Pre-deadline state (before 10 AM, 1 PM, 4 PM)
   - Post-deadline/pre-event state (10-11 AM, 1-2 PM, 4-5 PM)
   - Post-event/feedback state (after 11:20 AM, 2:20 PM, 5:20 PM)

## Architecture Constraints

### Current Time System Architecture
- **Central Function**: `getCurrentPSTTime()` in `/src/lib/time.ts` - single source of truth
- **Usage Pattern**: Called synchronously in 27+ files across components, API routes, and utilities
- **Hook Integration**: `useCurrentTime.ts` provides real-time updates for UI components
- **Critical Functions**: 
  - `createTimeSlots()` - generates daily 11 AM, 2 PM, 5 PM slots
  - `getSlotState()` - determines UI state (join/leave/confirmed/feedback/past)
  - `getCurrentFeedbackWindow()` - feedback timing logic

### Constraints That Cannot Be Changed
1. **Synchronous Requirement**: All time functions must remain synchronous (no async/await)
2. **Function Signatures**: 27+ dependent files expect current function signatures
3. **Server-Side Rendering**: Time calculations happen during SSR and must be consistent
4. **Hydration Matching**: Server and client must render identical time-dependent content

## Solution Attempts & Results

### Attempt 1: Environment Variables (IMPLEMENTED BUT LIMITED)

**Approach**: Replace hardcoded constant with `process.env.NEXT_PUBLIC_APP_TIME_OFFSET`

**Implementation**:
```typescript
// /src/lib/constants.ts
export function getAppTimeOffset(): number | null {
  const offset = process.env.NEXT_PUBLIC_APP_TIME_OFFSET;
  if (!offset) return null;
  if (offset === 'null') return null;
  
  const parsed = parseFloat(offset);
  return isNaN(parsed) ? null : parsed;
}
```

**Status**: ✅ **IMPLEMENTED** - Currently working in codebase

**Limitations**:
- **Container Restart Required**: Changing environment variables requires 30-second container restart
- **Deployment Friction**: Must update hosting platform environment variables
- **Not Truly Runtime**: Values are still set at application startup, not during execution
- **Limited Flexibility**: Cannot quickly test multiple scenarios in succession

**Benefits**:
- ✅ No code changes required for time offset updates
- ✅ Maintains all synchronous function signatures
- ✅ Zero performance impact
- ✅ Works identically in development and production
- ✅ Significant improvement over hardcoded values (30s vs 5min)

### Attempt 2: Supabase Runtime Configuration (DESIGNED BUT NOT IMPLEMENTED)

**Approach**: Store time offset in Supabase table, fetch at application entry points, cache for synchronous access

**Design**:
```sql
CREATE TABLE app_config (
  key text PRIMARY KEY,
  value text,
  updated_at timestamptz DEFAULT now()
);
INSERT INTO app_config (key, value) VALUES ('time_offset', 'null');
```

```typescript
// Cached eventual consistency pattern
let cache: { value: number | null; timestamp: number } | null = null;
const CACHE_TTL = 30000; // 30 seconds

export function getTimeOffsetSync(): number | null {
  return cache?.value ?? null;
}

export async function refreshTimeOffsetCache(): Promise<void> {
  // Fetch from Supabase, update cache
}
```

**Status**: ❌ **NOT IMPLEMENTED**

**Why This Was Abandoned**:
- **Async/Sync Mismatch**: Database calls are async, time functions must be sync
- **Race Conditions**: Cache might not be populated when time functions are first called
- **Serverless Complexity**: Cache invalidation across multiple function instances
- **Hydration Risk**: Server and client could have different cached values during initial render
- **Over-Engineering**: Added significant complexity for marginal benefit over environment variables

### Attempt 3: Background Fetch with Local Cache (CONSIDERED BUT REJECTED)

**Approach**: Background timer fetches config updates, stores in memory/localStorage

**Rejection Reasons**:
- **Server-Side Rendering**: Background timers don't work in SSR context
- **Memory Leaks**: Timers in serverless functions cause issues
- **Startup Race**: Functions called before background fetch completes
- **Client-Server Desync**: Different update frequencies on server vs client

### Attempt 4: Real-Time WebSocket Updates (CONSIDERED BUT REJECTED)

**Approach**: WebSocket connection for instant time offset updates

**Rejection Reasons**:
- **Massive Over-Engineering**: WebSocket infrastructure for a simple config value
- **Complexity**: Connection management, reconnection logic, error handling
- **Serverless Incompatible**: WebSockets don't work well with serverless functions
- **Performance Overhead**: Constant connection for infrequent updates

## Current Production Issues

### Issue 1: 7-Hour Time Display Bug
**Problem**: Time slots showing as 4:05 AM, 7:05 AM, 10:05 AM instead of 11:05 AM, 2:05 PM, 5:05 PM

**Root Cause Identified**: Double application of time offset in `useCurrentTime.ts`
- `getCurrentPSTTime()` applies offset correctly
- `useCurrentTime.ts` re-applies the same offset, causing 7-hour shift

**Fix Required**: Remove duplicate offset application in `useCurrentTime.ts` lines 59-65

### Issue 2: Server-Client Hydration Mismatches
**Problem**: Server and client calculate different times, causing hydration errors

**Root Cause**: Time offset conflated with PST timezone conversion

**Proposed Solution**: Separate Real PST Time from App Time
```typescript
// Real PST - never adjustable, for slot creation
export function getRealPSTTime(): Date {
  const now = new Date();
  return new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
}

// App Time - adjustable for testing, for UI state
export function getCurrentPSTTime(): Date {
  const realPST = getRealPSTTime();
  const timeOffset = getAppTimeOffset();
  if (timeOffset !== null) {
    realPST.setHours(Math.floor(timeOffset));
    realPST.setMinutes((timeOffset % 1) * 60);
  }
  return realPST;
}
```

## What We Know Doesn't Work

### ❌ Async Database Calls in Time Functions
- Cannot make `getCurrentPSTTime()` async without breaking 27+ dependent files
- React renders cannot await database calls
- Synchronous time access is a hard requirement

### ❌ Client-Side Only Solutions
- Server-side rendering requires time calculations before client JavaScript loads
- Must work identically on server and client for hydration
- Browser-only solutions fail during SSR

### ❌ Complex Caching Strategies
- Serverless functions don't maintain persistent memory between invocations
- Cache invalidation across multiple instances is unreliable
- Adds complexity without solving core synchronous access requirement

### ❌ Real-Time Update Mechanisms
- WebSockets, polling, or push notifications are over-engineered for this use case
- Testing scenarios don't require real-time updates, just page-refresh updates
- Added infrastructure complexity not justified by benefits

## Required External Clock Solution

### The Need for External Time Control

The fundamental issue is that **all attempted solutions still require some form of deployment or restart** to change time values. For effective testing of time-dependent features, we need:

1. **Instant Updates**: Change time offset and see results immediately
2. **Multiple Scenarios**: Rapidly test different time states without delays
3. **External Control**: Modify time settings outside the application deployment cycle

### Proposed External Clock Architecture

**Option 1: Admin Dashboard**
- Separate admin interface (could be Supabase dashboard, custom admin panel, or simple API)
- Update time offset value in external configuration
- Application polls/fetches on page load for updated values
- Acceptable: 1-2 page refreshes for changes to take effect

**Option 2: Development-Only Browser Extension**
- Browser extension that intercepts time function calls
- Overrides `getCurrentPSTTime()` return values in development
- No production impact, purely development testing tool
- Instant updates without any server changes

**Option 3: URL Parameter Override (Development Only)**
- Check for `?time_offset=14.5` in URL parameters
- Override environment variable if URL parameter present
- Development/staging only feature for rapid testing
- Zero deployment changes needed

### Recommended Approach: Hybrid Solution

**Production**: Environment variables (current implementation)
- Stable, reliable, good for production time testing
- 30-second restart cycle acceptable for production testing

**Development**: URL Parameter Override
```typescript
export function getAppTimeOffset(): number | null {
  // Development: Check URL params first
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const urlOffset = urlParams.get('time_offset');
    if (urlOffset) {
      return urlOffset === 'null' ? null : parseFloat(urlOffset) || null;
    }
  }
  
  // Fallback to environment variable
  const offset = process.env.NEXT_PUBLIC_APP_TIME_OFFSET;
  if (!offset) return null;
  if (offset === 'null') return null;
  
  const parsed = parseFloat(offset);
  return isNaN(parsed) ? null : parsed;
}
```

**Benefits**:
- **Development**: Instant testing via URL: `localhost:3000?time_offset=14.5`
- **Production**: Stable environment variable approach
- **Zero Risk**: URL params only work in development
- **No Infrastructure**: Uses existing URL parsing, no external dependencies

## Next Steps

1. **Fix Immediate Bug**: Remove double offset application in `useCurrentTime.ts`
2. **Implement Real PST Separation**: Create `getRealPSTTime()` for slot creation
3. **Add URL Parameter Override**: Enable instant development testing
4. **Test All Time Scenarios**: Verify 11 AM, 2 PM, 5 PM states work correctly
5. **Document Testing Workflow**: Create guide for rapid time scenario testing

## Testing Scenarios Needed

### Pre-Deadline Testing (Before 10 AM, 1 PM, 4 PM)
- URL: `localhost:3000?time_offset=9.5` (9:30 AM)
- Expected: "Join" buttons active, deadline countdown visible

### Post-Deadline Testing (10-11 AM, 1-2 PM, 4-5 PM)  
- URL: `localhost:3000?time_offset=10.5` (10:30 AM)
- Expected: "Confirmed ✓" or "Past" based on assignment

### Feedback Window Testing (After 11:20 AM, 2:20 PM, 5:20 PM)
- URL: `localhost:3000?time_offset=11.5` (11:30 AM)
- Expected: "Feedback >" button for assigned users

This external clock capability will enable rapid testing of all time-dependent features without deployment friction.