"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function WelcomeScreen() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  const handleStartJourney = () => {
    router.push("/onboarding/profile");
  };

  useEffect(() => {
    // Trigger fade-in animation after component mounts
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-8">
      <div className="max-w-sm w-full space-y-6 text-center">
        {/* Image Section - Constrained to 40% of screen height on mobile */}
        <div className={`space-y-5 transition-all duration-700 ease-out ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <div className="relative w-full h-44 rounded-2xl overflow-hidden">
            <Image
              src="/images/onboarding/Friends_Seated.png"
              alt="Three friends having a conversation at an outdoor table"
              fill
              className="object-cover"
              priority
            />
          </div>
          
          {/* Text Content with Staggered Animation */}
          <div className={`space-y-3 transition-all duration-700 ease-out delay-200 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <h1 className="text-xl font-bold text-gray-900">
              Meet 3 curious minds
            </h1>
            
            <p className="text-sm text-gray-600">
              Hang out for 20 minute on campus
            </p>
            
            <div className="w-12 h-0.5 bg-gray-300 mx-auto my-2"></div>
            
            <p className="text-xs text-gray-500">
              Initiative for a more connected world by 2027
            </p>
          </div>
        </div>
        
        {/* Button Section with Final Animation */}
        <div className={`space-y-3 transition-all duration-700 ease-out delay-400 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <button
            onClick={handleStartJourney}
            className="w-full active:scale-95 text-white font-medium py-3 px-8 rounded-full text-sm transition-all duration-200"
            style={{backgroundColor: '#0E2C54'}}
          >
            Start my journey
          </button>
          
          <p className="text-xs text-gray-400">
            Free & Secure Access
          </p>
        </div>
      </div>
    </main>
  );
}