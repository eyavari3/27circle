"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function joinWaitlist(timeSlot: string): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // For development: Skip database operations if no auth
  if (!user) {
    console.log('Development mode: Simulating waitlist join (no database operation)');
    // In development without auth, we just return success
    // The UI will handle optimistic updates
    revalidatePath("/circles");
    return { error: null };
  }

  const timeSlotDate = new Date(timeSlot);
  const now = new Date();
  const pstNow = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
  
  const deadline = new Date(timeSlotDate);
  deadline.setHours(deadline.getHours() - 1);
  
  if (pstNow >= deadline) {
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
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // For development: Skip database operations if no auth
  if (!user) {
    console.log('Development mode: Simulating waitlist leave (no database operation)');
    // In development without auth, we just return success
    // The UI will handle optimistic updates
    revalidatePath("/circles");
    return { error: null };
  }

  const timeSlotDate = new Date(timeSlot);
  const now = new Date();
  const pstNow = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
  
  const deadline = new Date(timeSlotDate);
  deadline.setHours(deadline.getHours() - 1);
  
  if (pstNow >= deadline) {
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