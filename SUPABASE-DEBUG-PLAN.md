# Supabase Update Issues - Comprehensive Debug Plan

## **Current Situation**
- API endpoint responds successfully (http://localhost:3001/api/cron/matching)
- But data is NOT appearing in Supabase database
- Need systematic approach to find and fix the issue

## **Step-by-Step Debug Plan**

### **STEP 1: Check Browser Response**
1. Open http://localhost:3001/api/cron/matching in browser
2. Copy the ENTIRE JSON response
3. Look for:
   - `success: true` or `false`
   - Any error messages
   - Results array content
   - Circle IDs that were supposedly created

### **STEP 2: Check Supabase Connection**
Run this test query in Supabase SQL Editor:
```sql
-- Test if database is accessible
SELECT COUNT(*) as user_count FROM users;
SELECT COUNT(*) as location_count FROM locations;
SELECT COUNT(*) as spark_count FROM conversation_sparks;
```

Expected results:
- user_count: 38 (if test users loaded)
- location_count: 8
- spark_count: 10

### **STEP 3: Check Current Waitlist Status**
```sql
-- See what's in waitlist right now
SELECT 
    TO_CHAR(time_slot AT TIME ZONE 'America/Los_Angeles', 'YYYY-MM-DD HH24:MI') as slot_pst,
    COUNT(*) as users_waiting
FROM waitlist_entries 
GROUP BY time_slot
ORDER BY time_slot DESC
LIMIT 10;
```

### **STEP 4: Check Service Role Key**
Verify in your `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # CRITICAL - Needed for bypassing RLS
```

If `SUPABASE_SERVICE_ROLE_KEY` is missing, the API can't write to database!

### **STEP 5: Create Debug Version of Matching Route**
Create `/src/app/api/test-db/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const results = {
    connection: false,
    auth: false,
    read: false,
    write: false,
    errors: []
  };

  try {
    // Test 1: Basic connection
    const supabase = await createClient();
    results.connection = true;

    // Test 2: Auth check
    const { data: { user } } = await supabase.auth.getUser();
    results.auth = !!user;

    // Test 3: Read test
    const { data: locations, error: readError } = await supabase
      .from('locations')
      .select('id')
      .limit(1);
    
    if (readError) {
      results.errors.push(`Read error: ${readError.message}`);
    } else {
      results.read = true;
    }

    // Test 4: Write test with service role
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const adminClient = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const testId = `test-${Date.now()}`;
      const { error: writeError } = await adminClient
        .from('circles')
        .insert({
          id: testId,
          time_slot: new Date().toISOString(),
          location_id: locations?.[0]?.id,
          status: 'forming'
        });

      if (writeError) {
        results.errors.push(`Write error: ${writeError.message}`);
      } else {
        results.write = true;
        
        // Clean up test record
        await adminClient.from('circles').delete().eq('id', testId);
      }
    } else {
      results.errors.push('SUPABASE_SERVICE_ROLE_KEY not found in environment');
    }

  } catch (error) {
    results.errors.push(`Exception: ${error.message}`);
  }

  return NextResponse.json(results);
}
```

### **STEP 6: Fix Based on Results**

#### **If Service Role Key Missing:**
1. Go to Supabase Dashboard > Settings > API
2. Copy the `service_role` key (NOT anon key)
3. Add to `.env.local`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-service-role-key...
   ```
4. Restart dev server

#### **If RLS Policies Blocking:**
Update matching route to use admin client:
```typescript
// In matching route
const adminClient = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Use adminClient instead of supabase for all database operations
```

### **STEP 7: Add Detailed Logging**
Add console.logs to track execution:
```typescript
console.log('1. Starting matching for slot:', slotTimeStr);
console.log('2. Found waitlist users:', waitlistUsers?.length);
console.log('3. Creating circles:', circles.length);
console.log('4. Circle creation result:', { error: circleError });
console.log('5. Members added:', memberInserts.length);
```

### **STEP 8: Test One Operation at a Time**
Create simple test endpoint `/api/test-insert/route.ts`:
```typescript
export async function GET() {
  // Just try to insert one circle
  const { error } = await adminClient
    .from('circles')
    .insert({
      time_slot: new Date().toISOString(),
      location_id: 1,
      status: 'forming'
    });
    
  return NextResponse.json({ error: error?.message || 'Success' });
}
```

### **STEP 9: Check Supabase Logs**
1. Go to Supabase Dashboard > Logs > API Logs
2. Filter by time when you ran the matching
3. Look for any failed requests or errors

### **STEP 10: Final Verification Query**
After fixing and re-running matching:
```sql
-- Should show newly created circles
SELECT 
    c.id,
    TO_CHAR(c.time_slot AT TIME ZONE 'America/Los_Angeles', 'HH12:MI AM') as time,
    c.created_at,
    l.name as location,
    COUNT(cm.user_id) as members
FROM circles c
LEFT JOIN locations l ON c.location_id = l.id
LEFT JOIN circle_members cm ON c.id = cm.circle_id
WHERE c.created_at > NOW() - INTERVAL '1 hour'
GROUP BY c.id, c.time_slot, c.created_at, l.name
ORDER BY c.created_at DESC;
```

## **Common Issues & Solutions**

### **Issue 1: No Service Role Key**
**Solution**: Add SUPABASE_SERVICE_ROLE_KEY to .env.local

### **Issue 2: RLS Policies Blocking Writes**
**Solution**: Use service role client for cron job operations

### **Issue 3: Time Zone Mismatch**
**Solution**: Ensure all times are properly converted to/from PST

### **Issue 4: Transaction Rollback**
**Solution**: Remove transactions or ensure all operations succeed

### **Issue 5: Unique Constraint Violations**
**Solution**: Use unique IDs with timestamps

## **Next Steps After Fix**
1. Clear test data
2. Run full 38-user test
3. Verify unique locations
4. Check GPS coordinates
5. Test user experience flow