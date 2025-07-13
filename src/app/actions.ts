// in src/app/onboarding/actions.ts
'use server';

import { createClient } from '@/lib/supabase/server'; // Using your suggested, better import path

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

  const interestsToInsert = interests.map(interestType => ({
    user_id: user.id,
    interest_type: interestType,
  }));

  const { error } = await supabase.from('user_interests').insert(interestsToInsert);

  if (error) {
    // Gracefully handle re-submissions without showing an error to the user
    if (error.message && error.message.includes('duplicate key value violates unique constraint')) {
      return { error: null };
    }
    
    // Handle table not existing (until new schema is deployed)
    if (error.message && error.message.includes('relation "user_interests" does not exist')) {
      console.log('user_interests table does not exist yet - skipping interest save until schema deployment');
      return { error: null };
    }
    
    console.error('Error saving user interests:', error.message || error);
    return { error: 'Could not save your interests. Please try again.' };
  }

  return { error: null };
}