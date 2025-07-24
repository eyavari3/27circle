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
  console.log('🔍 DEBUG: submitProfile called with:', { 
    fullName: profileData.fullName,
    gender: profileData.gender,
    dateOfBirth: profileData.dateOfBirth 
  });

  if (!profileData.fullName.trim() || !profileData.gender || !profileData.dateOfBirth) {
    return { error: 'Please fill in all required fields.' };
  }

  // CORRECT - Regular client has access to auth session
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  console.log('🔍 DEBUG: Auth user:', { 
    userId: user?.id,
    email: user?.email,
    phone: user?.phone 
  });

  // For development: Skip auth check and return success
  if (!user) {
    console.log('🔍 DEBUG: No authenticated user, returning early');
    return { error: null };
  }

  // For test mode: Always use service role client to completely bypass RLS
  let targetSupabase = supabase;
  let clientType = 'regular';

  if (isTestModeEnabled()) {
    console.log('🔍 DEBUG: Test mode enabled, checking user type');
    
    // Use service role client to check if this is a test user (bypasses any RLS issues)
    const serviceSupabase = await createServiceClient();
    const { data: userData, error: fetchError } = await serviceSupabase
      .from('users')
      .select('phone_number, is_test')
      .eq('id', user.id)
      .maybeSingle();

    console.log('🔍 DEBUG: User lookup result:', { 
      userData,
      fetchError,
      userExists: !!userData 
    });

    if (userData?.is_test || (userData?.phone_number && isTestPhoneNumber(userData.phone_number))) {
      console.log('🔍 DEBUG: Detected test user, switching to service client');
      targetSupabase = serviceSupabase; // Use service role for ALL test user operations
      clientType = 'service';
    }
  }

  // Check if user record exists before update
  console.log('🔍 DEBUG: Checking if user record exists before update');
  const { data: existingUser, error: checkError } = await targetSupabase
    .from('users')
    .select('id, full_name, phone_number')
    .eq('id', user.id)
    .maybeSingle();

  console.log('🔍 DEBUG: User record check:', {
    clientType,
    existingUser,
    checkError,
    recordExists: !!existingUser
  });

  // If no user record exists, we need to insert instead of update
  if (!existingUser) {
    console.log('🔍 DEBUG: No user record found, attempting INSERT instead of UPDATE');
    const { error: insertError } = await targetSupabase
      .from('users')
      .insert({
        id: user.id,
        full_name: profileData.fullName,
        gender: profileData.gender,
        date_of_birth: profileData.dateOfBirth,
        location: profileData.location,
        phone_number: user.phone || null,
      });

    if (insertError) {
      console.error('🔍 DEBUG: Insert error:', insertError);
      return { error: 'Could not save your profile. Please try again.' };
    }

    console.log('🔍 DEBUG: Successfully inserted new user record');
    revalidatePath('/circles');
    return { error: null };
  }

  // User exists, proceed with update
  console.log('🔍 DEBUG: Attempting UPDATE with client type:', clientType);
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
    console.error('🔍 DEBUG: Update error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      clientType
    });
    return { error: 'Could not save your profile. Please try again.' };
  }

  console.log('🔍 DEBUG: Profile update successful');
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