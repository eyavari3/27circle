1. Time Zone Hell
typescript// ❌ WRONG - mixing time zones
const now = new Date() // User's local time
const slot = TIME_SLOTS[0] // PST time

// ✅ RIGHT - always use PST
const now = useAppTime() // Forces PST
Watch for: Any new Date() not wrapped in your PST converter
2. Real-time Count Race Conditions
typescript// ❌ WRONG - stale counts
const { count } = await getEventCount()
await joinEvent() // Count is now wrong!

// ✅ RIGHT - use Supabase real-time
const { count } = useRealtimeCount(eventId)
Watch for: Manual count refreshes instead of subscriptions
3. Auth State Desync
typescript// ❌ WRONG - checking auth in server component only
export default async function Page() {
  const user = await getUser() // Stale on client navigation

// ✅ RIGHT - use client-side auth state
const { user } = useAuth() // Always current
Watch for: Server/client auth mismatches on navigation
4. Phone Number Format Chaos
typescript// ❌ WRONG - inconsistent formats
"+1 (650) 555-1234" vs "6505551234" vs "+16505551234"

// ✅ RIGHT - normalize everything
const normalized = phone.replace(/\D/g, '')
Watch for: Different formats in auth vs profile vs display
5. Event Join Window Logic
typescript// ❌ WRONG - checking time on button click
onClick={() => {
  if (isJoinable) joinEvent() // Time might have passed!
}

// ✅ RIGHT - server validates time
joinEvent() // Server checks current time
Watch for: Client-side time validation without server checks
6. Navigation State Loss
typescript// ❌ WRONG - losing form data on navigation
router.push('/next-page') // Form data gone!

// ✅ RIGHT - save state first
await saveProfile(data)
router.push('/next-page')
Watch for: Multi-step onboarding losing data between pages
7. SMS Rate Limiting
typescript// ❌ WRONG - no rate limiting
await sendSMS(phone) // User spams button

// ✅ RIGHT - track attempts
const canSend = await checkSMSRateLimit(phone)
Watch for: Missing rate limits on SMS/verification
8. Feedback Survey Duplicates
typescript// ❌ WRONG - allowing multiple submissions
await submitFeedback(eventId, data) // User submits twice

// ✅ RIGHT - check existing feedback
const existing = await getFeedback(userId, eventId)
if (existing) redirect('/home')
9. Button State Timing
typescript// Early (before window): "Join at 12:00 PM"
// During (in window): "Join event"  
// Late (after window): "Event ended"
// Joined: "Leave event"
Watch for: Not handling all 4 states properly
10. Supabase Client Mixing
typescript// ❌ WRONG - using server client in browser
import { createClient } from '@/lib/supabase/server'

// ✅ RIGHT - match environment
// Client components: '@/lib/supabase/client'
// Server components: '@/lib/supabase/server'
🎯 Pro Tips to Avoid These

Create a test harness early:
typescript// Easy time testing
APP_TIME_OFFSET = 3600000 // Jump 1 hour forward

Log everything during dev:
typescriptconsole.log('[JOIN]', { userId, eventId, time: now.toISOString() })

Test edge cases first:

Join at 11:59:59 AM
Multiple users joining simultaneously
Refresh page mid-action
Navigate back during verification


Use TypeScript strictly:
typescripttype TimeSlot = 'morning' | 'noon' | 'evening'
// Not string!