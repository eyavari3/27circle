import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface TestUser {
  id: string;
  full_name: string;
  gender: 'male' | 'female' | 'non-binary';
  date_of_birth: string;
  phone_number: string;
}

interface TestWaitlistEntry {
  user_id: string;
  time_slot: string;
}

interface TestInterestEntry {
  user_id: string;
  interest_type: string;
}

export async function POST() {
  try {
    // Use service role to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get time slots for today
    const today = new Date();
    const timeSlots = [
      new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 0, 0).toISOString(), // 11 AM
      new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0, 0).toISOString(), // 2 PM  
      new Date(today.getFullYear(), today.getMonth(), today.getDate(), 17, 0, 0).toISOString()  // 5 PM
    ];

    console.log('🚀 Creating test users for time slots:', timeSlots.map(slot => new Date(slot).toLocaleTimeString()));

    const allUsers: TestUser[] = [];
    const allWaitlistEntries: TestWaitlistEntry[] = [];
    const allInterestEntries: TestInterestEntry[] = [];

    // Generate users for each time slot
    for (let slotIndex = 0; slotIndex < timeSlots.length; slotIndex++) {
      console.log(`📅 Generating 40 users for slot ${slotIndex + 1}...`);
      
      for (let userIndex = 0; userIndex < 40; userIndex++) {
        const userId = `test-user-${slotIndex}-${userIndex}`;
        
        // Stanford demographics: 20F, 18M, 2NB per slot
        let gender: 'male' | 'female' | 'non-binary';
        if (userIndex < 20) gender = 'female';
        else if (userIndex < 38) gender = 'male';
        else gender = 'non-binary';
        
        // Age distribution: 80% are 18-25 (32 people), 20% are 26+ (8 people)
        let age: number;
        if (userIndex < 32) {
          age = 18 + Math.floor(Math.random() * 8); // 18-25
        } else {
          age = 26 + Math.floor(Math.random() * 15); // 26-40
        }
        
        // Calculate date of birth from age
        const currentYear = new Date().getFullYear();
        const birthYear = currentYear - age;
        const birthMonth = Math.floor(Math.random() * 12) + 1;
        const birthDay = Math.floor(Math.random() * 28) + 1;
        const dateOfBirth = `${birthYear}-${birthMonth.toString().padStart(2, '0')}-${birthDay.toString().padStart(2, '0')}`;
        
        // Random interests
        const allInterests = ['deep_thinking', 'spiritual_growth', 'new_activities', 'community_service'];
        const numInterests = Math.floor(Math.random() * 3) + 1; // 1-3 interests
        const shuffledInterests = [...allInterests].sort(() => Math.random() - 0.5);
        const interests = shuffledInterests.slice(0, numInterests);
        
        // Add to arrays
        allUsers.push({
          id: userId,
          full_name: `Test User ${slotIndex}-${userIndex} (${gender.charAt(0).toUpperCase()}, ${age})`,
          gender,
          date_of_birth: dateOfBirth,
          phone_number: `+1555${slotIndex}${userIndex.toString().padStart(2, '0')}1234`
        });
        
        allWaitlistEntries.push({
          user_id: userId,
          time_slot: timeSlots[slotIndex]
        });
        
        interests.forEach(interest => {
          allInterestEntries.push({
            user_id: userId,
            interest_type: interest
          });
        });
      }
    }

    console.log(`📊 Summary: ${allUsers.length} users, ${allWaitlistEntries.length} waitlist entries, ${allInterestEntries.length} interests`);

    // Insert data
    console.log('👥 Inserting users...');
    const { error: usersError } = await supabase
      .from('users')
      .upsert(allUsers, { onConflict: 'id' });
    
    if (usersError) throw usersError;

    console.log('📝 Inserting waitlist entries...');
    const { error: waitlistError } = await supabase
      .from('waitlist_entries')
      .upsert(allWaitlistEntries, { onConflict: 'user_id,time_slot' });
    
    if (waitlistError) throw waitlistError;

    console.log('🎯 Inserting user interests...');
    const { error: interestsError } = await supabase
      .from('user_interests')
      .upsert(allInterestEntries, { onConflict: 'user_id,interest_type' });
    
    if (interestsError) throw interestsError;

    return NextResponse.json({
      success: true,
      message: 'Test data created successfully',
      summary: {
        users: allUsers.length,
        waitlistEntries: allWaitlistEntries.length,
        interests: allInterestEntries.length,
        timeSlots: timeSlots.map(slot => new Date(slot).toLocaleTimeString())
      }
    });

  } catch (error) {
    console.error('❌ Error creating test data:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}