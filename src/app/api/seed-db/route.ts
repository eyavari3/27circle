import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServiceClient();
    
    console.log('🌱 Starting database seed...');
    
    // Step 1: Clear and insert locations
    await supabase.from('locations').delete().gte('id', '00000000-0000-0000-0000-000000000000');
    
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
      console.error('❌ Error inserting locations:', locationsResult.error);
      return NextResponse.json({ error: 'Failed to insert locations', details: locationsResult.error }, { status: 500 });
    }
    
    // Step 2: Clear and insert conversation sparks
    await supabase.from('conversation_sparks').delete().gte('id', '00000000-0000-0000-0000-000000000000');
    
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
      console.error('❌ Error inserting sparks:', sparksResult.error);
      return NextResponse.json({ error: 'Failed to insert sparks', details: sparksResult.error }, { status: 500 });
    }
    
    // Step 3: Create test users with auth entries
    const testUsers = [];
    for (let i = 1; i <= 38; i++) {
      const userId = `user-${i.toString().padStart(3, '0')}`;
      const email = `test${i.toString().padStart(3, '0')}@stanford.edu`;
      const phone = `+1415123${i.toString().padStart(4, '0')}`;
      
      testUsers.push({
        id: userId,
        email,
        phone,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        email_confirmed_at: new Date().toISOString(),
        phone_confirmed_at: new Date().toISOString(),
        aud: 'authenticated',
        role: 'authenticated'
      });
    }
    
    // Insert auth users (this will fail with RLS, but we'll handle it gracefully)
    console.log('👥 Creating test users...');
    
    // Create public user profiles directly - generate UUIDs
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
      'ffffffff-ffff-ffff-ffff-ffffffffffff',
      '10101010-1010-1010-1010-101010101010',
      '20202020-2020-2020-2020-202020202020',
      '30303030-3030-3030-3030-303030303030',
      '40404040-4040-4040-4040-404040404040',
      '50505050-5050-5050-5050-505050505050',
      '60606060-6060-6060-6060-606060606060',
      '70707070-7070-7070-7070-707070707070',
      '80808080-8080-8080-8080-808080808080',
      '90909090-9090-9090-9090-909090909090',
      'a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a0a0',
      'b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b0',
      'c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c0c0',
      'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
      'e0e0e0e0-e0e0-e0e0-e0e0-e0e0e0e0e0e0',
      'f0f0f0f0-f0f0-f0f0-f0f0-f0f0f0f0f0f0',
      '12345678-1234-1234-1234-123456789012',
      '23456789-2345-2345-2345-234567890123',
      '34567890-3456-3456-3456-345678901234',
      '45678901-4567-4567-4567-456789012345',
      '56789012-5678-5678-5678-567890123456',
      '67890123-6789-6789-6789-678901234567',
      '78901234-7890-7890-7890-789012345678',
      '89012345-8901-8901-8901-890123456789'
    ];
    
    const publicUsers = [
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
      { id: testUserIds[14], full_name: 'Oscar Lee', gender: 'male', date_of_birth: '2002-07-09', phone_number: '+14151234015' },
      { id: testUserIds[15], full_name: 'Priya Sharma', gender: 'female', date_of_birth: '2001-12-01', phone_number: '+14151234016' },
      { id: testUserIds[16], full_name: 'Quinn Taylor', gender: 'non-binary', date_of_birth: '2000-10-14', phone_number: '+14151234017' },
      { id: testUserIds[17], full_name: 'Rachel Green', gender: 'female', date_of_birth: '2002-03-22', phone_number: '+14151234018' },
      { id: testUserIds[18], full_name: 'Sam Anderson', gender: 'male', date_of_birth: '2001-05-11', phone_number: '+14151234019' },
      { id: testUserIds[19], full_name: 'Tara Williams', gender: 'female', date_of_birth: '2000-08-27', phone_number: '+14151234020' },
      { id: testUserIds[20], full_name: 'Umar Hassan', gender: 'male', date_of_birth: '2002-11-19', phone_number: '+14151234021' },
      { id: testUserIds[21], full_name: 'Victoria Chen', gender: 'female', date_of_birth: '2001-02-06', phone_number: '+14151234022' },
      { id: testUserIds[22], full_name: 'William Jones', gender: 'male', date_of_birth: '2000-06-13', phone_number: '+14151234023' },
      { id: testUserIds[23], full_name: 'Xenia Popov', gender: 'female', date_of_birth: '2002-09-24', phone_number: '+14151234024' },
      { id: testUserIds[24], full_name: 'Yuki Tanaka', gender: 'female', date_of_birth: '2001-04-17', phone_number: '+14151234025' },
      { id: testUserIds[25], full_name: 'Zoe Miller', gender: 'female', date_of_birth: '2000-07-31', phone_number: '+14151234026' },
      { id: testUserIds[26], full_name: 'Alex Rivera', gender: 'male', date_of_birth: '2002-12-08', phone_number: '+14151234027' },
      { id: testUserIds[27], full_name: 'Bella Smith', gender: 'female', date_of_birth: '2001-10-21', phone_number: '+14151234028' },
      { id: testUserIds[28], full_name: 'Carlos Mendez', gender: 'male', date_of_birth: '2000-03-04', phone_number: '+14151234029' },
      { id: testUserIds[29], full_name: 'Dasha Kumar', gender: 'female', date_of_birth: '2002-05-26', phone_number: '+14151234030' },
      { id: testUserIds[30], full_name: 'Eli Foster', gender: 'male', date_of_birth: '2001-09-12', phone_number: '+14151234031' },
      { id: testUserIds[31], full_name: 'Freya Nelson', gender: 'female', date_of_birth: '2000-11-29', phone_number: '+14151234032' },
      { id: testUserIds[32], full_name: 'George Park', gender: 'male', date_of_birth: '2002-01-15', phone_number: '+14151234033' },
      { id: testUserIds[33], full_name: 'Hope Martinez', gender: 'female', date_of_birth: '2001-07-03', phone_number: '+14151234034' },
      { id: testUserIds[34], full_name: 'Ian Cooper', gender: 'male', date_of_birth: '2000-12-18', phone_number: '+14151234035' },
      { id: testUserIds[35], full_name: 'Jade Wong', gender: 'female', date_of_birth: '2002-08-07', phone_number: '+14151234036' },
      { id: testUserIds[36], full_name: 'Kai Thompson', gender: 'male', date_of_birth: '2001-03-25', phone_number: '+14151234037' },
      { id: testUserIds[37], full_name: 'Lila Rodriguez', gender: 'female', date_of_birth: '2000-06-10', phone_number: '+14151234038' }
    ];
    
    // Clear existing test users (can't use LIKE with UUIDs, so skip for now)
    
    const usersResult = await supabase
      .from('users')
      .insert(publicUsers);
    
    if (usersResult.error) {
      console.error('❌ Error inserting users:', usersResult.error);
      return NextResponse.json({ error: 'Failed to insert users', details: usersResult.error }, { status: 500 });
    }
    
    // Step 4: Insert user interests
    const interests = [
      // Deep thinking + New activities (users 1-10)
      ...Array.from({length: 10}, (_, i) => [
        { user_id: testUserIds[i], interest_type: 'deep_thinking' },
        { user_id: testUserIds[i], interest_type: 'new_activities' }
      ]).flat(),
      // Spiritual + Community (users 11-20)
      ...Array.from({length: 10}, (_, i) => [
        { user_id: testUserIds[i + 10], interest_type: 'spiritual_growth' },
        { user_id: testUserIds[i + 10], interest_type: 'community_service' }
      ]).flat(),
      // All four interests (users 21-30)
      ...Array.from({length: 10}, (_, i) => [
        { user_id: testUserIds[i + 20], interest_type: 'deep_thinking' },
        { user_id: testUserIds[i + 20], interest_type: 'spiritual_growth' },
        { user_id: testUserIds[i + 20], interest_type: 'new_activities' },
        { user_id: testUserIds[i + 20], interest_type: 'community_service' }
      ]).flat(),
      // Single interests (users 31-38)
      { user_id: testUserIds[30], interest_type: 'deep_thinking' },
      { user_id: testUserIds[31], interest_type: 'spiritual_growth' },
      { user_id: testUserIds[32], interest_type: 'new_activities' },
      { user_id: testUserIds[33], interest_type: 'community_service' },
      { user_id: testUserIds[34], interest_type: 'deep_thinking' },
      { user_id: testUserIds[35], interest_type: 'spiritual_growth' },
      { user_id: testUserIds[36], interest_type: 'new_activities' },
      { user_id: testUserIds[37], interest_type: 'community_service' }
    ];
    
    // Clear existing test user interests (can't use LIKE with UUIDs, so skip for now)
    
    const interestsResult = await supabase
      .from('user_interests')
      .insert(interests);
    
    if (interestsResult.error) {
      console.error('❌ Error inserting interests:', interestsResult.error);
      return NextResponse.json({ error: 'Failed to insert interests', details: interestsResult.error }, { status: 500 });
    }
    
    // Step 5: Create waitlist entries for today (PST)
    const today = new Date();
    const pstToday = new Date(today.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
    
    // Clear existing waitlist for today
    await supabase
      .from('waitlist_entries')
      .delete()
      .gte('time_slot', new Date(pstToday.getFullYear(), pstToday.getMonth(), pstToday.getDate(), 0, 0, 0).toISOString())
      .lt('time_slot', new Date(pstToday.getFullYear(), pstToday.getMonth(), pstToday.getDate() + 1, 0, 0, 0).toISOString());
    
    const waitlistEntries = [
      // 11AM PST slot (13 users)
      ...Array.from({length: 13}, (_, i) => ({
        user_id: testUserIds[i],
        time_slot: new Date(pstToday.getFullYear(), pstToday.getMonth(), pstToday.getDate(), 11, 0, 0).toISOString()
      })),
      // 2PM PST slot (12 users)
      ...Array.from({length: 12}, (_, i) => ({
        user_id: testUserIds[i + 13],
        time_slot: new Date(pstToday.getFullYear(), pstToday.getMonth(), pstToday.getDate(), 14, 0, 0).toISOString()
      })),
      // 5PM PST slot (13 users)
      ...Array.from({length: 13}, (_, i) => ({
        user_id: testUserIds[i + 25],
        time_slot: new Date(pstToday.getFullYear(), pstToday.getMonth(), pstToday.getDate(), 17, 0, 0).toISOString()
      }))
    ];
    
    const waitlistResult = await supabase
      .from('waitlist_entries')
      .insert(waitlistEntries);
    
    if (waitlistResult.error) {
      console.error('❌ Error inserting waitlist:', waitlistResult.error);
      return NextResponse.json({ error: 'Failed to insert waitlist', details: waitlistResult.error }, { status: 500 });
    }
    
    // Verify counts
    const { data: locationCount } = await supabase.from('locations').select('*', { count: 'exact' });
    const { data: sparkCount } = await supabase.from('conversation_sparks').select('*', { count: 'exact' });
    const { data: userCount } = await supabase.from('users').select('*', { count: 'exact' });
    const { data: interestCount } = await supabase.from('user_interests').select('*', { count: 'exact' });
    const { data: waitlistCount } = await supabase.from('waitlist_entries').select('*', { count: 'exact' });
    
    console.log('✅ Seed completed successfully!');
    
    return NextResponse.json({ 
      success: true,
      message: 'Database seeded successfully',
      counts: {
        locations: locationCount?.length || 0,
        sparks: sparkCount?.length || 0,
        users: userCount?.length || 0,
        interests: interestCount?.length || 0,
        waitlist: waitlistCount?.length || 0
      }
    });
    
  } catch (error) {
    console.error('❌ Seed failed:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}