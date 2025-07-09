import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServiceClient();
    
    console.log('🌱 Starting test seed for 15 users...');
    
    // Step 1: Clear existing data
    await supabase.from('circle_members').delete().neq('circle_id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('circles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('waitlist_entries').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('user_interests').delete().neq('user_id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('conversation_sparks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('locations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    // Step 2: Insert locations
    const locationsResult = await supabase
      .from('locations')
      .insert([
        { name: 'Memorial Church', description: 'Historic Stanford Memorial Church', address: '450 Jane Stanford Way, Stanford, CA 94305', latitude: 37.4272, longitude: -122.1703 },
        { name: 'Main Quad', description: 'Central quadrangle of Stanford campus', address: '450 Jane Stanford Way, Stanford, CA 94305', latitude: 37.4274, longitude: -122.1716 },
        { name: 'Green Library', description: 'Cecil H. Green Library - main campus library', address: '557 Escondido Mall, Stanford, CA 94305', latitude: 37.4265, longitude: -122.1695 },
        { name: 'Cantor Arts Center', description: 'Iris & B. Gerald Cantor Center for Visual Arts', address: '328 Lomita Dr, Stanford, CA 94305', latitude: 37.4281, longitude: -122.1693 },
        { name: 'Tresidder Union', description: 'Student union building with dining and services', address: '459 Lagunita Dr, Stanford, CA 94305', latitude: 37.4265, longitude: -122.1709 },
        { name: 'White Plaza', description: 'Central campus gathering space', address: '557 Escondido Mall, Stanford, CA 94305', latitude: 37.4263, longitude: -122.1698 },
        { name: 'Hoover Tower', description: 'Iconic Stanford landmark and observation tower', address: '550 Serra Mall, Stanford, CA 94305', latitude: 37.4275, longitude: -122.1663 },
        { name: 'The Oval', description: 'Large grassy area near campus center', address: '450 Serra Mall, Stanford, CA 94305', latitude: 37.4281, longitude: -122.1685 }
      ]);
    
    if (locationsResult.error) {
      return NextResponse.json({ error: 'Failed to insert locations', details: locationsResult.error }, { status: 500 });
    }
    
    // Step 3: Insert conversation sparks
    const sparksResult = await supabase
      .from('conversation_sparks')
      .insert([
        { spark_text: "What's one topic you wish was taught at Stanford but isn't?" },
        { spark_text: "If you had one year fully funded to chase any idea, what would you build or research?" },
        { spark_text: "What belief did you used to hold strongly that you no longer believe?" },
        { spark_text: "What's a moment when you felt most alive on campus?" },
        { spark_text: "Which discipline outside your major do you think holds a key to solving a global problem?" },
        { spark_text: "What's a 'weird' personal ritual or habit that actually helps you thrive?" },
        { spark_text: "What's one question you wish more people asked you?" },
        { spark_text: "If everyone had to take a class on 'How to Be Human,' what's one lesson you'd teach?" },
        { spark_text: "Who's someone on campus you secretly admire and why?" },
        { spark_text: "What's a small act of courage you've done that no one noticed?" }
      ]);
    
    if (sparksResult.error) {
      return NextResponse.json({ error: 'Failed to insert sparks', details: sparksResult.error }, { status: 500 });
    }
    
    // Step 4: Create exactly 15 test users
    const testUserIds = [
      '11111111-1111-1111-1111-111111111111',
      '22222222-2222-2222-2222-222222222222',
      '33333333-3333-3333-3333-333333333333',
      '44444444-4444-4444-4444-444444444444',
      '55555555-5555-5555-5555-555555555555',
      '66666666-6666-6666-6666-666666666666',
      '77777777-7777-7777-7777-777777777777',
      '88888888-8888-8888-8888-888888888888',
      '99999999-9999-9999-9999-999999999999',
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      'cccccccc-cccc-cccc-cccc-cccccccccccc',
      'dddddddd-dddd-dddd-dddd-dddddddddddd',
      'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
      'ffffffff-ffff-ffff-ffff-ffffffffffff'
    ];
    
    const testUsers = [
      { id: testUserIds[0], full_name: 'Alice Chen', gender: 'female', date_of_birth: '2001-03-15', phone_number: '+14151234001' },
      { id: testUserIds[1], full_name: 'Bob Martinez', gender: 'male', date_of_birth: '2000-07-22', phone_number: '+14151234002' },
      { id: testUserIds[2], full_name: 'Charlie Kim', gender: 'non-binary', date_of_birth: '2002-01-10', phone_number: '+14151234003' },
      { id: testUserIds[3], full_name: 'Diana Rodriguez', gender: 'female', date_of_birth: '2001-11-05', phone_number: '+14151234004' },
      { id: testUserIds[4], full_name: 'Ethan Wilson', gender: 'male', date_of_birth: '2000-09-18', phone_number: '+14151234005' },
      { id: testUserIds[5], full_name: 'Fiona Li', gender: 'female', date_of_birth: '2002-04-12', phone_number: '+14151234006' },
      { id: testUserIds[6], full_name: 'Gabriel Santos', gender: 'male', date_of_birth: '2001-06-30', phone_number: '+14151234007' },
      { id: testUserIds[7], full_name: 'Hannah Patel', gender: 'female', date_of_birth: '2000-12-25', phone_number: '+14151234008' },
      { id: testUserIds[8], full_name: 'Isaac Johnson', gender: 'male', date_of_birth: '2002-02-14', phone_number: '+14151234009' },
      { id: testUserIds[9], full_name: 'Julia Thompson', gender: 'female', date_of_birth: '2001-08-08', phone_number: '+14151234010' },
      { id: testUserIds[10], full_name: 'Kevin Zhang', gender: 'male', date_of_birth: '2000-05-20', phone_number: '+14151234011' },
      { id: testUserIds[11], full_name: 'Luna Davis', gender: 'female', date_of_birth: '2002-10-03', phone_number: '+14151234012' },
      { id: testUserIds[12], full_name: 'Marcus Brown', gender: 'male', date_of_birth: '2001-01-28', phone_number: '+14151234013' },
      { id: testUserIds[13], full_name: 'Nina Garcia', gender: 'female', date_of_birth: '2000-04-16', phone_number: '+14151234014' },
      { id: testUserIds[14], full_name: 'Oscar Lee', gender: 'male', date_of_birth: '2002-07-09', phone_number: '+14151234015' }
    ];
    
    const usersResult = await supabase
      .from('users')
      .insert(testUsers);
    
    if (usersResult.error) {
      return NextResponse.json({ error: 'Failed to insert users', details: usersResult.error }, { status: 500 });
    }
    
    // Step 5: Add diverse interests to users
    const interests = [
      // Users 0-4 (11AM slot) - diverse interests
      { user_id: testUserIds[0], interest_type: 'deep_thinking' },
      { user_id: testUserIds[0], interest_type: 'new_activities' },
      { user_id: testUserIds[1], interest_type: 'spiritual_growth' },
      { user_id: testUserIds[1], interest_type: 'community_service' },
      { user_id: testUserIds[2], interest_type: 'deep_thinking' },
      { user_id: testUserIds[2], interest_type: 'spiritual_growth' },
      { user_id: testUserIds[3], interest_type: 'new_activities' },
      { user_id: testUserIds[3], interest_type: 'community_service' },
      { user_id: testUserIds[4], interest_type: 'deep_thinking' },
      
      // Users 5-9 (2PM slot) - diverse interests
      { user_id: testUserIds[5], interest_type: 'spiritual_growth' },
      { user_id: testUserIds[5], interest_type: 'new_activities' },
      { user_id: testUserIds[6], interest_type: 'community_service' },
      { user_id: testUserIds[6], interest_type: 'deep_thinking' },
      { user_id: testUserIds[7], interest_type: 'spiritual_growth' },
      { user_id: testUserIds[7], interest_type: 'new_activities' },
      { user_id: testUserIds[8], interest_type: 'community_service' },
      { user_id: testUserIds[9], interest_type: 'deep_thinking' },
      
      // Users 10-14 (5PM slot) - diverse interests
      { user_id: testUserIds[10], interest_type: 'spiritual_growth' },
      { user_id: testUserIds[10], interest_type: 'community_service' },
      { user_id: testUserIds[11], interest_type: 'new_activities' },
      { user_id: testUserIds[11], interest_type: 'deep_thinking' },
      { user_id: testUserIds[12], interest_type: 'spiritual_growth' },
      { user_id: testUserIds[13], interest_type: 'community_service' },
      { user_id: testUserIds[13], interest_type: 'new_activities' },
      { user_id: testUserIds[14], interest_type: 'deep_thinking' }
    ];
    
    const interestsResult = await supabase
      .from('user_interests')
      .insert(interests);
    
    if (interestsResult.error) {
      return NextResponse.json({ error: 'Failed to insert interests', details: interestsResult.error }, { status: 500 });
    }
    
    // Step 6: Create waitlist entries for today (July 9th) in PST
    const waitlistEntries = [
      // 11AM PST slot (5 users) - July 9th, 2025 11:00 AM PST
      { user_id: testUserIds[0], time_slot: '2025-07-09T18:00:00.000Z' }, // 11AM PST = 6PM UTC
      { user_id: testUserIds[1], time_slot: '2025-07-09T18:00:00.000Z' },
      { user_id: testUserIds[2], time_slot: '2025-07-09T18:00:00.000Z' },
      { user_id: testUserIds[3], time_slot: '2025-07-09T18:00:00.000Z' },
      { user_id: testUserIds[4], time_slot: '2025-07-09T18:00:00.000Z' },
      
      // 2PM PST slot (5 users) - July 9th, 2025 2:00 PM PST
      { user_id: testUserIds[5], time_slot: '2025-07-09T21:00:00.000Z' }, // 2PM PST = 9PM UTC
      { user_id: testUserIds[6], time_slot: '2025-07-09T21:00:00.000Z' },
      { user_id: testUserIds[7], time_slot: '2025-07-09T21:00:00.000Z' },
      { user_id: testUserIds[8], time_slot: '2025-07-09T21:00:00.000Z' },
      { user_id: testUserIds[9], time_slot: '2025-07-09T21:00:00.000Z' },
      
      // 5PM PST slot (5 users) - July 9th, 2025 5:00 PM PST
      { user_id: testUserIds[10], time_slot: '2025-07-10T00:00:00.000Z' }, // 5PM PST = 12AM UTC next day
      { user_id: testUserIds[11], time_slot: '2025-07-10T00:00:00.000Z' },
      { user_id: testUserIds[12], time_slot: '2025-07-10T00:00:00.000Z' },
      { user_id: testUserIds[13], time_slot: '2025-07-10T00:00:00.000Z' },
      { user_id: testUserIds[14], time_slot: '2025-07-10T00:00:00.000Z' }
    ];
    
    const waitlistResult = await supabase
      .from('waitlist_entries')
      .insert(waitlistEntries);
    
    if (waitlistResult.error) {
      return NextResponse.json({ error: 'Failed to insert waitlist', details: waitlistResult.error }, { status: 500 });
    }
    
    // Verify counts
    const [
      { count: locationCount },
      { count: sparkCount },
      { count: userCount },
      { count: interestCount },
      { count: waitlistCount }
    ] = await Promise.all([
      supabase.from('locations').select('*', { count: 'exact' }).limit(1),
      supabase.from('conversation_sparks').select('*', { count: 'exact' }).limit(1),
      supabase.from('users').select('*', { count: 'exact' }).limit(1),
      supabase.from('user_interests').select('*', { count: 'exact' }).limit(1),
      supabase.from('waitlist_entries').select('*', { count: 'exact' }).limit(1)
    ].map(async (promise) => {
      const result = await promise;
      return { count: result.count || 0 };
    }));
    
    console.log('✅ Test seed completed successfully!');
    
    return NextResponse.json({ 
      success: true,
      message: 'Test database seeded successfully',
      testConfig: {
        totalUsers: 15,
        usersPerSlot: 5,
        expectedCircles: 6,
        expectedDistribution: '3+2 users per time slot'
      },
      counts: {
        locations: locationCount,
        sparks: sparkCount,
        users: userCount,
        interests: interestCount,
        waitlist: waitlistCount
      }
    });
    
  } catch (error) {
    console.error('❌ Test seed failed:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}