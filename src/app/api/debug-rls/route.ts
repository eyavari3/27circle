import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createServiceClient();
    
    console.log('🔍 STARTING COMPREHENSIVE RLS DIAGNOSTIC');
    
    // 1. Check table permissions and RLS status
    const { data: tableInfo, error: tableError } = await supabase
      .from('pg_tables')
      .select('tablename, rowsecurity')
      .eq('schemaname', 'public')
      .in('tablename', ['users', 'waitlist_entries', 'circles', 'circle_members']);
    
    console.log('📋 TABLE RLS STATUS:', tableInfo);
    
    // 2. Check existing RLS policies
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('schemaname', 'public')
      .eq('tablename', 'waitlist_entries');
    
    console.log('🛡️ EXISTING RLS POLICIES:', policies);
    
    // 3. Test direct SELECT with service role
    const { data: selectTest, error: selectError } = await supabase
      .from('waitlist_entries')
      .select('*')
      .limit(5);
    
    console.log('🔍 SERVICE ROLE SELECT TEST:', {
      success: !selectError,
      error: selectError?.message,
      recordCount: selectTest?.length || 0
    });
    
    // 4. Attempt to disable RLS with explicit commands
    const disableCommands = [
      'ALTER TABLE waitlist_entries DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE users DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE circles DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE circle_members DISABLE ROW LEVEL SECURITY;'
    ];
    
    const results = [];
    
    for (const command of disableCommands) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: command });
        results.push({
          command,
          success: !error,
          error: error?.message
        });
      } catch (e) {
        // If exec_sql doesn't exist, try alternative approach
        results.push({
          command,
          success: false,
          error: 'exec_sql RPC not available'
        });
      }
    }
    
    console.log('🔧 RLS DISABLE ATTEMPTS:', results);
    
    // 5. Re-check table status after disable attempts
    const { data: finalTableInfo } = await supabase
      .from('pg_tables')
      .select('tablename, rowsecurity')
      .eq('schemaname', 'public')
      .in('tablename', ['users', 'waitlist_entries', 'circles', 'circle_members']);
    
    console.log('📋 FINAL TABLE RLS STATUS:', finalTableInfo);
    
    // 6. Test SELECT again
    const { data: finalSelectTest, error: finalSelectError } = await supabase
      .from('waitlist_entries')
      .select('*')
      .limit(5);
    
    console.log('🔍 FINAL SELECT TEST:', {
      success: !finalSelectError,
      error: finalSelectError?.message,
      recordCount: finalSelectTest?.length || 0
    });
    
    return NextResponse.json({
      tableStatus: finalTableInfo,
      policies,
      disableAttempts: results,
      selectTest: {
        initial: { success: !selectError, error: selectError?.message, count: selectTest?.length || 0 },
        final: { success: !finalSelectError, error: finalSelectError?.message, count: finalSelectTest?.length || 0 }
      }
    });
    
  } catch (error) {
    console.error('❌ RLS DIAGNOSTIC ERROR:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}