import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    console.log('🚀 Creating 5 specific test users...');
    
    const supabase = await createServiceClient();
    
    // Get time slot for today 11 AM
    const today = new Date();
    const timeSlot11AM = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 0, 0).toISOString();
    
    // Clear existing test data
    console.log('🧹 Clearing existing test data...');
    await supabase.from('circle_members').delete().in('user_id', [
      '10000000-0000-0000-0000-000000000001',
      '10000000-0000-0000-0000-000000000002', 
      '10000000-0000-0000-0000-000000000003',
      '10000000-0000-0000-0000-000000000004',
      '10000000-0000-0000-0000-000000000005'
    ]);
    
    await supabase.from('circles').delete().like('id', 'test-%');
    
    await supabase.from('waitlist_entries').delete().in('user_id', [
      '10000000-0000-0000-0000-000000000001',
      '10000000-0000-0000-0000-000000000002',
      '10000000-0000-0000-0000-000000000003', 
      '10000000-0000-0000-0000-000000000004',
      '10000000-0000-0000-0000-000000000005'
    ]);
    
    await supabase.from('user_interests').delete().in('user_id', [
      '10000000-0000-0000-0000-000000000001',
      '10000000-0000-0000-0000-000000000002',
      '10000000-0000-0000-0000-000000000003',
      '10000000-0000-0000-0000-000000000004', 
      '10000000-0000-0000-0000-000000000005'
    ]);
    
    await supabase.from('users').delete().in('id', [
      '10000000-0000-0000-0000-000000000001',
      '10000000-0000-0000-0000-000000000002',
      '10000000-0000-0000-0000-000000000003',
      '10000000-0000-0000-0000-000000000004',
      '10000000-0000-0000-0000-000000000005'
    ]);

    // Create 5 specific test users: 3F + 2M (all 18-25)
    const testUsers = [
      { id: '10000000-0000-0000-0000-000000000001', full_name: 'Alice Test (F, 22)', gender: 'female', date_of_birth: '2002-06-15', phone_number: '+15552001001' },
      { id: '10000000-0000-0000-0000-000000000002', full_name: 'Beth Test (F, 21)', gender: 'female', date_of_birth: '2003-03-10', phone_number: '+15552001002' },
      { id: '10000000-0000-0000-0000-000000000003', full_name: 'Cara Test (F, 23)', gender: 'female', date_of_birth: '2001-09-20', phone_number: '+15552001003' },
      { id: '10000000-0000-0000-0000-000000000004', full_name: 'David Test (M, 20)', gender: 'male', date_of_birth: '2004-01-15', phone_number: '+15552001004' },
      { id: '10000000-0000-0000-0000-000000000005', full_name: 'Eric Test (M, 24)', gender: 'male', date_of_birth: '2000-08-30', phone_number: '+15552001005' },
    ];

    const waitlistEntries = testUsers.map(user => ({
      user_id: user.id,
      time_slot: timeSlot11AM
    }));

    const interests = testUsers.map(user => ({
      user_id: user.id,
      interest_type: 'deep_thinking'
    }));

    // Insert new data
    console.log('👥 Inserting 5 test users...');
    const usersResult = await supabase
      .from('users')
      .insert(testUsers);
    
    if (usersResult.error) {
      console.error('Users error:', usersResult.error);
      throw usersResult.error;
    }

    console.log('📝 Inserting waitlist entries...');
    const waitlistResult = await supabase
      .from('waitlist_entries')
      .insert(waitlistEntries);
    
    if (waitlistResult.error) {
      console.error('Waitlist error:', waitlistResult.error);
      throw waitlistResult.error;
    }

    console.log('🎯 Inserting interests...');
    const interestsResult = await supabase
      .from('user_interests')
      .insert(interests);
    
    if (interestsResult.error) {
      console.error('Interests error:', interestsResult.error);
      throw interestsResult.error;
    }

    console.log('✅ 5 test users created successfully');

    return NextResponse.json({
      success: true,
      message: '5 test users created successfully',
      summary: {
        users: testUsers.length,
        demographics: '3 Females (18-25) + 2 Males (18-25)',
        expectedResult: '1 circle of 3F + 2M unmatched (no gender mixing)',
        waitlistEntries: waitlistEntries.length,
        timeSlot: new Date(timeSlot11AM).toLocaleTimeString()
      },
      users: testUsers.map(u => ({
        name: u.full_name,
        gender: u.gender,
        age: 2025 - parseInt(u.date_of_birth.substring(0, 4))
      }))
    });

  } catch (error) {
    console.error('❌ Error creating 5 test users:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
}