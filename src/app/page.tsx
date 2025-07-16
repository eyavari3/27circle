import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import SplashScreen from "@/components/onboarding/SplashScreen";

export default async function Home() {
  // In development mode, check localStorage for completed onboarding
  if (process.env.NODE_ENV === 'development') {
    // For development, we'll handle this client-side since we can't access localStorage on server
    return <SplashScreen />;
  }

  // Production auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // Check if user has completed profile setup
    const { data: profile } = await supabase
      .from("users")
      .select("full_name, gender, date_of_birth")
      .eq("id", user.id)
      .single();

    // Check if user has selected interests
    const { data: interests } = await supabase
      .from("user_interests")
      .select("*")
      .eq("user_id", user.id);

    // If user has completed onboarding, redirect to main page
    if (profile?.full_name && profile?.gender && profile?.date_of_birth && 
        interests && interests.length > 0) {
      redirect('/circles');
    }

    // If user is authenticated but hasn't completed onboarding, continue with flow
  } else {
    // If no user is authenticated, redirect to login page
    redirect('/login');
  }

  return <SplashScreen />;
}
