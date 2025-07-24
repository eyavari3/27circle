# 27 Circle Testing Guide

Complete guide for testing 38 users and the matching algorithm to ensure bulletproof functionality.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up test database
psql -d your_supabase_db -f scripts/seed-test-users.sql

# 3. Run automated tests
node scripts/run-all-tests.js

# 4. Get manual testing checklist
node scripts/run-all-tests.js --manual
```

## Test Files Overview

### 1. `scripts/seed-test-users.sql`
- Creates 38 diverse test users in auth.users and public.users
- Includes varied gender distribution (male/female/non-binary)
- Diverse interest combinations for testing matching algorithm
- Age range: 18-22 (typical college students)

### 2. `scripts/test-waitlist-signup.js`
- Tests different user distribution scenarios
- Validates waitlist signup process
- Tests edge cases (uneven distribution, minimum users, etc.)
- Simulates matching algorithm execution

### 3. `scripts/test-matching-algorithm.js`
- Comprehensive matching algorithm testing
- Tests group sizes (4, 3, 2 person groups)
- Validates gender balance in groups
- Tests interest-based matching
- Edge case handling (odd numbers, single users)

### 4. `scripts/run-all-tests.js`
- Complete test suite runner
- Combines all test scenarios
- Performance testing
- User flow validation
- Manual testing instructions

## Test Scenarios

### A. Distribution Tests
1. **Equal Distribution**: 12 users each slot (36 total)
2. **Uneven Distribution**: 5, 25, 8 users per slot
3. **Minimum Viable**: 2 users per slot (6 total)
4. **Edge Case**: 37 users (tests uneven matching)

### B. Matching Algorithm Tests
1. **Perfect Groups**: 16 users → 4 groups of 4
2. **Mixed Sizes**: 14 users → 2 groups of 4, 2 groups of 3
3. **Some Pairs**: 10 users → 1 group of 4, 2 groups of 3
4. **Single Leftover**: 13 users → 3 groups of 4, 1 unmatched

### C. Interest Matching Tests
- Deep Thinking + New Activities (10 users)
- Spiritual Growth + Community Service (10 users) 
- All Four Interests (10 users)
- Single Interest Only (8 users)

### D. Gender Balance Tests
- Even male/female distribution
- Minority gender representation
- Non-binary inclusion
- Group diversity optimization

## Time-Based Testing

Use `APP_TIME_OFFSET` in `/src/lib/constants.ts` to simulate different times:

```javascript
// Test different scenarios
export const APP_TIME_OFFSET = 9;    // 9AM - Pre-deadline
export const APP_TIME_OFFSET = 10.5; // 10:30AM - Pre-deadline
export const APP_TIME_OFFSET = 11.5; // 11:30AM - Post-deadline
export const APP_TIME_OFFSET = 14.5; // 2:30PM - Between slots
export const APP_TIME_OFFSET = 21;   // 9PM - End of day
```

## Expected Behaviors

### Button States
- **Before Deadline**: "Join" → "Can't Go" (toggleable)
- **After Deadline, Matched**: "Confirmed ✓" (clickable)
- **After Deadline, Unmatched**: "Closed at [time]" (disabled)
- **After Event Time**: "Past" (disabled)

### Group Formation Rules
1. **Preferred Size**: 4 people per group
2. **Minimum Size**: 2 people per group
3. **Single Users**: Don't get matched (shown as unmatched)
4. **Gender Balance**: Attempt to balance when possible
5. **Interest Matching**: Consider shared interests in grouping

## Performance Benchmarks

### Expected Performance
- **Waitlist Join**: < 200ms response time
- **Matching Algorithm**: < 1000ms for 100 users
- **Page Load**: < 2000ms initial load
- **Button Transitions**: Instant (no loading states)

### Stress Testing
- 38 concurrent waitlist joins
- 100+ user matching algorithm
- Rapid join/leave cycles
- Database connection failures

## Manual Testing Checklist

### 1. User Onboarding Flow
- [ ] Welcome screen loads correctly
- [ ] Curiosity 1 selection works
- [ ] Curiosity 2 selection works
- [ ] Profile form validation
- [ ] All navigation flows work
- [ ] Back button functions correctly

### 2. Circles Page Testing
- [ ] Time slots display correctly
- [ ] Join/leave buttons work
- [ ] State persists on refresh
- [ ] Time-based state changes work
- [ ] Confirmed navigation works

### 3. Responsive Design
- [ ] iPhone SE (375px width)
- [ ] iPhone 12 (390px width)
- [ ] iPad (768px width)
- [ ] Desktop (1200px+ width)

### 4. Edge Cases
- [ ] Single user in waitlist
- [ ] All users in one slot
- [ ] Last-minute departures
- [ ] Network failures
- [ ] Browser refresh during actions

## Common Issues & Solutions

### Issue: Users not getting matched
**Solution**: Check minimum group size (2) and user distribution

### Issue: Uneven gender distribution
**Solution**: Verify gender balance algorithm in matching function

### Issue: State not persisting
**Solution**: Check localStorage implementation in development mode

### Issue: Button states incorrect
**Solution**: Verify time calculations and APP_TIME_OFFSET

### Issue: Performance slow
**Solution**: Check database queries and optimize if needed

## Debugging Tools

### 1. Browser Developer Tools
- Network tab for API calls
- Console for error messages
- Application tab for localStorage
- Performance tab for timing

### 2. Database Queries
```sql
-- Check waitlist distribution
SELECT 
  EXTRACT(HOUR FROM time_slot) as hour,
  COUNT(*) as user_count
FROM waitlist_entries 
GROUP BY EXTRACT(HOUR FROM time_slot);

-- Check circle formation
SELECT 
  c.id,
  c.time_slot,
  COUNT(cm.user_id) as member_count
FROM circles c
LEFT JOIN circle_members cm ON c.id = cm.circle_id
GROUP BY c.id, c.time_slot;
```

### 3. Test Data Validation
```javascript
// Verify test user creation
const { data: users } = await supabase
  .from('users')
  .select('*')
  .like('full_name', 'Test User%');

console.log(`Created ${users.length} test users`);
```

## Automated Testing Commands

```bash
# Run all tests
npm run test:all

# Run only waitlist tests
npm run test:waitlist

# Run only matching tests
npm run test:matching

# Run performance tests
npm run test:performance

# Get manual testing checklist
npm run test:manual
```

## Success Criteria

✅ **All 38 users can complete onboarding**
✅ **Waitlist signup works for all time slots**
✅ **Matching algorithm handles all scenarios**
✅ **No single users left unmatched (when avoidable)**
✅ **Gender balance maintained in groups**
✅ **Interest diversity considered in matching**
✅ **Time-based state changes work correctly**
✅ **Performance meets benchmarks**
✅ **All edge cases handled gracefully**
✅ **Mobile responsive design works**

## Production Deployment Checklist

Before going live:
- [ ] All automated tests pass
- [ ] Manual testing completed
- [ ] Performance benchmarks met
- [ ] Error handling tested
- [ ] Database queries optimized
- [ ] Cron jobs for matching configured
- [ ] Monitoring and alerting set up
- [ ] Load testing completed
- [ ] Security review passed
- [ ] User acceptance testing done