export const APP_TIME_OFFSET: number | null = 9;

// Feedback Feature Toggle
export const FEEDBACK_ENABLED: boolean = false; // Set to true to enable feedback

// Performance: Time update interval (milliseconds)
export const UPDATE_INTERVAL: number = 10000; // 10 seconds (6x fewer re-renders than 1 second)

//  Change the APP_TIME_OFFSET value:
//  null = real PST time
//  14.5 = 2:30 PM today
// - 10 = 10:00 AM today
// - 16 = 4:00 PM today