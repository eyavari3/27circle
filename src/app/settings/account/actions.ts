'use server';

import { createClient, createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

interface UserProfile {
  fullName: string;
  gender: string;
  dateOfBirth: string;
  location: string;
  phoneNumber?: string;
}

export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();
    
    if (!user) return null;
    
    // Use service client to bypass RLS
    const serviceClient = await createServiceClient();
    const { data, error } = await serviceClient
      .from('users')
      .select('full_name, gender, date_of_birth, location')
      .eq('id', user.id)
      .single();
    
    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
    
    // Transform snake_case to camelCase and add phone from auth
    return {
      fullName: data?.full_name || '',
      gender: data?.gender || '',
      dateOfBirth: data?.date_of_birth || '',
      location: data?.location || 'Stanford University',
      phoneNumber: user.phone || ''
    };
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return null;
  }
}

export async function updateUserProfile(profile: UserProfile): Promise<{ error: string | null }> {
  try {
    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();
    
    if (!user) {
      return { error: 'Not authenticated' };
    }
    
    // Use service client to bypass RLS
    const serviceClient = await createServiceClient();
    
    // Transform camelCase to snake_case
    const { error } = await serviceClient
      .from('users')
      .update({
        full_name: profile.fullName,
        gender: profile.gender,
        date_of_birth: profile.dateOfBirth,
        location: profile.location,
      })
      .eq('id', user.id);
    
    if (error) {
      console.error('Error updating user profile:', error);
      return { error: 'Failed to update profile' };
    }
    
    return { error: null };
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    return { error: 'An unexpected error occurred' };
  }
}

export async function signOutUser(): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Error signing out:', error);
  }
  
  // Always redirect to home after signout attempt
  redirect('/');
}