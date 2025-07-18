'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useCurrentTime } from './useCurrentTime';
import { getCurrentFeedbackWindow } from '../time';
import { FEEDBACK_ENABLED, UPDATE_INTERVAL } from '../constants';
import { getFeedbackRecord, generateEventId } from '../feedback-keys';

/**
 * Hook to check if user needs to provide feedback and redirect if necessary
 * This "locks" the app during feedback windows until feedback is submitted
 */
export function useFeedbackCheck(userId?: string) {
  const router = useRouter();
  const pathname = usePathname();
  const { getNow } = useCurrentTime();
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => getNow());

  // Update time on interval to reduce re-renders
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(getNow());
    };
    
    const intervalId = setInterval(updateTime, UPDATE_INTERVAL);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [getNow]);

  // Memoized feedback window computation
  const currentFeedbackWindow = useMemo(() => {
    return getCurrentFeedbackWindow(currentTime);
  }, [currentTime]);

  useEffect(() => {
    // Check if feedback is enabled globally
    if (!FEEDBACK_ENABLED) {
      console.log('🔕 Feedback disabled via FEEDBACK_ENABLED flag');
      return;
    }

    // Don't redirect if already on feedback page or auth pages
    if (pathname.startsWith('/feedback') || pathname.startsWith('/auth') || pathname.startsWith('/onboarding')) {
      return;
    }

    // Check if we're in a feedback window
    const feedbackWindow = currentFeedbackWindow;
    
    console.log('🕐 Feedback Check State:', {
      currentTime: currentTime.toLocaleTimeString(),
      feedbackWindow: feedbackWindow ? {
        slot: feedbackWindow.timeSlot.slot,
        eventTime: feedbackWindow.timeSlot.time.toLocaleTimeString()
      } : 'none',
      userId,
      pathname
    });
    
    if (!feedbackWindow || !userId) {
      console.log('⏰ No feedback window or user - skipping feedback check');
      return;
    }

    // Check if user attended this event (simplified for dev mode)
    if (process.env.NODE_ENV === 'development') {
      const devWaitlist = localStorage.getItem('dev-waitlist');
      
      console.log('📋 Dev waitlist check:', {
        devWaitlist,
        waitlistExists: !!devWaitlist
      });
      
      if (!devWaitlist) {
        console.log('📋 No dev-waitlist found - user never joined any events');
        return;
      }

      try {
        const waitlistEvents = JSON.parse(devWaitlist) as string[];
        const eventTime = feedbackWindow.timeSlot.time.toISOString();
        
        // CRITICAL: Filter out stale waitlist data from previous days
        const todayDate = feedbackWindow.timeSlot.time.toISOString().split('T')[0]; // YYYY-MM-DD
        const validTodayEvents = waitlistEvents.filter(eventISOString => {
          const eventDate = eventISOString.split('T')[0];
          return eventDate === todayDate;
        });
        
        console.log('🗓️ Waitlist date filtering:', {
          todayDate,
          allWaitlistEvents: waitlistEvents,
          validTodayEvents,
          filteredOut: waitlistEvents.length - validTodayEvents.length
        });
        
        // Check if user was on waitlist for THIS day's event
        const wasOnWaitlist = validTodayEvents.includes(eventTime);
        
        console.log('🎪 Event matching check:', {
          eventTimeBeingChecked: eventTime,
          validTodayEvents,
          wasOnWaitlist,
          exactMatch: validTodayEvents.find(e => e === eventTime)
        });
        
        if (!wasOnWaitlist) {
          console.log('❌ User was not on waitlist for this event');
          return;
        }
        
        console.log('✅ User WAS on waitlist - proceeding with feedback check');

        // Check if feedback already submitted or skipped using centralized key system
        const feedbackRecord = getFeedbackRecord(userId, feedbackWindow.timeSlot.slot, feedbackWindow.timeSlot.time);
        
        if (feedbackRecord) {
          // If feedback was submitted or skipped, don't show popup
          if (feedbackRecord.status === 'submitted' || feedbackRecord.status === 'skipped') {
            return;
          }
        }

        // Check if auto-popup should trigger (60 mins after event start)
        const eventStartTime = feedbackWindow.timeSlot.time;
        const autoPopupTime = new Date(eventStartTime);
        autoPopupTime.setMinutes(autoPopupTime.getMinutes() + 60); // 60 minutes after start
        
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
          const eventId = generateEventId(timeSlot, feedbackWindow.timeSlot.time);
          router.push(`/feedback?timeSlot=${timeSlot}&eventId=${eventId}`);
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