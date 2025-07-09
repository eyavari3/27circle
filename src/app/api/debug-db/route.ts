import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServiceClient();
    
    // Check locations
    const { data: locations, error: locError } = await supabase
      .from('locations')
      .select('*');
    
    // Check conversation sparks
    const { data: sparks, error: sparkError } = await supabase
      .from('conversation_sparks')
      .select('*');
    
    // Check waitlist
    const { data: waitlist, error: waitlistError } = await supabase
      .from('waitlist_entries')
      .select('*')
      .limit(5);
    
    // Check circles
    const { data: circles, error: circleError } = await supabase
      .from('circles')
      .select('*');
    
    // Check circle members
    const { data: circleMembers, error: membersError } = await supabase
      .from('circle_members')
      .select('*');
    
    return NextResponse.json({
      locations: {
        count: locations?.length || 0,
        data: locations || [],
        error: locError?.message
      },
      sparks: {
        count: sparks?.length || 0,
        data: sparks || [],
        error: sparkError?.message
      },
      waitlist: {
        count: waitlist?.length || 0,
        data: waitlist || [],
        error: waitlistError?.message
      },
      circles: {
        count: circles?.length || 0,
        data: circles || [],
        error: circleError?.message
      },
      circleMembers: {
        count: circleMembers?.length || 0,
        data: circleMembers || [],
        error: membersError?.message
      }
    });
    
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}