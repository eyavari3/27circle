import { NextRequest, NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/database/client';
import { getCurrentPSTTime, getDisplayDate, getDayBoundaries } from '@/lib/time';

export async function GET(request: NextRequest) {
  try {
    const currentTime = getCurrentPSTTime();
    const today = getDisplayDate(currentTime);
    const { start: startOfDay, end: endOfDay } = getDayBoundaries(today);
    
    // Get comprehensive statistics
    const [
      dailyStats,
      recentCircles,
      waitlistSummary,
      systemHealth
    ] = await Promise.all([
      getDailyStats(startOfDay, endOfDay),
      getRecentCircles(),
      getWaitlistSummary(startOfDay, endOfDay),
      getSystemHealth()
    ]);
    
    return NextResponse.json({
      success: true,
      timestamp: currentTime.toISOString(),
      today: today.toISOString(),
      dailyStats,
      recentCircles,
      waitlistSummary,
      systemHealth
    });
    
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: getCurrentPSTTime().toISOString()
    }, { status: 500 });
  }
}

async function getDailyStats(startOfDay: Date, endOfDay: Date) {
  try {
    const supabase = await dbAdmin.getClient();
    
    // Get waitlist entries for today
    const { data: waitlistEntries } = await supabase
      .from('waitlist_entries')
      .select('time_slot')
      .gte('time_slot', startOfDay.toISOString())
      .lte('time_slot', endOfDay.toISOString());
    
    // Get circles created today
    const { data: circles } = await supabase
      .from('circles')
      .select('time_slot, circle_members(user_id)')
      .gte('time_slot', startOfDay.toISOString())
      .lte('time_slot', endOfDay.toISOString());
    
    // Process by time slot
    const slots = {
      '11AM': { signups: 0, circles: 0, matched: 0 },
      '2PM': { signups: 0, circles: 0, matched: 0 },
      '5PM': { signups: 0, circles: 0, matched: 0 }
    };
    
    // Count waitlist signups
    waitlistEntries?.forEach((entry: any) => {
      const hour = new Date(entry.time_slot).getHours();
      if (hour === 11) slots['11AM'].signups++;
      else if (hour === 14) slots['2PM'].signups++;
      else if (hour === 17) slots['5PM'].signups++;
    });
    
    // Count circles and matched users
    circles?.forEach((circle: any) => {
      const hour = new Date(circle.time_slot).getHours();
      const memberCount = circle.circle_members?.length || 0;
      
      if (hour === 11) {
        slots['11AM'].circles++;
        slots['11AM'].matched += memberCount;
      } else if (hour === 14) {
        slots['2PM'].circles++;
        slots['2PM'].matched += memberCount;
      } else if (hour === 17) {
        slots['5PM'].circles++;
        slots['5PM'].matched += memberCount;
      }
    });
    
    return slots;
  } catch (error) {
    console.error('Error getting daily stats:', error);
    return {
      '11AM': { signups: 0, circles: 0, matched: 0 },
      '2PM': { signups: 0, circles: 0, matched: 0 },
      '5PM': { signups: 0, circles: 0, matched: 0 }
    };
  }
}

