"use client";

import InterestSelection from '@/components/onboarding/InterestSelection';

export default function CuriosityHeartPage() {
  const heartOptions = [
    { 
      interestKey: 'new_activities', 
      label: 'New Activities', 
      imagePath: '/images/curiosity/Heart_Left.png',
      glowColor: 'drop-shadow-glow-blue'
    },
    { 
      interestKey: 'community_service', 
      label: 'Community Service', 
      imagePath: '/images/curiosity/Heart_Right.png',
      glowColor: 'drop-shadow-glow-yellow'
    }
  ];

  return (
    <InterestSelection
      title="Let Your Curiosity Lead"
      subtitle="And what actions call to your heart?"
      subtext="Select ones that resonate"
      options={heartOptions}
      nextPageUrl="/onboarding/profile"
      buttonText="Lead with Curiosity"
      stepText="Step 2 of 2"
      showBackButton={true}
    />
  );
} 