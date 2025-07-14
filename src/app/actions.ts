'use server';

import { createClient, createServiceClient } from '@/lib/supabase/server';
import { isTestPhoneNumber, isTestModeEnabled } from '@/lib/auth/test-user-utils';

// Adding explicit return type and server-side validation
export async function saveUserInterests(interests: string[]): Promise<{ error: string | null }> {
  // Server-side validation, as you recommended
  if (!interests || interests.length === 0) {
    return { error: 'Please select at least one interest to continue.' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to save interests.' };
  }

  // For test mode: Always use service role client to completely bypass RLS
  let targetSupabase = supabase;
  let isTestUser = false;

  if (isTestModeEnabled()) {
    // Use service role client to check if this is a test user (bypasses any RLS issues)
    const serviceSupabase = await createServiceClient();
    const { data: userData } = await serviceSupabase
      .from('users')
      .select('phone_number, is_test')
      .eq('id', user.id)
      .maybeSingle();

    if (userData?.is_test || (userData?.phone_number && isTestPhoneNumber(userData.phone_number))) {
      isTestUser = true;
      targetSupabase = serviceSupabase; // Use service role for ALL test user operations
      console.log('🧪 TEST MODE: Using service role client for ALL test user operations (bypassing RLS)');
    }
  }

  const interestsToInsert = interests.map(interestType => ({
    user_id: user.id,
    interest_type: interestType,
  }));

  const { error } = await targetSupabase.from('user_interests').insert(interestsToInsert);

  if (error) {
    console.log('🔧 Error saving user interests - error object:', error);
    // Get error message safely from various possible error structures
    const errorMessage = error?.message || error?.details || error?.hint || String(error);
    console.log('🔧 Extracted errorMessage:', errorMessage);
    
    // Gracefully handle re-submissions without showing an error to the user
    if (errorMessage && errorMessage.includes('duplicate key value violates unique constraint')) {
      return { error: null };
    }
    
    // Handle table not existing (until new schema is deployed)
    if (errorMessage && errorMessage.includes('relation "user_interests" does not exist')) {
      console.log('user_interests table does not exist yet - skipping interest save until schema deployment');
      return { error: null };
    }
    
    console.error('Error saving user interests:', errorMessage);
    return { error: 'Could not save your interests. Please try again.' };
  }

  console.log(`✅ Interests saved successfully for ${isTestUser ? 'test' : 'regular'} user:`, user.id);
  return { error: null };
}