/**
 * Comprehensive Matching System Verification
 * This script validates every component of the matching system
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Create Supabase client with service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, type = 'info') {
  const prefix = {
    info: `${colors.blue}ℹ️`,
    success: `${colors.green}✅`,
    error: `${colors.red}❌`,
    warning: `${colors.yellow}⚠️`,
    debug: `${colors.cyan}🔍`
  };
  console.log(`${prefix[type]} ${message}${colors.reset}`);
}

async function verifyMatchingSystem() {
  console.log(`${colors.bright}========================================`);
  console.log(`   MATCHING SYSTEM VERIFICATION REPORT`);
  console.log(`========================================${colors.reset}\n`);

  let allChecksPass = true;
  const report = {
    environment: {},
    database: {},
    data: {},
    algorithm: {},
    issues: []
  };

  // 1. ENVIRONMENT CHECKS
  log('CHECKING ENVIRONMENT VARIABLES', 'info');
  
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      log(`${envVar}: Set ✓`, 'success');
      report.environment[envVar] = 'Set';
    } else {
      log(`${envVar}: Missing`, 'error');
      report.environment[envVar] = 'Missing';
      allChecksPass = false;
      report.issues.push(`Missing environment variable: ${envVar}`);
    }
  }

  // 2. DATABASE CONNECTION
  console.log('\n' + colors.bright + 'CHECKING DATABASE CONNECTION' + colors.reset);
  
  try {
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    if (error) throw error;
    log('Database connection: OK', 'success');
    report.database.connection = 'OK';
  } catch (error) {
    log(`Database connection: FAILED - ${error.message}`, 'error');
    report.database.connection = 'FAILED';
    report.issues.push(`Database connection failed: ${error.message}`);
    allChecksPass = false;
    return report;
  }

  // 3. TABLE STRUCTURE CHECKS
  console.log('\n' + colors.bright + 'CHECKING TABLE STRUCTURES' + colors.reset);
  
  const tables = ['users', 'waitlist_entries', 'circles', 'circle_members', 'locations', 'conversation_sparks'];
  
  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('*').limit(1);
      if (error) throw error;
      log(`Table '${table}': Exists ✓`, 'success');
      report.database[`table_${table}`] = 'Exists';
    } catch (error) {
      log(`Table '${table}': Missing or inaccessible`, 'error');
      report.database[`table_${table}`] = 'Missing/Inaccessible';
      report.issues.push(`Table '${table}' is missing or inaccessible`);
      allChecksPass = false;
    }
  }

  // 4. DATA INTEGRITY CHECKS
  console.log('\n' + colors.bright + 'CHECKING DATA INTEGRITY' + colors.reset);
  
  // Check waitlist entries
  const { data: waitlistEntries, error: waitlistError } = await supabase
    .from('waitlist_entries')
    .select('time_slot, user_id')
    .order('time_slot');
    
  if (waitlistError) {
    log('Cannot read waitlist entries', 'error');
    report.issues.push('Cannot read waitlist entries');
    allChecksPass = false;
  } else {
    log(`Total waitlist entries: ${waitlistEntries.length}`, 'info');
    report.data.totalWaitlistEntries = waitlistEntries.length;
    
    // Group by time slot
    const timeSlotGroups = waitlistEntries.reduce((acc, entry) => {
      const slot = new Date(entry.time_slot).toISOString();
      acc[slot] = (acc[slot] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n' + colors.cyan + 'Waitlist Distribution:' + colors.reset);
    for (const [slot, count] of Object.entries(timeSlotGroups)) {
      const date = new Date(slot);
      const pstTime = date.toLocaleString('en-US', { timeZone: 'America/Los_Angeles', hour: '2-digit', minute: '2-digit' });
      log(`  ${slot} (${pstTime} PST): ${count} users`, 'debug');
    }
    report.data.timeSlotDistribution = timeSlotGroups;
  }

  // Check locations
  const { count: locationCount } = await supabase
    .from('locations')
    .select('*', { count: 'exact', head: true });
    
  log(`Available locations: ${locationCount || 0}`, 'info');
  report.data.locationCount = locationCount || 0;
  
  if (!locationCount || locationCount === 0) {
    log('No locations available for circles', 'error');
    report.issues.push('No locations available');
    allChecksPass = false;
  }

  // Check conversation sparks
  const { count: sparkCount } = await supabase
    .from('conversation_sparks')
    .select('*', { count: 'exact', head: true });
    
  log(`Available conversation sparks: ${sparkCount || 0}`, 'info');
  report.data.sparkCount = sparkCount || 0;
  
  if (!sparkCount || sparkCount === 0) {
    log('No conversation sparks available', 'error');
    report.issues.push('No conversation sparks available');
    allChecksPass = false;
  }

  // 5. MATCHING ALGORITHM SIMULATION
  console.log('\n' + colors.bright + 'SIMULATING MATCHING ALGORITHM' + colors.reset);
  
  // Get current PST time
  const now = new Date();
  const pstTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
  log(`Current PST time: ${pstTime.toLocaleString()}`, 'info');
  
  // Simulate time slot generation (same logic as matching algorithm)
  const today = new Date(pstTime);
  today.setHours(0, 0, 0, 0);
  
  const testSlot = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 0, 0);
  const testSlotISO = testSlot.toISOString();
  
  log(`Test slot (11 AM PST): ${testSlot.toString()}`, 'debug');
  log(`Test slot ISO: ${testSlotISO}`, 'debug');
  
  // Check if any waitlist entries match
  const { data: matchingEntries, error: matchError } = await supabase
    .from('waitlist_entries')
    .select('user_id')
    .eq('time_slot', testSlotISO);
    
  if (matchError) {
    log('Error checking time slot matches', 'error');
    report.issues.push('Cannot match time slots');
    allChecksPass = false;
  } else {
    log(`Entries matching 11 AM slot: ${matchingEntries?.length || 0}`, 'info');
    report.algorithm.matching11AMEntries = matchingEntries?.length || 0;
    
    if (matchingEntries?.length === 0 && waitlistEntries?.length > 0) {
      log('Time slot mismatch detected!', 'warning');
      report.issues.push('Time slot format mismatch between algorithm and database');
      
      // Show what we're looking for vs what exists
      const sampleEntry = waitlistEntries[0];
      console.log('\n' + colors.yellow + 'Debugging time mismatch:' + colors.reset);
      log(`  Algorithm looks for: ${testSlotISO}`, 'debug');
      log(`  Database contains: ${sampleEntry.time_slot}`, 'debug');
      log(`  Match: ${testSlotISO === new Date(sampleEntry.time_slot).toISOString()}`, 'debug');
    }
  }

  // 6. CHECK EXISTING CIRCLES
  console.log('\n' + colors.bright + 'CHECKING EXISTING CIRCLES' + colors.reset);
  
  const { data: circles, error: circleError } = await supabase
    .from('circles')
    .select('id, time_slot, status, location_id, conversation_spark_id')
    .order('created_at', { ascending: false })
    .limit(5);
    
  if (!circleError && circles) {
    log(`Total circles in database: ${circles.length}`, 'info');
    report.data.recentCircles = circles.length;
    
    if (circles.length > 0) {
      console.log('\n' + colors.cyan + 'Recent circles:' + colors.reset);
      circles.forEach(circle => {
        log(`  ${circle.id}: ${circle.time_slot} - ${circle.status}`, 'debug');
      });
    }
  }

  // 7. FINAL REPORT
  console.log('\n' + colors.bright + '========================================' + colors.reset);
  console.log(colors.bright + '           VERIFICATION SUMMARY' + colors.reset);
  console.log(colors.bright + '========================================' + colors.reset);
  
  if (allChecksPass) {
    console.log('\n' + colors.green + colors.bright + '✅ ALL CHECKS PASSED!' + colors.reset);
    console.log('\nThe matching system is properly configured and ready to use.');
  } else {
    console.log('\n' + colors.red + colors.bright + '❌ ISSUES FOUND!' + colors.reset);
    console.log('\nThe following issues need to be resolved:');
    report.issues.forEach((issue, index) => {
      console.log(`${colors.red}${index + 1}. ${issue}${colors.reset}`);
    });
  }

  // 8. RECOMMENDATIONS
  if (!allChecksPass) {
    console.log('\n' + colors.yellow + colors.bright + 'RECOMMENDATIONS:' + colors.reset);
    
    if (report.issues.includes('Time slot format mismatch between algorithm and database')) {
      console.log(`${colors.yellow}• Update waitlist entries to match the algorithm's timezone expectations${colors.reset}`);
      console.log(`${colors.yellow}• Use the following SQL to fix timestamps:${colors.reset}`);
      console.log(`  UPDATE waitlist_entries SET time_slot = '2025-07-09 11:00:00-07'::timestamptz WHERE ...`);
    }
    
    if (report.issues.includes('No locations available')) {
      console.log(`${colors.yellow}• Add locations to the locations table${colors.reset}`);
    }
    
    if (report.issues.includes('No conversation sparks available')) {
      console.log(`${colors.yellow}• Add conversation sparks to the conversation_sparks table${colors.reset}`);
    }
  }

  return report;
}

// Run verification
verifyMatchingSystem()
  .then(report => {
    console.log('\n' + colors.cyan + 'Full report saved to: matching-system-report.json' + colors.reset);
    require('fs').writeFileSync('matching-system-report.json', JSON.stringify(report, null, 2));
  })
  .catch(error => {
    console.error(colors.red + 'Verification failed:', error.message + colors.reset);
  });