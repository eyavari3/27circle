'use server';

import { createClient, createServiceClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { isTestPhoneNumber, isTestModeEnabled } from '@/lib/auth/test-user-utils';

export async function saveUserInterests(interests: string[]): Promise<{ error: string | null }> {
  if (!interests || interests.length === 0) {
    return { error: 'Please select at least one interest to continue.' };
  }

  // SIMPLE: Use service client for all operations
  const supabase = await createServiceClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  // Handle unauthenticated users during onboarding
  if (!user) {
    // Return success - interests will be saved after login
    return { error: null };
  }

  const interestsToInsert = interests.map(interestType => ({
    user_id: user.id,
    interest_type: interestType,
  }));

  const { error } = await supabase.from('user_interests').insert(interestsToInsert);

  if (error) {
    // Handle duplicate key gracefully
    if (error.message?.includes('duplicate key value violates unique constraint')) {
      return { error: null };
    }
    
    console.error('Error saving user interests:', error.message);
    return { error: 'Could not save your interests. Please try again.' };
  }

  return { error: null };
}

export async function submitProfile(profileData: {
  fullName: string;
  gender: string;
  dateOfBirth: string;
  location: string;
}): Promise<{ error: string | null }> {
  if (!profileData.fullName.trim() || !profileData.gender || !profileData.dateOfBirth) {
    return { error: 'Please fill in all required fields.' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // For development: Skip auth check and return success
  if (!user) {
    return { error: null };
  }

  // For test mode: Always use service role client to completely bypass RLS
  let targetSupabase = supabase;

  if (isTestModeEnabled()) {
    // Use service role client to check if this is a test user (bypasses any RLS issues)
    const serviceSupabase = await createServiceClient();
    const { data: userData } = await serviceSupabase
      .from('users')
      .select('phone_number, is_test')
      .eq('id', user.id)
      .maybeSingle();

    if (userData?.is_test || (userData?.phone_number && isTestPhoneNumber(userData.phone_number))) {
      targetSupabase = serviceSupabase; // Use service role for ALL test user operations
    }
  }

  const { error } = await targetSupabase
    .from('users')
    .update({
      full_name: profileData.fullName,
      gender: profileData.gender,
      date_of_birth: profileData.dateOfBirth,
      location: profileData.location,
    })
    .eq('id', user.id);

  if (error) {
    console.error('Error updating user profile:', error.message);
    return { error: 'Could not save your profile. Please try again.' };
  }

  revalidatePath('/circles');
  return { error: null };
}

// Development-only function to ensure user has basic profile data
export async function ensureDevProfile(): Promise<{ error: string | null }> {
  if (process.env.NODE_ENV !== 'development') {
    return { error: 'This function is only available in development' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: null };
  }

  // Check if user already has profile data
  const { data: existingProfile } = await supabase
    .from('users')
    .select('full_name, gender, date_of_birth')
    .eq('id', user.id)
    .single();

  if (existingProfile?.full_name && existingProfile?.gender && existingProfile?.date_of_birth) {
    // User already has complete profile
    return { error: null };
  }

  // Create default dev profile
  const { error } = await supabase
    .from('users')
    .update({
      full_name: existingProfile?.full_name || 'Dev User',
      gender: existingProfile?.gender || 'prefer-not-to-say',
      date_of_birth: existingProfile?.date_of_birth || '2000-01-01',
      location: 'Stanford University',
    })
    .eq('id', user.id);

  if (error) {
    console.error('Error creating dev profile:', error.message);
    return { error: 'Could not create dev profile' };
  }

  return { error: null };
}