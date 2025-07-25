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
  
  console.log('🔄 OAuth callback received:', {
    hasCode: !!code,
    hasError: !!error,
    next,
    source,
    origin
  });

  // Handle OAuth errors from provider
  if (error) {
    console.error('❌ OAuth provider error:', error);
    return createErrorResponse(origin, 'oauth_provider_error', error);
  }

  if (!code) {
    console.error('❌ No authorization code received');
    return createErrorResponse(origin, 'missing_auth_code');
  }

  try {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('❌ Failed to exchange code for session:', exchangeError);
      return createErrorResponse(origin, 'session_exchange_failed', exchangeError.message);
    }

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('❌ Failed to get user after auth:', userError);
      return createErrorResponse(origin, 'user_fetch_failed');
    }

    console.log('✅ User authenticated successfully:', user.email);
    console.log('🔍 User ID from Google OAuth:', user.id);

    // Check if user has completed onboarding by looking for profile data
    // Use service client to bypass RLS policies for this lookup
    const serviceSupabase = await createServiceClient()
    const { data: profiles, error: profileError } = await serviceSupabase
      .from('users')
      .select('full_name, gender, date_of_birth')
      .eq('id', user.id)

    const profile = profiles && profiles.length > 0 ? profiles[0] : null;
    
    console.log('🔍 Profile lookup result:', { profile, profileError });
    console.log('🔍 DETAILED PROFILE CHECK:', {
      profilesArray: profiles,
      profilesLength: profiles?.length || 0,
      profileFound: !!profile,
      hasFullName: profile?.full_name || 'NO_FULL_NAME',
      hasGender: profile?.gender || 'NO_GENDER',
      hasDateOfBirth: profile?.date_of_birth || 'NO_DOB'
    });
    
    // Determine redirect based on profile completion and parameters
    let redirectUrl = '/circles' // Default for completed users
    
    if (profileError || !profile || !profile.full_name) {
      // User hasn't completed profile, send to profile page
      redirectUrl = '/onboarding/profile'
      console.log('👤 NEW USER PATH: Redirecting to profile completion');
      console.log('🔍 REDIRECT REASON:', {
        profileError: profileError?.message || 'NO_ERROR',
        profileExists: !!profile,
        hasFullName: !!profile?.full_name,
        decidedPath: 'PROFILE_CREATION'
      });
    } else if (next) {
      // Use the provided next parameter
      redirectUrl = next
      console.log('🎯 CUSTOM REDIRECT: Using provided next parameter:', next);
    } else {
      console.log('🎉 EXISTING USER PATH: Has complete profile, going to circles');
      console.log('🔍 PROFILE COMPLETE:', {
        fullName: profile.full_name,
        gender: profile.gender,
        dateOfBirth: profile.date_of_birth,
        decidedPath: 'CIRCLES_PAGE'
      });
    }
    
    console.log('📍 REDIRECT DECISION: redirectUrl set to:', redirectUrl);
    
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
    
    console.log('🌐 URL CONSTRUCTION DETAILS:', {
      origin,
      forwardedHost,
      forwardedProto,
      isLocalEnv,
      baseRedirectUrl: redirectUrl,
      finalRedirectUrl
    });
    console.log('🔀 FINAL REDIRECT URL:', finalRedirectUrl);
    console.log('🚀 REDIRECTING USER TO:', finalRedirectUrl);
    
    return NextResponse.redirect(finalRedirectUrl);
    
  } catch (error) {
    console.error('❌ Unexpected error in OAuth callback:', error);
    return createErrorResponse(origin, 'callback_error', 'Unexpected authentication error');
  }
}