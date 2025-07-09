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

  // Skip profile page in development
  const isDev = process.env.NODE_ENV === 'development';
  const nextPageUrl = isDev ? '/circles' : '/onboarding/profile';
  const buttonText = isDev ? "Go to Circles (Dev)" : "Lead with Curiosity";
  const stepText = isDev ? "Dev Mode: Skipping Profile" : "Step 2 of 2";

  return (
    <InterestSelection
      title="Let Your Curiosity Lead"
      subtitle="And what actions call to your heart?"
      subtext="Select ones that resonate"
      options={heartOptions}
      nextPageUrl={nextPageUrl}
      buttonText={buttonText}
      stepText={stepText}
      showBackButton={true}
    />
  );
} 