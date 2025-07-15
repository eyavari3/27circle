"use client";

import { useRef, useCallback, useEffect } from "react";
import { getCurrentPSTTime } from "@/lib/time";
import { APP_TIME_OFFSET } from "@/lib/constants";

// Browser compatibility fallbacks
const performanceNow = (): number => {
  return (typeof performance !== 'undefined' && performance.now) 
    ? performance.now() 
    : Date.now();
};

const requestAnimFrame = (callback: FrameRequestCallback): number => {
  if (typeof requestAnimationFrame !== 'undefined') {
    return requestAnimationFrame(callback);
  }
  
  // Fallback with adaptive timing for better smoothness
  const lastTime = performanceNow();
  return setTimeout(() => {
    const currentTime = performanceNow();
    const deltaTime = currentTime - lastTime;
    // Adjust next frame timing based on actual performance
    callback(currentTime);
  }, 16) as unknown as number; // Target ~60fps
};

const cancelAnimFrame = (id: number): void => {
  if (typeof cancelAnimationFrame !== 'undefined') {
    cancelAnimationFrame(id);
  } else {
    clearTimeout(id);
  }
};

export function useCurrentTime(initialTime?: Date) {
  // Validate initialTime if provided
  const validatedInitialTime = initialTime && !isNaN(initialTime.getTime()) 
    ? initialTime 
    : undefined;
    
  const baselineRef = useRef({
    time: validatedInitialTime?.getTime() || getCurrentPSTTime().getTime(),
    perf: performanceNow()
  });

  // Debug mode support - stricter checks to prevent production leakage
  const isDebug = typeof window !== 'undefined' && 
    process.env.NODE_ENV === 'development' && 
    (!process.env.NEXT_PUBLIC_IS_PROD) &&
    (localStorage.getItem('debug-time') !== 'false');

  const resyncBaseline = useCallback(() => {
    try {
      const currentPST = getCurrentPSTTime();
      
      // Apply APP_TIME_OFFSET if it's set (for testing)
      if (APP_TIME_OFFSET !== null) {
        currentPST.setHours(Math.floor(APP_TIME_OFFSET));
        currentPST.setMinutes((APP_TIME_OFFSET % 1) * 60);
        currentPST.setSeconds(0);
        currentPST.setMilliseconds(0);
      }
      
      const newBaseline = {
        time: currentPST.getTime(),
        perf: performanceNow()
      };
      
      // Validate the new baseline
      if (isNaN(newBaseline.time)) {
        throw new Error('Invalid time value in resync');
      }
      
      baselineRef.current = newBaseline;
      if (isDebug) {
        console.log('🔄 Time baseline resynced:', new Date(newBaseline.time), 
          APP_TIME_OFFSET ? `(APP_TIME_OFFSET: ${APP_TIME_OFFSET})` : '');
      }
    } catch (error) {
      // Fallback to Date.now() if timezone computation fails
      const fallbackTime = Date.now();
      baselineRef.current = {
        time: fallbackTime,
        perf: performanceNow()
      };
      if (isDebug) {
        console.error('⚠️ Time resync error, using fallback:', error);
      }
    }
  }, [isDebug]);

  const getNow = useCallback(() => {
    try {
      const elapsed = performanceNow() - baselineRef.current.perf;
      const currentTime = new Date(baselineRef.current.time + elapsed);
      
      // Validate the result
      if (isNaN(currentTime.getTime())) {
        throw new Error('Invalid time calculation');
      }
      
      return currentTime;
    } catch (error) {
      // Fallback to current time if calculation fails
      if (isDebug) {
        console.error('⚠️ getNow error, using fallback:', error);
      }
      return new Date();
    }
  }, [isDebug]);

  const rafRef = useRef<number | null>(null);
  const resyncTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startLiveUpdates = useCallback((callback: (now: Date) => void) => {
    // Log warning in debug mode if using fallback
    if (isDebug && typeof requestAnimationFrame === 'undefined') {
      console.warn('⚠️ RAF not supported - using setTimeout fallback');
    }
    
    const loop = () => {
      callback(getNow());
      rafRef.current = requestAnimFrame(loop);
    };
    rafRef.current = requestAnimFrame(loop);
  }, [getNow, isDebug]);

  const stopLiveUpdates = useCallback(() => {
    if (rafRef.current) {
      cancelAnimFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  // Manual resync for testing/debugging
  const forceResync = useCallback(() => {
    resyncBaseline();
  }, [resyncBaseline]);

  useEffect(() => {
    // Periodic resync every 10 minutes to prevent drift
    const startResyncTimer = () => {
      resyncTimerRef.current = setInterval(() => {
        if (!document.hidden) {
          resyncBaseline();
        }
      }, 10 * 60 * 1000); // 10 minutes
    };

    const handleVisibility = () => {
      if (document.hidden) {
        stopLiveUpdates();
        if (resyncTimerRef.current) {
          clearInterval(resyncTimerRef.current);
          resyncTimerRef.current = null;
        }
      } else {
        resyncBaseline();
        startResyncTimer();
      }
    };
    
    // Handle focus events for system clock changes
    const handleFocus = () => {
      // Always resync on focus to catch system clock changes
      resyncBaseline();
      if (isDebug) {
        console.log('🔍 Window focused - resyncing time baseline');
      }
    };
    
    // Handle online/offline events (for extended suspensions)
    const handleOnline = () => {
      resyncBaseline();
      if (isDebug) {
        console.log('🌐 Back online - resyncing time baseline');
      }
    };

    // Initial setup
    startResyncTimer();
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);

    // Expose forceResync ONLY in development mode
    if (isDebug && typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      (window as unknown as Record<string, unknown>).forceTimeResync = forceResync;
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
      if (resyncTimerRef.current) {
        clearInterval(resyncTimerRef.current);
      }
      stopLiveUpdates();
    };
  }, [stopLiveUpdates, resyncBaseline, forceResync, isDebug]);

  return { getNow, startLiveUpdates, stopLiveUpdates, forceResync };
}