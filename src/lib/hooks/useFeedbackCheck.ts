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
        
        // MVP Fix: Check if user joined ANY event currently in feedback window
        // Instead of only checking the chronologically first feedback window
        let matchedEvent: string | null = null;
        let matchedTimeSlot: string | null = null;
        
        for (const joinedEventTime of validTodayEvents) {
          const joinedEventDate = new Date(joinedEventTime);
          const eventEndTime = new Date(joinedEventDate);
          eventEndTime.setMinutes(eventEndTime.getMinutes() + 20); // Event lasts 20 minutes
          
          // Check if this joined event is currently in its feedback window
          if (currentTime >= eventEndTime) {
            // Extract time slot from joined event
            const joinedHour = joinedEventDate.getHours();
            const joinedSlot = joinedHour === 11 ? '11AM' : joinedHour === 14 ? '2PM' : '5PM';
            
            matchedEvent = joinedEventTime;
            matchedTimeSlot = joinedSlot;
            break; // Use first match (earliest event) to avoid multiple redirects
          }
        }
        
        console.log('🎪 Multi-event feedback check:', {
          validTodayEvents,
          currentTime: currentTime.toLocaleTimeString(),
          matchedEvent,
          matchedTimeSlot,
          originalFeedbackWindow: feedbackWindow.timeSlot.slot
        });
        
        if (!matchedEvent || !matchedTimeSlot) {
          console.log('❌ User not on waitlist for any event currently in feedback window');
          return;
        }
        
        console.log('✅ User joined event in feedback window - proceeding with feedback check');

        // Check if feedback already submitted for the matched event
        const matchedEventDate = new Date(matchedEvent);
        const feedbackRecord = getFeedbackRecord(userId, matchedTimeSlot, matchedEventDate);
        
        if (feedbackRecord) {
          // If feedback was submitted or skipped, don't show popup
          if (feedbackRecord.status === 'submitted' || feedbackRecord.status === 'skipped') {
            console.log('✅ Feedback already submitted/skipped for matched event');
            return;
          }
        }

        // Check if auto-popup should trigger (60 mins after matched event start)
        const eventStartTime = matchedEventDate;
        const autoPopupTime = new Date(eventStartTime);
        autoPopupTime.setMinutes(autoPopupTime.getMinutes() + 60); // 60 minutes after start
        
        const shouldAutoPopup = currentTime >= autoPopupTime;
        
        console.log('🎯 Feedback Auto-Popup Check (matched event):', {
          matchedEventStart: eventStartTime.toLocaleTimeString(),
          autoPopupTime: autoPopupTime.toLocaleTimeString(),
          currentTime: currentTime.toLocaleTimeString(),
          shouldAutoPopup,
          isNavigating,
          matchedTimeSlot
        });
        
        // Auto-popup if time has come and not already navigating
        if (shouldAutoPopup && !isNavigating) {
          console.log('🚀 Auto-popup triggering for matched event feedback');
          setIsNavigating(true);
          const eventId = generateEventId(matchedTimeSlot, matchedEventDate);
          router.push(`/feedback?timeSlot=${matchedTimeSlot}&eventId=${eventId}`);
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