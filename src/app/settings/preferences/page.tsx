import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PreferencesClient from './PreferencesClient';

export default async function PreferencesPage() {
  // In development mode, skip auth check for easier testing
  if (process.env.NODE_ENV === 'development') {
    // Skip auth check in dev mode
  } else {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      redirect('/auth');
    }
  }

  return <PreferencesClient />;
}