/**
 * UI-SPECIFIC TYPES
 * 
 * These types are used by the UI components and are separate from the database types
 * to avoid coupling the UI to the database schema.
 */

export interface TimeSlot {
  time: Date;
  deadline: Date;
}

export interface CircleData {
  circleId: string;
  locationName: string;
  sparkText: string;
}

export interface TimeSlotWithUserStatus {
  timeSlot: TimeSlot;
  isOnWaitlist: boolean;
  assignedCircleId: string | null;
  circleData: CircleData | null;
  buttonState: 'join' | 'leave' | 'confirmed' | 'feedback' | 'past';
  buttonText: string;
  middleText: string;
  isDisabled: boolean;
}

// Re-export commonly used database types for convenience
export type { 
  User, 
  UserWithInterests, 
  Circle, 
  CircleWithDetails, 
  WaitlistEntry, 
  Location, 
  ConversationSpark,
  ApiResponse,
  MatchingApiResponse 
} from '@/lib/database/types';