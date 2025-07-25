"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { typography } from '@/lib/typography';
import type { User } from '@supabase/supabase-js';

export default function SettingsClient() {
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        if (user) {
          // Check if user has profile data
          const { data: profile } = await supabase
            .from('users')
            .select('full_name, gender, date_of_birth')
            .eq('id', user.id)
            .single();
          
          setProfileData(profile);
        }
        
        console.log('🎯 CHECK:', {
          point: 'settings_access',
          hasAuth: !!user,
          hasProfile: !!profileData
        });
      } catch (error) {
        console.log('🎯 CHECK:', {
          point: 'settings_access',
          hasAuth: false,
          hasProfile: false
        });
      }
    }
    
    checkAuth();
  }, [supabase]);

  const settingsItems = [
    {
      id: 'account',
      label: 'Account Information',
      icon: 'person',
      action: () => router.push('/settings/account'),
      hasArrow: true,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: 'person',
      action: () => setNotificationsEnabled(!notificationsEnabled),
      hasArrow: false,
      hasToggle: true,
    },
    {
      id: 'logout',
      label: 'Logout',
      icon: 'logout',
      action: async () => {
        try {
          // Sign out from Supabase (clears session)
          const { error } = await supabase.auth.signOut();
          
          if (error) {
          } else {
          }
          
          // Remove waitlist entries but keep preferences and account data
          if (process.env.NODE_ENV === 'development') {
            // Only remove waitlist-related data, preserve preferences and account info
            localStorage.removeItem('dev-waitlist');
          }
          
          // Navigate to login page
          router.push('/login');
        } catch (err) {
          // Still navigate to login even if logout fails
          router.push('/login');
        }
      },
      hasArrow: true,
    },
  ];

  const PersonIcon = () => (
    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );

  const LogoutIcon = () => (
    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );

  const ArrowIcon = () => (
    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center p-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors mr-4"
          aria-label="Go back"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Title */}
      <div className="px-6 mb-8">
        <h1 className={`${typography.page.title} text-gray-900`}>Settings</h1>
      </div>

      {/* Settings Items */}
      <div className="px-6">
        <div className="space-y-1">
          {settingsItems.map((item) => (
            <button
              key={item.id}
              onClick={item.action}
              className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  {item.icon === 'person' ? <PersonIcon /> : <LogoutIcon />}
                </div>
                <span className={`${typography.component.body} text-gray-900`}>{item.label}</span>
              </div>
              
              <div className="flex items-center">
                {item.hasToggle && (
                  <div className={`relative inline-block w-12 h-6 transition-colors duration-200 ease-in-out rounded-full ${
                    notificationsEnabled ? 'bg-blue-600' : 'bg-gray-300'
                  }`}>
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ease-in-out ${
                      notificationsEnabled ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </div>
                )}
                {item.hasArrow && <ArrowIcon />}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}