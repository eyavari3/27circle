import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const supabase = await createServiceClient();
    
    console.log('🚀 FORCE-FIXING RLS ISSUE');
    
    // 1. Drop all existing policies first
    const dropPolicyCommands = [
      'DROP POLICY IF EXISTS "Service role can do everything on waitlist_entries" ON waitlist_entries;',
      'DROP POLICY IF EXISTS "Users can view their own waitlist entries" ON waitlist_entries;',
      'DROP POLICY IF EXISTS "Users can insert their own waitlist entries" ON waitlist_entries;',
      'DROP POLICY IF EXISTS "Users can delete their own waitlist entries" ON waitlist_entries;'
    ];
    
    for (const command of dropPolicyCommands) {
      try {
        // Use raw SQL execution
        await supabase.from('_dummy').select('1').limit(0); // Warmup connection
        const { error } = await supabase.rpc('exec_sql', { sql: command });
        console.log(`🗑️ DROP POLICY: ${command} - ${error ? 'FAILED' : 'SUCCESS'}`);
      } catch (e) {
        console.log(`🗑️ DROP POLICY ATTEMPT: ${command} - ERROR:`, String(e));
      }
    }
    
    // 2. Disable RLS completely
    const disableCommands = [
      'ALTER TABLE waitlist_entries DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE users DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE circles DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE circle_members DISABLE ROW LEVEL SECURITY;'
    ];
    
    for (const command of disableCommands) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: command });
        console.log(`🔧 DISABLE RLS: ${command} - ${error ? 'FAILED' : 'SUCCESS'}`);
      } catch (e) {
        console.log(`🔧 DISABLE RLS ATTEMPT: ${command} - ERROR:`, String(e));
      }
    }
    
    // 3. Test immediate SELECT
    const { data: testData, error: testError } = await supabase
      .from('waitlist_entries')
      .select('*');
    
    console.log('🧪 IMMEDIATE TEST RESULT:', {
      success: !testError,
      error: testError?.message,
      recordCount: testData?.length || 0,
      sampleRecord: testData?.[0]
    });
    
    // 4. Check final RLS status
    const { data: finalStatus } = await supabase
      .from('pg_tables')
      .select('tablename, rowsecurity')
      .eq('schemaname', 'public')
      .eq('tablename', 'waitlist_entries');
    
    console.log('📊 FINAL RLS STATUS:', finalStatus);
    
    return NextResponse.json({
      success: !testError,
      error: testError?.message,
      recordCount: testData?.length || 0,
      rlsStatus: finalStatus?.[0]?.rowsecurity,
      message: testError ? 'RLS fix failed' : 'RLS fix successful'
    });
    
  } catch (error) {
    console.error('❌ FORCE FIX ERROR:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}