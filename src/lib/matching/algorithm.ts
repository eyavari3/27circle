/**
 * BULLETPROOF MATCHING ALGORITHM
 * 
 * This module implements a robust matching algorithm with proper error handling,
 * validation, and atomic transactions for the 27 Circle app.
 */

import { dbAdmin, withTransaction } from '@/lib/database/client';
import { 
  MatchingUser, 
  MatchingResult, 
  MatchingSlotResult, 
  Circle,
  WaitlistEntry,
  Location,
  ConversationSpark,
  ApiResponse,
  createApiError,
  createApiSuccess 
} from '@/lib/database/types';
import { TimeSlot, createTimeSlotString } from '@/lib/time';

// =============================================================================
// MATCHING ALGORITHM CORE
// =============================================================================

/**
 * Main matching algorithm that groups users optimally
 * Implements specific distribution rules: 1=do nothing; 2-4=normal; 5=2+3; 6=2+4; 7-8=normal; 9=4+3+2; 10=4+4+2
 */
export async function runMatchingAlgorithm(users: MatchingUser[]): Promise<MatchingResult> {
  console.log(`🧮 Running matching algorithm for ${users.length} users`);
  
  if (users.length === 0) {
    return { circles: [], unmatchedUsers: [] };
  }
  
  // Validate user data
  const validUsers = users.filter(user => 
    user.user_id && 
    user.full_name && 
    user.gender && 
    Array.isArray(user.interests)
  );
  
  if (validUsers.length !== users.length) {
    console.warn(`⚠️ Filtered out ${users.length - validUsers.length} invalid users`);
  }
  
  const circles: MatchingUser[][] = [];
  let remainingUsers = [...validUsers];
  
  // Sort users by interest diversity (users with more interests first)
  remainingUsers.sort((a, b) => b.interests.length - a.interests.length);
  
  // Apply specific distribution rules
  const userCount = remainingUsers.length;
  console.log(`📏 Applying distribution rules for ${userCount} users`);
  
  if (userCount === 1) {
    // 1 = do nothing
    console.log(`🚫 1 user - no circles created`);
    return { circles: [], unmatchedUsers: remainingUsers };
  } else if (userCount >= 2 && userCount <= 4) {
    // 2-4 = normal (single group)
    console.log(`👥 ${userCount} users - creating single group`);
    const group = createOptimalGroup(remainingUsers, userCount);
    circles.push(group);
    remainingUsers = remainingUsers.filter(user => !group.includes(user));
  } else if (userCount === 5) {
    // 5 = 2+3
    console.log(`🎯 5 users - creating 2+3 distribution`);
    const group3 = createOptimalGroup(remainingUsers, 3);
    circles.push(group3);
    remainingUsers = remainingUsers.filter(user => !group3.includes(user));
    
    const group2 = createOptimalGroup(remainingUsers, 2);
    circles.push(group2);
    remainingUsers = remainingUsers.filter(user => !group2.includes(user));
  } else if (userCount === 6) {
    // 6 = 2+4
    console.log(`🎯 6 users - creating 2+4 distribution`);
    const group4 = createOptimalGroup(remainingUsers, 4);
    circles.push(group4);
    remainingUsers = remainingUsers.filter(user => !group4.includes(user));
    
    const group2 = createOptimalGroup(remainingUsers, 2);
    circles.push(group2);
    remainingUsers = remainingUsers.filter(user => !group2.includes(user));
  } else if (userCount >= 7 && userCount <= 8) {
    // 7-8 = normal (groups of 4 first, then 3, then 2)
    console.log(`👥 ${userCount} users - normal distribution`);
    while (remainingUsers.length >= 4) {
      const group = createOptimalGroup(remainingUsers, 4);
      circles.push(group);
      remainingUsers = remainingUsers.filter(user => !group.includes(user));
    }
    while (remainingUsers.length >= 3) {
      const group = createOptimalGroup(remainingUsers, 3);
      circles.push(group);
      remainingUsers = remainingUsers.filter(user => !group.includes(user));
    }
    while (remainingUsers.length >= 2) {
      const group = createOptimalGroup(remainingUsers, 2);
      circles.push(group);
      remainingUsers = remainingUsers.filter(user => !group.includes(user));
    }
  } else if (userCount === 9) {
    // 9 = 4+3+2
    console.log(`🎯 9 users - creating 4+3+2 distribution`);
    const group4 = createOptimalGroup(remainingUsers, 4);
    circles.push(group4);
    remainingUsers = remainingUsers.filter(user => !group4.includes(user));
    
    const group3 = createOptimalGroup(remainingUsers, 3);
    circles.push(group3);
    remainingUsers = remainingUsers.filter(user => !group3.includes(user));
    
    const group2 = createOptimalGroup(remainingUsers, 2);
    circles.push(group2);
    remainingUsers = remainingUsers.filter(user => !group2.includes(user));
  } else if (userCount === 10) {
    // 10 = 4+4+2
    console.log(`🎯 10 users - creating 4+4+2 distribution`);
    const group4a = createOptimalGroup(remainingUsers, 4);
    circles.push(group4a);
    remainingUsers = remainingUsers.filter(user => !group4a.includes(user));
    
    const group4b = createOptimalGroup(remainingUsers, 4);
    circles.push(group4b);
    remainingUsers = remainingUsers.filter(user => !group4b.includes(user));
    
    const group2 = createOptimalGroup(remainingUsers, 2);
    circles.push(group2);
    remainingUsers = remainingUsers.filter(user => !group2.includes(user));
  } else {
    // For counts > 10, use normal distribution (groups of 4 first, then 3, then 2)
    console.log(`👥 ${userCount} users - normal distribution (>10)`);
    while (remainingUsers.length >= 4) {
      const group = createOptimalGroup(remainingUsers, 4);
      circles.push(group);
      remainingUsers = remainingUsers.filter(user => !group.includes(user));
    }
    while (remainingUsers.length >= 3) {
      const group = createOptimalGroup(remainingUsers, 3);
      circles.push(group);
      remainingUsers = remainingUsers.filter(user => !group.includes(user));
    }
    while (remainingUsers.length >= 2) {
      const group = createOptimalGroup(remainingUsers, 2);
      circles.push(group);
      remainingUsers = remainingUsers.filter(user => !group.includes(user));
    }
  }
  
  console.log(`📊 Created ${circles.length} circles, ${remainingUsers.length} unmatched users`);
  console.log(`📈 Matching efficiency: ${((validUsers.length - remainingUsers.length) / validUsers.length * 100).toFixed(1)}%`);
  
  return {
    circles,
    unmatchedUsers: remainingUsers
  };
}

