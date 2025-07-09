import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Use admin client to bypass RLS
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Force process all waitlist entries for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    console.log('🔄 Force matching all slots for today:', today.toISOString());
    
    // Get all waitlist entries for today
    const { data: waitlistEntries, error: waitlistError } = await adminClient
      .from('waitlist_entries')
      .select(`
        time_slot,
        user_id,
        users!inner(
          id,
          full_name,
          gender,
          user_interests(interest_type)
        )
      `)
      .gte('time_slot', today.toISOString())
      .lt('time_slot', tomorrow.toISOString());
    
    if (waitlistError) {
      return NextResponse.json({ 
        success: false, 
        error: `Failed to fetch waitlist: ${waitlistError.message}` 
      });
    }
    
    if (!waitlistEntries || waitlistEntries.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No waitlist entries found for today',
        searchRange: {
          from: today.toISOString(),
          to: tomorrow.toISOString()
        }
      });
    }
    
    // Group by time slot
    const slotGroups = waitlistEntries.reduce((acc, entry) => {
      const slotKey = entry.time_slot;
      if (!acc[slotKey]) acc[slotKey] = [];
      acc[slotKey].push(entry);
      return acc;
    }, {} as Record<string, any[]>);
    
    const results = [];
    
    for (const [slotTime, entries] of Object.entries(slotGroups)) {
      console.log(`\n📍 Processing ${entries.length} users for slot: ${slotTime}`);
      
      // Transform users for matching
      const usersForMatching = entries.map(entry => ({
        user_id: entry.user_id,
        full_name: entry.users.full_name,
        gender: entry.users.gender,
        interests: entry.users.user_interests?.map((ui: any) => ui.interest_type) || []
      }));
      
      // Create circles (groups of 4, then 3, then 2)
      const circles = [];
      let remaining = [...usersForMatching];
      
      while (remaining.length >= 4) {
        circles.push(remaining.splice(0, 4));
      }
      while (remaining.length >= 3) {
        circles.push(remaining.splice(0, 3));
      }
      while (remaining.length >= 2) {
        circles.push(remaining.splice(0, 2));
      }
      
      console.log(`📊 Created ${circles.length} circles, ${remaining.length} unmatched`);
      
      // Get available locations and sparks
      const { data: locations } = await adminClient
        .from('locations')
        .select('id, name');
      
      const { data: sparks } = await adminClient
        .from('conversation_sparks')
        .select('id, spark_text');
      
      // Create circles in database
      const createdCircles = [];
      
      for (let i = 0; i < circles.length; i++) {
        const circle = circles[i];
        const circleId = `circle-force-${new Date(slotTime).getHours()}h-${Date.now()}-${i}`;
        
        // Assign location and spark
        const locationIndex = i % (locations?.length || 1);
        const sparkIndex = (i * 3) % (sparks?.length || 1);
        
        const location = locations?.[locationIndex];
        const spark = sparks?.[sparkIndex];
        
        console.log(`🏢 Creating circle ${i + 1} at ${location?.name}`);
        
        // Insert circle
        const { error: circleError } = await adminClient
          .from('circles')
          .insert({
            id: circleId,
            time_slot: slotTime,
            location_id: location?.id,
            conversation_spark_id: spark?.id,
            status: 'active',
            created_at: new Date().toISOString()
          });
        
        if (circleError) {
          console.error(`❌ Error creating circle: ${circleError.message}`);
          continue;
        }
        
        // Add members
        const memberInserts = circle.map(user => ({
          circle_id: circleId,
          user_id: user.user_id,
          joined_at: new Date().toISOString()
        }));
        
        const { error: membersError } = await adminClient
          .from('circle_members')
          .insert(memberInserts);
        
        if (membersError) {
          console.error(`❌ Error adding members: ${membersError.message}`);
        } else {
          createdCircles.push({
            id: circleId,
            location: location?.name,
            spark: spark?.spark_text,
            members: circle.map(u => u.full_name)
          });
        }
      }
      
      results.push({
        slot: new Date(slotTime).toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit' 
        }),
        totalUsers: entries.length,
        circlesCreated: createdCircles.length,
        circles: createdCircles,
        unmatched: remaining.map(u => u.full_name)
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Force matching completed',
      results 
    });
    
  } catch (error) {
    console.error('❌ Force match error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}