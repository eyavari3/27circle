"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { saveUserInterests, ensureDevProfile } from "@/app/onboarding/actions";
import { addCuriositySelection, startOnboarding } from "@/lib/onboarding-state";

export interface Option {
  interestKey: string;
  label: string;
  imagePath: string;
  glowColor: 'blue' | 'gold';
}

interface InterestSelectionProps {
  title: string;
  subtitle: string;
  subtext?: string;
  options: Option[];
  nextPageUrl: string;
  buttonText: string;
  stepText?: string;
  showBackButton?: boolean;
  contentShiftUp?: boolean;
}

export default function InterestSelection({
  title,
  subtitle,
  subtext,
  options,
  nextPageUrl,
  buttonText,
  stepText,
  showBackButton = false,
  contentShiftUp = false
}: InterestSelectionProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load existing preferences on mount (for consistency with settings)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const saved = localStorage.getItem('dev-user-preferences');
      if (saved) {
        try {
          const preferences = JSON.parse(saved);
          // Only select preferences that match current page options
          const pagePreferences = preferences.filter((pref: string) => 
            options.some(option => option.interestKey === pref)
          );
          setSelected(pagePreferences);
          console.log('📋 Loaded existing preferences for this page:', pagePreferences);
        } catch (e) {
          console.error('Error loading preferences:', e);
        }
      }
    }
  }, [options]);

  const handleSelect = (interestKey: string) => {
    setSelected(prev =>
      prev.includes(interestKey)
        ? prev.filter(key => key !== interestKey)
        : [...prev, interestKey]
    );
  };

  const handleNext = async () => {
    if (selected.length === 0) {
      setError("Please select at least one interest.");
      return;
    }
    setLoading(true);
    setError("");
    
    // If navigating to login (onboarding flow), save to onboarding state
    if (nextPageUrl.includes('/login?source=onboarding')) {
      try {
        // Start onboarding tracking and save selections
        startOnboarding();
        addCuriositySelection(selected);
        
        // Still save to localStorage for development mode
        if (process.env.NODE_ENV === 'development') {
          const existingSaved = localStorage.getItem('dev-user-preferences');
          let allPreferences = [...selected];
          
          if (existingSaved) {
            try {
              const existing = JSON.parse(existingSaved);
              const currentPageKeys = options.map(opt => opt.interestKey);
              const otherPagePreferences = existing.filter((pref: string) => 
                !currentPageKeys.includes(pref)
              );
              allPreferences = [...otherPagePreferences, ...selected];
            } catch (e) {
              console.error('Error merging preferences:', e);
              // Fallback to just current selections
              allPreferences = [...selected];
            }
          }
          
          localStorage.setItem('dev-user-preferences', JSON.stringify(allPreferences));
          console.log('✅ Onboarding preferences saved for auth flow:', allPreferences);
        }
        
        setLoading(false);
        router.push(nextPageUrl);
        return;
      } catch (error) {
        console.error('Error saving onboarding state:', error);
        setError('Failed to save preferences. Please try again.');
        setLoading(false);
        return;
      }
    }
    
    // Original flow for non-onboarding navigation
    // Save to localStorage in development mode for consistency with settings
    if (process.env.NODE_ENV === 'development') {
      // Merge with existing preferences from other pages
      const existingSaved = localStorage.getItem('dev-user-preferences');
      let allPreferences = [...selected];
      
      if (existingSaved) {
        try {
          const existing = JSON.parse(existingSaved);
          // Remove any existing preferences that are from current page options
          const currentPageKeys = options.map(opt => opt.interestKey);
          const otherPagePreferences = existing.filter((pref: string) => 
            !currentPageKeys.includes(pref)
          );
          allPreferences = [...otherPagePreferences, ...selected];
        } catch (e) {
          console.error('Error merging preferences:', e);
        }
      }
      
      localStorage.setItem('dev-user-preferences', JSON.stringify(allPreferences));
      console.log('✅ Onboarding preferences merged and saved to localStorage:', allPreferences);
    }
    
    const result = await saveUserInterests(selected);
    
    if (process.env.NODE_ENV === 'development' && nextPageUrl === '/circles') {
      await ensureDevProfile();
    }
    
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      router.push(nextPageUrl);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <main 
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: '#FFFFFF' }}
    >
      {/* Container with mobile-first design */}
      <div 
        className="main-container w-full mx-auto flex flex-col flex-1"
        style={{ 
          paddingTop: '10.625rem', // 170px converted to rem
          paddingLeft: '1.5rem',    // 24px converted to rem
          paddingRight: '1.5rem',   // 24px converted to rem
          paddingBottom: '6.25rem', // 100px converted to rem
          minHeight: '812px',
          maxWidth: '375px'
        }}
      >
        {/* Back Arrow - Conditionally rendered */}
        {showBackButton && (
          <div className="mb-8">
            <button 
              onClick={handleBack} 
              className="p-2 -ml-2 rounded-full"
              style={{ backgroundColor: '#F5F5F5' }}
            >
              <svg className="w-6 h-6" fill="none" stroke="#666666" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
        )}

        {/* Content area */}
        <div 
          className="content-area flex-1 flex flex-col"
          style={contentShiftUp ? { transform: 'translateY(-3.75rem)' } : {}}
        >
          {/* Title and subtitle */}
          <div className="text-center mb-8">
            <h1 
              className="font-medium mb-3"
              style={{ 
                fontSize: '1.5rem', // 24px in rem
                lineHeight: '1.3',
                color: '#000000'
              }}
            >
              {title}
            </h1>
            <p 
              className="mx-auto"
              style={{ 
                fontSize: '1rem', // 16px in rem
                lineHeight: '1.5',
                color: '#666666',
                maxWidth: '17.5rem' // 280px in rem
              }}
            >
              {subtitle}
            </p>
            {subtext && (
              <p 
                className="mt-2"
                style={{ 
                  fontSize: '0.875rem', // 14px in rem
                  lineHeight: '1.5',
                  color: '#999999'
                }}
              >
                {subtext}
              </p>
            )}
            
            {/* Separation line */}
            <div 
              className="mx-auto mt-4 mb-6"
              style={{
                width: '5rem', // 80px in rem
                height: '1px',
                background: 'linear-gradient(to right, transparent, #CCCCCC, transparent)'
              }}
            ></div>
          </div>

          {/* Brain Container - Unified presentation */}
          <div 
            className="brain-container relative mx-auto"
            style={{ 
              width: contentShiftUp ? '24.25rem' : '24.5rem', // Tighter for hearts: 388px vs 392px
              height: '17.5rem', // 280px in rem (200px * 1.4) 
              margin: '2rem auto' // 32px in rem
            }}
          >
            {options.map((option, index) => (
              <div
                key={option.interestKey}
                className={`brain-half absolute ${index === 0 ? 'left' : 'right'} group`}
                style={{
                  width: contentShiftUp ? 'calc(50% - 0.125rem)' : 'calc(50% - 0.25rem)', // Tighter gap for hearts: 2px vs 4px each side
                  height: '100%',
                  [index === 0 ? 'left' : 'right']: 0,
                  cursor: 'pointer',
                  transform: selected.includes(option.interestKey) ? 'scale(1.03)' : 'scale(1)',
                  zIndex: selected.includes(option.interestKey) ? 5 : 1,
                  transition: 'transform 0.2s ease'
                }}
                onClick={() => handleSelect(option.interestKey)}
              >
                <div 
                  className={`relative w-full h-full transition-all duration-200 ${
                    selected.includes(option.interestKey) 
                      ? (option.glowColor === 'blue' ? 'drop-shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'drop-shadow-[0_0_20px_rgba(255,248,180,0.5)]')
                      : ''
                  }`}
                  style={{
                    transform: 'scale(1)',
                    filter: selected.includes(option.interestKey)
                      ? `brightness(1.15) contrast(0.95) saturate(1.05) drop-shadow(0 0 1.25rem ${option.glowColor === 'blue' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 248, 180, 0.3)'})`
                      : 'brightness(1.1) contrast(0.9) saturate(0.95)'
                  }}
                  onMouseEnter={(e) => {
                    if (!selected.includes(option.interestKey)) {
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selected.includes(option.interestKey)) {
                      e.currentTarget.style.transform = 'scale(1)';
                    }
                  }}
                >
                  <Image
                    src={option.imagePath}
                    alt={option.label}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 50vw, 25vw"
                    priority
                    unoptimized
                    style={{
                      objectPosition: 'center center'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Labels */}
          <div className="flex justify-center mb-8" style={{ gap: '3rem' }}>
            {options.map((option) => (
              <p 
                key={option.interestKey}
                className="text-center"
                style={{ 
                  fontSize: '1.3125rem', // 21px in rem (14px * 1.5)
                  color: '#333333'
                }}
              >
                {option.label}
              </p>
            ))}
          </div>
        </div>

        {/* Button Container - Fixed at bottom */}
        <div 
          className="button-container mt-auto"
          style={contentShiftUp ? { transform: 'translateY(-3.75rem)' } : {}}
        >
          {error && (
            <div 
              className="text-center mb-4"
              style={{ 
                fontSize: '0.875rem', // 14px in rem
                color: '#FF0000'
              }}
            >
              {error}
            </div>
          )}
          
          <button
            onClick={handleNext}
            disabled={loading}
            className="w-full font-medium transition-all"
            style={{
              backgroundColor: '#152B5C',
              color: '#FFFFFF',
              height: '3.125rem', // 50px in rem
              borderRadius: '1.5625rem', // 25px in rem
              fontSize: '1rem', // 16px in rem
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? "Saving..." : buttonText}
          </button>

          {stepText && (
            <p 
              className="text-center"
              style={{ 
                fontSize: '0.875rem', // 14px in rem
                color: '#666666',
                marginTop: '1rem' // 16px in rem
              }}
            >
              {stepText}
            </p>
          )}
        </div>
      </div>

      {/* Desktop enhancement styles */}
      <style jsx>{`
        @media (min-width: 768px) {
          .main-container {
            max-width: none !important;
            width: 100% !important;
            padding-top: 4rem !important; /* Reduced from 10.625rem */
            padding-bottom: 2rem !important; /* Reduced from 6.25rem */
            min-height: 100vh !important;
            justify-content: center !important;
          }
          
          .brain-container {
            width: 28rem !important;   /* 459px in rem for brains */
            height: 20.125rem !important; /* 322px in rem (230px * 1.4) */
            margin: 1.5rem auto !important; /* Reduced margin */
          }
          
          /* Tighter spacing for hearts on desktop */
          .content-area[style*="translateY"] .brain-container {
            width: 27.75rem !important;   /* 455px in rem for hearts - slightly tighter */
          }
          
          h1 {
            font-size: 1.75rem !important; /* 28px in rem */
          }
          
          .content-area {
            justify-content: center !important;
          }
          
          .button-container {
            margin-top: 2rem !important;
          }
        }
      `}</style>
    </main>
  );
}