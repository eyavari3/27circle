import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('Environment variables:');
    console.log('SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING');
    console.log('SERVICE_KEY:', serviceKey ? 'SET' : 'MISSING');
    
    if (!supabaseUrl || !serviceKey) {
      throw new Error('Missing environment variables');
    }
    
    // Create Supabase service client using our helper
    const supabase = await createServiceClient();
    
    // Test simple query
    console.log('Testing simple query...');
    const { data, error } = await supabase
      .from('users')
      .select('count', { count: 'exact' })
      .limit(1);
    
    if (error) {
      console.error('Database error:', error);
      throw error;
    }
    
    console.log('Database query successful:', data);
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      userCount: data?.[0]?.count || 0,
      environment: {
        supabaseUrl: supabaseUrl.substring(0, 30) + '...',
        serviceKeyLength: serviceKey.length
      }
    });
    
  } catch (error) {
    console.error('❌ Database test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
}