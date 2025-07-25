export function getAppTimeOffset(): number | null {
  const offset = process.env.NEXT_PUBLIC_APP_TIME_OFFSET;
  if (!offset) return null;
  if (offset === 'null') return null;
  
  const parsed = parseFloat(offset);
  return isNaN(parsed) ? null : parsed;
}

// Feedback Feature Toggle
export const FEEDBACK_ENABLED: boolean = true; // Re-enabled with debug logging to investigate

// Performance: Time update interval (milliseconds)
export const UPDATE_INTERVAL: number = 10000; // 10 seconds (6x fewer re-renders than 1 second)


//  NEXT_PUBLIC_APP_TIME_OFFSET=18 npm run dev
//  Change the APP_TIME_OFFSET value:
//  null = real PST time
//  14.5 = 2:30 PM today
// - 10 = 10:00 AM today
// - 16 = 4:00 PM today