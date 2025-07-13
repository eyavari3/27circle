import { createClient } from '@/lib/supabase/server';

/**
 * Ensures user has a profile in the database
 * Creates a minimal profile if one doesn't exist
 */
export async function ensureUserProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: 'No authenticated user' };
  }
  
  // Check if profile exists
  const { data: existingProfile } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.id)
    .single();
    
  if (existingProfile) {
    return { error: null };
  }
  
  // Create minimal profile for Google OAuth users
  console.log('🔧 Creating profile for Google user:', user.email);
  
  const { error, data } = await supabase
    .from('users')
    .insert({
      id: user.id,
      full_name: user.email?.split('@')[0] || 'User',
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
    console.log('✅ Profile created successfully for:', user.email);
  }
  
  return { error: null };
}