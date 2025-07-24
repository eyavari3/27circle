# PRP: Critical Authentication & Onboarding Flow Fixes

## Executive Summary

Fix three critical production issues preventing core user flows from working properly. These issues block the fundamental authentication and onboarding process, making the app essentially non-functional for new users. The fixes must be implemented as a cohesive batch to restore the complete user journey from splash screen through profile creation.

## Problem Statement

Testing revealed three critical issues that break the core authentication and onboarding flow:

### Issue 1: Splash Screen Bypass in Production
**Problem**: Despite removing the auth guard, production still redirects directly to the auth page instead of showing the splash screen first.
**Impact**: Users never see the intended first impression and brand introduction.
**Expected**: User lands on `/` splash screen, sees branding, then proceeds to curiosity questions.
**Actual**: Direct redirect to `/auth` page, bypassing splash and curiosity flow.

### Issue 2: Google OAuth Infinite Loop
**Problem**: After successful Google login, users are redirected back to the splash screen instead of profile creation, creating an endless loop.
**Impact**: Google OAuth users cannot complete signup or access the app.
**Expected**: Google OAuth → Profile creation page → Circles page
**Actual**: Google OAuth → Splash screen → Auth page → Google OAuth (infinite loop)

### Issue 3: Profile Save Permission Denied
**Problem**: Phone auth works for login, but profile saving fails with 401 error "permission denied for table user_data" (PostgreSQL error code: 42501).
**Impact**: Phone auth users can authenticate but cannot complete onboarding.
**Expected**: Phone auth → Profile page → Save successfully → Circles page
**Actual**: Phone auth → Profile page → Save fails with database permission error

## Root Cause Analysis

### Issue 1: Routing Logic Conflict
The production environment has different routing behavior than development. Likely causes:
- Server-side auth check happening before client-side routing
- Middleware intercepting requests to `/` and forcing auth redirect
- Auth state checking logic running before splash screen can render

### Issue 2: Auth Callback Routing Error
Google OAuth callback is not properly handling the post-authentication flow:
- Callback handler may be missing or incorrect
- Post-OAuth redirect logic sending users to wrong route
- Auth state not being properly established after OAuth completion

### Issue 3: Database Client Permission Mismatch
The profile save operation is using the wrong database client:
- User-scoped operations using service client (or vice versa)
- Missing auth context in database queries
- RLS or permission settings blocking user table operations

## Technical Requirements

### 1. Fix Splash Screen Routing
**Goal**: Ensure splash screen displays first in all environments

**Requirements**:
- Verify no middleware is intercepting `/` route
- Check auth protection logic is not running before splash renders
- Ensure server/client routing consistency
- Test that splash screen auto-progresses or responds to user action

**Success Criteria**:
- `/` route shows splash screen in production
- Splash screen displays for intended duration
- User can proceed to curiosity questions from splash

### 2. Fix Google OAuth Flow
**Goal**: Complete Google OAuth flow leads to profile creation

**Requirements**:
- Verify OAuth callback handler at `/auth/callback` works correctly
- Ensure post-OAuth redirect goes to profile completion page
- Check that auth state is properly established after OAuth
- Verify Google user profile data is accessible for profile creation

**Success Criteria**:
- Google OAuth completes without infinite loops
- User redirected to `/onboarding/profile` after OAuth success
- Auth state properly established for subsequent operations
- Profile creation form pre-populated with Google data where appropriate

### 3. Fix Profile Save Permissions
**Goal**: Profile data saves successfully for all auth methods

**Requirements**:
- Identify which database client should be used for profile operations
- Verify auth context is properly passed to database queries
- Check that user table permissions allow authenticated user operations
- Ensure consistent client usage across all profile-related operations

**Success Criteria**:
- Profile saves successfully after phone auth
- Profile saves successfully after Google OAuth
- No 401/403 permission errors during profile operations
- User redirected to circles page after successful profile save

## Implementation Approach

### Phase 1: Diagnostic Analysis
1. **Routing Investigation**:
   - Check all middleware files for auth redirects
   - Verify route protection logic in layout/page components
   - Test routing behavior in production environment

2. **OAuth Flow Tracing**:
   - Verify OAuth callback endpoint configuration
   - Check redirect URLs in Supabase OAuth settings
   - Trace auth state changes through OAuth flow