/**
 * Create an optimal group using advanced scoring algorithm
 */
function createOptimalGroup(availableUsers: MatchingUser[], targetSize: number): MatchingUser[] {
  if (availableUsers.length <= targetSize) {
    return availableUsers.slice(0, targetSize);
  }
  
  const group: MatchingUser[] = [];
  const remaining = [...availableUsers];
  
  // Track group composition
  const genderCounts: Record<string, number> = { male: 0, female: 0, 'non-binary': 0 };
  const interestCounts: Record<string, number> = {};
  
  for (let i = 0; i < targetSize; i++) {
    let bestUser: MatchingUser | null = null;
    let bestScore = -1;
    
    remaining.forEach(user => {
      const score = calculateUserScore(user, group, genderCounts, interestCounts, targetSize);
      
      if (score > bestScore) {
        bestScore = score;
        bestUser = user;
      }
    });
    
    if (bestUser) {
      group.push(bestUser);
      
      // Update tracking
      genderCounts[bestUser.gender] = (genderCounts[bestUser.gender] || 0) + 1;
      bestUser.interests.forEach(interest => {
        interestCounts[interest] = (interestCounts[interest] || 0) + 1;
      });
      
      // Remove from remaining
      const userIndex = remaining.indexOf(bestUser);
      remaining.splice(userIndex, 1);
    }
  }
  
  return group;
}

/**
 * Calculate a score for how well a user fits into a group
 */
