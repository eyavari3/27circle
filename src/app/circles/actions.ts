"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getCurrentPSTTime, parseTimeSlotString, isValidTimeSlot, createTimeSlots, getDisplayDate } from "@/lib/time";
import { ensureUserProfile } from "./ensure-profile";

export async function joinWaitlist(timeSlot: string, userId?: string): Promise<{ error: string | null }> {
  try {
    // Get user ID from parameter or auth
    let effectiveUserId = userId;
    
    if (!effectiveUserId) {
      // Get user from regular client (handles cookies/sessions)
      const authClient = await createClient();
      const { data: { user }, error: authError } = await authClient.auth.getUser();
      
      if (authError) {
        console.error('Auth error in joinWaitlist:', authError);
        return { error: "Authentication error. Please try again." };
      }

      if (!user) {
        return { error: "User ID required for waitlist operations." };
      }
      
      effectiveUserId = user.id;
      
      // Ensure user has a profile (for authenticated users only)
      const profileResult = await ensureUserProfile(user.id);
      if (profileResult.error) {
        console.error('Profile creation failed:', profileResult.error);
        return { error: "Failed to create user profile. Please try again." };
      }
    }
    
    // Use service client for database operations (bypasses RLS)
    const supabase = await createServiceClient();

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
      user_id: effectiveUserId,
      time_slot: timeSlot
    });

  if (error && error.message) {
    if (error.message.includes("duplicate key value")) {
      return { error: null };
    }
    console.error("Error joining waitlist:", error.message);
    return { error: "Could not join the waitlist. Please try again." };
  }

  revalidatePath("/circles");
  return { error: null };
  } catch (error) {
    console.error('Unexpected error in joinWaitlist:', error);
    return { error: "An unexpected error occurred. Please try again." };
  }
}

export async function leaveWaitlist(timeSlot: string, userId?: string): Promise<{ error: string | null }> {
  try {
    // Get user ID from parameter or auth
    let effectiveUserId = userId;
    
    if (!effectiveUserId) {
      // Get user from regular client (handles cookies/sessions)
      const authClient = await createClient();
      const { data: { user }, error: authError } = await authClient.auth.getUser();
      
      if (authError) {
        console.error('Auth error in leaveWaitlist:', authError);
        return { error: "Authentication error. Please sign in again." };
      }

      if (!user) {
        return { error: "User ID required for waitlist operations." };
      }
      
      effectiveUserId = user.id;
    }
    
    // Use service client for database operations (bypasses RLS)
    const supabase = await createServiceClient();

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
      .eq("user_id", effectiveUserId)
      .eq("time_slot", timeSlot);

    if (error) {
      console.error("Error leaving waitlist:", error.message);
      return { error: "Could not leave the waitlist. Please try again." };
    }

    revalidatePath("/circles");
    return { error: null };
  } catch (error) {
    console.error('Unexpected error in leaveWaitlist:', error);
    return { error: "An unexpected error occurred. Please try again." };
  }
}