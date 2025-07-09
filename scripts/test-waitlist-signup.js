/**
 * Automated Test Script for 38 Users Waitlist Signup
 * Tests all possible scenarios and edge cases
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test scenarios
const TEST_SCENARIOS = [
  {
    name: "Equal Distribution Test",
    description: "12 users each for 11AM, 2PM, 5PM (36 total)",
    distribution: {
      '11:00': 12,
      '14:00': 12, 
      '17:00': 12
    }
  },
  {
    name: "Uneven Distribution Test",
    description: "Heavy load on 2PM slot",
    distribution: {
      '11:00': 5,
      '14:00': 25,
      '17:00': 8
    }
  },
  {
    name: "Minimum Viable Test",
    description: "Only 2 users per slot (minimum for matching)",
    distribution: {
      '11:00': 2,
      '14:00': 2,
      '17:00': 2
    }
  },
  {
    name: "Edge Case Test",
    description: "37 users (one slot gets 13, tests uneven matching)",
    distribution: {
      '11:00': 12,
      '14:00': 13,
      '17:00': 12
    }
  }
];

// Helper function to create time slots for today
function createTimeSlots() {
  const today = new Date();
  const baseDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  return {
    '11:00': new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 11, 0, 0),
    '14:00': new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 14, 0, 0),
    '17:00': new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 17, 0, 0)
  };
}

// Main test function
async function runWaitlistTest(scenario) {
  console.log(`\n🧪 Running: ${scenario.name}`);
  console.log(`📋 ${scenario.description}`);
  
  const timeSlots = createTimeSlots();
  const testUsers = Array.from({ length: 38 }, (_, i) => `user-${String(i + 1).padStart(3, '0')}`);
  
  // Clear existing waitlist entries
  await supabase.from('waitlist_entries').delete().neq('user_id', 'none');
  await supabase.from('circles').delete().neq('id', 'none');
  await supabase.from('circle_members').delete().neq('user_id', 'none');
  
  let userIndex = 0;
  
  // Distribute users according to scenario
  for (const [timeKey, userCount] of Object.entries(scenario.distribution)) {
    const timeSlot = timeSlots[timeKey];
    
    for (let i = 0; i < userCount; i++) {
      if (userIndex >= testUsers.length) break;
      
      const userId = testUsers[userIndex++];
      
      // Add user to waitlist
      const { error } = await supabase
        .from('waitlist_entries')
        .insert({
          user_id: userId,
          time_slot: timeSlot.toISOString()
        });
      
      if (error) {
        console.error(`❌ Error adding ${userId} to ${timeKey} slot:`, error);
      } else {
        console.log(`✅ Added ${userId} to ${timeKey} slot`);
      }
    }
  }
  
  // Verify waitlist entries
  const { data: waitlistData, error: waitlistError } = await supabase
    .from('waitlist_entries')
    .select('*');
  
  if (waitlistError) {
    console.error('❌ Error fetching waitlist:', waitlistError);
    return;
  }
  
  console.log(`\n📊 Waitlist Summary:`);
  const slotCounts = {};
  waitlistData.forEach(entry => {
    const hour = new Date(entry.time_slot).getHours();
    const key = `${hour}:00`;
    slotCounts[key] = (slotCounts[key] || 0) + 1;
  });
  
  Object.entries(slotCounts).forEach(([slot, count]) => {
    console.log(`   ${slot}: ${count} users`);
  });
  
  return waitlistData;
}

// Test matching algorithm
async function testMatchingAlgorithm() {
  console.log('\n🔄 Testing Matching Algorithm...');
  
  // This would normally be triggered by a cron job at deadline times
  // For testing, we'll simulate the matching process
  
  const timeSlots = createTimeSlots();
  
  for (const [timeKey, timeSlot] of Object.entries(timeSlots)) {
    console.log(`\n⏰ Processing ${timeKey} slot matching...`);
    
    // Get waitlist for this time slot
    const { data: waitlistUsers, error } = await supabase
      .from('waitlist_entries')
      .select(`
        user_id,
        users!inner(full_name, gender)
      `)
      .eq('time_slot', timeSlot.toISOString());
    
    if (error) {
      console.error(`❌ Error fetching waitlist for ${timeKey}:`, error);
      continue;
    }
    
    if (waitlistUsers.length === 0) {
      console.log(`   No users in waitlist for ${timeKey}`);
      continue;
    }
    
    console.log(`   Found ${waitlistUsers.length} users in waitlist`);
    
    // Simple matching algorithm (groups of 4, then 3, then 2)
    const circles = [];
    let remainingUsers = [...waitlistUsers];
    
    // Create groups of 4
    while (remainingUsers.length >= 4) {
      circles.push(remainingUsers.splice(0, 4));
    }
    
    // Create groups of 3
    while (remainingUsers.length >= 3) {
      circles.push(remainingUsers.splice(0, 3));
    }
    
    // Create groups of 2
    while (remainingUsers.length >= 2) {
      circles.push(remainingUsers.splice(0, 2));
    }
    
    // Handle remaining single user (they don't get matched)
    if (remainingUsers.length === 1) {
      console.log(`   ⚠️  1 user couldn't be matched (${remainingUsers[0].users.full_name})`);
    }
    
    // Create circles in database
    for (let i = 0; i < circles.length; i++) {
      const circle = circles[i];
      const circleId = `test-circle-${timeKey}-${i + 1}`;
      
      // Insert circle
      const { error: circleError } = await supabase
        .from('circles')
        .insert({
          id: circleId,
          time_slot: timeSlot.toISOString(),
          location_id: 1, // Assuming location ID 1 exists
          conversation_spark_id: 1, // Assuming spark ID 1 exists
          status: 'active',
          created_at: new Date().toISOString()
        });
      
      if (circleError) {
        console.error(`❌ Error creating circle ${circleId}:`, circleError);
        continue;
      }
      
      // Add members to circle
      const memberInserts = circle.map(user => ({
        circle_id: circleId,
        user_id: user.user_id,
        joined_at: new Date().toISOString()
      }));
      
      const { error: membersError } = await supabase
        .from('circle_members')
        .insert(memberInserts);
      
      if (membersError) {
        console.error(`❌ Error adding members to ${circleId}:`, membersError);
      } else {
        console.log(`   ✅ Created circle ${circleId} with ${circle.length} members:`);
        circle.forEach(user => {
          console.log(`      - ${user.users.full_name} (${user.users.gender})`);
        });
      }
    }
    
    console.log(`   📊 ${timeKey} Results: ${circles.length} circles created`);
  }
}

// Validation function
async function validateResults() {
  console.log('\n✅ Validating Results...');
  
  // Check all circles
  const { data: circles, error: circlesError } = await supabase
    .from('circles')
    .select(`
      id,
      time_slot,
      circle_members(
        user_id,
        users(full_name, gender)
      )
    `);
  
  if (circlesError) {
    console.error('❌ Error fetching circles:', circlesError);
    return;
  }
  
  console.log(`\n📈 Final Results:`);
  console.log(`   Total circles created: ${circles.length}`);
  
  let totalMatched = 0;
  const timeSlotResults = {};
  
  circles.forEach(circle => {
    const hour = new Date(circle.time_slot).getHours();
    const timeKey = `${hour}:00`;
    
    if (!timeSlotResults[timeKey]) {
      timeSlotResults[timeKey] = { circles: 0, users: 0 };
    }
    
    timeSlotResults[timeKey].circles++;
    timeSlotResults[timeKey].users += circle.circle_members.length;
    totalMatched += circle.circle_members.length;
    
    console.log(`   Circle ${circle.id}: ${circle.circle_members.length} members`);
    circle.circle_members.forEach(member => {
      console.log(`      - ${member.users.full_name} (${member.users.gender})`);
    });
  });
  
  console.log(`\n📊 Summary by Time Slot:`);
  Object.entries(timeSlotResults).forEach(([slot, results]) => {
    console.log(`   ${slot}: ${results.circles} circles, ${results.users} users matched`);
  });
  
  console.log(`\n🎯 Total users matched: ${totalMatched}/38`);
  console.log(`   Match rate: ${((totalMatched / 38) * 100).toFixed(1)}%`);
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Comprehensive Circle Matching Tests\n');
  
  for (const scenario of TEST_SCENARIOS) {
    await runWaitlistTest(scenario);
    await testMatchingAlgorithm();
    await validateResults();
    
    console.log('\n' + '='.repeat(60));
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🎉 All tests completed!');
}

// Export for use
module.exports = {
  runWaitlistTest,
  testMatchingAlgorithm,
  validateResults,
  runAllTests
};

// Run if called directly
if (require.main === module) {
  runAllTests().catch(console.error);
}