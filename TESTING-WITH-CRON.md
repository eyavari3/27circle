# Complete Testing with Cron Job - Step by Step

## **Setup Phase**

1. Open your terminal and navigate to your project directory.

2. Make sure you have your Supabase database credentials in your `.env.local` file.

3. Run the SQL seed script to create 38 test users:
   ```bash
   psql -d your_supabase_database_url -f scripts/seed-test-users.sql
   ```

4. Verify the test users were created by running this query in your Supabase dashboard:
   ```sql
   SELECT COUNT(*) FROM auth.users WHERE email LIKE 'test%@stanford.edu';
   ```

5. You should see 38 users created.

6. Make sure your locations and conversation_sparks tables have data:
   ```sql
   INSERT INTO locations (id, name, description) VALUES 
   (1, 'Old Union', 'Stanford Old Union building area')
   ON CONFLICT (id) DO NOTHING;
   
   INSERT INTO conversation_sparks (id, spark_text) VALUES 
   (1, 'What''s something you''ve always wanted to learn but never had the chance to?')
   ON CONFLICT (id) DO NOTHING;
   ```

## **Create Test Waitlists**

7. Open `/src/lib/constants.ts` and set `APP_TIME_OFFSET: number | null = 9;` (9AM - before all deadlines).

8. Start your development server with `npm run dev`.

