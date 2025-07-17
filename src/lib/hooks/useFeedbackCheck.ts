'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useCurrentTime } from './useCurrentTime';
import { getCurrentFeedbackWindow } from '../time';
import { FEEDBACK_ENABLED } from '../constants';

/**
 * Hook to check if user needs to provide feedback and redirect if necessary
 * This "locks" the app during feedback windows until feedback is submitted
 */
export function useFeedbackCheck(userId?: string) {
  const router = useRouter();
  const pathname = usePathname();
  const { getNow } = useCurrentTime();
  const [isNavigating, setIsNavigating] = useState(false);

  // Memoized feedback window computation
  const currentFeedbackWindow = useMemo(() => {
    return getCurrentFeedbackWindow(getNow());
  }, [getNow]);

  useEffect(() => {
    // Check if feedback is enabled globally
    if (!FEEDBACK_ENABLED) {
      return;
    }

    // Don't redirect if already on feedback page or auth pages
    if (pathname.startsWith('/feedback') || pathname.startsWith('/auth') || pathname.startsWith('/onboarding')) {
      return;
    }

    // Check if we're in a feedback window
    const feedbackWindow = currentFeedbackWindow;
    
    if (!feedbackWindow || !userId) {
      return;
    }

    // Check if user attended this event (simplified for dev mode)
    if (process.env.NODE_ENV === 'development') {
      const devWaitlist = localStorage.getItem('dev-waitlist');
      
      if (!devWaitlist) {
        return;
      }

      try {
        const waitlistEvents = JSON.parse(devWaitlist) as string[];
        const eventTime = feedbackWindow.timeSlot.time.toISOString();
        
        // Check if user was on waitlist for this event
        const wasOnWaitlist = waitlistEvents.includes(eventTime);
        if (!wasOnWaitlist) {
          return;
        }

        // Check if feedback already submitted or skipped
        const feedbackKey = `feedback-${userId}-dev-event-${feedbackWindow.timeSlot.slot}`;
        const existingFeedback = localStorage.getItem(feedbackKey);
        
        if (existingFeedback) {
          try {
            const feedbackRecord = JSON.parse(existingFeedback);
            // If feedback was submitted or skipped, don't show popup
            if (feedbackRecord.status === 'submitted' || feedbackRecord.status === 'skipped') {
              return;
            }
          } catch (e) {
            console.error('Error parsing feedback record:', e);
          }
        }

        // Check if auto-popup should trigger (60 mins after event start)
        const eventStartTime = feedbackWindow.timeSlot.time;
        const autoPopupTime = new Date(eventStartTime);
        autoPopupTime.setMinutes(autoPopupTime.getMinutes() + 60); // 60 minutes after start
        
        const currentTime = getNow();
        const shouldAutoPopup = currentTime >= autoPopupTime;
        
        console.log('🎯 Feedback Auto-Popup Check:', {
          eventStart: eventStartTime.toLocaleTimeString(),
          autoPopupTime: autoPopupTime.toLocaleTimeString(),
          currentTime: currentTime.toLocaleTimeString(),
          shouldAutoPopup,
          isNavigating,
          timeSlot: feedbackWindow.timeSlot.slot
        });
        
        // Auto-popup if time has come and not already navigating
        if (shouldAutoPopup && !isNavigating) {
          console.log('🚀 Auto-popup triggering for feedback');
          setIsNavigating(true);
          const timeSlot = feedbackWindow.timeSlot.slot;
          router.push(`/feedback?timeSlot=${timeSlot}&eventId=dev-event-${timeSlot}`);
        }
      } catch (e) {
        console.error('Error checking feedback requirements:', e);
      }
    }
  }, [currentFeedbackWindow, pathname, router, userId, isNavigating, getNow]);

  return {
    currentFeedbackWindow,
  };
}