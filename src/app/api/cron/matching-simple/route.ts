import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Simple test - just check if we can connect to database
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    
    // Get waitlist count
    const { data: waitlist, error } = await supabase
      .from('waitlist_entries')
      .select('time_slot, user_id')
      .order('time_slot');
    
    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      });
    }
    
    // Group by time slot
    const bySlot = waitlist?.reduce((acc, entry) => {
      const hour = new Date(entry.time_slot).getHours();
      const key = `${hour}:00`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};
    
    return NextResponse.json({
      success: true,
      totalWaitlist: waitlist?.length || 0,
      bySlot,
      message: 'Database connection works!'
    });
    
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}