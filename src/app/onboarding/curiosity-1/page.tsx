"use client"; // Keep for now as InterestSelection is client

import InterestSelection, { type Option } from '@/components/onboarding/InterestSelection';

export default function CuriosityHeadPage() {
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

  return (
    <InterestSelection
      title="What sparks your curiosity?"
      subtitle="Select one or both themes to meet and chat with up to 3 others."
      
      options={headOptions}
      nextPageUrl="/onboarding/curiosity-1.1"
      buttonText="Next"
      stepText="Step 1 of 2"
      showBackButton={false} // No back on first curiosity page
    />
  );
} 