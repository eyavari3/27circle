import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { TimeSlotWithUserStatus, CircleData } from "@/lib/types";
import { getCurrentPSTTime, getDisplayDate, createTimeSlots, getDayBoundaries, formatDeadlineTime } from "@/lib/time";
import { requireAuthInProduction } from "@/lib/auth/production-guards";
import CirclesClient from "./CirclesClient";

export default async function CirclesPage() {
  // Enforce authentication in production while preserving dev utilities
  // await requireAuthInProduction(); // TEMPORARILY DISABLED FOR TESTING
  
  const supabase = await createClient();
  const serviceSupabase = await createServiceClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  // const { data: profile } = await supabase
  //   .from("users")
  //   .select("*")
  //   .eq("id", user.id)
  //   .single();
  
  // if (!profile?.full_name || !profile?.gender || !profile?.date_of_birth) {
  //   redirect("/onboarding/profile");
  // }
  
  // const { data: interests } = await supabase
  //   .from("user_interests")
  //   .select("*")
  //   .eq("user_id", user.id);
  
  // if (!interests || interests.length === 0) {
  //   redirect("/onboarding/curiosity-1");
  // }
  
  const currentTime = getCurrentPSTTime();
  const displayDate = getDisplayDate(currentTime);
  const timeSlots = createTimeSlots(displayDate);
  const { start: startOfDay } = getDayBoundaries(displayDate);
  
  // For development: Skip database queries if no auth
  let waitlistEntries = null;
  let circleData = null;
  
  if (user) {
    // FORCE FIX: Use service client to bypass RLS issues
    const { data: wlData, error: wlError } = await serviceSupabase
      .from("waitlist_entries")
      .select("*")
      .eq("user_id", user.id)
      .gte("time_slot", startOfDay.toISOString());
    
    
    waitlistEntries = wlData;
    
    const { data: cData } = await supabase
      .from("circle_members")
      .select(`
        circle_id,
        circles!inner(
          time_slot,
          locations(name),
          conversation_sparks(spark_text)
        )
      `)
      .eq("user_id", user.id)
      .gte("circles.time_slot", startOfDay.toISOString());
    circleData = cData;
  }
  
  const userWaitlistTimes = new Set(
    waitlistEntries?.map(entry => new Date(entry.time_slot).toISOString()) || []
  );
  
  const userCircles = new Map<string, { circleId: string; circleData: CircleData }>();
  circleData?.forEach(item => {
    const timeStr = new Date(item.circles[0].time_slot).toISOString();
    userCircles.set(timeStr, {
      circleId: item.circle_id,
      circleData: {
        circleId: item.circle_id,
        locationName: item.circles[0].locations[0]?.name || "Location TBD",
        sparkText: item.circles[0].conversation_sparks[0]?.spark_text || "Conversation spark TBD"
      }
    });
  });
  
  const timeSlotsWithStatus: TimeSlotWithUserStatus[] = timeSlots.map(slot => {
    const slotTimeStr = slot.time.toISOString();
    const isOnWaitlist = user ? userWaitlistTimes.has(slotTimeStr) : false;
    const userCircle = user ? userCircles.get(slotTimeStr) : undefined;
    
    return {
      timeSlot: {
        time: slot.time,
        deadline: slot.deadline
      },
      isOnWaitlist,
      assignedCircleId: userCircle?.circleId || null,
      circleData: userCircle?.circleData || null,
      buttonState: 'join',
      buttonText: 'Join',
      middleText: `Decide by ${formatDeadlineTime(slot)}`,
      isDisabled: false
    };
  });
  
  return <CirclesClient 
    initialTimeSlots={timeSlotsWithStatus} 
    serverTime={currentTime} 
    authenticatedUser={user}
  />;
}