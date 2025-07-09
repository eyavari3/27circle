import { NextRequest, NextResponse } from 'next/server';
import { getCurrentPSTTime } from '@/lib/time';
import { logger } from '@/lib/monitoring/logger';

/**
 * Comprehensive system test endpoint
 * Tests all major components of the 27 Circle system
 */
export async function POST(request: NextRequest) {
  const testStartTime = Date.now();
  
  logger.system.info('Starting comprehensive system test');
  
  try {
    const results = {
      timestamp: getCurrentPSTTime().toISOString(),
      tests: [] as any[],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        duration: 0
      }
    };
    
    // Test 1: Health Check
    results.tests.push(await testHealthCheck());
    
    // Test 2: Database Operations
    results.tests.push(await testDatabaseOperations());
    
    // Test 3: Time Management
    results.tests.push(await testTimeManagement());
    
    // Test 4: Monitoring Dashboard
    results.tests.push(await testMonitoringDashboard());
    
    // Test 5: Matching Algorithm (simulated)
    results.tests.push(await testMatchingAlgorithm());
    
    // Calculate summary
    results.summary.total = results.tests.length;
    results.summary.passed = results.tests.filter(t => t.status === 'passed').length;
    results.summary.failed = results.tests.filter(t => t.status === 'failed').length;
    results.summary.duration = Date.now() - testStartTime;
    
    const overallStatus = results.summary.failed === 0 ? 'passed' : 'failed';
    
    logger.system.info('Comprehensive system test completed', {
      status: overallStatus,
      duration: results.summary.duration,
      passed: results.summary.passed,
      failed: results.summary.failed
    });
    
    return NextResponse.json({
      success: overallStatus === 'passed',
      overallStatus,
      ...results
    });
    
  } catch (error) {
    logger.system.error('Comprehensive test failed', error as Error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: getCurrentPSTTime().toISOString()
    }, { status: 500 });
  }
}

async function testHealthCheck() {
  const testStart = Date.now();
  
  try {
    const response = await fetch('http://localhost:3000/api/health');
    const data = await response.json();
    
    const passed = response.ok && data.status === 'healthy';
    
    return {
      name: 'Health Check',
      status: passed ? 'passed' : 'failed',
      duration: Date.now() - testStart,
      details: {
        httpStatus: response.status,
        healthStatus: data.status,
        checks: data.checks
      }
    };
  } catch (error) {
    return {
      name: 'Health Check',
      status: 'failed',
      duration: Date.now() - testStart,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function testDatabaseOperations() {
  const testStart = Date.now();
  
  try {
    const response = await fetch('http://localhost:3000/api/debug-db');
    const data = await response.json();
    
    const hasLocations = data.locations?.count > 0;
    const hasSparks = data.sparks?.count > 0;
    const hasWaitlist = data.waitlist?.count > 0;
    
    const passed = response.ok && hasLocations && hasSparks && hasWaitlist;
    
    return {
      name: 'Database Operations',
      status: passed ? 'passed' : 'failed',
      duration: Date.now() - testStart,
      details: {
        locations: data.locations?.count || 0,
        sparks: data.sparks?.count || 0,
        waitlist: data.waitlist?.count || 0
      }
    };
  } catch (error) {
    return {
      name: 'Database Operations',
      status: 'failed',
      duration: Date.now() - testStart,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function testTimeManagement() {
  const testStart = Date.now();
  
  try {
    const currentTime = getCurrentPSTTime();
    const isValidTime = currentTime instanceof Date && !isNaN(currentTime.getTime());
    const isReasonableTime = Math.abs(currentTime.getTime() - Date.now()) < 24 * 60 * 60 * 1000; // Within 24 hours
    
    const passed = isValidTime && isReasonableTime;
    
    return {
      name: 'Time Management',
      status: passed ? 'passed' : 'failed',
      duration: Date.now() - testStart,
      details: {
        currentTime: currentTime.toISOString(),
        isValidTime,
        isReasonableTime
      }
    };
  } catch (error) {
    return {
      name: 'Time Management',
      status: 'failed',
      duration: Date.now() - testStart,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function testMonitoringDashboard() {
  const testStart = Date.now();
  
  try {
    const response = await fetch('http://localhost:3000/api/monitoring/dashboard');
    const data = await response.json();
    
    const hasValidStructure = data.success && data.dailyStats && data.systemHealth;
    const isHealthy = data.systemHealth?.overall === 'healthy';
    
    const passed = response.ok && hasValidStructure && isHealthy;
    
    return {
      name: 'Monitoring Dashboard',
      status: passed ? 'passed' : 'failed',
      duration: Date.now() - testStart,
      details: {
        success: data.success,
        systemHealth: data.systemHealth?.overall,
        dailyStats: data.dailyStats
      }
    };
  } catch (error) {
    return {
      name: 'Monitoring Dashboard',
      status: 'failed',
      duration: Date.now() - testStart,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function testMatchingAlgorithm() {
  const testStart = Date.now();
  
  try {
    // Test with current time (should return results indicating no processing needed)
    const response = await fetch('http://localhost:3000/api/cron/matching', {
      method: 'POST'
    });
    const data = await response.json();
    
    const hasValidStructure = data.success !== undefined && Array.isArray(data.results);
    const validResponse = response.ok && hasValidStructure;
    
    return {
      name: 'Matching Algorithm',
      status: validResponse ? 'passed' : 'failed',
      duration: Date.now() - testStart,
      details: {
        success: data.success,
        processedAt: data.processedAt,
        resultsCount: data.results?.length || 0,
        results: data.results
      }
    };
  } catch (error) {
    return {
      name: 'Matching Algorithm',
      status: 'failed',
      duration: Date.now() - testStart,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Use POST to run comprehensive tests',
    endpoints: {
      health: '/api/health',
      dashboard: '/api/monitoring/dashboard',
      matching: '/api/cron/matching',
      debug: '/api/debug-db'
    }
  });
}