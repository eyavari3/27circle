import { createServiceClient } from '@/lib/supabase/server';

/**
 * Ensures user has a profile in the database
 * Creates a minimal profile if one doesn't exist
 */
export async function ensureUserProfile(userId: string) {
  const supabase = await createServiceClient();
  
  if (!userId) {
    return { error: 'No user ID provided' };
  }
  
  // Check if profile exists
  const { data: existingProfile } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .single();
    
  if (existingProfile) {
    return { error: null };
  }
  
  // Create minimal profile for Google OAuth users
  console.log('🔧 Creating profile for user ID:', userId);
  
  const { error } = await supabase
    .from('users')
    .insert({
      id: userId,
      full_name: 'User', // Default - user can update later
      gender: 'male', // Default - user can update later
      date_of_birth: '2000-01-01' // Default - user can update later
    });
    
  // Only treat as error if it has a meaningful message (not empty object)
  if (error && error.message) {
    console.error('Real error creating profile:', error);
    
    if (error.message.includes('duplicate')) {
      // Profile already exists - that's fine
      console.log('Profile already exists for user');
    } else {
      return { error: `Failed to create profile: ${error.message}` };
    }
  } else {
    console.log('✅ Profile created successfully for user ID:', userId);
  }
  
  return { error: null };
}