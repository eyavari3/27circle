"use client";

import { useState, useEffect } from "react";
import { TimeSlotWithUserStatus } from "@/lib/types";
import { useCurrentTime } from "@/lib/hooks/useCurrentTime";
import { joinWaitlist, leaveWaitlist } from "@/app/circles/actions";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface CirclesClientProps {
  initialTimeSlots: TimeSlotWithUserStatus[];
}

export default function CirclesClient({ initialTimeSlots }: CirclesClientProps) {
  const currentTime = useCurrentTime();
  const [timeSlots, setTimeSlots] = useState(initialTimeSlots);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();

  // Load persisted waitlist state from localStorage on mount
  useEffect(() => {
    const persistedWaitlist = localStorage.getItem('dev-waitlist');
    if (persistedWaitlist) {
      try {
        const waitlistSet = new Set(JSON.parse(persistedWaitlist));
        setTimeSlots(prev => prev.map(slot => ({
          ...slot,
          isOnWaitlist: waitlistSet.has(slot.timeSlot.time.toISOString())
        })));
      } catch (e) {
        console.error('Error loading persisted waitlist:', e);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    
    setTimeSlots(prev => prev.map(slot => {
      const deadline = new Date(slot.timeSlot.deadline);
      const slotTime = new Date(slot.timeSlot.time);
      const slotEndTime = new Date(slotTime);
      slotEndTime.setMinutes(slotEndTime.getMinutes() + 20);

      let buttonState: TimeSlotWithUserStatus["buttonState"];
      let buttonText: string;
      let isDisabled: boolean;

      if (currentTime >= slotEndTime) {
        buttonState = "past";
        buttonText = "Past";
        isDisabled = true;
      } else if (currentTime < deadline) {
        if (slot.isOnWaitlist) {
          buttonState = "leave";
          buttonText = "Can't Go";
          isDisabled = false;
        } else {
          buttonState = "join";
          buttonText = "Join";
          isDisabled = false;
        }
      } else if (currentTime >= deadline && currentTime < slotTime) {
        if (slot.isOnWaitlist) {
          // In development mode, simulate confirmed status for waitlisted users
          buttonState = "confirmed";
          buttonText = "Confirmed ✓";
          isDisabled = false;
        } else {
          buttonState = "closed";
          buttonText = `Closed at ${deadline.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true
          })}`;
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
  }, [currentTime, isLoaded]);

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
        localStorage.setItem('dev-waitlist', JSON.stringify(currentWaitlist));

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
            localStorage.setItem('dev-waitlist', JSON.stringify(revertedWaitlist));

            return reverted;
          });
          setErrors(prev => ({ ...prev, [slotKey]: result.error! }));
        }
      } catch (err) {
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
          localStorage.setItem('dev-waitlist', JSON.stringify(revertedWaitlist));

          return reverted;
        });
        setErrors(prev => ({ ...prev, [slotKey]: "An unexpected error occurred. Please try again." }));
      }
    }
  };

  const formatAppTime = (time: Date) => {
    return time.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
  };

  const getButtonClasses = (slot: TimeSlotWithUserStatus) => {
    if (slot.buttonState === "confirmed") {
      return "bg-transparent text-green-600 border-none font-medium";
    }
    if (slot.buttonState === "closed" || slot.buttonState === "past") {
      return "bg-transparent text-gray-400 border-none cursor-not-allowed font-medium";
    }
    if (slot.buttonState === "leave") {
      return "bg-transparent text-red-500 border-none font-medium";
    }
    return "text-white font-medium border-none transition-all duration-200";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="px-6 pt-6 pb-4" style={{backgroundColor: '#0E2C54'}}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-gray-300 text-sm font-light">
              App Time:
            </p>
            <p className="text-gray-300 text-sm font-light">
              {formatAppTime(currentTime)}
            </p>
          </div>
          <div className="p-2">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>
        
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Today's Circles</h1>
          <p className="text-gray-300 text-base">New conversations waiting to happen</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-6">
        {/* Upcoming Times Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Upcoming Times</h2>
          
          <div className="space-y-4">
            {timeSlots.map((slot, index) => {
              const slotKey = slot.timeSlot.time.toISOString();
              const deadline = new Date(slot.timeSlot.deadline);
              const error = errors[slotKey];
              
              return (
                <div key={index} className="flex items-center justify-between py-3">
                  <div className="flex-1">
                    <div className="text-xl font-semibold text-gray-900">
                      {(() => {
                        const hour = slot.timeSlot.time.getHours();
                        if (hour === 11) return "11:05 AM";
                        if (hour === 14) return "2:05 PM";
                        if (hour === 17) return "5:05 PM";
                        return slot.timeSlot.time.toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true
                        });
                      })()}
                    </div>
                    <div className="text-sm text-gray-500">
                      Decide by{" "}
                      {deadline.toLocaleTimeString("en-US", {
                        hour: "numeric",
                        hour12: true
                      })}
                    </div>
                    {error && (
                      <div className="text-red-500 text-xs mt-1">{error}</div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handleSlotAction(slot)}
                    disabled={slot.isDisabled}
                    className={`px-4 py-2 rounded-full text-sm min-w-[80px] ${getButtonClasses(slot)}`}
                    style={slot.buttonState === "join" ? {backgroundColor: '#0E2C54'} : {}}
                  >
                    {slot.buttonText}
                  </button>
                </div>
              );
            })}
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">Availability resets at 8PM each day</p>
          </div>
        </div>

        {/* Location Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-start space-x-3 mb-4">
            <div className="mt-1">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Approximate Area: Old Union</h3>
              <p className="text-sm text-gray-600">Exact spot is revealed 1hr before start</p>
            </div>
          </div>
          
          {/* Map Container */}
          <div className="relative h-48 bg-gray-200 rounded-lg overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-green-200">
              {/* Stanford Campus Representation */}
              <div className="absolute top-4 left-4 w-16 h-12 bg-green-600 rounded opacity-80"></div>
              <div className="absolute top-8 right-6 w-20 h-16 bg-green-700 rounded opacity-70"></div>
              <div className="absolute bottom-6 left-8 w-12 h-8 bg-green-500 rounded opacity-90"></div>
              
              {/* Roads */}
              <div className="absolute top-0 left-1/2 w-1 h-full bg-gray-400 transform -translate-x-1/2"></div>
              <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-400 transform -translate-y-1/2"></div>
              
              {/* Old Union Marker */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="relative">
                  <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg"></div>
                  <div className="absolute -bottom-1 left-1/2 w-0 h-0 border-l-2 border-r-2 border-t-4 border-transparent border-t-red-500 transform -translate-x-1/2"></div>
                </div>
              </div>
              
              {/* Location Labels */}
              <div className="absolute top-2 left-2 text-xs font-medium text-gray-700">Panama Mall</div>
              <div className="absolute bottom-2 right-2 text-xs font-medium text-gray-700">Stanford University Bookstore</div>
              <div className="absolute top-1/3 left-1/4 text-xs font-medium text-white bg-red-500 px-2 py-1 rounded shadow">
                Old Union at Stanford
              </div>
              
              {/* Blue Current Location Indicator */}
              <div className="absolute bottom-4 right-4">
                <div className="w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-md"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}