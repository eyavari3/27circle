import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { isTestPhoneNumber, isTestModeEnabled, validateTestOTP } from '@/lib/auth/test-user-utils';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { phone, testOtp } = await request.json();

    // Validate that test mode is enabled
    if (!isTestModeEnabled()) {
      return NextResponse.json(
        { error: 'Test user verification is not enabled' },
        { status: 403 }
      );
    }

    // Validate that this is a test phone number
    if (!isTestPhoneNumber(phone)) {
      return NextResponse.json(
        { error: 'Not a test phone number' },
        { status: 400 }
      );
    }

    // Validate the test OTP
    if (!validateTestOTP(phone, testOtp)) {
      return NextResponse.json(
        { error: 'Invalid test OTP' },
        { status: 400 }
      );
    }

    // Ensure service role key is available
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }
    
    console.log('🔑 Service role key available:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'YES' : 'NO');
    console.log('🔑 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

    // Create admin client with service role for admin operations
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Server-only admin key
      { 
        cookies: {
          get: () => undefined,
          set: () => {},
          remove: () => {}
        }
      }
    );

    // For test users, create a simple database record without Supabase auth complexity
    // Generate a proper UUID for the test user
    const testUserId = crypto.randomUUID();
    
    // Check if test user already exists by phone number
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('phone_number', phone)
      .maybeSingle();

    let userId: string;
    
    if (existingUser) {
      userId = existingUser.id;
      console.log('🧪 TEST MODE: Using existing test user:', userId);
    } else {
      // Create test user record directly in database (no auth.users complexity)
      const { data: newUser, error: userCreateError } = await supabaseAdmin
        .from('users')
        .insert({
          id: testUserId,
          phone_number: phone,
          full_name: `Test User ${phone.slice(-1)}`
        })
        .select('id')
        .single();

      if (userCreateError || !newUser) {
        console.error('❌ Error creating test user record:', userCreateError);
        return NextResponse.json(
          { error: 'Failed to create test user record' },
          { status: 500 }
        );
      }
      
      userId = newUser.id;
      console.log('🧪 TEST MODE: Created new test user record:', userId);
    }

    // For test users, return success without complex auth flow
    // The server actions will handle authentication via service role client
    console.log('🧪 TEST MODE: Test user record ready for:', phone);
    
    return NextResponse.json({
      success: true,
      userId: userId,
      testMode: true,
      message: 'Test user authenticated successfully'
    });

  } catch (error) {
    console.error('Test user verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}