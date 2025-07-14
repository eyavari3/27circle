import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    console.log('🚀 Creating simple test data...');
    console.log('Environment check:');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING');

    // Get time slots for today
    const today = new Date();
    const timeSlot11AM = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 0, 0).toISOString();

    // Create 6 test users with different demographics for 11 AM slot
    const testUsers = [
      // 18-25 Female
      { id: '00000000-0000-0000-0000-000000000001', full_name: 'Alice Young (F, 22)', gender: 'female', date_of_birth: '2002-06-15', phone_number: '+15551001001' },
      { id: '00000000-0000-0000-0000-000000000002', full_name: 'Beth Young (F, 24)', gender: 'female', date_of_birth: '2000-03-10', phone_number: '+15551001002' },
      { id: '00000000-0000-0000-0000-000000000003', full_name: 'Cara Young (F, 20)', gender: 'female', date_of_birth: '2004-09-20', phone_number: '+15551001003' },
      { id: '00000000-0000-0000-0000-000000000004', full_name: 'Dana Young (F, 23)', gender: 'female', date_of_birth: '2001-12-05', phone_number: '+15551001004' },
      
      // 18-25 Male  
      { id: '00000000-0000-0000-0000-000000000005', full_name: 'Eric Young (M, 21)', gender: 'male', date_of_birth: '2003-01-15', phone_number: '+15551001005' },
      { id: '00000000-0000-0000-0000-000000000006', full_name: 'Frank Young (M, 25)', gender: 'male', date_of_birth: '1999-08-30', phone_number: '+15551001006' },
    ];

    const waitlistEntries = testUsers.map(user => ({
      user_id: user.id,
      time_slot: timeSlot11AM
    }));

    const interests = testUsers.map(user => ({
      user_id: user.id,
      interest_type: 'deep_thinking'
    }));

    // Create service client
    const supabase = await createServiceClient();

    // Insert data using the service client
    console.log('👥 Inserting users...');
    const usersResult = await supabase
      .from('users')
      .upsert(testUsers, { onConflict: 'id' });
    
    if (usersResult.error) {
      console.error('Users error:', usersResult.error);
      throw usersResult.error;
    }

    console.log('📝 Inserting waitlist entries...');
    const waitlistResult = await supabase
      .from('waitlist_entries')
      .upsert(waitlistEntries, { onConflict: 'user_id,time_slot' });
    
    if (waitlistResult.error) {
      console.error('Waitlist error:', waitlistResult.error);
      throw waitlistResult.error;
    }

    console.log('🎯 Inserting interests...');
    const interestsResult = await supabase
      .from('user_interests')
      .upsert(interests, { onConflict: 'user_id,interest_type' });
    
    if (interestsResult.error) {
      console.error('Interests error:', interestsResult.error);
      throw interestsResult.error;
    }

    console.log('✅ Simple test data created successfully');

    return NextResponse.json({
      success: true,
      message: 'Simple test data created successfully',
      summary: {
        users: testUsers.length,
        waitlistEntries: waitlistEntries.length,
        interests: interests.length,
        timeSlot: new Date(timeSlot11AM).toLocaleTimeString()
      }
    });

  } catch (error) {
    console.error('❌ Error creating simple test data:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
}