import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AccountClient from './AccountClient';
import { getUserProfile } from './actions';

export default async function AccountPage() {
  let userProfile = null;
  
  // In development mode, skip auth check for easier testing
  if (process.env.NODE_ENV === 'development') {
    // Try to get profile data even in dev mode
    userProfile = await getUserProfile();
  } else {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      redirect('/auth');
    }
    
    // Fetch user profile data
    userProfile = await getUserProfile();
  }

  return <AccountClient initialData={userProfile} />;
}