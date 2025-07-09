import { NextRequest, NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/database/client';
import { getCurrentPSTTime, getTimeZoneInfo } from '@/lib/time';

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Basic health check
    const healthResponse = await dbAdmin.healthCheck();
    
    if (!healthResponse.success) {
      return NextResponse.json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: healthResponse.error,
        checks: {
          database: 'failed'
        }
      }, { status: 503 });
    }
    
    // Get current time info
    const timeInfo = getTimeZoneInfo();
    
    // Get database statistics
    const stats = await getSystemStats();
    
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timeInfo,
      stats,
      checks: {
        database: 'healthy',
        locations: stats.locations > 0 ? 'healthy' : 'warning',
        sparks: stats.sparks > 0 ? 'healthy' : 'warning'
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      checks: {
        database: 'error'
      }
    }, { status: 500 });
  }
}

async function getSystemStats() {
  try {
    const supabase = await dbAdmin.getClient();
    
    const [
      { count: userCount },
      { count: waitlistCount },
      { count: circleCount },
      { count: locationCount },
      { count: sparkCount }
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact' }).limit(1),
      supabase.from('waitlist_entries').select('*', { count: 'exact' }).limit(1),
      supabase.from('circles').select('*', { count: 'exact' }).limit(1),
      supabase.from('locations').select('*', { count: 'exact' }).limit(1),
      supabase.from('conversation_sparks').select('*', { count: 'exact' }).limit(1)
    ].map(async (promise) => {
      const result = await promise;
      return { count: result.count || 0 };
    }));
    
    return {
      users: userCount,
      waitlist: waitlistCount,
      circles: circleCount,
      locations: locationCount,
      sparks: sparkCount
    };
  } catch (error) {
    console.error('Error getting system stats:', error);
    return {
      users: 0,
      waitlist: 0,
      circles: 0,
      locations: 0,
      sparks: 0
    };
  }
}