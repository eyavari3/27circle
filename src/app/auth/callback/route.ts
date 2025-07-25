import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Enhanced error handling for OAuth callback
function createErrorResponse(origin: string, error: string, details?: string) {
  const errorUrl = new URL('/login', origin);
  errorUrl.searchParams.set('error', error);
  if (details) {
    errorUrl.searchParams.set('details', details);
  }
  return NextResponse.redirect(errorUrl.toString());
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')
  const source = searchParams.get('source')
  const error = searchParams.get('error')
  

  // Handle OAuth errors from provider
  if (error) {
    return createErrorResponse(origin, 'oauth_provider_error', error);
  }

  if (!code) {
    return createErrorResponse(origin, 'missing_auth_code');
  }

  try {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      return createErrorResponse(origin, 'session_exchange_failed', exchangeError.message);
    }

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return createErrorResponse(origin, 'user_fetch_failed');
    }


    // Check if user has completed onboarding by looking for profile data
    // Use service client to bypass RLS policies for this lookup
    const serviceSupabase = await createServiceClient()
    const { data: profiles, error: profileError } = await serviceSupabase
      .from('users')
      .select('full_name, gender, date_of_birth')
      .eq('id', user.id)

    const profile = profiles && profiles.length > 0 ? profiles[0] : null;
    
    // Determine redirect based on profile completion and parameters
    let redirectUrl = '/circles' // Default for completed users
    
    if (profileError || !profile || !profile.full_name) {
      // User hasn't completed profile, send to profile page
      redirectUrl = '/onboarding/profile'
    } else if (next) {
      // Use the provided next parameter
      redirectUrl = next
    }
    
    console.log('🔐 AUTH:', {
      step: 'oauth_callback',
      user: user?.id?.slice(0, 8),
      hasProfile: !!profile,
      redirect: redirectUrl
    });
    
    
    // Handle host forwarding for production deployments
    const forwardedHost = request.headers.get('x-forwarded-host')
    const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'
    const isLocalEnv = process.env.NODE_ENV === 'development'
    
    let finalRedirectUrl: string;
    
    if (isLocalEnv) {
      finalRedirectUrl = `${origin}${redirectUrl}`;
    } else if (forwardedHost) {
      finalRedirectUrl = `${forwardedProto}://${forwardedHost}${redirectUrl}`;
    } else {
      finalRedirectUrl = `${origin}${redirectUrl}`;
    }
    
    
    return NextResponse.redirect(finalRedirectUrl);
    
  } catch (error) {
    return createErrorResponse(origin, 'callback_error', 'Unexpected authentication error');
  }
}