3. **Database Permission Audit**:
   - Review all profile-related database queries
   - Identify which client (`createClient()` vs `createServiceClient()`) is being used
   - Check auth context availability in profile operations

### Phase 2: Targeted Fixes
1. **Splash Screen Fix**:
   - Remove or modify auth checks that bypass splash screen
   - Ensure `/` route renders splash component first
   - Test that curiosity flow proceeds correctly

2. **OAuth Flow Fix**:
   - Fix callback handler redirect logic
   - Ensure proper auth state establishment
   - Test complete Google OAuth → Profile → Circles flow

3. **Profile Save Fix**:
   - Use correct database client for profile operations
   - Ensure auth context is available for user table queries
   - Test profile saving for both auth methods

### Phase 3: Integration Testing
1. **Complete Flow Testing**:
   - Test full journey: Splash → Curiosity → Auth → Profile → Circles
   - Verify both phone and Google OAuth paths work end-to-end
   - Test in production environment to catch deployment-specific issues

2. **Error Handling**:
   - Ensure proper error messages for auth failures
   - Graceful fallbacks for network/database errors
   - User-friendly error states with recovery options

## Edge Cases & Considerations

### Authentication State Management
- Handle partially authenticated users (logged in but no profile)
- Manage session persistence across page refreshes
- Handle auth token expiration during profile creation

### User Experience
- Loading states during auth operations
- Clear error messages for each failure type
- Consistent navigation between auth methods

### Data Consistency
- Handle profile updates vs. initial creation
- Manage partial profile data from different auth sources
- Ensure atomic profile creation operations

## Success Metrics

### Functional Metrics
- 100% of users see splash screen on first visit
- 0% infinite loop rate for Google OAuth users
- 100% profile save success rate for authenticated users

### User Journey Metrics
- Complete onboarding flow completion rate
- Time to complete full signup process
- Error rate by authentication method

### Technical Metrics
- Database query success rates for profile operations
- Auth callback success rates
- Routing accuracy in production environment

## Testing Strategy

### Development Testing
- Test with `NEXT_PUBLIC_APP_TIME_OFFSET` for various scenarios
- Use both phone and Google auth methods
- Test with cleared browser state to simulate new users

### Production Testing
- Deploy to staging environment first
- Test with real phone numbers and Google accounts
- Verify database operations work with production credentials

### Regression Testing
- Ensure existing authenticated users are not affected
- Verify time-based features still work correctly
- Check that other app functionality remains intact

## Dependencies & Constraints

### Technical Dependencies
- Supabase Auth configuration
- Twilio SMS service for phone auth
- Google OAuth configuration
- Database schema and permissions

### Implementation Constraints
- Must maintain backward compatibility with existing users
- Cannot break current circle functionality
- Must work across different deployment environments

### Business Constraints
- Fixes must be completed as a batch to restore full functionality
- Cannot compromise user data or security
- Must maintain privacy and security standards

## Risk Assessment

### High Risk
- **Auth state corruption**: Incorrect fixes could break authentication for all users
- **Data loss**: Database permission changes could affect existing user data

### Medium Risk
- **Deployment differences**: Production environment behavior differs from development
- **Session conflicts**: Auth state conflicts between different login methods

### Low Risk
- **UI inconsistencies**: Minor display issues during auth flow
- **Performance impact**: Minimal impact expected from routing fixes

## Definition of Done

### Functional Requirements
- [ ] Splash screen displays first in production environment
- [ ] Google OAuth completes without infinite loops
- [ ] Profile saving works for both auth methods
- [ ] Complete user journey from splash to circles works end-to-end

### Technical Requirements
- [ ] All database permission errors resolved
- [ ] Auth callback routing fixed and tested
- [ ] Production routing behavior matches development

### Quality Requirements
- [ ] All existing functionality remains intact
- [ ] No new security vulnerabilities introduced
- [ ] Performance maintained across all auth flows

### Documentation Requirements
- [ ] Root causes documented for future reference
- [ ] Testing procedures updated to catch similar issues
- [ ] Deployment checklist updated with auth flow verification

## Priority Justification

This is a **P0 Critical** fix because:
1. **App is non-functional**: New users cannot complete signup
2. **Multiple auth methods broken**: Both phone and Google OAuth affected
3. **Production-specific issues**: Problems only surface in production environment
4. **User experience blocked**: Core onboarding flow completely broken

These issues must be resolved immediately to restore basic app functionality and allow new user acquisition.