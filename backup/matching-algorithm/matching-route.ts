import { NextRequest, NextResponse } from 'next/server';
import { getCurrentPSTTime, getSlotsReadyForMatching, getTimeZoneInfo } from '@/lib/time';
import { executeMatchingProcess } from '@/lib/matching/algorithm';
import { 
  MatchingSlotResult, 
  MatchingApiResponse,
  createApiError,
  createApiSuccess 
} from '@/lib/database/types';

export async function POST(request: NextRequest) {
  try {
    // Get current PST time using centralized time system
    const pstTime = getCurrentPSTTime();
    const timeZoneInfo = getTimeZoneInfo();
    
    console.log(`🔄 Running matching algorithm at ${pstTime.toISOString()} (APP_TIME_OFFSET: ${timeZoneInfo.offset})`);
    
    // Get slots ready for matching using centralized time system
    const slotsReadyForMatching = getSlotsReadyForMatching(pstTime);
    
    const results: MatchingSlotResult[] = [];
    
    // Process each slot ready for matching using bulletproof algorithm
    for (const slot of slotsReadyForMatching) {
      console.log(`⏰ Processing ${slot.hour}:00 slot at deadline`);
      
      const slotResponse = await executeMatchingProcess(slot);
      if (slotResponse.success && slotResponse.data) {
        results.push(slotResponse.data);
      } else {
        console.error(`❌ Failed to process slot ${slot.hour}:00:`, slotResponse.error);
        // Add error result to maintain consistent response structure
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
    console.error('❌ Matching algorithm error:', error);
    const errorResponse: MatchingApiResponse = {
      success: false,
      processedAt: getCurrentPSTTime().toISOString(),
      results: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// All matching logic has been moved to /src/lib/matching/algorithm.ts
// This keeps the API endpoint clean and focused on HTTP handling

// Allow GET for testing
export async function GET(request: NextRequest) {
  return POST(request);
}