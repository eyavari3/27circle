/**
 * SIMPLE AGE+GENDER MATCHING ALGORITHM
 * 
 * This module implements a simple matching algorithm based on age groups and gender,
 * with optimal group sizing and atomic transactions for the 27 Circle app.
 */

import { dbAdmin, withTransaction } from '@/lib/database/client';
import { 
  MatchingUser, 
  MatchingResult, 
  MatchingSlotResult, 
  Circle,
  WaitlistEntry,
  WaitlistQueryResult,
  Location,
  ConversationSpark,
  ApiResponse,
  createApiError,
  createApiSuccess 
} from '@/lib/database/types';
import { TimeSlot, createTimeSlotString } from '@/lib/time';

// =============================================================================
// CONSTANTS
// =============================================================================

/** Age boundary between young and older groups */
export const AGE_BOUNDARY = 25;

/** Minimum age for participation */
export const MIN_AGE = 18;

/** Maximum percentage of users that can be filtered before warning */
export const MAX_FILTER_RATE = 0.5; // 50%

// =============================================================================
// AGE CALCULATION UTILITY
// =============================================================================

/**
 * Calculate age from date of birth
 * @param dateOfBirth Date of birth as string (YYYY-MM-DD)
 * @returns Age in years, or null if invalid date
 */
export function calculateAge(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null;
  
  try {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    
    // Check for invalid date
    if (isNaN(birthDate.getTime())) return null;
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    // Adjust if birthday hasn't occurred this year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  } catch (error) {
    console.error('Error calculating age:', error);
    return null;
  }
}

/**
 * Get age group for a given age
 * @param age User's age
 * @returns '18-25' or '26+' or null if invalid
 */
export function getAgeGroup(age: number | null): '18-25' | '26+' | null {
  if (age === null || age < MIN_AGE) return null;
  return age <= AGE_BOUNDARY ? '18-25' : '26+';
}

// =============================================================================
// ENHANCED MATCHING USER TYPE
// =============================================================================

interface EnhancedMatchingUser extends MatchingUser {
  age: number | null;
  age_group: '18-25' | '26+' | null;
}

// =============================================================================
// OPTIMAL GROUP SIZING LOGIC
// =============================================================================

/**
 * Calculate optimal group sizes for N people
 * Rules: Min 2, Max 4, Special case for 5 = [3,2]
 * @param count Number of people to group
 * @returns Array of group sizes
 */
export function calculateOptimalGroupSizes(count: number): number[] {
  if (count <= 1) return [];
  if (count <= 4) return [count];
  if (count === 5) return [3, 2];
  
  const groups: number[] = [];
  let remaining = count;
  
  // Maximize groups of 4
  while (remaining >= 4) {
    // Special handling to avoid leaving exactly 1 person
    if (remaining === 5) {
      groups.push(3, 2);
      remaining = 0;
    } else {
      groups.push(4);
      remaining -= 4;
    }
  }
  
  // Handle remaining people (2 or 3)
  if (remaining >= 2) {
    groups.push(remaining);
  }
  
  return groups;
}

// =============================================================================
// MATCHING ALGORITHM CORE
// =============================================================================

/**
 * Simple age+gender based matching algorithm
 * Groups users by age group (18-25 vs 26+) and gender, then optimally sizes groups
 */
export async function runMatchingAlgorithm(users: MatchingUser[]): Promise<MatchingResult> {
  console.log(`🧮 Running simple age+gender matching for ${users.length} users`);
  
  if (users.length === 0) {
    return { circles: [], unmatchedUsers: [] };
  }
  
  // Enhance users with age data and filter invalid ones
  const enhancedUsers: EnhancedMatchingUser[] = users
    .map(user => {
      const age = calculateAge(user.date_of_birth);
      const age_group = getAgeGroup(age);
      return {
        ...user,
        age,
        age_group
      };
    })
    .filter(user => 
      user.user_id && 
      user.full_name && 
      user.gender && 
      user.age_group && // Must have valid age group
      ['male', 'female', 'non-binary'].includes(user.gender.toLowerCase())
    );
  
  const filteredCount = users.length - enhancedUsers.length;
  const filterRate = users.length > 0 ? filteredCount / users.length : 0;
  
  if (filteredCount > 0) {
    console.warn(`⚠️ Filtered out ${filteredCount} users (missing age/gender data)`);
    
    // Alert if too many users are being filtered (potential data issue)
    if (filterRate > MAX_FILTER_RATE) {
      console.error(`🚨 HIGH FILTER RATE: ${(filterRate * 100).toFixed(1)}% of users filtered. Check data quality!`);
    }
  }
  
  // Create buckets: age_group + gender
  const buckets: Record<string, EnhancedMatchingUser[]> = {};
  
  enhancedUsers.forEach(user => {
    const bucketKey = `${user.age_group}-${user.gender.toLowerCase()}`;
    if (!buckets[bucketKey]) {
      buckets[bucketKey] = [];
    }
    buckets[bucketKey].push(user);
  });
  
  console.log('📊 User distribution by bucket:');
  Object.entries(buckets).forEach(([bucket, users]) => {
    console.log(`   ${bucket}: ${users.length} users`);
  });
  
  // Process each bucket independently
  const allCircles: MatchingUser[][] = [];
  const allUnmatched: MatchingUser[] = [];
  
  Object.entries(buckets).forEach(([bucketKey, bucketUsers]) => {
    console.log(`\n🔄 Processing bucket: ${bucketKey} (${bucketUsers.length} users)`);
    
    const groupSizes = calculateOptimalGroupSizes(bucketUsers.length);
    console.log(`   Optimal group sizes: [${groupSizes.join(', ')}]`);
    
    let remainingUsers = [...bucketUsers];
    
    // Create groups according to optimal sizes
    groupSizes.forEach((size, index) => {
      if (remainingUsers.length >= size) {
        // Randomly shuffle and take first N users
        const shuffled = [...remainingUsers].sort(() => Math.random() - 0.5);
        const group = shuffled.slice(0, size);
        allCircles.push(group);
        
        // Remove selected users from remaining
        remainingUsers = remainingUsers.filter(user => !group.includes(user));
        
        console.log(`   Created group ${index + 1}: ${size} users`);
      }
    });
    
    // Add any leftover users to unmatched
    if (remainingUsers.length > 0) {
      allUnmatched.push(...remainingUsers);
      console.log(`   ${remainingUsers.length} users left unmatched`);
    }
  });
  
  console.log(`\n📈 Final Results:`);
  console.log(`   Total circles: ${allCircles.length}`);
  console.log(`   Total matched: ${allCircles.reduce((sum, circle) => sum + circle.length, 0)}`);
  console.log(`   Total unmatched: ${allUnmatched.length}`);
  console.log(`   Matching efficiency: ${((enhancedUsers.length - allUnmatched.length) / enhancedUsers.length * 100).toFixed(1)}%`);
  
  return {
    circles: allCircles,
    unmatchedUsers: allUnmatched
  };
}

// The complex group creation and scoring functions have been removed
// since the new algorithm uses simple random assignment within age+gender buckets

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
      return createApiError(new Error(validation.error || 'Slot validation failed'), 'executeMatchingProcess');
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
async function transformUsersForMatching(waitlistData: WaitlistQueryResult[]): Promise<MatchingUser[]> {
  return waitlistData.map(entry => ({
    user_id: entry.user_id,
    full_name: entry.users.full_name,
    gender: entry.users.gender,
    date_of_birth: entry.users.date_of_birth, // Include date_of_birth for age calculation
    interests: entry.users.user_interests?.map(ui => ui.interest_type) || []
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