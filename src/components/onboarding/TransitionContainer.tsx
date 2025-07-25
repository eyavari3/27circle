"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SplashScreen from "./SplashScreen";
import CuriosityPageWrapper from "./CuriosityPageWrapper";

export default function TransitionContainer() {
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);
  const [splashFading, setSplashFading] = useState(false);
  const [curiosityVisible, setCuriosityVisible] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    console.log('🏗️ TransitionContainer useEffect running');
    
    // In development mode, check if user has already completed onboarding
    if (process.env.NODE_ENV === 'development') {
      const hasAccount = localStorage.getItem('dev-user-account');
      const hasPreferences = localStorage.getItem('dev-user-preferences');
      
      // If user has completed full onboarding, redirect to main
      if (hasAccount && hasPreferences) {
        try {
          const accountData = JSON.parse(hasAccount);
          const preferences = JSON.parse(hasPreferences);
          
          // Check if onboarding is complete
          if (accountData.fullName && accountData.gender && accountData.dateOfBirth && 
              preferences && preferences.length > 0) {
            console.log('🔄 User has completed onboarding, redirecting to main page...');
            router.push('/circles');
            return;
          }
        } catch (e) {
          console.error('Error checking onboarding status:', e);
        }
      }
      
      // If user has partial onboarding (account but no preferences), skip splash
      if (hasAccount && !hasPreferences) {
        try {
          const accountData = JSON.parse(hasAccount);
          if (accountData.fullName && accountData.gender && accountData.dateOfBirth) {
            console.log('🔄 User has profile, redirecting to preferences...');
            router.push('/onboarding/curiosity-1');
            return;
          }
        } catch (e) {
          console.error('Error checking partial onboarding:', e);
        }
      }
    }
    
    console.log('✅ TransitionContainer auth check complete, starting splash timer');
    setIsCheckingAuth(false);
    
    // Start fade out at 4.8s to match SplashScreen's internal timing
    const fadeOutTimer = setTimeout(() => {
      console.log('⏰ TransitionContainer fade timer executing at 4.8s');
      setSplashFading(true);
      // Start curiosity fade in slightly before splash is fully gone
      setTimeout(() => {
        setCuriosityVisible(true);
      }, 300);
      // Remove splash from DOM after fade
      setTimeout(() => {
        setShowSplash(false);
      }, 500);
    }, 4800); // Match SplashScreen's total duration (2800ms settle + 2000ms reading)

    return () => {
      console.log('🧹 TransitionContainer cleanup, clearing fade timer');
      clearTimeout(fadeOutTimer);
    };
  }, [router]);

  const handleSkip = () => {
    // Immediate transition on click
    setSplashFading(true);
    setTimeout(() => {
      setCuriosityVisible(true);
    }, 150);
    setTimeout(() => {
      setShowSplash(false);
    }, 300);
  };

  // Don't render anything while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="w-full h-screen bg-white flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Splash Screen */}
      {showSplash && (
        <div
          className={`fixed inset-0 w-full h-full transition-opacity duration-500 ${
            splashFading ? "opacity-0" : "opacity-100"
          } z-20`}
          onClick={handleSkip}
        >
          <SplashScreen />
        </div>
      )}

      {/* Curiosity Page */}
      {curiosityVisible && (
        <div className="fixed inset-0 w-full h-full z-10">
          <CuriosityPageWrapper />
        </div>
      )}
    </div>
  );
}