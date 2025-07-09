"use client";

import { useState, useEffect } from "react";
import { getCurrentPSTTime } from "@/lib/time";

export function useCurrentTime() {
  const [currentTime, setCurrentTime] = useState(getCurrentPSTTime());

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(getCurrentPSTTime());
    };

    // Initial update
    updateTime();

    // Set up interval to update every second
    const interval = setInterval(updateTime, 1000);

    // Cleanup
    return () => clearInterval(interval);
  }, []);

  return currentTime;
}