import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AccountClient from './AccountClient';

export default async function AccountPage() {
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

  return <AccountClient />;
}