# PRP: Fix Core Authentication & Onboarding Flow

## OBSERVED ISSUES (Batch 1)

### Issue 1: Splash Screen Bypass 🚨
**Problem**: Despite removing auth guard, still redirects directly to auth page
**Impact**: Users skip intended splash → curiosity flow
**Root Cause**: Likely additional redirect logic in page.tsx or auth components

### Issue 2: Google OAuth Infinite Loop 🚨  
**Problem**: After Google login, redirects back to splash screen instead of profile creation
**Impact**: Google users cannot complete signup
**Root Cause**: OAuth callback logic sending users to wrong route

### Issue 3: Profile Save Permission Denied 🚨
**Problem**: Phone auth works but profile saving fails with 401 error on user_data table
**Impact**: Users cannot complete onboarding after phone auth
**Error**: `permission denied for table user_data` (code: 42501)

## TECHNICAL ANALYSIS

### Issue 1 Root Causes:
- `src/app/page.tsx` has production mode logic that bypasses TransitionContainer
- Auth redirect happening before splash screen can render
- Missing environment variable causing wrong mode detection

### Issue 2 Root Causes:  
- Google OAuth callback route (`/auth/callback`) redirecting to wrong destination
- Auth state not properly setting "onboarding complete" flag
- Session management confusion between auth success and profile completion

### Issue 3 Root Causes:
- Database client using wrong permissions for user_data table
- RLS policies blocking writes to user_data table
- Service client vs regular client confusion for profile operations

## FIX STRATEGY (Deploy Together)

### Fix 1: Force Splash Screen in Production
**File**: `src/app/page.tsx`
**Action**: Modify production logic to show splash screen first, defer auth until after curiosity selection

### Fix 2: Fix Google OAuth Redirect Logic  
**File**: `src/app/auth/callback/route.ts`
**Action**: Ensure successful Google auth redirects to profile completion, not splash

### Fix 3: Fix Profile Save Permissions
**File**: Profile saving logic + database client usage
**Action**: Use correct database client (service vs regular) for user_data operations

## IMPLEMENTATION PLAN

### Step 1: Page Flow Logic (Fix 1)
```typescript
// Modify src/app/page.tsx to always show splash first
export default async function Home() {
  // Always show splash screen first, regardless of environment
  return <TransitionContainer />;
}
```

### Step 2: OAuth Callback Fix (Fix 2)  
```typescript
// Fix src/app/auth/callback/route.ts
// Ensure redirect goes to /onboarding/profile after successful auth
```

### Step 3: Database Client Fix (Fix 3)
```typescript
// Use serviceClient for user_data operations
const serviceSupabase = await createServiceClient();
// Fix permission issues in profile saving
```

## TESTING VALIDATION

### Success Criteria:
1. ✅ Opening app shows splash screen first (not auth page)
2. ✅ Google OAuth completes and goes to profile creation  
3. ✅ Phone auth profile saving works without permission errors
4. ✅ Both auth methods result in completed user profiles in Supabase

### Test Sequence:
1. **Fresh browser**: Should see splash → curiosity → auth choice
2. **Google OAuth**: Should go splash → curiosity → Google auth → profile creation → circles
3. **Phone Auth**: Should go splash → curiosity → phone auth → profile creation → circles  
4. **Database Check**: Both users should appear in users table with complete profiles

## DEPLOYMENT STRATEGY

**Files to modify:**
- `src/app/page.tsx` (splash screen logic)
- `src/app/auth/callback/route.ts` (OAuth redirect)
- Profile saving logic (permission fix)

**Single deployment** with all 3 fixes for immediate comprehensive testing.

## ROLLBACK PLAN

If any fix breaks existing functionality:
- Revert page.tsx changes (restore original auth redirect)
- Revert OAuth callback changes  
- Revert database client changes
- Deploy rollback immediately

---

**Next Action**: Implement all 3 fixes, deploy together, test complete auth flows end-to-end.