async function getRecentCircles() {
  try {
    const supabase = await dbAdmin.getClient();
    
    const { data: circles } = await supabase
      .from('circles')
      .select(`
        id,
        time_slot,
        status,
        locations(name),
        conversation_sparks(spark_text),
        circle_members(
          user_id,
          users(full_name, gender)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10);
    
    return circles?.map((circle: any) => ({
      id: circle.id,
      timeSlot: circle.time_slot,
      status: circle.status,
      location: circle.locations?.name,
      spark: circle.conversation_sparks?.spark_text?.substring(0, 50) + '...',
      memberCount: circle.circle_members?.length || 0,
      members: circle.circle_members?.map((member: any) => ({
        name: member.users?.full_name,
        gender: member.users?.gender
      })) || []
    })) || [];
  } catch (error) {
    console.error('Error getting recent circles:', error);
    return [];
  }
}

async function getWaitlistSummary(startOfDay: Date, endOfDay: Date) {
  try {
    const supabase = await dbAdmin.getClient();
    
    // Get current waitlist
    const { data: waitlist } = await supabase
      .from('waitlist_entries')
      .select(`
        time_slot,
        users(full_name, gender, user_interests(interest_type))
      `)
      .gte('time_slot', startOfDay.toISOString())
      .lte('time_slot', endOfDay.toISOString());
    
    // Process waitlist data
    const summary = {
      totalUsers: waitlist?.length || 0,
      byTimeSlot: {
        '11AM': 0,
        '2PM': 0,
        '5PM': 0
      },
      byGender: {
        male: 0,
        female: 0,
        'non-binary': 0
      },
      byInterest: {
        deep_thinking: 0,
        spiritual_growth: 0,
        new_activities: 0,
        community_service: 0
      }
    };
    
    waitlist?.forEach((entry: any) => {
      // Count by time slot
      const hour = new Date(entry.time_slot).getHours();
      if (hour === 11) summary.byTimeSlot['11AM']++;
      else if (hour === 14) summary.byTimeSlot['2PM']++;
      else if (hour === 17) summary.byTimeSlot['5PM']++;
      
      // Count by gender
      const gender = entry.users?.gender;
      if (gender && gender in summary.byGender) {
        summary.byGender[gender as keyof typeof summary.byGender]++;
      }
      
      // Count by interests
      entry.users?.user_interests?.forEach((interest: any) => {
        const interestType = interest.interest_type;
        if (interestType in summary.byInterest) {
          summary.byInterest[interestType as keyof typeof summary.byInterest]++;
        }
      });
    });
    
    return summary;
  } catch (error) {
    console.error('Error getting waitlist summary:', error);
    return {
      totalUsers: 0,
      byTimeSlot: { '11AM': 0, '2PM': 0, '5PM': 0 },
      byGender: { male: 0, female: 0, 'non-binary': 0 },
      byInterest: { deep_thinking: 0, spiritual_growth: 0, new_activities: 0, community_service: 0 }
    };
  }
}

async function getSystemHealth() {
  try {
    const supabase = await dbAdmin.getClient();
    
    // Check critical system components
    const [
      { count: locationCount },
      { count: sparkCount },
      { count: activeCircles },
      { count: recentErrors }
    ] = await Promise.all([
      supabase.from('locations').select('*', { count: 'exact' }).limit(1),
      supabase.from('conversation_sparks').select('*', { count: 'exact' }).limit(1),
      supabase.from('circles').select('*', { count: 'exact' }).eq('status', 'active').limit(1),
      // Note: In a real system, you'd have an errors table
      Promise.resolve({ count: 0 })
    ].map(async (promise) => {
      const result = await promise;
      return { count: result.count || 0 };
    }));
    
    const health = {
      locations: {
        count: locationCount,
        status: locationCount >= 8 ? 'healthy' : 'warning'
      },
      sparks: {
        count: sparkCount,
        status: sparkCount >= 10 ? 'healthy' : 'warning'
      },
      activeCircles: {
        count: activeCircles,
        status: 'healthy'
      },
      errors: {
        count: recentErrors,
        status: recentErrors === 0 ? 'healthy' : 'warning'
      }
    };
    
    const overallStatus = Object.values(health).every(component => component.status === 'healthy') 
      ? 'healthy' 
      : 'warning';
    
    return {
      overall: overallStatus,
      components: health
    };
  } catch (error) {
    console.error('Error getting system health:', error);
    return {
      overall: 'error',
      components: {
        locations: { count: 0, status: 'error' },
        sparks: { count: 0, status: 'error' },
        activeCircles: { count: 0, status: 'error' },
        errors: { count: 0, status: 'unknown' }
      }
    };
  }
}