/**
 * CENTRALIZED TIME MANAGEMENT SYSTEM
 * 
 * This is the single source of truth for all time-related operations in the 27 Circle app.
 * All time handling MUST go through this module to ensure consistency.
 */

import { APP_TIME_OFFSET } from './constants';

// =============================================================================
// CORE TIME FUNCTIONS
// =============================================================================

/**
 * Get the current PST time with APP_TIME_OFFSET simulation
 * This is the ONLY function that should be used to get current time
 */
export function getCurrentPSTTime(): Date {
  const now = new Date();
  let pstTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
  
  // Apply APP_TIME_OFFSET if set for testing
  if (APP_TIME_OFFSET !== null) {
    pstTime.setHours(Math.floor(APP_TIME_OFFSET));
    pstTime.setMinutes((APP_TIME_OFFSET % 1) * 60);
    pstTime.setSeconds(0);
    pstTime.setMilliseconds(0);
  }
  
  return pstTime;
}

/**
 * Get the display date for the circles page
 * If after 8PM, show next day's slots
 */
export function getDisplayDate(currentTime?: Date): Date {
  const time = currentTime || getCurrentPSTTime();
  const displayDate = new Date(time);
  
  // After 8PM PST, show next day
  if (time.getHours() >= 20) {
    displayDate.setDate(displayDate.getDate() + 1);
  }
  
  // Set to start of day
  displayDate.setHours(0, 0, 0, 0);
  return displayDate;
}

/**
 * Convert any date to PST
 */
export function toPST(date: Date): Date {
  return new Date(date.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
}

/**
 * Convert PST time to UTC for database storage
 */
export function pstToUTC(pstDate: Date): Date {
  // PST is UTC-8, PDT is UTC-7
  // For simplicity, we'll assume PST (UTC-8) for now
  const utcTime = new Date(pstDate.getTime() + (8 * 60 * 60 * 1000));
  return utcTime;
}

// =============================================================================
// DAILY TIME SLOTS
// =============================================================================

export interface TimeSlot {
  time: Date;
  deadline: Date;
  slot: '11AM' | '2PM' | '5PM';
  hour: number;
}

/**
 * Create the three daily time slots for a given date
 */
export function createTimeSlots(displayDate?: Date): TimeSlot[] {
  const baseDate = displayDate || getDisplayDate();
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const date = baseDate.getDate();
  
  return [
    {
      time: new Date(year, month, date, 11, 0, 0, 0),
      deadline: new Date(year, month, date, 10, 0, 0, 0),
      slot: '11AM',
      hour: 11
    },
    {
      time: new Date(year, month, date, 14, 0, 0, 0),
      deadline: new Date(year, month, date, 13, 0, 0, 0),
      slot: '2PM',
      hour: 14
    },
    {
      time: new Date(year, month, date, 17, 0, 0, 0),
      deadline: new Date(year, month, date, 16, 0, 0, 0),
      slot: '5PM',
      hour: 17
    }
  ];
}

/**
 * Get the next time slot that's still accepting signups
 */
export function getNextAvailableSlot(currentTime?: Date): TimeSlot | null {
  const time = currentTime || getCurrentPSTTime();
  const slots = createTimeSlots(getDisplayDate(time));
  
  return slots.find(slot => time < slot.deadline) || null;
}

/**
 * Get time slots that are currently in deadline processing window
 */
export function getSlotsReadyForMatching(currentTime?: Date): TimeSlot[] {
  const time = currentTime || getCurrentPSTTime();
  const slots = createTimeSlots(getDisplayDate(time));
  
  return slots.filter(slot => {
    const currentHour = time.getHours();
    const currentMinutes = time.getMinutes();
    const slotDeadlineHour = slot.deadline.getHours();
    
    // Check if it's exactly the deadline time (within 1 minute)
    return currentHour === slotDeadlineHour && currentMinutes === 0;
  });
}

// =============================================================================
// SLOT STATE DETERMINATION
// =============================================================================

export type SlotState = 'pre-deadline' | 'post-deadline' | 'past-event';

/**
 * Determine the state of a time slot based on current time
 */
export function getSlotState(slot: TimeSlot, currentTime?: Date): SlotState {
  const time = currentTime || getCurrentPSTTime();
  const slotEndTime = new Date(slot.time);
  slotEndTime.setMinutes(slotEndTime.getMinutes() + 20); // 20 minutes after event
  
  if (time >= slotEndTime) {
    return 'past-event';
  } else if (time >= slot.deadline) {
    return 'post-deadline';
  } else {
    return 'pre-deadline';
  }
}

/**
 * Check if a slot is in the past (more than 20 minutes after start time)
 */
export function isSlotPast(slot: TimeSlot, currentTime?: Date): boolean {
  return getSlotState(slot, currentTime) === 'past-event';
}

/**
 * Check if a slot is still accepting signups (before deadline)
 */
export function isSlotAcceptingSignups(slot: TimeSlot, currentTime?: Date): boolean {
  return getSlotState(slot, currentTime) === 'pre-deadline';
}

/**
 * Check if a slot is in the confirmation window (after deadline, before event)
 */
export function isSlotInConfirmationWindow(slot: TimeSlot, currentTime?: Date): boolean {
  return getSlotState(slot, currentTime) === 'post-deadline';
}

// =============================================================================
// DATABASE TIME UTILITIES
// =============================================================================

/**
 * Create a time slot string for database queries (ISO format)
 */
export function createTimeSlotString(slot: TimeSlot): string {
  return slot.time.toISOString();
}

/**
 * Parse a time slot string from database back to Date
 */
export function parseTimeSlotString(timeSlotString: string): Date {
  return new Date(timeSlotString);
}

/**
 * Get start and end of day for database queries
 */
export function getDayBoundaries(date?: Date): { start: Date; end: Date } {
  const targetDate = date || getDisplayDate();
  const start = new Date(targetDate);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(targetDate);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}

// =============================================================================
// FORMATTING UTILITIES
// =============================================================================

/**
 * Format time for display in UI
 */
export function formatDisplayTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
}

