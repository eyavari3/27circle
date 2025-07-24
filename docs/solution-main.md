// src/lib/time-utils.ts

/**
 * Simplified timezone utilities for 27 Circle
 * Uses UTC for consistency across environments
 */

/**
 * Creates a UTC date that represents a specific PST/PDT time
 * Handles DST automatically using the built-in timezone support
 */
export function createPSTDateAsUTC(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number = 0
): Date {
  // Create a date string in PST format
  // Month is 0-indexed in JS, but we expect 1-indexed input
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
  
  // Parse as PST/PDT time and convert to UTC
  // This handles DST automatically
  const pstDate = new Date(`${dateStr}T${timeStr}-08:00`); // PST
  const pdtDate = new Date(`${dateStr}T${timeStr}-07:00`); // PDT
  
  // Check which one gives us the correct hour in Pacific time
  const pstHour = parseInt(pstDate.toLocaleString('en-US', { 
    timeZone: 'America/Los_Angeles', 
    hour: 'numeric',
    hour12: false 
  }));
  
  return pstHour === hour ? pstDate : pdtDate;
}

/**
 * Gets the current time, respecting APP_TIME_OFFSET for testing
 * When offset is set, it represents the desired hour (e.g., 14.5 = 2:30 PM)
 */
export function getCurrentTime(): Date {
  const now = new Date();
  
  // Apply app time offset if in development
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_APP_TIME_OFFSET) {
    const offsetHours = parseFloat(process.env.NEXT_PUBLIC_APP_TIME_OFFSET);
    if (!isNaN(offsetHours)) {
      // Get today's date in PST
      const pstDateStr = now.toLocaleDateString('en-US', {
        timeZone: 'America/Los_Angeles',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
      });
      
      const [month, day, year] = pstDateStr.split('/').map(n => parseInt(n));
      
      // Set to the specific hour (offsetHours)
      const hours = Math.floor(offsetHours);
      const minutes = Math.round((offsetHours - hours) * 60);
      
      return createPSTDateAsUTC(year, month, day, hours, minutes);
    }
  }
  
  return now;
}

/**
 * Creates time slots for a given date
 * Returns UTC dates that represent 11:05 AM, 2:05 PM, 5:05 PM PST
 */
