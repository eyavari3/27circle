import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    // Check if Twilio environment variables are set
    const twilioCheck = {
      hasAccountSid: !!process.env.TWILIO_ACCOUNT_SID,
      hasAuthToken: !!process.env.TWILIO_AUTH_TOKEN,
      hasPhoneNumber: !!process.env.TWILIO_PHONE_NUMBER,
      accountSidLength: process.env.TWILIO_ACCOUNT_SID?.length || 0,
      phoneNumberFormat: process.env.TWILIO_PHONE_NUMBER || 'not set'
    };

    // Test Supabase Auth SMS configuration
    const supabase = await createClient();
    
    // Check if phone auth is enabled in Supabase
    const testPhone = '+16505551234'; // Test number
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: testPhone,
      options: {
        shouldCreateUser: false // Don't actually create user
      }
    });

    return NextResponse.json({
      twilioConfig: twilioCheck,
      supabaseTest: {
        success: !error,
        error: error?.message || null,
        errorCode: error?.code || null,
        errorStatus: error?.status || null
      },
      advice: {
        needsTwilioInSupabase: 'Make sure Twilio is configured in Supabase Dashboard > Authentication > Providers > Phone',
        checkSupabaseSettings: 'Verify SMS provider is set to Twilio in Supabase',
        verifyPhoneFormat: 'Phone numbers must include country code (e.g., +1 for US)'
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to test Twilio configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}