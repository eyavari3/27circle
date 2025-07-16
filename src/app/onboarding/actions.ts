'use server';

import { createClient, createServiceClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { isTestPhoneNumber, isTestModeEnabled } from '@/lib/auth/test-user-utils';

export async function saveUserInterests(interests: string[]): Promise<{ error: string | null }> {
  if (!interests || interests.length === 0) {
    return { error: 'Please select at least one interest to continue.' };
  }

  // Use regular client for auth (has session access)
  const authSupabase = await createClient();
  const { data: { user } } = await authSupabase.auth.getUser();
  
  // Use service client for database operations (bypasses RLS)
  const supabase = await createServiceClient();

  // For development: Skip auth check and save to localStorage
  // For test mode: Handle test users without auth session
  if (isTestModeEnabled() && !user) {
    console.log('🧪 TEST MODE: No auth session, checking for recent test users');
    const serviceSupabase = await createServiceClient();
    
    // Find the most recent test user (within last 10 minutes)
    const { data: testUsers } = await serviceSupabase
      .from('users')
      .select('id, phone_number')
      .eq('is_test', true)
      .gte('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (testUsers?.length && isTestPhoneNumber(testUsers[0].phone_number)) {
      const testUser = testUsers[0];
      console.log('🧪 TEST MODE: Using recent test user for interests:', testUser.id);
      
      const interestsToInsert = interests.map(interestType => ({
        user_id: testUser.id,
        interest_type: interestType,
      }));

      const { error } = await serviceSupabase.from('user_interests').insert(interestsToInsert);

      if (error) {
        console.log('🔧 Error saving test user interests:', error);
        const errorMessage = error?.message || error?.details || error?.hint || String(error);
        
        if (errorMessage && errorMessage.includes('duplicate key value violates unique constraint')) {
          return { error: null };
        }
        
        console.error('Error saving test user interests:', errorMessage);
        return { error: 'Could not save your interests. Please try again.' };
      }

      console.log('✅ Interests saved successfully for test user:', testUser.id);
      return { error: null };
    }
  }

  if (!user) {
    console.log('Development mode: Saving user interests to localStorage');
    // This will be handled client-side in the component
    return { error: null };
  }

  const interestsToInsert = interests.map(interestType => ({
    user_id: user.id,
    interest_type: interestType,
  }));

  const { error } = await supabase.from('user_interests').insert(interestsToInsert);

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

  console.log('✅ Interests saved successfully for user:', user.id);
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

  // Use regular client for auth (has session access)
  const authSupabase = await createClient();
  const { data: { user } } = await authSupabase.auth.getUser();
  
  // Use service client for database operations (bypasses RLS)
  const supabase = await createServiceClient();

  // For development: Skip auth check and return success
  if (!user) {
    console.log('Development mode: Skipping profile save (no auth)');
    return { error: null };
  }

  const { error } = await supabase
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

  console.log('✅ Profile updated successfully for user:', user.id);
  revalidatePath('/circles');
  return { error: null };
}

// Development-only function to ensure user has basic profile data
export async function ensureDevProfile(): Promise<{ error: string | null }> {
  if (process.env.NODE_ENV !== 'development') {
    return { error: 'This function is only available in development' };
  }

  // Use regular client for auth (has session access)
  const authSupabase = await createClient();
  const { data: { user } } = await authSupabase.auth.getUser();
  
  // Use service client for database operations (bypasses RLS)
  const supabase = await createServiceClient();

  if (!user) {
    console.log('Development mode: No user to create profile for');
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

  console.log('Created default dev profile for user:', user.id);
  return { error: null };
}