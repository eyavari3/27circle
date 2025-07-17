/**
 * SIMPLE MVP MATCHING ALGORITHM
 * 
 * This module implements a simple MVP matching algorithm where all users
 * join one massive circle with no demographic matching or group sizing.
 */

import { DatabaseClient } from '@/lib/database/client';
import { 
  MatchingUser, 
  MatchingResult, 
  MatchingSlotResult, 
  ApiResponse,
  createApiError,
  createApiSuccess 
} from '@/lib/database/types';
import { TimeSlot, createTimeSlotString } from '@/lib/time';
import { generateCircleId } from '@/lib/circle-id-utils';

// Create database client instance
const dbClient = new DatabaseClient(true); // Use service role

// =============================================================================
// AGE-BASED MATCHING ALGORITHM
// =============================================================================

/**
 * Age-based matching algorithm with optimal group sizing
 * Separates users into age groups (18-35 vs 36+) and creates optimal circles
 */
export async function runMatchingAlgorithm(users: MatchingUser[]): Promise<MatchingResult> {
  console.log(`🧮 Running age-based matching for ${users.length} users`);
  
  if (users.length === 0) {
    return { circles: [], unmatchedUsers: [] };
  }
  
  // Filter out invalid users (basic validation + age requirement)
  const validUsers = users.filter(user => {
    if (!user.user_id || !user.full_name || !user.gender || !user.date_of_birth) {
      return false;
    }
    
    // Calculate age and ensure user is 18+
    const age = calculateAge(user.date_of_birth);
    if (age < 18) {
      console.warn(`⚠️ User ${user.user_id} is under 18 (age: ${age}), excluding from matching`);
      return false;
    }
    
    return true;
  });
  
  const filteredCount = users.length - validUsers.length;
  if (filteredCount > 0) {
    console.warn(`⚠️ Filtered out ${filteredCount} users (missing data or under 18)`);
  }
  
  if (validUsers.length === 0) {
    return { circles: [], unmatchedUsers: [] };
  }
  
  // Separate users by age groups: 18-35 and 36+
  const youngUsers = validUsers.filter(user => {
    const age = calculateAge(user.date_of_birth as string);
    return age >= 18 && age <= 35;
  });
  
  const olderUsers = validUsers.filter(user => {
    const age = calculateAge(user.date_of_birth as string);
    return age >= 36;
  });
  
  console.log(`👥 Age group distribution:`);
  console.log(`   18-35 age group: ${youngUsers.length} users`);
  console.log(`   36+ age group: ${olderUsers.length} users`);
  
  // Create circles for each age group
  const allCircles: MatchingUser[][] = [];
  
  // Process young users (18-35)
  if (youngUsers.length > 0) {
    const youngCircles = createOptimalCircles(youngUsers);
    allCircles.push(...youngCircles);
    console.log(`   Created ${youngCircles.length} circles for 18-35 age group`);
  }
  
  // Process older users (36+)
  if (olderUsers.length > 0) {
    const olderCircles = createOptimalCircles(olderUsers);
    allCircles.push(...olderCircles);
    console.log(`   Created ${olderCircles.length} circles for 36+ age group`);
  }
  
  const totalMatched = allCircles.reduce((sum, circle) => sum + circle.length, 0);
  
  console.log(`📊 Age-based matching results:`);
  console.log(`   Total users: ${validUsers.length}`);
  console.log(`   Circles created: ${allCircles.length}`);
  console.log(`   Users matched: ${totalMatched}`);
  console.log(`   Unmatched users: 0`);
  console.log(`   Matching efficiency: 100%`);
  
  return {
    circles: allCircles,
    unmatchedUsers: []
  };
}

/**
 * Calculate age from date of birth
 */
function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Create optimal circles from a group of users
 * Uses the group sizing logic from INITIAL.md:
 * - 1 person: Gets their own circle
 * - 2-4 people: Single group
 * - 5 people: 3 + 2 (not 4 + 1)
 * - 6+ people: Maximize groups of 4, then 3, then 2
 */