9. Add users to waitlists by running this SQL in Supabase (replace `2024-01-01` with today's date):
   ```sql
   -- Clear existing data
   DELETE FROM circle_members;
   DELETE FROM circles;
   DELETE FROM waitlist_entries;
   
   -- Add users to 11AM slot
   INSERT INTO waitlist_entries (user_id, time_slot) VALUES
   ('user-001', '2024-01-01 11:00:00'),
   ('user-002', '2024-01-01 11:00:00'),
   ('user-003', '2024-01-01 11:00:00'),
   ('user-004', '2024-01-01 11:00:00'),
   ('user-005', '2024-01-01 11:00:00'),
   ('user-006', '2024-01-01 11:00:00'),
   ('user-007', '2024-01-01 11:00:00'),
   ('user-008', '2024-01-01 11:00:00'),
   ('user-009', '2024-01-01 11:00:00'),
   ('user-010', '2024-01-01 11:00:00'),
   ('user-011', '2024-01-01 11:00:00'),
   ('user-012', '2024-01-01 11:00:00'),
   ('user-013', '2024-01-01 11:00:00');
   
   -- Add users to 2PM slot
   INSERT INTO waitlist_entries (user_id, time_slot) VALUES
   ('user-014', '2024-01-01 14:00:00'),
   ('user-015', '2024-01-01 14:00:00'),
   ('user-016', '2024-01-01 14:00:00'),
   ('user-017', '2024-01-01 14:00:00'),
   ('user-018', '2024-01-01 14:00:00'),
   ('user-019', '2024-01-01 14:00:00'),
   ('user-020', '2024-01-01 14:00:00'),
   ('user-021', '2024-01-01 14:00:00'),
   ('user-022', '2024-01-01 14:00:00'),
   ('user-023', '2024-01-01 14:00:00'),
   ('user-024', '2024-01-01 14:00:00'),
   ('user-025', '2024-01-01 14:00:00');
   
   -- Add users to 5PM slot
   INSERT INTO waitlist_entries (user_id, time_slot) VALUES
   ('user-026', '2024-01-01 17:00:00'),
   ('user-027', '2024-01-01 17:00:00'),
   ('user-028', '2024-01-01 17:00:00'),
   ('user-029', '2024-01-01 17:00:00'),
   ('user-030', '2024-01-01 17:00:00'),
   ('user-031', '2024-01-01 17:00:00'),
   ('user-032', '2024-01-01 17:00:00'),
   ('user-033', '2024-01-01 17:00:00'),
   ('user-034', '2024-01-01 17:00:00'),
   ('user-035', '2024-01-01 17:00:00'),
   ('user-036', '2024-01-01 17:00:00'),
   ('user-037', '2024-01-01 17:00:00'),
   ('user-038', '2024-01-01 17:00:00');
   ```

10. Verify waitlist entries were created:
    ```sql
    SELECT 
      EXTRACT(HOUR FROM time_slot) as hour,
      COUNT(*) as user_count
    FROM waitlist_entries 
    GROUP BY EXTRACT(HOUR FROM time_slot)
    ORDER BY hour;
    ```

## **Test 11AM Slot Matching**

11. Change `/src/lib/constants.ts` to `APP_TIME_OFFSET: number | null = 10;` (exactly 10AM - 11AM deadline).

12. Open a new terminal and run the matching trigger:
    ```bash
    cd /Users/ebrayavari/Documents/27circle-july
    node scripts/trigger-matching.js
    ```

13. You should see output like:
    ```
    ✅ Matching algorithm completed successfully!
    ⏰ Processed at: 2024-01-01T18:00:00.000Z
    
    📊 Results:
    11:00 Slot:
      Total users: 13
      Circles created: 3
      Users matched: 12
      Unmatched users: 1
      Circle IDs: circle-11h-1234567890-0, circle-11h-1234567890-1, circle-11h-1234567890-2
    ```

## **Test 2PM Slot Matching**

14. Change `/src/lib/constants.ts` to `APP_TIME_OFFSET: number | null = 13;` (exactly 1PM - 2PM deadline).

15. Run the matching trigger again:
    ```bash
    node scripts/trigger-matching.js
    ```

16. You should see the 2PM slot get processed with 12 users creating 3 circles.

## **Test 5PM Slot Matching**

17. Change `/src/lib/constants.ts` to `APP_TIME_OFFSET: number | null = 16;` (exactly 4PM - 5PM deadline).

18. Run the matching trigger again:
    ```bash
    node scripts/trigger-matching.js
    ```

19. You should see the 5PM slot get processed with 13 users.

## **View Complete Results**

20. Run this comprehensive query to see all users in circles with locations and sparks:
    ```sql
    SELECT 
      c.id as circle_id,
      TO_CHAR(c.time_slot, 'HH12:MI AM') as meeting_time,
      l.name as location_name,
      cs.spark_text as conversation_spark,
      u.full_name as user_name,
      u.gender as user_gender,
      STRING_AGG(ui.interest_type, ', ') as user_interests
    FROM circles c
    JOIN circle_members cm ON c.id = cm.circle_id
    JOIN users u ON cm.user_id = u.id
    LEFT JOIN locations l ON c.location_id = l.id
    LEFT JOIN conversation_sparks cs ON c.conversation_spark_id = cs.id
    LEFT JOIN user_interests ui ON u.id = ui.user_id
    GROUP BY c.id, c.time_slot, l.name, cs.spark_text, u.full_name, u.gender, cm.user_id
    ORDER BY c.time_slot, c.id, u.full_name;
    ```

21. This will show you output like:
    ```
    circle_id              | meeting_time | location_name | conversation_spark | user_name | user_gender | user_interests
    ----------------------|--------------|---------------|-------------------|-----------|-------------|---------------
    circle-11h-1234567890-0| 11:00 AM     | Old Union     | What's something...| Alice Chen| female      | deep_thinking, new_activities
    circle-11h-1234567890-0| 11:00 AM     | Old Union     | What's something...| Bob Martinez| male      | deep_thinking, new_activities
    circle-11h-1234567890-0| 11:00 AM     | Old Union     | What's something...| Charlie Kim| non-binary | deep_thinking, new_activities
    circle-11h-1234567890-0| 11:00 AM     | Old Union     | What's something...| Diana Rodriguez| female | deep_thinking, new_activities
    ```

22. Count total circles created:
    ```sql
    SELECT 
      TO_CHAR(time_slot, 'HH12:MI AM') as slot_time,
      COUNT(*) as circles_created
    FROM circles 
    GROUP BY time_slot 
    ORDER BY time_slot;
    ```

23. Count total users matched:
    ```sql
    SELECT COUNT(*) as total_matched_users FROM circle_members;
    ```

24. See unmatched users (should be 2 users total - 1 from 11AM, 1 from 5PM):
    ```sql
    SELECT 
      u.full_name,
      TO_CHAR(we.time_slot, 'HH12:MI AM') as intended_slot
    FROM waitlist_entries we
    JOIN users u ON we.user_id = u.id
    WHERE we.user_id NOT IN (
      SELECT user_id FROM circle_members
    );
    ```

## **Expected Results**

With 38 users distributed as above, you should see:
- **11AM**: 13 users → 3 circles (4+4+4, 1 unmatched)
- **2PM**: 12 users → 3 circles (4+4+4, 0 unmatched)  
- **5PM**: 13 users → 3 circles (4+4+4, 1 unmatched)
- **Total**: 9 circles, 36 users matched, 2 unmatched

## **Test Different Scenarios**

25. To test uneven distribution, clear the data and try:
    ```sql
    -- Heavy load on 2PM
    DELETE FROM circle_members;
    DELETE FROM circles;
    DELETE FROM waitlist_entries;
    
    -- Add 25 users to 2PM slot
    INSERT INTO waitlist_entries (user_id, time_slot) 
    SELECT 'user-' || LPAD(generate_series(1, 25)::text, 3, '0'), '2024-01-01 14:00:00';
    ```

26. Test edge cases like single users:
    ```sql
    -- Only 1 user per slot
    DELETE FROM circle_members;
    DELETE FROM circles;
    DELETE FROM waitlist_entries;
    
    INSERT INTO waitlist_entries (user_id, time_slot) VALUES
    ('user-001', '2024-01-01 11:00:00'),
    ('user-002', '2024-01-01 14:00:00'),
    ('user-003', '2024-01-01 17:00:00');
    ```

This comprehensive testing with the cron job will show you exactly how the matching algorithm works in production!

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "Create cron job for automated matching algorithm", "status": "completed", "priority": "high", "id": "create-matching-cron"}]