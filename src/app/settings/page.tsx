import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireAuthInProduction } from '@/lib/auth/production-guards';
import SettingsClient from './SettingsClient';

export default async function SettingsPage() {
  // Enforce authentication in production while preserving dev utilities
  await requireAuthInProduction();

  return <SettingsClient />;
}