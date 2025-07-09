// in src/app/onboarding/actions.ts
'use server';

import { createClient } from '@/lib/supabase/server'; // Using your suggested, better import path
import { revalidatePath } from 'next/cache';

// Adding explicit return type and server-side validation
export async function saveUserInterests(interests: string[]): Promise<{ error: string | null }> {
  // Server-side validation, as you recommended
  if (!interests || interests.length === 0) {
    return { error: 'Please select at least one interest to continue.' };
  }

  const supabase = createClient();
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
    if (error.message.includes('duplicate key value violates unique constraint')) {
      return { error: null };
    }
    console.error('Error saving user interests:', error.message);
    return { error: 'Could not save your interests. Please try again.' };
  }

  return { error: null };
}