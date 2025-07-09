"use client";

import { useState, useEffect } from "react";
import { APP_TIME_OFFSET } from "@/lib/constants";

export function useCurrentTime() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      
      if (APP_TIME_OFFSET !== null) {
        const pstTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
        pstTime.setHours(Math.floor(APP_TIME_OFFSET));
        pstTime.setMinutes((APP_TIME_OFFSET % 1) * 60);
        pstTime.setSeconds(0);
        pstTime.setMilliseconds(0);
        setCurrentTime(pstTime);
      } else {
        const pstTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
        setCurrentTime(pstTime);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return currentTime;
}