function createOptimalCircles(users: MatchingUser[]): MatchingUser[][] {
  const circles: MatchingUser[][] = [];
  let remainingUsers = [...users];
  
  // Shuffle users for randomization
  for (let i = remainingUsers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [remainingUsers[i], remainingUsers[j]] = [remainingUsers[j], remainingUsers[i]];
  }
  
  while (remainingUsers.length > 0) {
    if (remainingUsers.length === 1) {
      // Single user gets their own circle
      circles.push([remainingUsers[0]]);
      remainingUsers = [];
    } else if (remainingUsers.length === 2) {
      // Two users form a circle
      circles.push([remainingUsers[0], remainingUsers[1]]);
      remainingUsers = [];
    } else if (remainingUsers.length === 3) {
      // Three users form a circle
      circles.push([remainingUsers[0], remainingUsers[1], remainingUsers[2]]);
      remainingUsers = [];
    } else if (remainingUsers.length === 4) {
      // Four users form a circle
      circles.push([remainingUsers[0], remainingUsers[1], remainingUsers[2], remainingUsers[3]]);
      remainingUsers = [];
    } else if (remainingUsers.length === 5) {
      // 5 people: 3 + 2 (not 4 + 1)
      circles.push([remainingUsers[0], remainingUsers[1], remainingUsers[2]]);
      circles.push([remainingUsers[3], remainingUsers[4]]);
      remainingUsers = [];
    } else {
      // 6+ people: Maximize groups of 4
      circles.push([remainingUsers[0], remainingUsers[1], remainingUsers[2], remainingUsers[3]]);
      remainingUsers = remainingUsers.slice(4);
    }
  }
  
  return circles;
}

// =============================================================================
// ATOMIC MATCHING PROCESS
// =============================================================================

/**
 * Execute the complete matching process atomically
 */
