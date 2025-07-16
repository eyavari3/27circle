"use client";

import { useEffect } from 'react';
import InterestSelection, { type Option } from '@/components/onboarding/InterestSelection';

export default function CuriosityPageWrapper() {
  const headOptions: Option[] = [
    { 
      interestKey: 'scientific_topics', 
      label: 'Scientific Topics', 
      imagePath: '/Images/PNG/brain-left.png',
      glowColor: 'blue'
    },
    { 
      interestKey: 'spiritual_discussions', 
      label: 'Spiritual Discussions', 
      imagePath: '/Images/PNG/brain-right.png',
      glowColor: 'gold'
    }
  ];

  useEffect(() => {
    // Clean up transition class after animations complete
    const cleanupTimer = setTimeout(() => {
      document.body.classList.remove('transitioning-to-curiosity');
    }, 1200); // Total animation duration

    return () => {
      clearTimeout(cleanupTimer);
      // Always clean up on unmount
      document.body.classList.remove('transitioning-to-curiosity');
    };
  }, []);

  return (
    <div className="min-h-screen w-full relative">
      {/* Transition overlay for CSS-only animation */}
      <div className="transition-overlay" />
      
      <InterestSelection
        title="What sparks your curiosity?"
        subtitle="Select one or both themes to meet and chat with up to 3 others."
        
        options={headOptions}
        nextPageUrl="/onboarding/curiosity-1.1"
        buttonText="Next"
        stepText="Step 1 of 2"
        showBackButton={false}
      />
    </div>
  );
}