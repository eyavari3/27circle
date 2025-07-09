"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TimeSlotWithUserStatus } from "@/lib/types";
import { joinWaitlist, leaveWaitlist } from "@/app/circles/actions";

interface TimeSlotCardProps {
  slot: TimeSlotWithUserStatus;
}

export default function TimeSlotCard({ slot }: TimeSlotCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [optimisticState, setOptimisticState] = useState<"join" | "leave" | null>(null);

  const handleButtonClick = async () => {
    if (slot.buttonState === "confirmed" && slot.assignedCircleId) {
      router.push(`/circles/${slot.assignedCircleId}`);
      return;
    }

    if (slot.buttonState === "join" || slot.buttonState === "leave") {
      setLoading(true);
      setError("");
      
      setOptimisticState(slot.buttonState === "join" ? "leave" : "join");

      try {
        const result = slot.buttonState === "join" 
          ? await joinWaitlist(slot.timeSlot.time.toISOString())
          : await leaveWaitlist(slot.timeSlot.time.toISOString());

        if (result.error) {
          setError(result.error);
          setOptimisticState(null);
        }
      } catch (err) {
        setError("An unexpected error occurred. Please try again.");
        setOptimisticState(null);
      } finally {
        setLoading(false);
      }
    }
  };

  const displayState = optimisticState || slot.buttonState;
  const isOptimisticJoin = displayState === "join";
  const isOptimisticLeave = displayState === "leave";

  const getButtonClasses = () => {
    if (slot.buttonState === "confirmed") return "bg-green-500 text-white hover:bg-green-600";
    if (slot.buttonState === "closed" || slot.buttonState === "past") return "bg-gray-300 text-gray-500 cursor-not-allowed";
    if (isOptimisticJoin) return "bg-blue-500 text-white hover:bg-blue-600";
    if (isOptimisticLeave) return "bg-gray-500 text-white hover:bg-gray-600";
    return "bg-blue-500 text-white hover:bg-blue-600";
  };

  const getButtonText = () => {
    if (optimisticState) {
      return optimisticState === "join" ? "Join" : "Can't Go";
    }
    return slot.buttonText;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
      <div className="text-center">
        <h3 className="text-xl font-semibold">
          {slot.timeSlot.time.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true
          })}
        </h3>
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        <p className="font-medium">
          {slot.circleData?.locationName || "Location TBD"}
        </p>
        {slot.circleData?.sparkText && (
          <p className="italic">"{slot.circleData.sparkText}"</p>
        )}
      </div>

      {error && (
        <p className="text-red-500 text-sm text-center">{error}</p>
      )}

      <button
        onClick={handleButtonClick}
        disabled={slot.isDisabled || loading}
        className={`w-full py-2 px-4 rounded font-medium transition-colors relative ${getButtonClasses()}`}
      >
        {loading && (
          <span className="absolute inset-0 flex items-center justify-center">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </span>
        )}
        <span className={loading ? "opacity-0" : ""}>
          {getButtonText()}
        </span>
      </button>
    </div>
  );
}