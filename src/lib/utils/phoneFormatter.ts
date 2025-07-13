/**
 * Phone number formatting utilities
 * Formats US phone numbers as (xxx) xxx-xxxx
 */

export function formatPhoneNumber(value: string): string {
  // Remove all non-digit characters
  const numbers = value.replace(/\D/g, '');
  
  // Don't format if empty
  if (!numbers) return '';
  
  // Don't format if more than 10 digits
  if (numbers.length > 10) return numbers.slice(0, 10);
  
  // Apply formatting based on length
  if (numbers.length <= 3) {
    return numbers;
  } else if (numbers.length <= 6) {
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
  } else {
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6)}`;
  }
}

export function getCleanPhoneNumber(formattedPhone: string): string {
  // Return just the digits for API calls
  return formattedPhone.replace(/\D/g, '');
}

export function isValidPhoneNumber(phone: string): boolean {
  // Check if we have exactly 10 digits
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10;
}

export function formatPhoneForDisplay(phone: string): string {
  // Format for display (adds +1 prefix if needed)
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}