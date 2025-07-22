# localStorage Migration Debug Log

## Overview
This document tracks the debugging journey for migrating from localStorage to Supabase storage for perfect dev/prod parity. The migration involved replacing all localStorage usage with a custom Storage utility backed by Supabase.

## What Was Changed

### 1. Database Schema Created
- Created `user_data` table in Supabase with JSONB storage
- Schema includes: `id`, `user_id`, `key`, `value`, `created_at`, `updated_at`
- Added unique constraint on `(user_id, key)`
- Added performance indexes for lookups

### 2. Enhanced Storage Utility Built (`/src/lib/storage.ts`)
- localStorage-like API with async methods: `get()`, `set()`, `remove()`, `clear()`
- In-memory caching with 5-minute TTL for performance
- Optimistic updates with database sync
- Session-based anonymous user support via `anonUserId` in sessionStorage
- Migration utilities for gradual transition from localStorage
- Error handling and fallback mechanisms

### 3. Core Files Migrated

#### `/src/lib/feedback-keys.ts`
- **Changed:** All functions converted from sync to async
- `getFeedbackRecord()` → `async getFeedbackRecord()`
- `saveFeedbackRecord()` → `async saveFeedbackRecord()`
- `migrateLegacyFeedbackKey()` → `async migrateLegacyFeedbackKey()`
- **Replaced:** All `localStorage.getItem/setItem` with `Storage.get/set`

#### `/src/app/circles/CirclesClient.tsx`
- **Added:** `feedbackStatus` state for async feedback loading
- **Added:** `useEffect` to load feedback status asynchronously
- **Changed:** Button state computation to use loaded feedback status
- **Updated:** Dependency arrays to include `feedbackStatus`

#### `/src/lib/onboarding-state.ts`
- **Changed:** All functions converted from sync to async
- `getOnboardingState()` → `async getOnboardingState()`
- `saveOnboardingState()` → `async saveOnboardingState()`
- `clearOnboardingState()` → `async clearOnboardingState()`
- Plus all related helper functions

#### `/src/app/onboarding/profile/page.tsx`
- **Updated:** `useEffect` to handle async onboarding state loading
- **Changed:** Form submission to use async storage operations
- **Added:** Proper error handling for storage failures

#### `/src/components/onboarding/InterestSelection.tsx`
- **Updated:** Preference loading to use async Storage utility
- **Changed:** Both onboarding flow and regular flow to use Storage
- **Added:** Proper null checking for TypeScript compliance

#### `/src/app/settings/preferences/PreferencesClient.tsx`
- **Updated:** `useEffect` to load preferences asynchronously
- **Changed:** Save operation to use Storage utility
- **Maintained:** Database save as primary, Storage as secondary

#### `/src/app/settings/account/AccountClient.tsx`
- **Updated:** Account data loading to use async Storage
- **Changed:** Save and delete operations to use Storage utility
- **Added:** Proper async/await patterns

#### `/src/lib/hooks/useFeedbackCheck.ts`
- **Restructured:** Dev waitlist checking to use async Storage
- **Added:** Async function wrapper within useEffect
- **Updated:** Feedback record checking to use async getFeedbackRecord

## Debugging Timeline

### Issue 1: Table Doesn't Exist (42P01)
**Error:** `relation "public.user_data" does not exist`
**Cause:** User hadn't run the SQL schema yet
**Solution:** Provided SQL schema to create user_data table

### Issue 2: Permission Denied (42501) 
**Error:** `permission denied for table user_data`
**Cause:** Row Level Security (RLS) permissions not properly configured
**Attempted Solutions:**
- Disabled RLS with `ALTER TABLE user_data DISABLE ROW LEVEL SECURITY;`
- Granted permissions to anon/authenticated roles
- Provided comprehensive SQL fix with DROP/CREATE

### Issue 3: Build Failures (TypeScript Errors)
**Errors:** Multiple TypeScript compilation errors during migration
**Issues Found:**
- Extra closing brace in `useFeedbackCheck.ts`
- Null spread operator issues in array spreads
- Missing null checks for potentially null values

**Fixed:**
- Syntax error in `useFeedbackCheck.ts` (extra `}`)
- Added null coalescing in `onboarding/profile/page.tsx`: `...(existingSaved || [])`
- Added null checks in `InterestSelection.tsx`: `preferences && preferences.length > 0`

### Issue 4: Current Problem - Not Acceptable (406)
**Error:** `GET https://szttdwmpwqvabtwbhzal.supabase.co/rest/v1/user_data?select=value&user_id=eq.anon-1753120192611-h9vffq9z8&key=eq.dev-user-preferences 406 (Not Acceptable)`

**Context:**
- Previous errors (404, 401) were resolved
- App builds successfully (`npm run build` passes)
- Development server starts without issues
- Storage utility is being called correctly
- Database table exists (confirmed by resolution of 404 error)
- Permissions appear to be working (no more 401 errors)

**Current Status:**
- HTTP 406 indicates the request is valid but the server cannot produce a response in the format requested by the client
- This is a new error type we haven't seen before in this debugging session
- The request structure looks correct: `/rest/v1/user_data?select=value&user_id=eq.[id]&key=eq.[key]`
- Anonymous user ID is being generated properly: `anon-1753120192611-h9vffq9z8`

## Technical Implementation Details

### Storage Utility Architecture
```typescript
// User ID generation for anonymous users
function getUserId(): string {
  let sessionId = sessionStorage.getItem('anonUserId');
  if (!sessionId) {
    sessionId = `anon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('anonUserId', sessionId);
  }
  return sessionId;
}

// Caching system
const cache = new Map<string, { value: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
```

### Database Schema Used
```sql
CREATE TABLE user_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, key)
);
```

## Migration Scope
- ✅ **Feedback System:** Async feedback loading and storage
- ✅ **User Preferences:** Onboarding and settings preferences
- ✅ **Onboarding State:** Full async conversion
- ✅ **Account Data:** Settings page storage
- ✅ **Waitlist Data:** Feedback checking hook
- ✅ **Build Process:** All TypeScript errors resolved
- ✅ **Loading States:** Proper async handling throughout

## Current State
- Code compilation: ✅ Working
- Database table: ✅ Created  
- Permissions: ✅ Configured (based on error progression)
- Storage utility: ✅ Implemented
- Migration: ✅ Complete (from code perspective)
- **Runtime Issue:** ❌ HTTP 406 error on Supabase API calls

The migration is architecturally complete but experiencing a runtime API communication issue that needs investigation.