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

// Create database client instance
const dbClient = new DatabaseClient(true); // Use service role

// =============================================================================
// SIMPLE MVP MATCHING ALGORITHM
// =============================================================================

/**
 * Simple MVP matching algorithm - all users go to one massive circle
 * No demographic matching, no group sizing, no complexity
 */
export async function runMatchingAlgorithm(users: MatchingUser[]): Promise<MatchingResult> {
  console.log(`🧮 Running simple MVP matching for ${users.length} users`);
  
  if (users.length === 0) {
    return { circles: [], unmatchedUsers: [] };
  }
  
  // Filter out invalid users (basic validation only)
  const validUsers = users.filter(user => 
    user.user_id && 
    user.full_name && 
    user.gender
  );
  
  const filteredCount = users.length - validUsers.length;
  if (filteredCount > 0) {
    console.warn(`⚠️ Filtered out ${filteredCount} users (missing basic data)`);
  }
  
  if (validUsers.length === 0) {
    return { circles: [], unmatchedUsers: [] };
  }
  
  // MVP: Create ONE massive circle with ALL users
  const massiveCircle = validUsers;
  
  console.log(`📊 MVP Results:`);
  console.log(`   Total users: ${validUsers.length}`);
  console.log(`   Circles created: 1 (massive circle)`);
  console.log(`   Users matched: ${validUsers.length}`);
  console.log(`   Unmatched users: 0`);
  console.log(`   Matching efficiency: 100%`);
  
  return {
    circles: [massiveCircle],
    unmatchedUsers: []
  };
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
     const circleId = `circle-${slot.hour}h-${Date.now()}-${i}`;
     
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