/**
 * Format time for the specific display times shown in UI (11:05 AM, 2:05 PM, 5:05 PM)
 */
export function formatSlotDisplayTime(slot: TimeSlot): string {
  switch (slot.slot) {
    case '11AM':
      return '11:05 AM';
    case '2PM':
      return '2:05 PM';
    case '5PM':
      return '5:05 PM';
    default:
      return formatDisplayTime(slot.time);
  }
}

/**
 * Format deadline time for display
 */
export function formatDeadlineTime(slot: TimeSlot): string {
  return slot.deadline.toLocaleTimeString("en-US", {
    hour: "numeric",
    hour12: true
  });
}

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

/**
 * Validate that a time slot is valid for the current day
 */
export function isValidTimeSlot(timeSlotString: string, currentTime?: Date): boolean {
  try {
    const slotTime = parseTimeSlotString(timeSlotString);
    const { start, end } = getDayBoundaries(getDisplayDate(currentTime));
    
    return slotTime >= start && slotTime <= end;
  } catch {
    return false;
  }
}

// =============================================================================
// FEEDBACK TIMING
// =============================================================================

export type FeedbackWindow = {
  timeSlot: TimeSlot;
  feedbackStartTime: Date;
  feedbackEndTime: Date;
};

/**
 * Check if current time is in the feedback window for any events (30 minutes after event ends)
 */
export function getCurrentFeedbackWindow(currentTime?: Date): FeedbackWindow | null {
  const time = currentTime || getCurrentPSTTime();
  const slots = createTimeSlots(getDisplayDate(time));
  
  for (const slot of slots) {
    const eventEndTime = new Date(slot.time);
    eventEndTime.setMinutes(eventEndTime.getMinutes() + 20); // Event lasts 20 minutes
    
    const feedbackStartTime = new Date(eventEndTime);
    feedbackStartTime.setMinutes(feedbackStartTime.getMinutes() + 10); // 10 minutes after event ends
    
    const feedbackEndTime = new Date(feedbackStartTime);
    feedbackEndTime.setMinutes(feedbackEndTime.getMinutes() + 30); // 30 minute feedback window
    
    console.log(`📅 Event timing for ${slot.slot}:`, {
      eventStart: slot.time.toLocaleTimeString(),
      eventEnd: eventEndTime.toLocaleTimeString(), 
      feedbackStart: feedbackStartTime.toLocaleTimeString(),
      feedbackEnd: feedbackEndTime.toLocaleTimeString(),
      currentTime: time.toLocaleTimeString(),
      inWindow: time >= feedbackStartTime && time < feedbackEndTime
    });
    
    // Check if current time is in the feedback window
    if (time >= feedbackStartTime && time < feedbackEndTime) {
      return {
        timeSlot: slot,
        feedbackStartTime,
        feedbackEndTime,
      };
    }
  }
  
  return null;
}

/**
 * Check if a user needs to provide feedback for a specific event
 */
export function needsFeedback(timeSlot: TimeSlot, currentTime?: Date): boolean {
  const feedbackWindow = getCurrentFeedbackWindow(currentTime);
  return feedbackWindow?.timeSlot.slot === timeSlot.slot;
}

/**
 * Get the time when feedback will be required for a time slot
 */
export function getFeedbackTime(timeSlot: TimeSlot): Date {
  const eventEndTime = new Date(timeSlot.time);
  eventEndTime.setMinutes(eventEndTime.getMinutes() + 30); // 20 min event + 10 min buffer
  return eventEndTime;
}

/**
 * Get time zone info for logging and debugging
 */
export function getTimeZoneInfo(): {
  currentTime: Date;
  pstTime: Date;
  offset: number | null;
  timeZone: string;
} {
  const currentTime = new Date();
  const pstTime = getCurrentPSTTime();
  
  return {
    currentTime,
    pstTime,
    offset: APP_TIME_OFFSET,
    timeZone: 'America/Los_Angeles'
  };
}