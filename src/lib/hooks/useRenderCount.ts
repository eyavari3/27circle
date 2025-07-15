"use client";

import { useRef, useEffect } from "react";

/**
 * Simple hook to measure render counts for performance profiling
 * Only runs in development mode
 */
export function useRenderCount(componentName: string) {
  const renderCount = useRef(0);
  const lastLogTime = useRef(Date.now());
  
  renderCount.current++;
  
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    
    const now = Date.now();
    const timeSinceLastLog = now - lastLogTime.current;
    
    // Log every 10 seconds in development
    if (timeSinceLastLog >= 10000) {
      const rendersPerHour = (renderCount.current / (timeSinceLastLog / 1000)) * 3600;
      console.log(`📊 ${componentName} Performance:`, {
        totalRenders: renderCount.current,
        rendersPerHour: Math.round(rendersPerHour),
        timeElapsed: `${(timeSinceLastLog / 1000).toFixed(1)}s`
      });
      
      // Reset for next interval
      renderCount.current = 0;
      lastLogTime.current = now;
    }
  });
  
  return renderCount.current;
}