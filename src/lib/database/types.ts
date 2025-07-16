/**
 * TYPE-SAFE DATABASE LAYER
 * 
 * This file defines all database types and interfaces for the 27 Circle app.
 * All database operations should use these types for type safety.
 */

// =============================================================================
// CORE DATABASE TYPES
// =============================================================================

export interface User {
  id: string; // UUID
  full_name: string | null;
  gender: 'male' | 'female' | 'non-binary' | null;
  date_of_birth: string | null; // ISO date string
  phone_number: string | null;
}

export interface UserInterest {
  user_id: string; // UUID
  interest_type: 'deep_thinking' | 'spiritual_growth' | 'new_activities' | 'community_service';
  created_at?: string; // ISO timestamp
}

export interface Location {
  id: string; // UUID
  name: string;
  description: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
}

export interface ConversationSpark {
  id: string; // UUID
  spark_text: string;
}

export interface Circle {
  id: string; // UUID
  time_slot: string; // ISO timestamp
  location_id: string | null; // UUID
  conversation_spark_id: string | null; // UUID
  status: 'forming' | 'active' | 'completed' | 'cancelled';
  max_participants: number;
  created_at: string; // ISO timestamp
}

export interface WaitlistEntry {
  id: string; // UUID
  user_id: string; // UUID
  time_slot: string; // ISO timestamp
  created_at: string; // ISO timestamp
}

export interface CircleMember {
  circle_id: string; // UUID
  user_id: string; // UUID
}

// =============================================================================
// JOINED/ENRICHED TYPES
// =============================================================================

export interface UserWithInterests {
  id: string;
  full_name: string | null;
  gender: 'male' | 'female' | 'non-binary' | null;
  date_of_birth: string | null;
  phone_number: string | null;
  user_interests: UserInterest[];
}

export interface CircleWithDetails {
  id: string;
  time_slot: string;
  status: Circle['status'];
  max_participants: number;
  created_at: string;
  location: Location | null;
  conversation_spark: ConversationSpark | null;
  members: UserWithInterests[];
}

export interface WaitlistWithUser {
  id: string;
  user_id: string;
  time_slot: string;
  created_at: string;
  user: User;
}

// =============================================================================
// MATCHING ALGORITHM TYPES
// =============================================================================

export interface MatchingUser {
  user_id: string;
  full_name: string;
  gender: 'male' | 'female' | 'non-binary';
  date_of_birth: string | null; // Required for age calculation
  interests: string[];
}

export interface MatchingResult {
  circles: MatchingUser[][];
  unmatchedUsers: MatchingUser[];
}

export interface MatchingSlotResult {
  slot: number;
  totalUsers: number;
  circlesCreated: number;
  usersMatched: number;
  unmatchedUsers: number;
  circleIds: string[];
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface DatabaseError {
  code: string;
  message: string;
  details?: any;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: DatabaseError;
}

export interface MatchingApiResponse {
  success: boolean;
  processedAt: string;
  results: MatchingSlotResult[];
  error?: string;
  message?: string;
}

// =============================================================================
// QUERY RESULT TYPES
// =============================================================================

export interface WaitlistQueryResult {
  user_id: string;
  users: {
    id: string;
    full_name: string;
    gender: 'male' | 'female' | 'non-binary';
    date_of_birth: string | null; // Required for age calculation
    user_interests: { interest_type: string }[];
  };
}

export interface CircleQueryResult {
  circle_id: string;
  circles: {
    time_slot: string;
    locations: { name: string } | null;
    conversation_sparks: { spark_text: string } | null;
  };
}

// =============================================================================
// VALIDATION TYPES
// =============================================================================

export interface TimeSlotValidation {
  isValid: boolean;
  error?: string;
  timeSlot?: Date;
}

export interface UserValidation {
  isValid: boolean;
  error?: string;
  missingFields?: string[];
}

// =============================================================================
// STATISTICS TYPES
// =============================================================================

export interface CircleStatistics {
  totalCircles: number;
  totalUsers: number;
  averageParticipants: number;
  completionRate: number;
  interestDistribution: Record<string, number>;
  genderDistribution: Record<string, number>;
}

export interface DailyStats {
  date: string;
  slot11AM: {
    signups: number;
    matched: number;
    unmatched: number;
  };
  slot2PM: {
    signups: number;
    matched: number;
    unmatched: number;
  };
  slot5PM: {
    signups: number;
    matched: number;
    unmatched: number;
  };
}

// =============================================================================
// SUPABASE SPECIFIC TYPES
// =============================================================================

export interface SupabaseResponse<T> {
  data: T | null;
  error: {
    message: string;
    details: string | null;
    hint: string | null;
    code: string;
  } | null;
}

export type SupabaseQueryResult<T> = Promise<SupabaseResponse<T>>;

// =============================================================================
// TYPE GUARDS
// =============================================================================

export function isUser(obj: any): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    (obj.full_name === null || typeof obj.full_name === 'string') &&
    (obj.gender === null || ['male', 'female', 'non-binary'].includes(obj.gender)) &&
    (obj.date_of_birth === null || typeof obj.date_of_birth === 'string') &&
    (obj.phone_number === null || typeof obj.phone_number === 'string')
  );
}

export function isValidInterestType(interest: string): interest is UserInterest['interest_type'] {
  return ['deep_thinking', 'spiritual_growth', 'new_activities', 'community_service'].includes(interest);
}

export function isValidCircleStatus(status: string): status is Circle['status'] {
  return ['forming', 'active', 'completed', 'cancelled'].includes(status);
}

export function isValidGender(gender: string | null): gender is User['gender'] {
  return gender !== null && ['male', 'female', 'non-binary'].includes(gender);
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export function validateTimeSlot(timeSlot: string): TimeSlotValidation {
  try {
    const date = new Date(timeSlot);
    if (isNaN(date.getTime())) {
      return { isValid: false, error: 'Invalid date format' };
    }
    
    const hour = date.getHours();
    if (![11, 14, 17].includes(hour)) {
      return { isValid: false, error: 'Invalid time slot hour' };
    }
    
    return { isValid: true, timeSlot: date };
  } catch (error) {
    return { isValid: false, error: 'Failed to parse time slot' };
  }
}

export function validateUser(user: Partial<User>): UserValidation {
  const missingFields: string[] = [];
  
  if (!user.id) missingFields.push('id');
  if (!user.full_name) missingFields.push('full_name');
  if (!user.gender) missingFields.push('gender');
  if (!user.date_of_birth) missingFields.push('date_of_birth');
  
  if (missingFields.length > 0) {
    return {
      isValid: false,
      error: `Missing required fields: ${missingFields.join(', ')}`,
      missingFields
    };
  }
  
  if (user.gender && !isValidGender(user.gender)) {
    return {
      isValid: false,
      error: 'Invalid gender value'
    };
  }
  
  return { isValid: true };
}

export function createApiError(error: unknown, context?: string): ApiResponse {
  console.error(`API Error${context ? ` in ${context}` : ''}:`, error);
  
  if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
    return {
      success: false,
      error: (error as DatabaseError).message,
      details: error as DatabaseError
    };
  }
  
  return {
    success: false,
    error: error instanceof Error ? error.message : 'Unknown error occurred'
  };
}

export function createApiSuccess<T>(data?: T): ApiResponse<T> {
  return {
    success: true,
    data
  };
}