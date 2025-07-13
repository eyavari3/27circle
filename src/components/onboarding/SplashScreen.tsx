"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface SplashScreenProps {
  isVisible?: boolean;
}

export default function SplashScreen({ isVisible = true }: SplashScreenProps) {
  const [titleVisible, setTitleVisible] = useState(false);
  const [logoVisible, setLogoVisible] = useState(false);
  const [taglineVisible, setTaglineVisible] = useState(false);
  const [subtextVisible, setSubtextVisible] = useState(false);

  useEffect(() => {
    // Stagger animations on mount
    const titleTimer = setTimeout(() => {
      setTitleVisible(true);
    }, 300);

    const logoTimer = setTimeout(() => {
      setLogoVisible(true);
    }, 700);

    const taglineTimer = setTimeout(() => {
      setTaglineVisible(true);
    }, 1100);

    const subtextTimer = setTimeout(() => {
      setSubtextVisible(true);
    }, 1500);

    return () => {
      clearTimeout(titleTimer);
      clearTimeout(logoTimer);
      clearTimeout(taglineTimer);
      clearTimeout(subtextTimer);
    };
  }, []);

  return (
    <main 
      className="min-h-screen flex flex-col items-center justify-center text-white relative overflow-hidden"
      style={{ backgroundColor: '#152B5C' }}
    >
      <div className="text-center px-6 relative z-10 max-w-lg mx-auto">
        {/* Title */}
        <div className={`transition-opacity duration-1000 ${titleVisible ? 'opacity-100' : 'opacity-0'}`}>
          <h1 style={{ fontSize: '3rem', marginBottom: '2rem' }} className="md:text-[4rem] font-bold tracking-wide text-center">
            27 Circle
          </h1>
        </div>
        
        {/* Logo Icon */}
        <div className={`transition-opacity duration-1000 ${logoVisible ? 'opacity-100' : 'opacity-0'}`}>
          <div style={{ width: '8rem', height: '4rem', marginBottom: '2rem' }} className="mx-auto relative">
            <Image
              src="/Images/PNG/logo.png"
              alt="27 Circle Logo"
              fill
              className="object-contain"
              sizes="(max-width: 768px) 8rem, 10rem"
              unoptimized
            />
          </div>
        </div>
        
        {/* Tagline */}
        <div className={`transition-opacity duration-1000 ${taglineVisible ? 'opacity-100' : 'opacity-0'}`}>
          <p style={{ fontSize: '1.5rem', marginBottom: '1rem' }} className="md:text-[1.75rem] font-light tracking-wide">
            Be Curious Together
          </p>
        </div>

        {/* Subtext */}
        <div className={`transition-opacity duration-1000 ${subtextVisible ? 'opacity-100' : 'opacity-0'}`}>
          <p style={{ fontSize: '1rem' }} className="md:text-[1.125rem] font-light tracking-wide opacity-90">
            Hang out for 20 minutes on campus
          </p>
        </div>
      </div>
    </main>
  );
}