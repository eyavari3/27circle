"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { formatPhoneNumber, getCleanPhoneNumber, isValidPhoneNumber } from '@/lib/utils/phoneFormatter';
import { createClient } from '@/lib/supabase/client';
import { getGoogleOAuthConfig, validateOAuthConfig } from '@/lib/auth/oauth-config';

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClient();

  // Check for auth callback errors
  useEffect(() => {
    const authError = searchParams.get('error');
    const details = searchParams.get('details');
    
    if (authError) {
      console.error('OAuth callback error:', authError, details);
      
      switch (authError) {
        case 'oauth_provider_error':
          setError('Google authentication failed. Please try again.');
          break;
        case 'missing_auth_code':
          setError('Authentication was cancelled or failed. Please try again.');
          break;
        case 'session_exchange_failed':
          setError('Authentication session failed. Please try again.');
          break;
        case 'user_fetch_failed':
          setError('Unable to retrieve user information. Please try again.');
          break;
        case 'callback_error':
          setError('Authentication error occurred. Please try again.');
          break;
        case 'auth_callback_error': // Legacy error
          setError('Google sign-in failed. Please try again.');
          break;
        default:
          setError('Authentication failed. Please try again.');
      }
    }
  }, [searchParams]);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      setError('Please enter your phone number');
      return;
    }

    if (!isValidPhoneNumber(phoneNumber)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const cleanPhone = getCleanPhoneNumber(phoneNumber);
      const formattedForAPI = '+1' + cleanPhone; // Add country code for API

      // Use Supabase phone auth
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedForAPI
      });
      
      if (error) {
        throw error;
      }
      
      console.log('✅ SMS verification code sent to', formattedForAPI);
      
      // Pass source parameter to verification page
      const source = searchParams.get('source');
      const verifyUrl = source 
        ? `/auth/verify?phone=${encodeURIComponent(formattedForAPI)}&source=${source}`
        : `/auth/verify?phone=${encodeURIComponent(formattedForAPI)}`;
      
      router.push(verifyUrl);
    } catch (err) {
      setError('Failed to send verification code. Please try again.');
      console.error('Phone auth error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
    if (error) setError(''); // Clear error when user starts typing
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Get OAuth configuration based on environment and flow
      const source = searchParams.get('source');
      const oauthConfig = getGoogleOAuthConfig({
        source,
        next: source === 'onboarding' ? '/onboarding/profile' : undefined
      });

      // Validate configuration before using it
      validateOAuthConfig(oauthConfig);

      console.log('🔑 Initiating Google OAuth with config:', {
        redirectTo: oauthConfig.redirectTo,
        environment: process.env.NODE_ENV,
        source
      });

      // Use Supabase Google OAuth with validated configuration
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: oauthConfig.redirectTo,
          scopes: oauthConfig.scopes
        }
      });
      
      if (error) {
        throw error;
      }
      
      console.log('✅ Google OAuth redirect initiated successfully');
      
    } catch (err) {
      console.error('Google OAuth error:', err);
      
      // Provide more specific error messages
      if (err instanceof Error) {
        if (err.message.includes('Invalid OAuth redirect URI')) {
          setError('OAuth configuration error. Please contact support.');
        } else if (err.message.includes('HTTPS')) {
          setError('OAuth requires secure connection in production.');
        } else {
          setError('Google sign-in failed. Please try again.');
        }
      } else {
        setError('Google sign-in failed. Please try again.');
      }
      
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Main Container */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 max-w-sm mx-auto w-full">
        
        {/* Logo and Branding */}
        <div className="text-center mb-12">
          <div className="mb-6 flex justify-center">
            <Image
              src="/Images/PNG/logo-black.png"
              alt="27 Circle Logo"
              width={80}
              height={80}
              className="object-contain"
              unoptimized
            />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            27 Circle
          </h1>
          
          <h2 className="text-xl font-medium text-gray-900 mb-3">
            Let Your Curiosity Lead
          </h2>
          
          <p className="text-gray-600 text-base">
            Hang out for 20 minutes on campus
          </p>
        </div>

        {/* Phone Number Form */}
        <form onSubmit={handlePhoneSubmit} className="space-y-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={handlePhoneChange}
              placeholder="(555) 123-4567"
              className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <p className="text-sm text-gray-500 mt-2">
              We'll send you a code via SMS for a secure sign-in.
            </p>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 px-6 text-white font-semibold rounded-full transition-all duration-200 disabled:opacity-50"
            style={{ backgroundColor: '#0E2C54' }}
          >
            {isLoading ? 'Sending...' : 'Send verification code'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or</span>
          </div>
        </div>

        {/* Google Sign-In */}
        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
        >
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign in with Google
        </button>
      </div>
    </div>
  );
}