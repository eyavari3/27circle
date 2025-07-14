"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getCurrentPSTTime, parseTimeSlotString, isValidTimeSlot, createTimeSlots, getDisplayDate } from "@/lib/time";
import { db } from "@/lib/database/client";
import { ApiResponse } from "@/lib/database/types";
import { ensureUserProfile } from "./ensure-profile";
import { isTestPhoneNumber, isTestModeEnabled } from "@/lib/auth/test-user-utils";

export async function joinWaitlist(timeSlot: string): Promise<{ error: string | null }> {
  try {
    console.log('🎯 joinWaitlist called with timeSlot:', timeSlot);
    
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
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
    
    // Ensure user has a profile (for Google OAuth users)
    const profileResult = await ensureUserProfile();
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

  // For test mode: Always use service role client to completely bypass RLS
  let targetSupabase = supabase;
  let isTestUser = false;

  if (isTestModeEnabled()) {
    // Use service role client to check if this is a test user (bypasses any RLS issues)
    const serviceSupabase = await createServiceClient();
    const { data: userData } = await serviceSupabase
      .from('users')
      .select('phone_number, is_test')
      .eq('id', user.id)
      .maybeSingle();

    if (userData?.is_test || (userData?.phone_number && isTestPhoneNumber(userData.phone_number))) {
      isTestUser = true;
      targetSupabase = serviceSupabase; // Use service role for ALL test user operations
      console.log('🧪 TEST MODE: Using service role client for test user waitlist operations (bypassing RLS)');
    }
  }

  const { error } = await targetSupabase
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

  console.log(`✅ Waitlist joined successfully for ${isTestUser ? 'test' : 'regular'} user:`, user.id);
  revalidatePath("/circles");
  return { error: null };
  } catch (error) {
    console.error('❌ Unexpected error in joinWaitlist:', error);
    return { error: "An unexpected error occurred. Please try again." };
  }
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