export async function executeMatchingProcess(slot: TimeSlot): Promise<ApiResponse<MatchingSlotResult>> {
  const slotTimeStr = createTimeSlotString(slot);
  const slotHour = slot.hour;
  
  console.log(`🔄 Starting MVP matching process for ${slotHour}:00`);
  
  try {
    // Validate slot is ready for matching
    const validationResult = await validateSlotForMatching(slot);
    if (!validationResult.success) {
      return createApiError(validationResult.error || 'Slot validation failed');
    }
    
         // Get waitlist users for this slot
     const supabase = await dbClient.getClient();
     const { data: waitlistData, error: waitlistError } = await supabase
       .from('waitlist_entries')
       .select(`
         user_id,
         users!inner(
           id,
           full_name,
           gender,
           date_of_birth
         )
       `)
       .eq('time_slot', slotTimeStr);
    
    if (waitlistError) {
      console.error('❌ Error fetching waitlist:', waitlistError);
      return createApiError('Failed to fetch waitlist data');
    }
    
    if (!waitlistData || waitlistData.length === 0) {
      console.log(`📭 No users in waitlist for ${slotHour}:00`);
      return createApiSuccess({
        slot: slotHour,
        totalUsers: 0,
        circlesCreated: 0,
        usersMatched: 0,
        unmatchedUsers: 0,
        circleIds: []
      });
    }
    
    console.log(`👥 Found ${waitlistData.length} users in waitlist for ${slotHour}:00`);
    
    // Transform data for matching algorithm
    const matchingUsers = await transformUsersForMatching(waitlistData);
    
    // Run the simple MVP matching algorithm
    const matchingResult = await runMatchingAlgorithm(matchingUsers);
    
    if (matchingResult.circles.length === 0) {
      console.log(`⚠️ No circles created for ${slotHour}:00`);
      return createApiSuccess({
        slot: slotHour,
        totalUsers: matchingUsers.length,
        circlesCreated: 0,
        usersMatched: 0,
        unmatchedUsers: matchingUsers.length,
        circleIds: []
      });
    }
    
         // Create circles in database atomically
     const circleIds = await createCirclesAtomically(matchingResult.circles, slot);
    
    const totalMatched = matchingResult.circles.reduce((sum, circle) => sum + circle.length, 0);
    
    console.log(`✅ MVP matching completed for ${slotHour}:00`);
    console.log(`   Circles created: ${matchingResult.circles.length}`);
    console.log(`   Users matched: ${totalMatched}`);
    console.log(`   Unmatched: ${matchingResult.unmatchedUsers.length}`);
    
    return createApiSuccess({
      slot: slotHour,
      totalUsers: matchingUsers.length,
      circlesCreated: matchingResult.circles.length,
      usersMatched: totalMatched,
      unmatchedUsers: matchingResult.unmatchedUsers.length,
      circleIds
    });
    
  } catch (error) {
    console.error(`❌ Error in MVP matching process for ${slotHour}:00:`, error);
    return createApiError(error instanceof Error ? error.message : 'Unknown error');
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Validate that a slot is ready for matching
 */
async function validateSlotForMatching(slot: TimeSlot): Promise<ApiResponse<boolean>> {
  const slotTimeStr = createTimeSlotString(slot);
  
     // Check if circles already exist for this slot
   const supabase = await dbClient.getClient();
   const { data: existingCircles, error: circlesError } = await supabase
     .from('circles')
     .select('id')
     .eq('time_slot', slotTimeStr);
  
  if (circlesError) {
    console.error('❌ Error checking existing circles:', circlesError);
    return createApiError('Failed to check existing circles');
  }
  
  if (existingCircles && existingCircles.length > 0) {
    console.warn(`⚠️ Circles already exist for ${slot.hour}:00 slot`);
    return createApiError('Matching already completed for this slot');
  }
  
  return createApiSuccess(true);
}

 /**
  * Transform waitlist data for matching algorithm
  */
 async function transformUsersForMatching(waitlistData: unknown[]): Promise<MatchingUser[]> {
   return waitlistData.map((entry: any) => ({
     user_id: entry.user_id,
     full_name: entry.users.full_name,
     gender: entry.users.gender,
     date_of_birth: entry.users.date_of_birth,
     interests: [] // MVP: No interests collected
   }));
 }

 /**
  * Create circles in database atomically
  */
 async function createCirclesAtomically(circles: MatchingUser[][], slot: TimeSlot): Promise<string[]> {
   const supabase = await dbClient.getClient();
   const circleIds: string[] = [];
   
   for (let i = 0; i < circles.length; i++) {
     const circle = circles[i];
     const circleId = generateCircleId(slot.time, i + 1);
     
     // Get default location and spark
     const { data: location } = await supabase
       .from('locations')
       .select('id')
       .limit(1)
       .single();
     
     const { data: spark } = await supabase
       .from('conversation_sparks')
       .select('id')
       .limit(1)
       .single();
     
     // Create circle
     const { error: circleError } = await supabase
       .from('circles')
       .insert({
         id: circleId,
         time_slot: createTimeSlotString(slot),
         location_id: location?.id || null,
         conversation_spark_id: spark?.id || null,
         status: 'active',
         max_participants: circle.length
       });
     
     if (circleError) {
       throw new Error(`Failed to create circle: ${circleError.message}`);
     }
     
     // Add all users to the circle
     const memberInserts = circle.map(user => ({
       circle_id: circleId,
       user_id: user.user_id
     }));
     
     const { error: membersError } = await supabase
       .from('circle_members')
       .insert(memberInserts);
     
     if (membersError) {
       throw new Error(`Failed to add members to circle: ${membersError.message}`);
     }
     
     circleIds.push(circleId);
     console.log(`   Created circle ${circleId} with ${circle.length} members`);
   }
   
   return circleIds;
 }

// =============================================================================
// STATISTICS (Simplified for MVP)
// =============================================================================

export function calculateMatchingStatistics(
  totalUsers: number,
  circles: MatchingUser[][]
): {
  efficiency: number;
  averageGroupSize: number;
  genderDistribution: Record<string, number>;
  interestDistribution: Record<string, number>;
} {
  const totalMatched = circles.reduce((sum, circle) => sum + circle.length, 0);
  const efficiency = totalUsers > 0 ? (totalMatched / totalUsers) * 100 : 0;
  const averageGroupSize = circles.length > 0 ? totalMatched / circles.length : 0;
  
  // MVP: Simple gender distribution
  const genderDistribution: Record<string, number> = {};
  circles.flat().forEach(user => {
    genderDistribution[user.gender] = (genderDistribution[user.gender] || 0) + 1;
  });
  
  // MVP: No interest distribution (not collected in MVP)
  const interestDistribution: Record<string, number> = {};
  
  return {
    efficiency,
    averageGroupSize,
    genderDistribution,
    interestDistribution
  };
}