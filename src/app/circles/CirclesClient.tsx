"use client";

import { useState, useEffect, useMemo } from "react";
import { TimeSlotWithUserStatus } from "@/lib/types";
import { useCurrentTime } from "@/lib/hooks/useCurrentTime";
import { FEEDBACK_ENABLED, UPDATE_INTERVAL } from "@/lib/constants";
import { typography } from "@/lib/typography";
import { getFeedbackRecord } from "@/lib/feedback-keys";
import { getCurrentUserId, isAnonymousId } from "@/lib/anonymous-user";

import LiveClock from "@/components/ui/LiveClock";
import { useFeedbackCheck } from "@/lib/hooks/useFeedbackCheck";
import { 
  getButtonState, 
  formatDeadlineTime,
  getDisplayDate,
  createTimeSlots
} from "@/lib/time";
import { joinWaitlist, leaveWaitlist } from "@/app/circles/actions";
import { getTodaysMainLocation } from "@/app/circles/location-actions";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getMapUrl, getNavigationUrl } from "@/lib/maps";
import { Location } from "@/lib/types";

interface CirclesClientProps {
  initialTimeSlots: TimeSlotWithUserStatus[];
  serverTime?: Date;
  authenticatedUser?: { id: string } | null;
}

export default function CirclesClient({ initialTimeSlots, serverTime, authenticatedUser }: CirclesClientProps) {
  const { getNow } = useCurrentTime(serverTime);
  
  // Use state for current time with interval updates (not every render)
  const [currentTime, setCurrentTime] = useState(() => getNow());
  
  // Development-only render counting
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.count('🔄 CirclesClient render');
    }
  });
  
  // Update current time on interval instead of every render
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(getNow());
    };
    
    // Update immediately on mount
    updateTime();
    
    // Then update on interval
    const intervalId = setInterval(updateTime, UPDATE_INTERVAL);
    
    // Fallback: Force update every minute if tab becomes active
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        updateTime();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup
    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [getNow]);
  

  const [timeSlots, setTimeSlots] = useState(initialTimeSlots);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [lastDisplayDate, setLastDisplayDate] = useState<Date | null>(null);
  const [justReset, setJustReset] = useState(false);
  const [location, setLocation] = useState<Location | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const router = useRouter();

  // Check for pending feedback and redirect if necessary
  const { currentFeedbackWindow } = useFeedbackCheck('dev-user-id');

  // Fetch today's main location for map display
  useEffect(() => {
    async function fetchLocation() {
      try {
        const result = await getTodaysMainLocation();
        if (result.error) {
          setLocationError(result.error);
        } else {
          setLocation(result.location);
        }
      } catch (error) {
        console.error('Error fetching location:', error);
        setLocationError('Failed to load location');
      }
    }
    
    fetchLocation();
  }, []);

  // Get current user ID (authenticated or anonymous)
  const currentUserId = getCurrentUserId(authenticatedUser);
  
  // Load user's waitlist state from database on mount
  useEffect(() => {
    async function loadUserWaitlistState() {
      // For anonymous users, fetch from database using their anonymous ID
      if (isAnonymousId(currentUserId)) {
        try {
          // TODO: Add database fetch for anonymous user waitlist state
          // For now, just mark as loaded
          setIsLoaded(true);
        } catch (e) {
          console.error('Error loading anonymous user waitlist:', e);
          setIsLoaded(true);
        }
      } else {
        // For authenticated users, state comes from server (initialTimeSlots)
        setIsLoaded(true);
      }
    }
    
    loadUserWaitlistState();
  }, [currentUserId]);

  // Memoized display date computation - only recalculates when needed
  const currentDisplayDate = useMemo(() => {
    return getDisplayDate(currentTime);
  }, [currentTime]);
  
  // Check if we've crossed 8PM and need to show next day's slots
  useEffect(() => {
    if (!isLoaded) return;
    
    if (!lastDisplayDate) {
      setLastDisplayDate(currentDisplayDate);
      return;
    }
    
    // Check if the display date has changed (crossed 8PM boundary)
    if (currentDisplayDate.getTime() !== lastDisplayDate.getTime()) {
      
      // Create new time slots for the new day
      const newTimeSlots = createTimeSlots(currentDisplayDate);
      
      // Reset to fresh state (all Join buttons, no waitlist)
      const freshTimeSlots: TimeSlotWithUserStatus[] = newTimeSlots.map(slot => ({
        timeSlot: {
          time: slot.time,
          deadline: slot.deadline
        },
        isOnWaitlist: false, // Explicitly set to false for fresh day
        assignedCircleId: null,
        circleData: null,
        buttonState: 'join' as const,
        buttonText: 'Join',
        middleText: `Decide by ${formatDeadlineTime(slot)}`,
        isDisabled: false
      }));
      
      setTimeSlots(freshTimeSlots);
      setLastDisplayDate(currentDisplayDate);
      setJustReset(true);
      
      // Clear the reset flag after a short delay to allow the reset to take effect
      setTimeout(() => setJustReset(false), 100);
    }
  }, [currentDisplayDate, isLoaded, lastDisplayDate]);

  // Method 7: Unified button state computation using pure functions
  const processedTimeSlots = useMemo(() => {
    if (!isLoaded || justReset) return timeSlots;
    
    return timeSlots.map(slot => {
      // Create TimeSlot object for Method 7 functions
      const timeSlot = {
        time: slot.timeSlot.time,
        deadline: slot.timeSlot.deadline,
        slot: slot.timeSlot.time.getHours() === 11 ? '11AM' : 
              slot.timeSlot.time.getHours() === 14 ? '2PM' : '5PM',
        hour: slot.timeSlot.time.getHours()
      } as const;

      // Check if feedback was submitted (needed for getButtonState)
      let feedbackSubmitted = false;
      if (typeof window !== 'undefined') {
        try {
          const feedbackRecord = getFeedbackRecord('dev-user-id', timeSlot.slot, timeSlot.time);
          feedbackSubmitted = feedbackRecord && (feedbackRecord.status === 'submitted' || feedbackRecord.status === 'skipped');
        } catch (e) {
          console.error('Error checking feedback record:', e);
        }
      }

      // Simulate assignedCircleId for development (only if user is on waitlist AND deadline has passed)
      let assignedCircleId = slot.assignedCircleId;
      if (!assignedCircleId && slot.isOnWaitlist && currentTime >= timeSlot.deadline) {
        // Matching algorithm runs at deadline - simulate assignment
        const date = new Date(slot.timeSlot.time);
        const dateStr = date.toISOString().split('T')[0];
        const hour = slot.timeSlot.time.getHours();
        const timeSlotStr = hour === 11 ? '11AM' : hour === 14 ? '2PM' : '5PM';
        assignedCircleId = `${dateStr}_${timeSlotStr}_Circle_1`;
      }

      // Use Method 7 unified button state function
      const buttonStateResult = getButtonState(
        {
          timeSlot,
          isOnWaitlist: slot.isOnWaitlist,
          assignedCircleId
        },
        currentTime,
        feedbackSubmitted
      );

      return {
        ...slot,
        assignedCircleId, // Update with simulated ID if needed
        buttonState: buttonStateResult.buttonState,
        buttonText: buttonStateResult.buttonText,
        middleText: buttonStateResult.middleText,
        isDisabled: buttonStateResult.isDisabled
      };
    });
  }, [timeSlots, isLoaded, justReset, currentTime]);

  const handleSlotAction = async (slot: TimeSlotWithUserStatus) => {
    if (slot.buttonState === "confirmed") {
      // In development mode, use a simulated circle ID
      const date = new Date(slot.timeSlot.time);
      const dateStr = date.toISOString().split('T')[0];
      const hour = slot.timeSlot.time.getHours();
      const timeSlot = hour === 11 ? '11AM' : hour === 14 ? '2PM' : '5PM';
      const circleId = slot.assignedCircleId || `${dateStr}_${timeSlot}_Circle_1`;
      router.push(`/circles/${circleId}`);
      return;
    }

    if (slot.buttonState === "feedback") {
      // Navigate to feedback page with actual circle ID
      const date = new Date(slot.timeSlot.time);
      const dateStr = date.toISOString().split('T')[0];
      const hour = slot.timeSlot.time.getHours();
      const timeSlot = hour === 11 ? '11AM' : hour === 14 ? '2PM' : '5PM';
      const circleId = slot.assignedCircleId || `${dateStr}_${timeSlot}_Circle_1`;
      router.push(`/feedback?timeSlot=${timeSlot}&eventId=${circleId}`);
      return;
    }

    if (slot.buttonState === "join" || slot.buttonState === "leave") {
      const slotKey = slot.timeSlot.time.toISOString();
      setErrors(prev => ({ ...prev, [slotKey]: "" }));

      const isJoining = slot.buttonState === "join";

      // Instant optimistic update
      setTimeSlots(prev => {
        const updated = prev.map(s => {
          if (s.timeSlot.time.toISOString() === slotKey) {
            return {
              ...s,
              isOnWaitlist: isJoining
            };
          }
          return s;
        });

        // Database persistence handled by server actions

        return updated;
      });

      // Background server action (no loading UI)
      try {
        const result = isJoining 
          ? await joinWaitlist(slot.timeSlot.time.toISOString(), currentUserId)
          : await leaveWaitlist(slot.timeSlot.time.toISOString(), currentUserId);

        if (result.error) {
          // Revert optimistic update on error
          setTimeSlots(prev => {
            const reverted = prev.map(s => {
              if (s.timeSlot.time.toISOString() === slotKey) {
                return {
                  ...s,
                  isOnWaitlist: !isJoining
                };
              }
              return s;
            });

            // Database state managed by server actions

            return reverted;
          });
          setErrors(prev => ({ ...prev, [slotKey]: result.error! }));
        }
      } catch {
        // Revert optimistic update on error
        setTimeSlots(prev => {
          const reverted = prev.map(s => {
            if (s.timeSlot.time.toISOString() === slotKey) {
              return {
                ...s,
                isOnWaitlist: !isJoining
              };
            }
            return s;
          });

          // Database state managed by server actions

          return reverted;
        });
        setErrors(prev => ({ ...prev, [slotKey]: "An unexpected error occurred. Please try again." }));
      }
    }
  };


  const getButtonClasses = (slot: TimeSlotWithUserStatus) => {
    if (slot.buttonState === "confirmed") {
      return "bg-green-100 text-green-700 border border-green-300 font-medium";
    }
    if (slot.buttonState === "feedback") {
      return "bg-orange-100 text-orange-600 border border-orange-300 font-medium";
    }
    if (slot.buttonState === "past") {
      return "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed font-medium";
    }
    if (slot.buttonState === "leave") {
      return "bg-red-100 text-red-600 border border-red-300 font-medium";
    }
    return "text-white font-medium border-none transition-all duration-200 shadow-sm";
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header Section - ~20% of viewport */}
      <div className="h-[20vh] min-h-[140px] max-h-[180px] px-[6vw] flex flex-col justify-between py-[3vh]" style={{backgroundColor: '#0E2C54'}}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[#152B5C] text-[3vw] min-text-xs max-text-sm font-light">
              App Time:
            </p>
            <LiveClock 
              initialTime={serverTime}
              className="text-[#152B5C] text-[3vw] min-text-xs max-text-sm font-light"
            />
          </div>
          <button 
            onClick={() => {
              router.push('/settings');
            }}
            className="p-[1vw] rounded-full hover:bg-white/10 transition-colors"
            aria-label="Settings"
          >
            <svg className="w-[6vw] h-[6vw] min-w-[20px] max-w-[24px] text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
        
        <div className="text-center">
          <h1 className={`${typography.page.title} text-white mb-[1vh]`}>Today&apos;s Circles</h1>
          <p className={`${typography.component.small} text-gray-300`}>New conversations waiting to happen</p>
        </div>
      </div>

      {/* Main Content - Flex grow to fill remaining space */}
      <div className="flex-1 flex flex-col px-[6vw]">
        {/* Upcoming Times Section - ~50% of viewport */}
        <div className="h-[50vh] min-h-[300px] py-[3vh] flex flex-col">
          <h2 className={`${typography.section.title} text-gray-700 mb-[2vh]`}>Upcoming Times</h2>
          
          <div className="flex-1 flex flex-col justify-start space-y-3">
            {processedTimeSlots.map((slot, index) => {
              const slotKey = slot.timeSlot.time.toISOString();
              
              return (
                <div 
                  key={index} 
                  className="bg-[#f8f9fa] rounded-xl p-4 shadow-sm border border-gray-100"
                  style={{
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    marginBottom: '12px'
                  }}
                >
                  <div className="flex items-center justify-between">
                    {/* Time - Left side */}
                    <div className="flex-1">
                      <div className={`${typography.section.title} text-gray-900`}>
                        {(() => {
                          const hours = slot.timeSlot.time.getHours();
                          const minutes = slot.timeSlot.time.getMinutes();
                          const period = hours >= 12 ? 'PM' : 'AM';
                          const displayHours = hours % 12 || 12;
                          const displayMinutes = minutes.toString().padStart(2, '0');
                          return `${displayHours}:${displayMinutes} ${period}`;
                        })()}
                      </div>
                    </div>
                    
                    {/* Dynamic middle text - Center area */}
                    <div className="flex-1 text-center">
                      <p className={`${typography.component.small} text-gray-500 leading-tight font-medium`}>
                        {slot.middleText}
                      </p>
                    </div>
                    
                    {/* Button - Right side */}
                    <div className="flex-1 flex justify-end">
                      <button
                        onClick={() => handleSlotAction(slot)}
                        disabled={slot.isDisabled}
                        className={`px-4 py-2 rounded-full ${typography.component.button} min-w-[70px] ${getButtonClasses(slot)}`}
                        style={slot.buttonState === "join" ? {backgroundColor: '#0E2C54'} : {}}
                      >
                        <div className="flex items-center justify-center space-x-1">
                          <span>{slot.buttonText}</span>
                          {(slot.buttonState === "confirmed" || slot.buttonState === "feedback") && (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          )}
                        </div>
                      </button>
                    </div>
                  </div>
                  
                  {errors[slotKey] && (
                    <div className="text-red-500 text-xs mt-2">{errors[slotKey]}</div>
                  )}
                </div>
              );
            })}
          </div>
          
          <p className="text-sm text-gray-500 text-center mt-4">Availability resets at 8PM each day</p>
        </div>

        {/* Update Preferences Section */}
        <div className="px-6 py-4">
          <button
            onClick={() => router.push('/settings/preferences')}
            className="w-full flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                {/* Brain icon to match curiosity theme */}
                <Image
                  src="/Images/PNG/brain.png"
                  alt="Brain"
                  width={24}
                  height={24}
                  className="object-contain"
                  style={{ width: "auto", height: "auto" }}
                  unoptimized
                />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">Update Preferences</p>
                <p className="text-sm text-gray-500">Curious about new communities?</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Location Section - ~25% of viewport */}
        <div className="h-[25vh] min-h-[200px] pb-[3vh] flex flex-col">
          <div className="flex items-center space-x-[1vw] mb-[1vh]">
            <svg className="w-[5vw] h-[5vw] min-w-[16px] max-w-[20px] text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div className="text-[3.2vw] min-text-xs max-text-sm">
              <span className="font-medium text-gray-900">Approximate Area:</span>
              <span className="text-gray-700 ml-1">{location?.name || 'Old Union'}</span>
            </div>
          </div>
          <p className="text-[2.8vw] min-text-xs max-text-sm text-gray-600 mb-[1.5vh]">Exact spot is revealed 1hr before start</p>
          
          {/* Map Container */}
          <div className="map-container relative w-full bg-gray-50 rounded-[4vw] max-rounded-2xl overflow-hidden shadow-sm">
            {location && !locationError ? (
              <>
                {/* Google Maps Static Image */}
                <Image 
                  src={getMapUrl(location, 350)}
                  alt={`${location.name} at Stanford`}
                  fill
                  className="map-image object-cover object-center"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  priority
                />
                
                {/* Clickable overlay for navigation */}
                <button
                  onClick={() => {
                    const navUrl = getNavigationUrl(location);
                    window.open(navUrl, '_blank');
                  }}
                  className="absolute inset-0 bg-transparent hover:bg-black/10 transition-colors"
                  aria-label={`Open ${location.name} in Google Maps`}
                />
                
                {/* Location Label */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-white px-[3vw] py-[0.5vh] min-px-2 min-py-1 rounded-full shadow-lg border border-gray-200">
                    <span className="text-[2.8vw] min-text-xs max-text-sm font-medium text-gray-800">{location.name} at Stanford</span>
                  </div>
                </div>
              </>
            ) : (
              /* Fallback to placeholder if location fails to load */
              <>
                <div 
                  className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center"
                >
                  <div className="text-center text-gray-600">
                    <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-sm">Stanford Campus</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}