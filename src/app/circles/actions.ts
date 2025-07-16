"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getCurrentPSTTime, parseTimeSlotString, isValidTimeSlot, createTimeSlots, getDisplayDate } from "@/lib/time";
import { ensureUserProfile } from "./ensure-profile";

export async function joinWaitlist(timeSlot: string): Promise<{ error: string | null }> {
  try {
    console.log('🎯 joinWaitlist called with timeSlot:', timeSlot);
    
    // Get user from regular client (handles cookies/sessions)
    const authClient = await createClient();
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    
    if (authError) {
      console.error('❌ Auth error in joinWaitlist:', authError);
      return { error: "Authentication error. Please sign in again." };
    }

    // For development: Skip database operations if no auth
    if (!user) {
      console.log('Development mode: Simulating waitlist join (no database operation)');
      // In development without auth, we just return success
      // The UI will handle optimistic updates
      revalidatePath("/circles");
      return { error: null };
    }
    
    console.log('✅ User authenticated:', user.email, 'ID:', user.id);
    
    // Use service client for database operations (bypasses RLS)
    const supabase = await createServiceClient();
    
    // Ensure user has a profile (for Google OAuth users)
    const profileResult = await ensureUserProfile(user.id);
    if (profileResult.error) {
      console.error('❌ Profile creation failed:', profileResult.error);
      return { error: "Failed to create user profile. Please try again." };
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

  if (error && error.message) {
    if (error.message.includes("duplicate key value")) {
      return { error: null };
    }
    console.error("Error joining waitlist:", error.message);
    return { error: "Could not join the waitlist. Please try again." };
  }

  console.log(`✅ Waitlist joined successfully for user:`, user.id);
  revalidatePath("/circles");
  return { error: null };
  } catch (error) {
    console.error('❌ Unexpected error in joinWaitlist:', error);
    return { error: "An unexpected error occurred. Please try again." };
  }
}

export async function leaveWaitlist(timeSlot: string): Promise<{ error: string | null }> {
  // Get user from regular client (handles cookies/sessions)
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();

  // For development: Skip database operations if no auth
  if (!user) {
    console.log('Development mode: Simulating waitlist leave (no database operation)');
    // In development without auth, we just return success
    // The UI will handle optimistic updates
    revalidatePath("/circles");
    return { error: null };
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
    .eq("user_id", user.id)
    .eq("time_slot", timeSlot);

  if (error) {
    console.error("Error leaving waitlist:", error.message);
    return { error: "Could not leave the waitlist. Please try again." };
  }

  console.log(`✅ Waitlist left successfully for user:`, user.id);
  revalidatePath("/circles");
  return { error: null };
}