# Brief Overview for Opus

## What the App Is
A Next.js app for university students to join small group conversations ("Circles") on campus. Users can:
- Browse upcoming Circles with specific topics/times
- Join Circles and get notified of exact meeting locations
- Select interests during onboarding

## Current Problem
We're getting `permission denied for table users` errors when users try to join waitlists (which creates/updates user profiles).

## What We've Done
1. **Started with** `permission denied for table user_interests` during onboarding
2. **Realized** we're using Supabase service client (should bypass RLS entirely)
3. **Tested** service role permissions directly - they work fine
4. **Simplified** by disabling RLS on `user_interests` and using service client everywhere
5. **Now facing** same permission error but for `users` table during profile creation

## Current Status
The `users` table operations (in `ensureUserProfile` and `joinWaitlist`) need the same "service client everywhere" treatment we applied to `user_interests`.

## Next Steps
Apply service client to all `users` table operations, potentially disable RLS on `users` table, test profile creation flow. 