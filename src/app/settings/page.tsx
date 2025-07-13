import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import SettingsClient from './SettingsClient';

export default async function SettingsPage() {
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

  return <SettingsClient />;
}