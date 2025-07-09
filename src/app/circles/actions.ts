"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getCurrentPSTTime, parseTimeSlotString, isValidTimeSlot, createTimeSlots, getDisplayDate } from "@/lib/time";
import { db } from "@/lib/database/client";
import { ApiResponse } from "@/lib/database/types";

export async function joinWaitlist(timeSlot: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // For development: Skip database operations if no auth
  if (!user) {
    console.log('Development mode: Simulating waitlist join (no database operation)');
    // In development without auth, we just return success
    // The UI will handle optimistic updates
    revalidatePath("/circles");
    return { error: null };
  }

  // Validate time slot using centralized time system
  if (!isValidTimeSlot(timeSlot)) {
    return { error: "Invalid time slot." };
  }
  
  const timeSlotDate = parseTimeSlotString(timeSlot);
  const currentTime = getCurrentPSTTime();
  
  // Find the matching slot from today's slots to get the deadline
  const todaySlots = createTimeSlots(getDisplayDate(currentTime));
  const matchingSlot = todaySlots.find(slot => 
    slot.time.getTime() === timeSlotDate.getTime()
  );
  
  if (!matchingSlot) {
    return { error: "Time slot not found." };
  }
  
  // Check if deadline has passed
  if (currentTime >= matchingSlot.deadline) {
    return { error: "The deadline to join this circle has passed." };
  }

  const { error } = await supabase
    .from("waitlist_entries")
    .insert({
      user_id: user.id,
      time_slot: timeSlot
    });

  if (error) {
    if (error.message.includes("duplicate key value")) {
      return { error: null };
    }
    console.error("Error joining waitlist:", error.message);
    return { error: "Could not join the waitlist. Please try again." };
  }

  revalidatePath("/circles");
  return { error: null };
}

export async function leaveWaitlist(timeSlot: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // For development: Skip database operations if no auth
  if (!user) {
    console.log('Development mode: Simulating waitlist leave (no database operation)');
    // In development without auth, we just return success
    // The UI will handle optimistic updates
    revalidatePath("/circles");
    return { error: null };
  }

  // Validate time slot using centralized time system
  if (!isValidTimeSlot(timeSlot)) {
    return { error: "Invalid time slot." };
  }
  
  const timeSlotDate = parseTimeSlotString(timeSlot);
  const currentTime = getCurrentPSTTime();
  
  // Find the matching slot from today's slots to get the deadline
  const todaySlots = createTimeSlots(getDisplayDate(currentTime));
  const matchingSlot = todaySlots.find(slot => 
    slot.time.getTime() === timeSlotDate.getTime()
  );
  
  if (!matchingSlot) {
    return { error: "Time slot not found." };
  }
  
  // Check if deadline has passed
  if (currentTime >= matchingSlot.deadline) {
    return { error: "The deadline has passed. You cannot leave this waitlist." };
  }

  const { error } = await supabase
    .from("waitlist_entries")
    .delete()
    .eq("user_id", user.id)
    .eq("time_slot", timeSlot);

  if (error) {
    console.error("Error leaving waitlist:", error.message);
    return { error: "Could not leave the waitlist. Please try again." };
  }

  revalidatePath("/circles");
  return { error: null };
}