/**
 * Centralized storage key generation for feedback system
 * 
 * This utility ensures consistent key formats across detection and submission
 * to prevent infinite loops and data mismatches.
 * 
 * MIGRATION: Updated to use new Storage utility instead of localStorage
 */

/**
 * Generate feedback storage key for both detection and submission
 * 
 * @param userId - User ID (e.g., 'dev-user-id')
 * @param eventId - Event ID in format YYYY-MM-DD_TIME_Circle_N
 * @returns Consistent storage key string
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
 * Legacy migration function (REMOVED)
 * Migration completed - localStorage feedback data no longer supported
 * All feedback data is now stored directly in Supabase via Storage utility
 */
async function migrateLegacyFeedbackKey(): Promise<null> {
  // Migration no longer needed - all data is in Supabase
  return null;
}

/**
 * Check if feedback exists for a given event
 * All feedback data is stored in Supabase via Storage utility
 * 
 * @param userId - User ID
 * @param timeSlot - Time slot (11AM, 2PM, 5PM)
 * @param date - Date object for the event
 * @returns Feedback record or null
 */
export async function getFeedbackRecord(
  userId: string, 
  timeSlot: string, 
  date: Date
): Promise<any | null> {
  const eventId = generateEventId(timeSlot, date);
  const key = generateFeedbackKey(userId, eventId);
  
  // Import Storage dynamically to avoid circular dependencies
  const { Storage } = await import('./storage');
  
  // Get data from Supabase storage
  return await Storage.get(key, null);
}

/**
 * Save feedback record with consistent key format
 * 
 * @param userId - User ID
 * @param eventId - Event ID
 * @param data - Feedback data
 * @returns Success boolean
 */
export async function saveFeedbackRecord(
  userId: string, 
  eventId: string, 
  data: any
): Promise<boolean> {
  const key = generateFeedbackKey(userId, eventId);
  
  const record = {
    ...data,
    userId,
    eventId,
    submittedAt: new Date().toISOString(),
  };
  
  try {
    // Import Storage dynamically to avoid circular dependencies
    const { Storage } = await import('./storage');
    const success = await Storage.set(key, record);
    
    if (success) {
      console.log('✅ Saved feedback record to Supabase:', { key, eventId });
    } else {
      console.error('❌ Failed to save feedback record to Supabase:', key);
    }
    
    return success;
  } catch (e) {
    console.error('Error saving feedback record:', e);
    return false;
  }
}