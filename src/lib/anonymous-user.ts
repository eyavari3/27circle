/**
 * ANONYMOUS USER MANAGEMENT
 * 
 * Handles temporary anonymous user IDs for frictionless onboarding.
 * Anonymous users can join waitlists and get assigned to circles before signing in.
 * All data merges with real user account upon authentication.
 */

export const ANON_ID_PREFIX = 'anon';
export const ANON_USER_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generate a new anonymous user ID
 * Format: anon-{timestamp}-{randomId}
 */
export function generateAnonymousId(): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substr(2, 9);
  return `${ANON_ID_PREFIX}-${timestamp}-${randomId}`;
}

/**
 * Check if a user ID is anonymous
 */
export function isAnonymousId(userId: string): boolean {
  return userId.startsWith(`${ANON_ID_PREFIX}-`);
}

/**
 * Extract timestamp from anonymous ID for cleanup purposes
 */
export function getAnonymousIdTimestamp(anonymousId: string): number | null {
  if (!isAnonymousId(anonymousId)) return null;
  
  const parts = anonymousId.split('-');
  if (parts.length < 2) return null;
  
  const timestamp = parseInt(parts[1], 10);
  return isNaN(timestamp) ? null : timestamp;
}

/**
 * Check if anonymous ID has expired (older than 24 hours)
 */
export function isAnonymousIdExpired(anonymousId: string): boolean {
  const timestamp = getAnonymousIdTimestamp(anonymousId);
  if (!timestamp) return true;
  
  return Date.now() - timestamp > ANON_USER_EXPIRY;
}

/**
 * Get or create anonymous user ID from session storage
 * Returns existing ID if valid, creates new one if needed
 */
export function getOrCreateAnonymousId(): string {
  if (typeof window === 'undefined') {
    // Server-side: generate new ID
    return generateAnonymousId();
  }
  
  const existingId = sessionStorage.getItem('anonUserId');
  
  // Check if existing ID is valid and not expired
  if (existingId && !isAnonymousIdExpired(existingId)) {
    return existingId;
  }
  
  // Generate new ID and store it
  const newId = generateAnonymousId();
  sessionStorage.setItem('anonUserId', newId);
  return newId;
}

/**
 * Clear anonymous user ID from session storage
 * Called when user successfully signs in
 */
export function clearAnonymousId(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('anonUserId');
  }
}

/**
 * Get current user ID (authenticated or anonymous)
 * This is the main function used throughout the app
 */
export function getCurrentUserId(authenticatedUser?: { id: string } | null): string {
  if (authenticatedUser?.id) {
    return authenticatedUser.id;
  }
  
  return getOrCreateAnonymousId();
}

/**
 * Validate anonymous user ID format
 */
export function isValidAnonymousId(anonymousId: string): boolean {
  if (!isAnonymousId(anonymousId)) return false;
  
  const parts = anonymousId.split('-');
  if (parts.length !== 3) return false;
  
  const [prefix, timestamp, randomId] = parts;
  return (
    prefix === ANON_ID_PREFIX &&
    !isNaN(parseInt(timestamp, 10)) &&
    randomId.length > 0
  );
}