function calculateUserScore(
  user: MatchingUser,
  currentGroup: MatchingUser[],
  genderCounts: Record<string, number>,
  interestCounts: Record<string, number>,
  targetSize: number
): number {
  let score = 0;
  
  // 1. Gender diversity (40% weight)
  const currentGenderCount = genderCounts[user.gender] || 0;
  const maxGenderCount = Math.ceil(targetSize * 0.6); // Allow up to 60% of one gender
  
  if (currentGenderCount < maxGenderCount) {
    score += 40 * (1 - currentGenderCount / maxGenderCount);
  }
  
  // 2. Interest diversity (35% weight)
  const userInterests = new Set(user.interests);
  const groupInterests = new Set<string>();
  currentGroup.forEach(member => {
    member.interests.forEach(interest => groupInterests.add(interest));
  });
  
  const sharedInterests = [...userInterests].filter(interest => groupInterests.has(interest));
  const newInterests = [...userInterests].filter(interest => !groupInterests.has(interest));
  
  // Prefer some shared interests (connection) but also new interests (diversity)
  score += newInterests.length * 8; // Up to 32 points for 4 new interests
  score += Math.min(sharedInterests.length, 2) * 3; // Up to 6 points for shared interests
  
  // 3. Interest balance within group (15% weight)
  let interestBalance = 0;
  user.interests.forEach(interest => {
    const currentCount = interestCounts[interest] || 0;
    const maxCount = Math.ceil(targetSize * 0.75); // Allow up to 75% for one interest
    
    if (currentCount < maxCount) {
      interestBalance += 15 / user.interests.length;
    }
  });
  score += interestBalance;
  
  // 4. Randomization factor (10% weight) - prevents deterministic grouping
  score += Math.random() * 10;
  
  return score;
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
  
  console.log(`🔄 Starting atomic matching process for ${slotHour}:00`);
  
  try {
    // Step 1: Validate slot timing
    const validation = await validateSlotForMatching(slot);
    if (!validation.success) {
      return validation;
    }
    
    // Step 2: Get waitlist users
    const waitlistResponse = await dbAdmin.getWaitlistForTimeSlot(slotTimeStr);
    if (!waitlistResponse.success) {
      return createApiError(new Error(`Failed to get waitlist: ${waitlistResponse.error}`), 'executeMatchingProcess');
    }
    
    const waitlistUsers = waitlistResponse.data || [];
    
    if (waitlistUsers.length === 0) {
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
    
    // Step 3: Transform users for matching
    const matchingUsers = await transformUsersForMatching(waitlistUsers);
    
    // Step 4: Run matching algorithm
    const matchingResult = await runMatchingAlgorithm(matchingUsers);
    
    // Step 5: Create circles atomically
    const circleIds = await createCirclesAtomically(matchingResult.circles, slot);
    
    // Step 6: Return results
    const result: MatchingSlotResult = {
      slot: slotHour,
      totalUsers: waitlistUsers.length,
      circlesCreated: matchingResult.circles.length,
      usersMatched: matchingResult.circles.reduce((sum, circle) => sum + circle.length, 0),
      unmatchedUsers: matchingResult.unmatchedUsers.length,
      circleIds
    };
    
    console.log(`✅ Atomic matching completed for ${slotHour}:00:`, result);
    return createApiSuccess(result);
    
  } catch (error) {
    console.error(`❌ Atomic matching failed for ${slotHour}:00:`, error);
    return createApiError(error, 'executeMatchingProcess');
  }
}

/**
 * Validate that a slot is ready for matching
 */
async function validateSlotForMatching(slot: TimeSlot): Promise<ApiResponse<boolean>> {
  try {
    // Check if slot has already been processed
    const existingCircles = await dbAdmin.getClient().then(supabase => 
      supabase
        .from('circles')
        .select('id')
        .eq('time_slot', slot.time.toISOString())
        .limit(1)
    );
    
    if (existingCircles.data && existingCircles.data.length > 0) {
      return createApiError(new Error('Slot has already been processed'), 'validateSlotForMatching');
    }
    
    return createApiSuccess(true);
  } catch (error) {
    return createApiError(error, 'validateSlotForMatching');
  }
}

/**
 * Transform waitlist users for matching algorithm
 */
async function transformUsersForMatching(waitlistData: any[]): Promise<MatchingUser[]> {
  return waitlistData.map(entry => ({
    user_id: entry.user_id,
    full_name: entry.users.full_name,
    gender: entry.users.gender,
    interests: entry.users.user_interests.map((ui: any) => ui.interest_type)
  }));
}

/**
 * Create circles atomically with proper error handling
 */
async function createCirclesAtomically(circles: MatchingUser[][], slot: TimeSlot): Promise<string[]> {
  if (circles.length === 0) {
    return [];
  }
  
  const circleIds: string[] = [];
  
  try {
    // Use atomic transaction for all circle creation
    const transactionResult = await withTransaction(
      circles.map(circle => async (supabase: any) => {
        const circleId = crypto.randomUUID();
        
        // Get available locations and sparks
        const [locationsResponse, sparksResponse] = await Promise.all([
          dbAdmin.getAvailableLocations(slot.time.toISOString()),
          dbAdmin.getAllConversationSparks()
        ]);
        
        if (!locationsResponse.success || !sparksResponse.success) {
          throw new Error('Failed to get locations or sparks');
        }
        
        const availableLocations = locationsResponse.data || [];
        const allSparks = sparksResponse.data || [];
        
        if (availableLocations.length === 0 || allSparks.length === 0) {
          throw new Error('No available locations or sparks');
        }
        
        // Select location and spark
        const locationIndex = circleIds.length % availableLocations.length;
        const assignedLocation = availableLocations[locationIndex];
        
        // Use same spark for all circles in the same time slot
        const sparkIndex = slot.hour % allSparks.length; // Consistent spark based on time slot
        const assignedSpark = allSparks[sparkIndex];
        
        // Create circle
        const circleData = {
          id: circleId,
          time_slot: slot.time.toISOString(),
          location_id: assignedLocation.id,
          conversation_spark_id: assignedSpark.id,
          status: 'active' as const,
          max_participants: circle.length
        };
        
        const { error: circleError } = await supabase
          .from('circles')
          .insert(circleData);
        
        if (circleError) {
          throw circleError;
        }
        
        // Add members
        const memberData = circle.map(user => ({
          circle_id: circleId,
          user_id: user.user_id
        }));
        
        const { error: membersError } = await supabase
          .from('circle_members')
          .insert(memberData);
        
        if (membersError) {
          throw membersError;
        }
        
        console.log(`✅ Created circle ${circleId} with ${circle.length} members at ${assignedLocation.name}`);
        circleIds.push(circleId);
        
        return circleId;
      })
    );
    
    if (!transactionResult.success) {
      throw new Error(`Transaction failed: ${transactionResult.error}`);
    }
    
    return circleIds;
    
  } catch (error) {
    console.error('❌ Atomic circle creation failed:', error);
    throw error;
  }
}

// =============================================================================
// MATCHING STATISTICS
// =============================================================================

/**
 * Calculate matching statistics for monitoring
 */
export function calculateMatchingStatistics(
  totalUsers: number,
  circles: MatchingUser[][],
  unmatchedUsers: MatchingUser[]
): {
  efficiency: number;
  averageGroupSize: number;
  genderDistribution: Record<string, number>;
  interestDistribution: Record<string, number>;
} {
  const matchedUsers = circles.flat();
  const efficiency = totalUsers > 0 ? (matchedUsers.length / totalUsers) * 100 : 0;
  const averageGroupSize = circles.length > 0 ? matchedUsers.length / circles.length : 0;
  
  // Gender distribution
  const genderDistribution: Record<string, number> = {};
  matchedUsers.forEach(user => {
    genderDistribution[user.gender] = (genderDistribution[user.gender] || 0) + 1;
  });
  
  // Interest distribution
  const interestDistribution: Record<string, number> = {};
  matchedUsers.forEach(user => {
    user.interests.forEach(interest => {
      interestDistribution[interest] = (interestDistribution[interest] || 0) + 1;
    });
  });
  
  return {
    efficiency,
    averageGroupSize,
    genderDistribution,
    interestDistribution
  };
}