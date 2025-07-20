'use server';

import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function getUserInterests(): Promise<string[] | null> {
  try {
    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();
    
    if (!user) return null;
    
    // Use service client to bypass RLS
    const serviceClient = await createServiceClient();
    const { data, error } = await serviceClient
      .from('user_interests')
      .select('interest_type')
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Error fetching user interests:', error);
      return null;
    }
    
    // Transform to array of interest_type strings
    return data?.map(item => item.interest_type) || [];
  } catch (error) {
    console.error('Error in getUserInterests:', error);
    return null;
  }
}

export async function updateUserInterests(interests: string[]): Promise<{ error: string | null }> {
  try {
    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();
    
    if (!user) {
      return { error: 'Not authenticated' };
    }
    
    // Use service client to bypass RLS
    const serviceClient = await createServiceClient();
    
    // Simple upsert strategy: delete existing, insert new
    const { error: deleteError } = await serviceClient
      .from('user_interests')
      .delete()
      .eq('user_id', user.id);
    
    if (deleteError) {
      console.error('Error deleting user interests:', deleteError);
      return { error: 'Failed to update interests' };
    }
    
    // Insert new interests if any are selected
    if (interests.length > 0) {
      const interestsToInsert = interests.map(interest_type => ({
        user_id: user.id,
        interest_type,
      }));
      
      const { error: insertError } = await serviceClient
        .from('user_interests')
        .insert(interestsToInsert);
      
      if (insertError) {
        console.error('Error inserting user interests:', insertError);
        return { error: 'Failed to save interests' };
      }
    }
    
    return { error: null };
  } catch (error) {
    console.error('Error in updateUserInterests:', error);
    return { error: 'An unexpected error occurred' };
  }
}