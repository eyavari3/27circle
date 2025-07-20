import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  
  // Get current time info
  const now = new Date();
  const pstTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
  
  // Check APP_TIME_OFFSET
  const { getAppTimeOffset } = await import('@/lib/constants');
  const APP_TIME_OFFSET = getAppTimeOffset();
  
  // Get today's date for time slots
  const today = new Date(pstTime);
  if (pstTime.getHours() >= 20) {
    today.setDate(today.getDate() + 1);
  }
  today.setHours(0, 0, 0, 0);
  
  // Define time slots
  const timeSlots = [
    {
      time: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 0, 0),
      deadline: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0, 0)
    },
    {
      time: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0, 0),
      deadline: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 13, 0, 0)
    },
    {
      time: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 17, 0, 0),
      deadline: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 16, 0, 0)
    }
  ];
  
  // Check waitlist entries
  const { data: waitlistEntries, error } = await supabase
    .from('waitlist_entries')
    .select('time_slot, user_id')
    .order('time_slot');
  
  const debugInfo = {
    currentTime: {
      now: now.toISOString(),
      pstTime: pstTime.toISOString(),
      pstHour: pstTime.getHours(),
      pstMinutes: pstTime.getMinutes(),
      APP_TIME_OFFSET
    },
    timeSlots: timeSlots.map(slot => ({
      slotTime: slot.time.toISOString(),
      deadline: slot.deadline.toISOString(),
      deadlineHour: slot.deadline.getHours(),
      wouldProcess: pstTime.getHours() === slot.deadline.getHours() && pstTime.getMinutes() === 0
    })),
    waitlistEntries: {
      total: waitlistEntries?.length || 0,
      bySlot: waitlistEntries?.reduce((acc, entry) => {
        const hour = new Date(entry.time_slot).getHours();
        const key = `${hour}:00`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      error: error?.message
    },
    matchingWouldRun: timeSlots.some(slot => 
      pstTime.getHours() === slot.deadline.getHours() && 
      pstTime.getMinutes() === 0
    )
  };
  
  return NextResponse.json(debugInfo, { status: 200 });
}