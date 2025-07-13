'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useCurrentTime } from './useCurrentTime';
import { getCurrentFeedbackWindow } from '../time';

/**
 * Hook to check if user needs to provide feedback and redirect if necessary
 * This "locks" the app during feedback windows until feedback is submitted
 */
export function useFeedbackCheck(userId?: string) {
  const router = useRouter();
  const pathname = usePathname();
  const currentTime = useCurrentTime();

  useEffect(() => {
    // Don't redirect if already on feedback page or auth pages
    if (pathname.startsWith('/feedback') || pathname.startsWith('/auth') || pathname.startsWith('/onboarding')) {
      return;
    }

    // Check if we're in a feedback window
    const feedbackWindow = getCurrentFeedbackWindow(currentTime);
    console.log('🔍 Feedback check:', { feedbackWindow, userId, pathname });
    
    if (!feedbackWindow || !userId) {
      return;
    }

    // Check if user attended this event (simplified for dev mode)
    if (process.env.NODE_ENV === 'development') {
      const devWaitlist = localStorage.getItem('dev-waitlist');
      console.log('📋 Dev waitlist:', devWaitlist);
      
      if (!devWaitlist) {
        console.log('❌ No waitlist found, skipping feedback check');
        return;
      }

      try {
        const waitlistEvents = JSON.parse(devWaitlist) as string[];
        const eventTime = feedbackWindow.timeSlot.time.toISOString();
        
        console.log('🎯 Checking if user attended:', { waitlistEvents, eventTime });
        
        // Check if user was on waitlist for this event
        const wasOnWaitlist = waitlistEvents.includes(eventTime);
        if (!wasOnWaitlist) {
          console.log('❌ User was not on waitlist for this event');
          return;
        }

        // Check if feedback already submitted
        const feedbackKey = `feedback-${userId}-dev-event-${feedbackWindow.timeSlot.slot}`;
        const existingFeedback = localStorage.getItem(feedbackKey);
        console.log('✅ Feedback check:', { feedbackKey, existingFeedback });
        
        if (existingFeedback) {
          console.log('✅ Feedback already submitted');
          return;
        }

        // User needs to provide feedback - redirect
        console.log('🔒 Feedback required for', feedbackWindow.timeSlot.slot, 'event - would redirect to feedback');
        // Commented out auto-redirect since we now use clickable button
        // router.push(`/feedback?timeSlot=${feedbackWindow.timeSlot.slot}&eventId=dev-event-${feedbackWindow.timeSlot.slot}`);
      } catch (e) {
        console.error('Error checking feedback requirements:', e);
      }
    }
  }, [currentTime, pathname, router, userId]);

  return {
    currentFeedbackWindow: getCurrentFeedbackWindow(currentTime),
  };
}