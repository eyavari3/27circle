/**
 * Utility functions for generating consistent circle IDs across the application
 * Avoids duplication and ensures consistent formatting
 */

/**
 * Generate a circle ID in the format: YYYY-MM-DD_11AM_Circle_1
 */
export function generateCircleId(timeSlot: Date, circleIndex: number = 1): string {
  const date = new Date(timeSlot);
  const dateStr = date.toISOString().split('T')[0];
  const hour = timeSlot.getHours();
  const timeSlotStr = hour === 11 ? '11AM' : hour === 14 ? '2PM' : '5PM';
  return `${dateStr}_${timeSlotStr}_Circle_${circleIndex}`;
}

/**
 * Generate a circle ID from current time and time slot string
 */
export function generateCircleIdFromTimeSlot(currentTime: Date, timeSlotStr: string): string {
  const date = new Date(currentTime);
  const dateStr = date.toISOString().split('T')[0];
  return `${dateStr}_${timeSlotStr}_Circle_1`;
}

/**
 * Parse a circle ID to extract date and time slot information
 */
export function parseCircleId(circleId: string): {
  date: string;
  timeSlot: string;
  circleNumber: number;
} | null {
  const match = circleId.match(/^(\d{4}-\d{2}-\d{2})_(\d{1,2}[AP]M)_Circle_(\d+)$/);
  if (!match) {
    return null;
  }
  
  return {
    date: match[1],
    timeSlot: match[2],
    circleNumber: parseInt(match[3], 10)
  };
}