import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PreferencesClient from './PreferencesClient';
import { getUserInterests } from './actions';

export default async function PreferencesPage() {
  let userInterests = null;
  
  // In development mode, skip auth check for easier testing
  if (process.env.NODE_ENV === 'development') {
    // Try to get interests data even in dev mode
    userInterests = await getUserInterests();
  } else {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      redirect('/auth');
    }
    
    // Fetch user interests
    userInterests = await getUserInterests();
  }

  return <PreferencesClient initialData={userInterests} />;
}