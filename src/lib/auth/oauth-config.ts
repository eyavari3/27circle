/**
 * OAuth Configuration for Production-Ready Google Authentication
 * Handles environment-aware redirect URIs and fallback mechanisms
 */

export interface OAuthConfig {
  redirectTo: string;
  scopes?: string;
  queryParams?: Record<string, string>;
}

/**
 * Get the appropriate OAuth redirect URI based on environment
 */
function getOAuthRedirectURI(): string {
  // Production/Staging: Use environment variable or infer from host
  if (process.env.NODE_ENV === 'production') {
    // First try explicit production URL
    if (process.env.NEXT_PUBLIC_SITE_URL) {
      return `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`;
    }
    
    // Fallback to Vercel URL pattern
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}/auth/callback`;
    }
    
    // Last resort - this should be configured properly
    throw new Error('Production OAuth redirect URI not configured. Set NEXT_PUBLIC_SITE_URL environment variable.');
  }
  
  // Development: Handle dynamic ports and local development
  if (typeof window !== 'undefined') {
    // Client-side: Use current window location
    return `${window.location.origin}/auth/callback`;
  }
  
  // Server-side development: Use localhost with default port
  const devPort = process.env.PORT || '3000';
  return `http://localhost:${devPort}/auth/callback`;
}

/**
 * Get OAuth configuration for Google sign-in
 */
export function getGoogleOAuthConfig(options?: {
  source?: string;
  next?: string;
}): OAuthConfig {
  const baseRedirectURI = getOAuthRedirectURI();
  
  // Build query parameters
  const queryParams: Record<string, string> = {};
  
  if (options?.next) {
    queryParams.next = options.next;
  }
  
  // Add source for onboarding flow tracking
  if (options?.source) {
    queryParams.source = options.source;
  }
  
  // Construct final redirect URI with query parameters
  let redirectTo = baseRedirectURI;
  const searchParams = new URLSearchParams(queryParams);
  if (searchParams.toString()) {
    redirectTo += `?${searchParams.toString()}`;
  }
  
  return {
    redirectTo,
    scopes: 'email profile', // Standard Google scopes
    queryParams
  };
}

/**
 * Validate OAuth configuration before use
 */
export function validateOAuthConfig(config: OAuthConfig): void {
  try {
    new URL(config.redirectTo);
  } catch {
    throw new Error(`Invalid OAuth redirect URI: ${config.redirectTo}`);
  }
  
  // Ensure HTTPS in production
  if (process.env.NODE_ENV === 'production' && !config.redirectTo.startsWith('https://')) {
    throw new Error('Production OAuth redirect URI must use HTTPS');
  }
}

/**
 * Get environment-specific OAuth settings for documentation
 */
export function getOAuthDocumentation() {
  const config = getGoogleOAuthConfig();
  
  return {
    environment: process.env.NODE_ENV || 'development',
    redirectURI: config.redirectTo,
    requiredGoogleCloudSettings: {
      authorizedRedirectURIs: [
        // Development
        'http://localhost:3000/auth/callback',
        'http://localhost:3001/auth/callback',
        'http://localhost:3002/auth/callback',
        // Production (replace with your actual domain)
        'https://yourdomain.com/auth/callback',
        // Vercel preview deployments
        'https://*.vercel.app/auth/callback'
      ],
      authorizedOrigins: [
        'http://localhost:3000',
        'http://localhost:3001', 
        'http://localhost:3002',
        'https://yourdomain.com',
        'https://*.vercel.app'
      ]
    },
    environmentVariables: {
      required: [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY'
      ],
      production: [
        'NEXT_PUBLIC_SITE_URL' // e.g., https://yourdomain.com
      ]
    }
  };
}