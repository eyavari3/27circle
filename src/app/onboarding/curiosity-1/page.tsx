"use client";

import InterestSelection from '@/components/onboarding/InterestSelection';

export default function CuriosityHeadPage() {
  const headOptions = [
    { 
      interestKey: 'deep_conversations', 
      label: 'Deep Conversations', 
      imagePath: '/images/curiosity/Deep_Brain.png',
      glowColor: 'drop-shadow-glow-blue'
    },
    { 
      interestKey: 'spiritual_exploration', 
      label: 'Spiritual Exploration', 
      imagePath: '/images/curiosity/Spiritual_Brain.png',
      glowColor: 'drop-shadow-glow-yellow'
    }
  ];

  return (
    <InterestSelection
      title="Let Your Curiosity Lead"
      subtitle="What draws your mind to connect?"
      subtext="Select ones that resonate"
      options={headOptions}
      nextPageUrl="/onboarding/curiosity-2"
      buttonText="Explore Actions"
      stepText="Step 1 of 2"
    />
  );
} 