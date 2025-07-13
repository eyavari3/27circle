"use client"; // Keep for now as InterestSelection is client

import InterestSelection, { type Option } from '@/components/onboarding/InterestSelection';

export default function CuriosityHeartPage() {
  const heartOptions: Option[] = [
    { 
      interestKey: 'personal_growth', 
      label: 'Personal Growth', 
      imagePath: '/Images/PNG/heart-left.png',
      glowColor: 'blue'
    },
    { 
      interestKey: 'community_service', 
      label: 'Community Service', 
      imagePath: '/Images/PNG/heart-right.png',
      glowColor: 'gold'
    }
  ];

  return (
    <InterestSelection
      title="What goals are on your mind?"
      subtitle="Select one or both themes to meet and chat with up to 3 others."
      
      options={heartOptions}
      nextPageUrl="/login?source=onboarding"
      buttonText="Lead with Curiosity"
      stepText="Step 2 of 2"
      showBackButton={true} // Show back button on second curiosity page
      contentShiftUp={true} // Shift content up by 60px for this page only
    />
  );
}