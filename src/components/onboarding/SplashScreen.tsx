"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function SplashScreen() {
  const router = useRouter();
  const [titleVisible, setTitleVisible] = useState(false);
  const [logoVisible, setLogoVisible] = useState(false);
  const [taglineVisible, setTaglineVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Title "27 Circle" fades in at 1s
    const titleTimer = setTimeout(() => {
      setTitleVisible(true);
    }, 1000);

    // Logo icon fades in at 1.5s
    const logoTimer = setTimeout(() => {
      setLogoVisible(true);
    }, 1500);

    // Tagline "Be Curious Together" fades in at 2s
    const taglineTimer = setTimeout(() => {
      setTaglineVisible(true);
    }, 2000);

    // Fade to white and redirect after 4s total
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 3700);

    const redirectTimer = setTimeout(() => {
      router.push("/onboarding/curiosity-1");
    }, 4000);

    return () => {
      clearTimeout(titleTimer);
      clearTimeout(logoTimer);
      clearTimeout(taglineTimer);
      clearTimeout(fadeTimer);
      clearTimeout(redirectTimer);
    };
  }, [router]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center text-white relative overflow-hidden" style={{backgroundColor: '#0E2C54'}}>
      {/* Fade to white overlay */}
      <div 
        className={`absolute inset-0 bg-white transition-opacity duration-300 ${
          fadeOut ? 'opacity-100' : 'opacity-0'
        }`}
      />
      
      <div className="text-center space-y-6 relative z-10">
        {/* Title */}
        <div className={`transition-opacity duration-1000 ${titleVisible ? 'opacity-100' : 'opacity-0'}`}>
          <h1 className="text-6xl font-bold tracking-wide text-center">
            27 Circle
          </h1>
        </div>
        
        {/* Logo Icon */}
        <div className={`transition-opacity duration-1000 ${logoVisible ? 'opacity-100' : 'opacity-0'}`}>
          <div className="relative w-20 h-20 mx-auto">
            <Image
              src="/Images/Sign up /27 Circle White Text.png"
              alt="27 Circle Logo"
              fill
              className="object-contain"
            />
          </div>
        </div>
        
        {/* Tagline */}
        <div className={`space-y-3 transition-opacity duration-1000 ${
          taglineVisible ? 'opacity-100' : 'opacity-0'
        }`}>
          <p className="text-lg font-light tracking-wide">
            Be Curious Together
          </p>
          <p className="text-base font-light tracking-wide">
            Hang out for 20 minute on campus
          </p>
        </div>
      </div>
    </main>
  );
}