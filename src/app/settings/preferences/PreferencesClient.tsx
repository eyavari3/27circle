"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { updateUserInterests } from './actions';

interface PreferenceOption {
  key: string;
  label: string;
  imagePath: string;
  glowColor: 'blue' | 'gold';
}

interface PreferencesClientProps {
  initialData: string[] | null;
}

export default function PreferencesClient({ initialData }: PreferencesClientProps) {
  const router = useRouter();
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Brain preferences (first set)
  const brainPreferences: PreferenceOption[] = [
    {
      key: 'scientific_topics',
      label: 'Scientific Topics',
      imagePath: '/Images/PNG/brain-left.png',
      glowColor: 'blue',
    },
    {
      key: 'spiritual_discussions', 
      label: 'Spiritual Discussions',
      imagePath: '/Images/PNG/brain-right.png',
      glowColor: 'gold',
    },
  ];

  // Heart preferences (second set)
  const heartPreferences: PreferenceOption[] = [
    {
      key: 'personal_growth',
      label: 'Personal Growth', 
      imagePath: '/Images/PNG/heart-left.png',
      glowColor: 'blue',
    },
    {
      key: 'community_service',
      label: 'Community Service',
      imagePath: '/Images/PNG/heart-right.png', 
      glowColor: 'gold',
    },
  ];

  // Load saved preferences on mount
  useEffect(() => {
    async function loadPreferences() {
      // Use initialData from database first, then fallback to Storage utility
      if (initialData && initialData.length > 0) {
        setSelectedPreferences(initialData);
      } else {
        try {
          const { Storage } = await import('@/lib/storage');
          const storage = new Storage();
          const saved = await storage.get<string[]>('dev-user-preferences', []);
          if (saved && saved.length > 0) {
            setSelectedPreferences(saved);
          }
        } catch (e) {
          console.error('Error loading preferences from storage:', e);
        }
      }
    }
    
    loadPreferences();
  }, [initialData]);

  const togglePreference = (key: string) => {
    setSelectedPreferences(prev => 
      prev.includes(key) 
        ? prev.filter(p => p !== key)
        : [...prev, key]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Save to database
      const result = await updateUserInterests(selectedPreferences);
      
      if (result.error) {
        console.error('Error saving preferences:', result.error);
        // Could add toast notification here
        return;
      }
      
      // Also save to Storage utility for dev/prod parity
      try {
        const { Storage } = await import('@/lib/storage');
        const storage = new Storage();
        await storage.set('dev-user-preferences', selectedPreferences);
        console.log('✅ Preferences saved to storage:', selectedPreferences);
      } catch (error) {
        console.error('Error saving preferences to storage:', error);
      }
      
      // Small delay for UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      router.back();
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Component to render a preference set (brain or heart) with onboarding styling
  const PreferenceSet = ({ 
    options, 
    title, 
    subtitle,
    contentShiftUp = false 
  }: { 
    options: PreferenceOption[]; 
    title: string;
    subtitle: string;
    contentShiftUp?: boolean;
  }) => (
    <div className="mb-12">
      {/* Title and subtitle */}
      <div className="text-center mb-8">
        <h2 
          className="font-medium mb-3"
          style={{ 
            fontSize: '1.5rem',
            lineHeight: '1.3',
            color: '#000000'
          }}
        >
          {title}
        </h2>
        <p 
          className="mx-auto"
          style={{ 
            fontSize: '1rem',
            lineHeight: '1.5',
            color: '#666666',
            maxWidth: '17.5rem'
          }}
        >
          {subtitle}
        </p>
        
        {/* Separation line */}
        <div 
          className="mx-auto mt-4 mb-6"
          style={{
            width: '5rem',
            height: '1px',
            background: 'linear-gradient(to right, transparent, #CCCCCC, transparent)'
          }}
        ></div>
      </div>

      {/* Images Container - Unified presentation matching onboarding */}
      <div 
        className="brain-container relative mx-auto"
        style={{ 
          width: contentShiftUp ? '24.25rem' : '24.5rem',
          height: '17.5rem',
          margin: '2rem auto'
        }}
      >
        {options.map((option, index) => (
          <div
            key={option.key}
            className={`brain-half absolute ${index === 0 ? 'left' : 'right'} group`}
            style={{
              width: contentShiftUp ? 'calc(50% - 0.125rem)' : 'calc(50% - 0.25rem)',
              height: '100%',
              [index === 0 ? 'left' : 'right']: 0,
              cursor: 'pointer',
              transform: selectedPreferences.includes(option.key) ? 'scale(1.03)' : 'scale(1)',
              zIndex: selectedPreferences.includes(option.key) ? 5 : 1,
              transition: 'transform 0.2s ease'
            }}
            onClick={() => togglePreference(option.key)}
          >
            <div 
              className={`relative w-full h-full transition-all duration-200 ${
                selectedPreferences.includes(option.key) 
                  ? (option.glowColor === 'blue' ? 'drop-shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'drop-shadow-[0_0_20px_rgba(255,248,180,0.5)]')
                  : ''
              }`}
              style={{
                transform: 'scale(1)',
                filter: selectedPreferences.includes(option.key)
                  ? `brightness(1.15) contrast(0.95) saturate(1.05) drop-shadow(0 0 1.25rem ${option.glowColor === 'blue' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 248, 180, 0.3)'})`
                  : 'brightness(1.1) contrast(0.9) saturate(0.95)'
              }}
              onMouseEnter={(e) => {
                if (!selectedPreferences.includes(option.key)) {
                  e.currentTarget.style.transform = 'scale(1.02)';
                }
              }}
              onMouseLeave={(e) => {
                if (!selectedPreferences.includes(option.key)) {
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
            key={option.key}
            className="text-center"
            style={{ 
              fontSize: '1.3125rem',
              color: '#333333'
            }}
          >
            {option.label}
          </p>
        ))}
      </div>
    </div>
  );

  return (
    <main 
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: '#FFFFFF' }}
    >
      {/* Container with mobile-first design matching onboarding */}
      <div 
        className="main-container w-full mx-auto flex flex-col flex-1"
        style={{ 
          paddingTop: '3rem',
          paddingLeft: '1.5rem',
          paddingRight: '1.5rem',
          paddingBottom: '6.25rem',
          minHeight: '812px',
          maxWidth: '375px'
        }}
      >
        {/* Back Arrow */}
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

        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 
            className="font-medium mb-3"
            style={{ 
              fontSize: '2rem',
              lineHeight: '1.3',
              color: '#000000'
            }}
          >
            Update Your Preferences
          </h1>
          <p 
            className="mx-auto"
            style={{ 
              fontSize: '1rem',
              lineHeight: '1.5',
              color: '#666666',
              maxWidth: '20rem'
            }}
          >
            Select your interests to find the perfect conversation partners
          </p>
        </div>

        {/* Brain Preferences */}
        <PreferenceSet
          options={brainPreferences}
          title="What sparks your curiosity?"
          subtitle="Select one or both themes"
        />

        {/* Heart Preferences */}
        <PreferenceSet
          options={heartPreferences}
          title="What goals are on your mind?"
          subtitle="Select one or both themes"
          contentShiftUp={true}
        />

        {/* Save Button - Fixed at bottom */}
        <div className="mt-auto">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full font-medium transition-all"
            style={{
              backgroundColor: '#152B5C',
              color: '#FFFFFF',
              height: '3.125rem',
              borderRadius: '1.5625rem',
              fontSize: '1rem',
              opacity: isSaving ? 0.7 : 1
            }}
          >
            {isSaving ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      </div>

      {/* Desktop enhancement styles matching onboarding */}
      <style jsx>{`
        @media (min-width: 768px) {
          .main-container {
            max-width: none !important;
            width: 100% !important;
            padding-top: 4rem !important;
            padding-bottom: 2rem !important;
            min-height: 100vh !important;
            justify-content: center !important;
          }
          
          .brain-container {
            width: 28rem !important;
            height: 20.125rem !important;
            margin: 1.5rem auto !important;
          }
          
          h1 {
            font-size: 2.5rem !important;
          }
          
          h2 {
            font-size: 1.75rem !important;
          }
        }
      `}</style>
    </main>
  );
}