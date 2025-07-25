"use client";

import { useState, useEffect, useMemo } from "react";
import { TimeSlotWithUserStatus } from "@/lib/types";
import { useCurrentTime } from "@/lib/hooks/useCurrentTime";
import { FEEDBACK_ENABLED, UPDATE_INTERVAL } from "@/lib/constants";
import { typography } from "@/lib/typography";
import { getFeedbackRecord } from "@/lib/feedback-keys";
import { getCurrentUserId, isAnonymousId } from "@/lib/anonymous-user";
import { debugLogger } from "@/lib/debug-logger";

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
import { AttendanceModal } from "@/components/circles/AttendanceModal";

interface CirclesClientProps {
  initialTimeSlots: TimeSlotWithUserStatus[];
  serverTime?: Date;
  authenticatedUser?: { id: string } | null;
}

export default function CirclesClient({ initialTimeSlots, serverTime, authenticatedUser }: CirclesClientProps) {
  const { getNow } = useCurrentTime(serverTime);
  
  // Use state for current time with interval updates (not every render)
  const [currentTime, setCurrentTime] = useState(() => getNow());
  
  // Attendance modal state
  const [attendanceModal, setAttendanceModal] = useState<{
    isOpen: boolean;
    timeSlot: string;
    date: Date;
  } | null>(null);
  
  // Development-only render counting
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
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
    
    
    // Cleanup
    return () => {
      clearInterval(intervalId);
    };
  }, [getNow]);
  

  const [timeSlots, setTimeSlots] = useState(initialTimeSlots);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [lastDisplayDate, setLastDisplayDate] = useState<Date | null>(null);
  const [justReset, setJustReset] = useState(false);
  const [location, setLocation] = useState<Location | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [feedbackStatus, setFeedbackStatus] = useState<{ [key: string]: boolean }>({});
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
        setLocationError('Failed to load location');
      }
    }
    
    fetchLocation();
  }, []);

  // Load feedback status for all time slots
  useEffect(() => {
    async function loadFeedbackStatus() {
      if (!isLoaded || !timeSlots.length) return;

      const { getFeedbackRecord } = await import('@/lib/feedback-keys');
      const statusUpdates: { [key: string]: boolean } = {};

      for (const slot of timeSlots) {
        const slotKey = slot.timeSlot.time.toISOString();
        const timeSlotString = slot.timeSlot.time.getHours() === 11 ? '11AM' : 
                              slot.timeSlot.time.getHours() === 14 ? '2PM' : '5PM';
        
        try {
          const feedbackRecord = await getFeedbackRecord('dev-user-id', timeSlotString, slot.timeSlot.time);
          statusUpdates[slotKey] = feedbackRecord && (feedbackRecord.status === 'submitted' || feedbackRecord.status === 'skipped');
        } catch (error) {
          statusUpdates[slotKey] = false;
        }
      }

      setFeedbackStatus(statusUpdates);
    }

    loadFeedbackStatus();
  }, [isLoaded, timeSlots]);

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

      // Check if feedback was submitted (from loaded state)
      const slotKey = slot.timeSlot.time.toISOString();
      const feedbackSubmitted = feedbackStatus[slotKey] || false;

      // DEBUG: Log button state computation for each slot

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
  }, [timeSlots, isLoaded, justReset, currentTime, feedbackStatus]);

  const handleSlotAction = async (slot: TimeSlotWithUserStatus) => {
    debugLogger.logSection("BUTTON CLICK HANDLER START");
    
    if (slot.buttonState === "confirmed") {
      debugLogger.logButtonClick('navigate-to-circle', slot.timeSlot.time.toISOString(), currentUserId);
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
      debugLogger.logButtonClick('navigate-to-feedback', slot.timeSlot.time.toISOString(), currentUserId);
      // Show attendance modal instead of navigating directly
      const date = new Date(slot.timeSlot.time);
      const hour = slot.timeSlot.time.getHours();
      const timeSlot = hour === 11 ? '11AM' : hour === 14 ? '2PM' : '5PM';
      
      setAttendanceModal({
        isOpen: true,
        timeSlot,
        date
      });
      return;
    }

    if (slot.buttonState === "join" || slot.buttonState === "leave") {
      const slotKey = slot.timeSlot.time.toISOString();
      const isJoining = slot.buttonState === "join";
      
      debugLogger.logButtonClick(isJoining ? 'join' : 'leave', slotKey, currentUserId);
      debugLogger.logAnonymousUserInfo(currentUserId, typeof window !== 'undefined' ? sessionStorage.getItem('anonUserId') : 'N/A');
      
      setErrors(prev => ({ ...prev, [slotKey]: "" }));

      // Instant optimistic update
      debugLogger.logOptimisticUpdate(slotKey, isJoining);
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

        debugLogger.logStateRefresh('optimistic-update', updated);
        return updated;
      });

      // Background server action (no loading UI)
      debugLogger.logServerAction(isJoining ? 'joinWaitlist' : 'leaveWaitlist', {
        timeSlot: slotKey,
        userId: currentUserId
      });
      
      try {
        const result = isJoining 
          ? await joinWaitlist(slot.timeSlot.time.toISOString(), currentUserId)
          : await leaveWaitlist(slot.timeSlot.time.toISOString(), currentUserId);

        debugLogger.logDatabaseOperation(isJoining ? 'joinWaitlist' : 'leaveWaitlist', {
          timeSlot: slotKey,
          userId: currentUserId
        }, result);

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

  // Attendance modal handlers
  const handleCloseAttendanceModal = () => {
    setAttendanceModal(null);
  };

  const handleAttendanceMarked = async () => {
    // Refresh feedback status for the affected time slot
    const { getFeedbackRecord } = await import('@/lib/feedback-keys');
    const statusUpdates: { [key: string]: boolean } = {};

    for (const slot of timeSlots) {
      const slotKey = slot.timeSlot.time.toISOString();
      const timeSlotString = slot.timeSlot.time.getHours() === 11 ? '11AM' :
                           slot.timeSlot.time.getHours() === 14 ? '2PM' : '5PM';
      
      try {
        const feedbackRecord = await getFeedbackRecord('dev-user-id', timeSlotString, slot.timeSlot.time);
        statusUpdates[slotKey] = feedbackRecord && (feedbackRecord.status === 'submitted' || feedbackRecord.status === 'skipped');
      } catch (error) {
      }
    }

    setFeedbackStatus(statusUpdates);
  };

  const getButtonClasses = (slot: TimeSlotWithUserStatus) => {
    if (slot.buttonState === "confirmed") {
      return "bg-green-100 text-green-700 border border-green-300";
    }
    if (slot.buttonState === "feedback") {
      return "bg-orange-100 text-orange-600 border border-orange-300";
    }
    if (slot.buttonState === "past") {
      return "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed";
    }
    if (slot.buttonState === "leave") {
      return "bg-white text-red-600 border border-gray-200";
    }
    return "border border-gray-200";
  };

  return (
    <div className="main-container">
      {/* Header Section */}
      <header className="px-[1.25rem] py-[3rem] relative" style={{backgroundColor: 'var(--color-header-bg)'}}>
        <button 
          onClick={() => {
            router.push('/settings');
          }}
          className="absolute top-[1rem] right-[1rem] w-[2.5rem] h-[2.5rem] rounded-full flex items-center justify-center transition-opacity hover-opacity"
          style={{backgroundColor: 'var(--color-button)'}}
          aria-label="Settings"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
        
        <div className="text-center">
          <h1 className="text-[2rem] font-bold leading-tight" style={{color: 'var(--color-white)'}}>Today&apos;s Circles</h1>
          <p className="text-base font-normal mt-2" style={{color: 'var(--color-white)'}}>New conversations waiting to happen</p>
        </div>
      </header>

      {/* Main Content - flexible padding */}
      <main className="px-[1.25rem] py-[1.5rem]">
        {/* Upcoming Times Section */}
        <section>
          <h2 className="text-xl font-medium mb-4" style={{color: 'var(--color-text-primary)'}}>Upcoming Times</h2>
          
          <div className="flex flex-col gap-4">
            {processedTimeSlots.map((slot, index) => {
              const slotKey = slot.timeSlot.time.toISOString();
              
              return (
                <div 
                  key={index} 
                  className="flex items-center justify-between px-[1rem] h-[3rem] bg-white border rounded-lg"
                  style={{
                    borderColor: 'var(--color-border)'
                  }}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-[1.125rem] font-medium whitespace-nowrap" style={{color: 'var(--color-text-primary)'}}>
                      {(() => {
                        // Display the actual time without adding minutes
                        const displayTime = new Date(slot.timeSlot.time);
                        
                        const hours = displayTime.getHours();
                        const minutes = displayTime.getMinutes();
                        const period = hours >= 12 ? 'PM' : 'AM';
                        const displayHours = hours % 12 || 12;
                        const displayMinutes = minutes.toString().padStart(2, '0');
                        return `${displayHours}:${displayMinutes} ${period}`;
                      })()}
                    </span>
                    <span className="text-[0.875rem] font-normal whitespace-nowrap" style={{color: 'var(--color-text-secondary)'}}>
                      {slot.middleText}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => handleSlotAction(slot)}
                    disabled={slot.isDisabled}
                    className={`px-4 py-1 rounded-full text-sm font-medium transition-opacity hover-opacity ${getButtonClasses(slot)}`}
                    style={slot.buttonState === "join" ? {backgroundColor: 'var(--color-button)', color: 'var(--color-white)'} : {}}
                  >
                    {slot.buttonText}
                  </button>
                  
                  {errors[slotKey] && (
                    <div className="text-red-500 text-xs mt-2">{errors[slotKey]}</div>
                  )}
                </div>
              );
            })}
          </div>
          
          <p className="text-sm font-normal text-center mt-6" style={{color: 'var(--color-text-secondary)'}}>Availability resets at 8PM each day</p>
        </section>

        {/* Update Preferences Section */}
        <section className="mt-8 mb-6">
          <button
            onClick={() => router.push('/settings/preferences')}
            className="w-full flex items-center justify-between py-3 bg-transparent hover:bg-gray-50 transition-opacity rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 flex items-center justify-center">
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
                <p className="text-lg font-medium" style={{color: 'var(--color-text-primary)'}}>Update Preferences</p>
                <p className="text-sm font-normal mt-0.5" style={{color: 'var(--color-text-secondary)'}}>Curious about new communities?</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </section>

        {/* Location Section */}
        <section className="mt-8">
          <div className="flex items-center space-x-2 mb-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{color: 'var(--color-text-secondary)'}}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div>
              <span className="text-lg font-medium" style={{color: 'var(--color-text-primary)'}}>Approximate Area:</span>
              <span className="text-lg ml-1" style={{color: 'var(--color-text-primary)'}}>{location?.name || 'Old Union'}</span>
            </div>
          </div>
          <p className="text-sm font-normal mb-4" style={{color: 'var(--color-text-secondary)'}}>Exact spot is revealed 1hr before start</p>
          
          {/* Map Container */}
          <div className="map-container relative w-full bg-gray-50 rounded-xl overflow-hidden border" style={{borderColor: 'var(--color-border)'}}>
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
                  <div className="bg-white px-[0.75rem] py-[0.25rem] rounded-full shadow-lg border" style={{borderColor: 'var(--color-border)'}}>
                    <span className="text-sm font-medium" style={{color: 'var(--color-text-primary)'}}>{location.name} at Stanford</span>
                  </div>
                </div>
              </>
            ) : (
              /* Fallback to placeholder if location fails to load */
              <>
                <div 
                  className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center"
                >
                  <div className="text-center" style={{color: 'var(--color-text-secondary)'}}>
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
        </section>
      </main>

      {/* Attendance Modal */}
      {attendanceModal && (
        <AttendanceModal
          isOpen={attendanceModal.isOpen}
          onClose={handleCloseAttendanceModal}
          timeSlot={attendanceModal.timeSlot}
          date={attendanceModal.date}
          onAttendanceMarked={handleAttendanceMarked}
        />
      )}
    </div>
  );
}