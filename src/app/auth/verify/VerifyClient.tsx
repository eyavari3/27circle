"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatPhoneForDisplay } from '@/lib/utils/phoneFormatter';
import { createClient } from '@/lib/supabase/client';
import { isTestPhoneNumber, isTestModeEnabled, validateTestOTP } from '@/lib/auth/test-user-utils';
import { typography } from '@/lib/typography';

export default function VerifyClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phoneNumber = searchParams.get('phone') || '';
  const source = searchParams.get('source');
  
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClient();

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim()) {
      setError('Please enter the verification code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Check if this is a test user and test mode is enabled
      const isTestUser = isTestPhoneNumber(phoneNumber);
      const testModeActive = isTestModeEnabled();

      if (isTestUser && testModeActive) {
        // For test users, validate against fixed OTP instead of Supabase
        if (!validateTestOTP(phoneNumber, verificationCode)) {
          throw new Error('Invalid test OTP');
        }
        
        // For test users, we still need to create a real Supabase session
        // But we bypass the OTP verification step by using a server action
        console.log('✅ TEST MODE: Phone verification successful for test user');
        
        // Call server action to create test user session
        const response = await fetch('/api/auth/test-user-verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            phone: phoneNumber,
            testOtp: verificationCode 
          }),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || 'Test user verification failed');
        }
        
        const result = await response.json();
        
        if (result.success && result.testMode) {
          console.log('✅ TEST MODE: Test user created, proceeding to onboarding');
          // Store test user info for server actions to detect
          localStorage.setItem('test-user-id', result.userId);
          localStorage.setItem('test-user-phone', phoneNumber);
          
          // Route based on source parameter  
          if (source === 'onboarding') {
            router.push('/onboarding/profile');
          } else {
            router.push('/circles');
          }
          return;
        } else if (result.success) {
          console.log('✅ TEST MODE: Session created, refreshing page to load auth state');
          // Fallback: refresh to pick up auth state
          window.location.reload();
          return;
        } else {
          throw new Error('Test user authentication failed');
        }
      } else {
        // Use Supabase OTP verification for real users
        const { error } = await supabase.auth.verifyOtp({
          phone: phoneNumber,
          token: verificationCode,
          type: 'sms'
        });
        
        if (error) {
          throw error;
        }
        
        console.log('✅ Phone verification successful');
      }
      
      // Route based on source parameter
      if (source === 'onboarding') {
        router.push('/onboarding/profile');
      } else {
        router.push('/circles');
      }
    } catch (err) {
      setError('Invalid verification code. Please try again.');
      console.error('Verification error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Resend OTP using Supabase
      const { error } = await supabase.auth.signInWithOtp({
        phone: phoneNumber
      });
      
      if (error) {
        throw error;
      }
      
      console.log('✅ Verification code resent to', phoneNumber);
      
    } catch (err) {
      setError('Failed to resend code. Please try again.');
      console.error('Resend error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col justify-center px-6 py-8 max-w-sm mx-auto w-full">
        
        {/* Back Button */}
        <div className="mb-8">
          <button 
            onClick={() => router.back()} 
            className="p-2 -ml-2 rounded-full"
            style={{ backgroundColor: '#F5F5F5' }}
          >
            <svg className="w-6 h-6" fill="none" stroke="#666666" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className={`${typography.page.title} text-gray-900 mb-3`}>
            Check your SMS
          </h1>
          <p className={`${typography.component.small} text-gray-600`}>
            Verification code sent to{' '}
            <span className="font-medium">{formatPhoneForDisplay(phoneNumber)}</span>
          </p>
        </div>

        {/* Verification Form */}
        <form onSubmit={handleVerifyCode} className="space-y-6">
          <div>
            <label className={`block ${typography.section.label} text-gray-700 mb-2`}>
              Verification Code
            </label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit Code"
              className={`w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center ${typography.component.input} tracking-widest`}
              disabled={isLoading}
              maxLength={6}
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || verificationCode.length !== 6}
            className={`w-full py-4 px-6 text-white ${typography.component.button} rounded-full transition-all duration-200 disabled:opacity-50`}
            style={{ backgroundColor: '#0E2C54' }}
          >
            {isLoading ? 'Verifying...' : 'Verify Code'}
          </button>
        </form>

        {/* Helper Text */}
        <div className="text-center mt-6">
          <p className={`${typography.component.small} text-gray-600`}>
            Enter the code to sign in.
          </p>
        </div>
      </div>
    </div>
  );
}