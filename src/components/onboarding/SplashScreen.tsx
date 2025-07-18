"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";

export default function SplashScreen() {
  const [animate, setAnimate] = useState(false);
  const [settled, setSettled] = useState(false);
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    console.log('🚀 SplashScreen useEffect running at:', new Date().toISOString());
    const mountTime = Date.now();
    isMountedRef.current = true;
    
    console.log('⏰ Setting up animate timer for 100ms...');
    // Trigger animations after mount
    const animateTimer = setTimeout(() => {
      console.log('🔥 Animate timer callback executing at:', Date.now() - mountTime, 'ms');
      if (isMountedRef.current) {
        console.log('🎬 Animations started at:', Date.now() - mountTime, 'ms');
        setAnimate(true);
        console.log('✅ setAnimate(true) called');
      } else {
        console.log('❌ Component unmounted before animate timer could run');
      }
    }, 100);
    
    console.log('⏰ Setting up settle timer for 2800ms...');
    // Final settle for crisp edges
    const settleTime = 2800;
    const settleTimer = setTimeout(() => {
      console.log('🔥 Settle timer callback executing at:', Date.now() - mountTime, 'ms');
      if (isMountedRef.current) {
        console.log('✨ Animations settled at:', Date.now() - mountTime, 'ms');
        setSettled(true);
        console.log('✅ setSettled(true) called');
      } else {
        console.log('❌ Component unmounted before settle timer could run');
      }
    }, settleTime);
    
    return () => {
      console.log('🧹 SplashScreen cleanup running at:', Date.now() - mountTime, 'ms');
      console.log('🧹 Clearing timers...');
      isMountedRef.current = false;
      clearTimeout(animateTimer);
      clearTimeout(settleTimer);
      console.log('💥 SplashScreen cleanup complete');
    };
  }, []);
  
  console.log('🔄 SplashScreen render - animate:', animate, 'settled:', settled);

  return (
    <main 
      className="min-h-screen flex flex-col text-white relative overflow-hidden"
      style={{
        background: animate 
          ? 'linear-gradient(180deg, #152B5C 0%, #142959 100%)' 
          : '#0A192F',
        transition: 'background 1.5s ease-out'
      }}
      aria-live="polite"
      aria-label="Splash screen: Be Curious Together"
      aria-busy={!settled}
    >
      <div className="flex-1 flex flex-col justify-center text-center px-4 relative z-10 max-w-lg mx-auto pt-[10vh] pb-[8vh]">
        {/* "27 Circle" Title - PRP: Page headers should be 1.875rem (30px) */}
        <h1 
          className="text-[1.375rem] font-bold tracking-wide mb-4 transition-all duration-1000 delay-500"
          style={{
            opacity: animate ? 1 : 0,
            transform: animate ? 'scale(1)' : 'scale(0.9)',
            willChange: 'transform, opacity',
            transitionTimingFunction: animate ? 'cubic-bezier(0.34, 1.56, 0.64, 1)' : 'ease-out',
            filter: settled ? 'contrast(1.02)' : 'none'
          }}
        >
          27 Circle
        </h1>
        
        {/* Logo with Animation Effects - PRP: 3rem (48px) height */}
        <div 
          className="mb-6 transition-all duration-1000 delay-500"
          style={{
            opacity: animate ? 1 : 0,
            transform: animate ? 'scale(1)' : 'scale(0.95)',
            willChange: 'transform, opacity',
            transitionTimingFunction: animate ? 'cubic-bezier(0.34, 1.56, 0.64, 1)' : 'ease-out'
          }}
        >
          <div className="w-12 h-12 mx-auto relative">
            {/* Actual Logo */}
            <Image
              src="/Images/PNG/white-logo.svg"
              alt="27 Circle Logo"
              width={48}
              height={48}
              className={`w-full h-full object-contain ${
                animate ? 'animate-logo-draw' : ''
              }`}
              style={{
                filter: animate && settled 
                  ? 'drop-shadow(0 0 8px rgba(255,255,255,0.6))' 
                  : animate 
                    ? 'drop-shadow(0 0 4px rgba(255,255,255,0.3))'
                    : 'none',
                willChange: 'filter'
              }}
              onError={() => {
                console.error('Logo failed to load');
              }}
              priority
            />
            
            {/* Glow overlay that pulses on completion */}
            {animate && settled && (
              <div 
                className="absolute inset-0 pointer-events-none animate-glow-pulse"
                style={{
                  background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                  borderRadius: '50%'
                }}
              />
            )}
          </div>
        </div>
        
        {/* "Be Curious Together" Tagline - PRP: Body text should be 1rem (16px) */}
        <p 
          className="text-[1rem] font-medium tracking-wide mb-4 transition-all duration-1000 delay-[1500ms]"
          style={{
            opacity: animate ? 1 : 0,
            filter: animate ? 'blur(0)' : 'blur(8px)',
            willChange: 'filter, opacity',
            fontWeight: '500'
          }}
        >
          Be Curious Together
        </p>
        
        {/* Subtext - PRP: Caption text should be 0.875rem (14px) */}
        <p 
          className="text-[0.875rem] font-normal tracking-wide transition-all duration-1000 delay-[1800ms]"
          style={{
            opacity: animate ? 0.8 : 0,
            transform: animate ? 'translateY(0)' : 'translateY(0.5rem)',
            willChange: 'transform, opacity',
            transitionTimingFunction: animate ? 'cubic-bezier(0.34, 1.56, 0.64, 1)' : 'ease-out',
            fontWeight: '400'
          }}
        >
          Hang out for 20 minutes on campus
        </p>
      </div>
    </main>
  );
}