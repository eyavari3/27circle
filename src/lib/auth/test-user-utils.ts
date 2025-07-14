/**
 * Test User Authentication Utilities
 * Handles bypass logic for test phone numbers in production
 */

const TEST_PHONE_PATTERN = /^\+1555555555[0-9]$/;
const TEST_OTP = '123456';

/**
 * Checks if a phone number is a test number (555 555 555X format)
 */
export function isTestPhoneNumber(phoneNumber: string): boolean {
  // Handle various formats - clean and standardize first
  const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
  
  // Convert to +1 format if not already
  let standardized = cleaned;
  if (cleaned.startsWith('555555555') && cleaned.length === 10) {
    standardized = '+1' + cleaned;
  } else if (cleaned.startsWith('1555555555') && cleaned.length === 11) {
    standardized = '+' + cleaned;
  }
  
  return TEST_PHONE_PATTERN.test(standardized);
}

/**
 * Gets the fixed OTP for test users
 */
export function getTestOTP(): string {
  return TEST_OTP;
}

/**
 * Checks if test mode is enabled via environment variable
 */
export function isTestModeEnabled(): boolean {
  // Enable test mode in development by default, or when explicitly enabled
  return process.env.NODE_ENV === 'development' || 
         process.env.NEXT_PUBLIC_ENABLE_TEST_USERS === 'true';
}

/**
 * Simulates sending SMS for test users (logs instead of actual SMS)
 */
export function simulateTestSMS(phoneNumber: string): void {
  if (isTestPhoneNumber(phoneNumber)) {
    console.log(`🧪 TEST MODE: Simulated SMS sent to ${phoneNumber}`);
    console.log(`🧪 TEST MODE: Use OTP "${TEST_OTP}" to verify`);
  }
}

/**
 * Validates OTP for test users
 */
export function validateTestOTP(phoneNumber: string, otp: string): boolean {
  if (!isTestPhoneNumber(phoneNumber)) {
    return false;
  }
  
  return otp === TEST_OTP;
}