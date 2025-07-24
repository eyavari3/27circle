/**
 * Production Authentication Guards
 * 
 * Enforces authentication requirements in production while preserving 
 * development utilities like dev-user-id patterns for testing.
 */

import { createClient } from '@/lib/supabase/client';
import { redirect } from 'next/navigation';

/**
 * Require authentication in production environment only.
 * In development, this allows anonymous/dev patterns to work normally.
 * 
 * @returns true if authenticated or in development mode
 * @throws redirect to /auth if not authenticated in production
 */
export async function requireAuthInProduction(): Promise<boolean> {
  // Allow development mode to use dev-user-id patterns and anonymous access
  // This preserves the specification requirement: "Keep all development utilities active"
  if (process.env.NODE_ENV === 'development') {
    return true; // Don't block development utilities
  }
  
  // In production, enforce the specification requirement: 
  // "Users MUST authenticate to access any app features"
  // "No Anonymous Browsing: Cannot view or interact without signing in"
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (!user || error) {
      // User is not authenticated - redirect to auth page
      redirect('/auth');
    }
    
    return true;
  } catch (error) {
    console.error('Auth check failed:', error);
    // On auth check failure, redirect to auth page in production
    redirect('/auth');
  }
}

/**
 * Check if we're in production mode and should enforce auth
 */
export function isProductionAuthRequired(): boolean {
  return process.env.NODE_ENV === 'production' && 
         !process.env.NEXT_PUBLIC_ALLOW_ANONYMOUS;
}

/**
 * Get current authenticated user or null if not authenticated
 * Returns mock user data in development for testing
 */
export async function getCurrentUser() {
  // In development, allow dev patterns to work
  if (process.env.NODE_ENV === 'development') {
    // Return mock user for development
    return { id: 'dev-user-id', email: 'dev@test.com' };
  }
  
  // In production, get real user
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Failed to get user:', error);
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}