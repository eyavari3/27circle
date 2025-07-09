import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TimeSlotWithUserStatus, CircleData } from "@/lib/types";
import CirclesClient from "./CirclesClient";

function getDisplayDate(currentTime: Date): Date {
  const displayDate = new Date(currentTime);
  
  if (currentTime.getHours() >= 20) {
    displayDate.setDate(displayDate.getDate() + 1);
  }
  
  displayDate.setHours(0, 0, 0, 0);
  return displayDate;
}

function createTimeSlots(displayDate: Date): Array<{ time: Date; deadline: Date }> {
  const baseDate = new Date(displayDate);
  return [
    {
      time: new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 11, 0, 0, 0),
      deadline: new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 10, 0, 0, 0)
    },
    {
      time: new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 14, 0, 0, 0),
      deadline: new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 13, 0, 0, 0)
    },
    {
      time: new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 17, 0, 0, 0),
      deadline: new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 16, 0, 0, 0)
    }
  ];
}

export default async function CirclesPage() {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  // Temporary: Comment out auth checks for development
  // if (!user) {
  //   redirect("/");
  // }
  
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
  
  const currentTime = new Date();
  const pstTime = new Date(currentTime.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
  const displayDate = getDisplayDate(pstTime);
  const timeSlots = createTimeSlots(new Date(displayDate));
  
  const startOfDay = new Date(displayDate);
  startOfDay.setHours(0, 0, 0, 0);
  
  // For development: Skip database queries if no auth
  let waitlistEntries = null;
  let circleData = null;
  
  if (user) {
    const { data: wlData } = await supabase
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
    const timeStr = new Date(item.circles.time_slot).toISOString();
    userCircles.set(timeStr, {
      circleId: item.circle_id,
      circleData: {
        circleId: item.circle_id,
        locationName: item.circles.locations?.name || "Location TBD",
        sparkText: item.circles.conversation_sparks?.spark_text || "Conversation spark TBD"
      }
    });
  });
  
  const timeSlotsWithStatus: TimeSlotWithUserStatus[] = timeSlots.map(slot => {
    const slotTimeStr = slot.time.toISOString();
    const isOnWaitlist = userWaitlistTimes.has(slotTimeStr);
    const userCircle = userCircles.get(slotTimeStr);
    
    return {
      timeSlot: slot,
      isOnWaitlist,
      assignedCircleId: userCircle?.circleId || null,
      circleData: userCircle?.circleData || null,
      buttonState: 'join',
      buttonText: 'Join',
      isDisabled: false
    };
  });
  
  return <CirclesClient initialTimeSlots={timeSlotsWithStatus} />;
}