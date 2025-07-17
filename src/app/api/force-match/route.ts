import { NextRequest, NextResponse } from 'next/server';
import { getCurrentPSTTime, getSlotsReadyForMatching, getTimeZoneInfo } from '@/lib/time';
import { executeMatchingProcess } from '@/lib/matching/algorithm';
import { 
  MatchingSlotResult, 
  MatchingApiResponse,
  createApiError,
  createApiSuccess 
} from '@/lib/database/types';

export async function GET(request: NextRequest) {
  try {
    // Get current PST time using centralized time system
    const pstTime = getCurrentPSTTime();
    const timeZoneInfo = getTimeZoneInfo();
    
    console.log(`🔄 FORCE MATCHING: Simulating cron job at ${pstTime.toISOString()} (APP_TIME_OFFSET: ${timeZoneInfo.offset})`);
    
    // Get slots ready for matching using centralized time system
    // This simulates the real cron job behavior
    const slotsReadyForMatching = getSlotsReadyForMatching(pstTime);
    
    if (slotsReadyForMatching.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No slots ready for matching at current time',
        currentTime: pstTime.toISOString(),
        timeInfo: timeZoneInfo,
        hint: 'Slots are processed 1 hour before each event (10 AM for 11 AM slot, 1 PM for 2 PM slot, 4 PM for 5 PM slot)'
      });
    }
    
    console.log(`📅 Processing ${slotsReadyForMatching.length} slots ready for matching:`);
    slotsReadyForMatching.forEach(slot => {
      console.log(`   - ${slot.hour}:00 slot (deadline reached)`);
    });
    
    const results: MatchingSlotResult[] = [];
    
    // Process each slot ready for matching using our new age+gender algorithm
    for (const slot of slotsReadyForMatching) {
      console.log(`\n⏰ Processing ${slot.hour}:00 slot using age+gender algorithm...`);
      
      const slotResponse = await executeMatchingProcess(slot);
      if (slotResponse.success && slotResponse.data) {
        results.push(slotResponse.data);
        console.log(`✅ Successfully processed ${slot.hour}:00 slot:`);
        console.log(`   - Total users: ${slotResponse.data.totalUsers}`);
        console.log(`   - Circles created: ${slotResponse.data.circlesCreated}`);
        console.log(`   - Users matched: ${slotResponse.data.usersMatched}`);
        console.log(`   - Unmatched: ${slotResponse.data.unmatchedUsers}`);
      } else {
        console.error(`❌ Failed to process slot ${slot.hour}:00:`, slotResponse.error);
        results.push({
          slot: slot.hour,
          totalUsers: 0,
          circlesCreated: 0,
          usersMatched: 0,
          unmatchedUsers: 0,
          circleIds: []
        });
      }
    }
    
    const response: MatchingApiResponse = {
      success: true,
      processedAt: pstTime.toISOString(),
      results
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('❌ Force match error:', error);
    const errorResponse: MatchingApiResponse = {
      success: false,
      processedAt: getCurrentPSTTime().toISOString(),
      results: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// Allow POST for consistency with cron job
export async function POST(request: NextRequest) {
  return GET(request);
}