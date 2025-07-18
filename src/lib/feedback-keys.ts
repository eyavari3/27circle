/**
 * Centralized localStorage key generation for feedback system
 * 
 * This utility ensures consistent key formats across detection and submission
 * to prevent infinite loops and data mismatches.
 */

/**
 * Generate feedback localStorage key for both detection and submission
 * 
 * @param userId - User ID (e.g., 'dev-user-id')
 * @param eventId - Event ID in format YYYY-MM-DD_TIME_Circle_N
 * @returns Consistent localStorage key string
 */
export function generateFeedbackKey(userId: string, eventId: string): string {
  // Use eventId as the primary identifier for consistency
  return `feedback-${userId}-${eventId}`;
}

/**
 * Extract time slot from eventId for backward compatibility
 * 
 * @param eventId - Event ID in format YYYY-MM-DD_TIME_Circle_N
 * @returns Time slot (11AM, 2PM, 5PM)
 */
export function extractTimeSlotFromEventId(eventId: string): string {
  const match = eventId.match(/_(\d{1,2}[AP]M)_/);
  return match ? match[1] : eventId;
}

/**
 * Generate eventId from timeSlot and date for detection logic
 * 
 * @param timeSlot - Time slot string (11AM, 2PM, 5PM)
 * @param date - Date object for the event
 * @returns EventId in standard format
 */
export function generateEventId(timeSlot: string, date: Date): string {
  const dateStr = date.toISOString().split('T')[0];
  return `${dateStr}_${timeSlot}_Circle_1`;
}

/**
 * Migrate old localStorage keys to new format
 * 
 * @param userId - User ID
 * @param timeSlot - Time slot (11AM, 2PM, 5PM)
 * @param date - Date object for the event
 * @returns Migrated feedback data or null
 */
export function migrateLegacyFeedbackKey(
  userId: string, 
  timeSlot: string, 
  date: Date
): any | null {
  // Check for old format: feedback-${userId}-dev-event-${timeSlot}
  const oldKey = `feedback-${userId}-dev-event-${timeSlot}`;
  const oldData = localStorage.getItem(oldKey);
  
  if (oldData) {
    try {
      const data = JSON.parse(oldData);
      
      // Generate new eventId and key
      const eventId = generateEventId(timeSlot, date);
      const newKey = generateFeedbackKey(userId, eventId);
      
      // Update data with eventId if missing
      if (!data.eventId) {
        data.eventId = eventId;
      }
      
      // Save to new key format
      localStorage.setItem(newKey, JSON.stringify(data));
      
      // Remove old key to prevent conflicts
      localStorage.removeItem(oldKey);
      
      console.log('✅ Migrated feedback key:', { oldKey, newKey });
      return data;
    } catch (e) {
      console.error('Error migrating legacy feedback key:', e);
      // Remove malformed old key
      localStorage.removeItem(oldKey);
    }
  }
  
  return null;
}

/**
 * Check if feedback exists for a given event
 * Handles both new format and legacy migration
 * 
 * @param userId - User ID
 * @param timeSlot - Time slot (11AM, 2PM, 5PM)
 * @param date - Date object for the event
 * @returns Feedback record or null
 */
export function getFeedbackRecord(
  userId: string, 
  timeSlot: string, 
  date: Date
): any | null {
  const eventId = generateEventId(timeSlot, date);
  const key = generateFeedbackKey(userId, eventId);
  
  // Check new format first
  const newData = localStorage.getItem(key);
  if (newData) {
    try {
      return JSON.parse(newData);
    } catch (e) {
      console.error('Error parsing feedback record:', e);
      // Remove corrupted data
      localStorage.removeItem(key);
    }
  }
  
  // Check for legacy format and migrate
  return migrateLegacyFeedbackKey(userId, timeSlot, date);
}

/**
 * Save feedback record with consistent key format
 * 
 * @param userId - User ID
 * @param eventId - Event ID
 * @param data - Feedback data
 * @returns Success boolean
 */
export function saveFeedbackRecord(
  userId: string, 
  eventId: string, 
  data: any
): boolean {
  const key = generateFeedbackKey(userId, eventId);
  
  const record = {
    ...data,
    userId,
    eventId,
    submittedAt: new Date().toISOString(),
  };
  
  try {
    localStorage.setItem(key, JSON.stringify(record));
    console.log('✅ Saved feedback record:', { key, eventId });
    return true;
  } catch (e) {
    console.error('Error saving feedback record:', e);
    return false;
  }
}