export function createTimeSlots(date: Date): Array<{
  id: string;
  slot: '11AM' | '2PM' | '5PM';
  time: Date;
  deadline: Date;
}> {
  // Get PST date components
  const pstDateStr = date.toLocaleDateString('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  });
  
  const [month, day, year] = pstDateStr.split('/').map(n => parseInt(n));
  
  const slots = [
    { slot: '11AM' as const, hour: 11, minute: 5, deadlineHour: 10 },
    { slot: '2PM' as const, hour: 14, minute: 5, deadlineHour: 13 },
    { slot: '5PM' as const, hour: 17, minute: 5, deadlineHour: 16 }
  ];
  
  return slots.map(({ slot, hour, minute, deadlineHour }) => ({
    id: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}_${slot}`,
    slot,
    time: createPSTDateAsUTC(year, month, day, hour, minute),
    deadline: createPSTDateAsUTC(year, month, day, deadlineHour, 0)
  }));
}

/**
 * Validates if a time slot matches our expected slots
 * Works with UTC dates that represent PST times
 */
export function isValidTimeSlot(date: Date): boolean {
  // Get the time in PST
  const pstTime = date.toLocaleTimeString('en-US', {
    timeZone: 'America/Los_Angeles',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // Check against our valid slots
  return ['11:05', '14:05', '17:05'].includes(pstTime);
}

/**
 * Formats a date for display in PST
 */
export function formatToPST(date: Date, format: 'time' | 'datetime' = 'time'): string {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'America/Los_Angeles',
  };
  
  if (format === 'time') {
    options.hour = 'numeric';
    options.minute = '2-digit';
    options.hour12 = true;
  } else {
    options.month = 'short';
    options.day = 'numeric';
    options.hour = 'numeric';
    options.minute = '2-digit';
    options.hour12 = true;
  }
  
  return date.toLocaleString('en-US', options);
}

/**
 * Gets the deadline time for display (e.g., "10:00 AM")
 */
export function getDeadlineDisplay(deadline: Date): string {
  return deadline.toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Checks if we're before, during, or after an event
 */
export function getTimeSlotPhase(
  slot: { time: Date; deadline: Date },
  currentTime: Date
): 'before-deadline' | 'during-event' | 'after-event' {
  const now = currentTime.getTime();
  const deadline = slot.deadline.getTime();
  const eventStart = slot.time.getTime();
  const eventEnd = eventStart + (20 * 60 * 1000); // 20 minutes
  
  if (now < deadline) return 'before-deadline';
  if (now >= eventStart && now < eventEnd) return 'during-event';
  return 'after-event';
}

/**
 * Simple test to verify timezone consistency
 */
export function verifyTimezoneSetup(): void {
  console.log('🕐 Timezone Verification');
  
  // Test slot creation
  const today = new Date();
  const slots = createTimeSlots(today);
  
  console.log('Today\'s slots:');
  slots.forEach(slot => {
    console.log(`- ${slot.slot}: ${formatToPST(slot.time)} (deadline: ${formatToPST(slot.deadline)})`);
    console.log(`  UTC: ${slot.time.toISOString()}`);
    console.log(`  Valid: ${isValidTimeSlot(slot.time)}`);
  });
  
  // Test APP_TIME_OFFSET
  console.log('\nCurrent time:', formatToPST(getCurrentTime()));
  if (process.env.NEXT_PUBLIC_APP_TIME_OFFSET) {
    console.log('APP_TIME_OFFSET is set to:', process.env.NEXT_PUBLIC_APP_TIME_OFFSET);
  }
}

// src/app/api/waitlist/actions.ts
// Updated validation functions to work with UTC dates

import { isValidTimeSlot } from '@/lib/time-utils';

/**
 * Validates a time slot before joining waitlist
 * This replaces the existing isValidTimeSlot function
 */
export async function validateTimeSlot(timeSlotISO: string): Promise<{
  valid: boolean;
  error?: string;
}> {
  try {
    // Parse the ISO string
    const timeSlot = new Date(timeSlotISO);
    
    // Check if it's a valid date
    if (isNaN(timeSlot.getTime())) {
      return { valid: false, error: 'Invalid date format' };
    }
    
    // Use the new validation function that handles UTC properly
    if (!isValidTimeSlot(timeSlot)) {
      return { valid: false, error: 'Invalid time slot. Must be 11:05 AM, 2:05 PM, or 5:05 PM PST' };
    }
    
    // Check if the deadline has passed
    const now = new Date();
    const deadline = new Date(timeSlot);
    deadline.setHours(deadline.getHours() - 1);
    deadline.setMinutes(0);
    
    if (now > deadline) {
      return { valid: false, error: 'Deadline has passed for this time slot' };
    }
    
    // Check if the slot is today or in the future
    const slotDatePST = timeSlot.toLocaleDateString('en-US', { 
      timeZone: 'America/Los_Angeles' 
    });
    const todayPST = now.toLocaleDateString('en-US', { 
      timeZone: 'America/Los_Angeles' 
    });
    
    if (slotDatePST < todayPST) {
      return { valid: false, error: 'Cannot join past time slots' };
    }
    
    return { valid: true };
  } catch (error) {
    console.error('Validation error:', error);
    return { valid: false, error: 'Validation failed' };
  }
}

// Example of how to update the existing joinWaitlist function
export async function joinWaitlist(userId: string, timeSlotISO: string) {
  // Validate first
  const validation = await validateTimeSlot(timeSlotISO);
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  
  // Your existing database logic here
  const supabase = createServiceClient();
  
  const { error } = await supabase
    .from('waitlist_entries')
    .insert({
      user_id: userId,
      time_slot: timeSlotISO, // Store as ISO string
      created_at: new Date().toISOString()
    });
    
  if (error) throw error;
  
  return { success: true };
}