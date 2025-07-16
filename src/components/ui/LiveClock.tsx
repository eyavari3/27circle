"use client";

import { useState, useEffect, useRef } from "react";
import { useCurrentTime } from "@/lib/hooks/useCurrentTime";
import { formatDisplayTime } from "@/lib/time";

interface LiveClockProps {
  initialTime?: Date;
  className?: string;
}

export default function LiveClock({ initialTime, className = "" }: LiveClockProps) {
  const { getNow, startLiveUpdates, stopLiveUpdates } = useCurrentTime(initialTime);
  const [displayTime, setDisplayTime] = useState(() => formatDisplayTime(getNow()));
  const renderCountRef = useRef(0);
  
  // Debug mode support - stricter checks to match useCurrentTime
  const isDebug = typeof window !== 'undefined' && 
    process.env.NODE_ENV === 'development' && 
    (!process.env.NEXT_PUBLIC_IS_PROD) &&
    (localStorage.getItem('debug-time') !== 'false');

  useEffect(() => {
    renderCountRef.current++;
    if (isDebug) {
      console.log('🕐 LiveClock render count:', renderCountRef.current);
    }
  }, []); // Add empty dependency array to run only once

  useEffect(() => {
    // Start RAF-driven updates for smooth time display
    const updateDisplay = (now: Date) => {
      setDisplayTime(formatDisplayTime(now));
    };

    startLiveUpdates(updateDisplay);

    // Cleanup on unmount
    return () => {
      stopLiveUpdates();
    };
  }, [startLiveUpdates, stopLiveUpdates]);

  return (
    <span className={className}>
      {displayTime}
    </span>
  );
}