import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import TransitionContainer from "@/components/onboarding/TransitionContainer";

export default async function Home() {
  // Always show splash screen first - let the flow handle auth naturally
  return <TransitionContainer />;
}
