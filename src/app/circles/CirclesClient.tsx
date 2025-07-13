"use client";

import { useState, useEffect } from "react";
import { TimeSlotWithUserStatus } from "@/lib/types";
import { useCurrentTime } from "@/lib/hooks/useCurrentTime";
import { useFeedbackCheck } from "@/lib/hooks/useFeedbackCheck";
import { 
  getSlotState, 
  formatDisplayTime, 
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
}

export default function CirclesClient({ initialTimeSlots }: CirclesClientProps) {
  const currentTime = useCurrentTime();
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

  // Load persisted waitlist state from localStorage on mount
  useEffect(() => {
    // Comment out clear for testing persistence
    // if (process.env.NODE_ENV === 'development') {
    //   localStorage.removeItem('dev-waitlist');
    // }

    const persistedWaitlist = localStorage.getItem('dev-waitlist');
    if (persistedWaitlist) {
      try {
        const waitlistSet = new Set(JSON.parse(persistedWaitlist));
        setTimeSlots(prev => prev.map(slot => ({
          ...slot,
          isOnWaitlist: waitlistSet.has(slot.timeSlot.time.toISOString())
        })));
        console.log('Loaded persisted waitlist:', waitlistSet); // Debug
      } catch (e) {
        console.error('Error loading persisted waitlist:', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Check if we've crossed 8PM and need to show next day's slots
  useEffect(() => {
    if (!isLoaded) return;
    
    const currentDisplayDate = getDisplayDate(currentTime);
    
    if (!lastDisplayDate) {
      setLastDisplayDate(currentDisplayDate);
      return;
    }
    
    // Check if the display date has changed (crossed 8PM boundary)
    if (currentDisplayDate.getTime() !== lastDisplayDate.getTime()) {
      console.log('🕐 Display date changed! Regenerating slots for next day...');
      console.log('Previous date:', lastDisplayDate.toDateString());
      console.log('New date:', currentDisplayDate.toDateString());
      
      // FIRST: Clear localStorage waitlist for the new day (in development)
      if (process.env.NODE_ENV === 'development') {
        localStorage.removeItem('dev-waitlist');
        console.log('🧹 Cleared dev-waitlist for new day');
      }
      
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
        isDisabled: false
      }));
      
      setTimeSlots(freshTimeSlots);
      setLastDisplayDate(currentDisplayDate);
      setJustReset(true);
      console.log('✅ Reset complete - all slots should show "Join"');
      console.log('Fresh slots created:', freshTimeSlots.map(s => ({
        time: s.timeSlot.time.toLocaleTimeString(),
        isOnWaitlist: s.isOnWaitlist,
        buttonText: s.buttonText
      })));
      
      // Clear the reset flag after a short delay to allow the reset to take effect
      setTimeout(() => setJustReset(false), 100);
    }
  }, [currentTime, isLoaded, lastDisplayDate]);

  useEffect(() => {
    if (!isLoaded || justReset) return;
    
    console.log('🔄 Processing button states...', { justReset });
    
    setTimeSlots(prev => prev.map(slot => {
      const timeSlot = {
        time: slot.timeSlot.time,
        deadline: slot.timeSlot.deadline,
        slot: slot.timeSlot.time.getHours() === 11 ? '11AM' : 
              slot.timeSlot.time.getHours() === 14 ? '2PM' : '5PM',
        hour: slot.timeSlot.time.getHours()
      } as const;
      
      const slotState = getSlotState(timeSlot, currentTime);
      const slotEndTime = new Date(timeSlot.time);
      slotEndTime.setMinutes(slotEndTime.getMinutes() + 20);

      let buttonState: TimeSlotWithUserStatus["buttonState"];
      let buttonText: string;
      let isDisabled: boolean;

      if (slotState === 'past-event') {
        buttonState = "past";
        buttonText = "Past";
        isDisabled = true;
      } else if (slotState === 'pre-deadline') {
        if (slot.isOnWaitlist) {
          buttonState = "leave";
          buttonText = "Can't Go";
          isDisabled = false;
        } else {
          buttonState = "join";
          buttonText = "Join";
          isDisabled = false;
        }
      } else if (slotState === 'post-deadline') {
        if (slot.isOnWaitlist) {
          console.log('🎉 CONFIRMED STATE TRIGGERED:', timeSlot.slot, 'at', formatDisplayTime(currentTime));
          buttonState = "confirmed";
          buttonText = "Confirmed ✓";
          isDisabled = false;
          // Simulate assignedCircleId for dev
          slot.assignedCircleId = slot.assignedCircleId || `simulated-${slot.timeSlot.time.getHours()}`;
        } else {
          buttonState = "closed";
          buttonText = `Closed at ${formatDeadlineTime(timeSlot)}`;
          isDisabled = true;
        }
      } else {
        buttonState = "past";
        buttonText = "Past";
        isDisabled = true;
      }

      return {
        ...slot,
        buttonState,
        buttonText,
        isDisabled
      };
    }));
  }, [currentTime, isLoaded, justReset]);

  const handleSlotAction = async (slot: TimeSlotWithUserStatus) => {
    if (slot.buttonState === "confirmed") {
      // In development mode, use a simulated circle ID
      const circleId = slot.assignedCircleId || `dev-circle-${slot.timeSlot.time.getHours()}`;
      router.push(`/circles/${circleId}`);
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

        // Persist to localStorage for development
        const currentWaitlist = updated
          .filter(s => s.isOnWaitlist)
          .map(s => s.timeSlot.time.toISOString());
        if (process.env.NODE_ENV === 'development') {
          localStorage.setItem('dev-waitlist', JSON.stringify(currentWaitlist));
          console.log('Updated localStorage waitlist:', currentWaitlist); // Debug
        }

        return updated;
      });

      // Background server action (no loading UI)
      try {
        const result = isJoining 
          ? await joinWaitlist(slot.timeSlot.time.toISOString())
          : await leaveWaitlist(slot.timeSlot.time.toISOString());

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

            // Update localStorage with reverted state
            const revertedWaitlist = reverted
              .filter(s => s.isOnWaitlist)
              .map(s => s.timeSlot.time.toISOString());
            if (process.env.NODE_ENV === 'development') {
              localStorage.setItem('dev-waitlist', JSON.stringify(revertedWaitlist));
            }

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

          // Update localStorage with reverted state
          const revertedWaitlist = reverted
            .filter(s => s.isOnWaitlist)
            .map(s => s.timeSlot.time.toISOString());
          if (process.env.NODE_ENV === 'development') {
            localStorage.setItem('dev-waitlist', JSON.stringify(revertedWaitlist));
          }

          return reverted;
        });
        setErrors(prev => ({ ...prev, [slotKey]: "An unexpected error occurred. Please try again." }));
      }
    }
  };

  const formatAppTime = (time: Date) => {
    return formatDisplayTime(time);
  };

  const getButtonClasses = (slot: TimeSlotWithUserStatus) => {
    if (slot.buttonState === "confirmed") {
      return "bg-green-100 text-green-700 border border-green-300 font-medium";
    }
    if (slot.buttonState === "closed" || slot.buttonState === "past") {
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
            <p className="text-[#152B5C] text-[3vw] min-text-xs max-text-sm font-light">
              {formatAppTime(currentTime)}
            </p>
          </div>
          <button 
            onClick={() => {
              console.log('🔧 Settings button clicked, navigating to /settings');
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
          <h1 className="text-[4.5vw] min-text-2xl max-text-3xl font-bold text-white mb-[1vh]">Today&apos;s Circles</h1>
          <p className="text-gray-300 text-[3vw] min-text-sm max-text-base">New conversations waiting to happen</p>
          {currentFeedbackWindow && (
            <button
              onClick={() => router.push(`/feedback?timeSlot=${currentFeedbackWindow.timeSlot.slot}&eventId=dev-event-${currentFeedbackWindow.timeSlot.slot}`)}
              className="mt-2 px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white text-xs rounded-full inline-block transition-colors cursor-pointer"
            >
              📝 Feedback needed for {currentFeedbackWindow.timeSlot.slot} event - Click here
            </button>
          )}
        </div>
      </div>

      {/* Main Content - Flex grow to fill remaining space */}
      <div className="flex-1 flex flex-col px-[6vw]">
        {/* Upcoming Times Section - ~50% of viewport */}
        <div className="h-[50vh] min-h-[300px] py-[3vh] flex flex-col">
          <h2 className="text-gray-700 font-medium text-[3.5vw] min-text-sm max-text-base mb-[2vh]">Upcoming Times</h2>
          
          <div className="flex-1 flex flex-col justify-start space-y-3">
            {timeSlots.map((slot, index) => {
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
                      <div className="text-xl font-bold text-gray-900">
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
                    
                    {/* Decide by - Center area */}
                    <div className="flex-1 text-center">
                      <p className="text-xs text-gray-500 leading-tight">
                        Decide by<br />
                        <span className="font-medium">
                          {formatDeadlineTime({
                            time: slot.timeSlot.time,
                            deadline: slot.timeSlot.deadline,
                            slot: slot.timeSlot.time.getHours() === 11 ? '11AM' : 
                                  slot.timeSlot.time.getHours() === 14 ? '2PM' : '5PM',
                            hour: slot.timeSlot.time.getHours()
                          })}
                        </span>
                      </p>
                    </div>
                    
                    {/* Button - Right side */}
                    <div className="flex-1 flex justify-end">
                      <button
                        onClick={() => handleSlotAction(slot)}
                        disabled={slot.isDisabled}
                        className={`px-4 py-2 rounded-full text-sm font-medium min-w-[70px] ${getButtonClasses(slot)}`}
                        style={slot.buttonState === "join" ? {backgroundColor: '#0E2C54'} : {}}
                      >
                        {slot.buttonText}
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