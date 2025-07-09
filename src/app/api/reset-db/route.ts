import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServiceClient();
    
    console.log('🗑️ Clearing database...');
    
    // Clear all data in correct order (respecting foreign keys)
    await supabase.from('circle_members').delete().neq('circle_id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('circles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('waitlist_entries').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('user_interests').delete().neq('user_id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('conversation_sparks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('locations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    console.log('✅ Database cleared successfully');
    
    return NextResponse.json({ 
      success: true,
      message: 'Database cleared successfully'
    });
    
  } catch (error) {
    console.error('❌ Clear failed:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}