/**
 * Simple Matching System Verification
 * No external dependencies required
 */

const BASE_URL = 'http://localhost:3001';

// ANSI color codes
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
  console.log(`   MATCHING SYSTEM VERIFICATION`);
  console.log(`========================================${colors.reset}\n`);

  try {
    // 1. Check if server is running
    log('Checking if server is running...', 'info');
    
    try {
      const response = await fetch(`${BASE_URL}/api/cron/matching`);
      if (response.ok) {
        log('Server is running', 'success');
      } else {
        log('Server returned error status: ' + response.status, 'error');
        return;
      }
    } catch (error) {
      log('Server is not running. Start it with: npm run dev', 'error');
      return;
    }

    // 2. Run the matching algorithm
    log('\nTriggering matching algorithm...', 'info');
    
    const response = await fetch(`${BASE_URL}/api/cron/matching`, {
      method: 'GET'
    });
    
    const result = await response.json();
    
    if (!result.success) {
      log('Matching algorithm failed: ' + result.error, 'error');
      return;
    }
    
    log('Matching algorithm responded successfully', 'success');
    
    // 3. Analyze results
    console.log(`\n${colors.bright}RESULTS ANALYSIS:${colors.reset}`);
    
    if (result.results && result.results.length > 0) {
      result.results.forEach(slotResult => {
        console.log(`\n${colors.cyan}Time Slot: ${slotResult.slot}:00${colors.reset}`);
        
        if (slotResult.message) {
          log(`Message: ${slotResult.message}`, 'warning');
          
          if (slotResult.message === 'No users in waitlist') {
            console.log('\n' + colors.yellow + 'DIAGNOSIS: The matching algorithm cannot find waitlist entries.' + colors.reset);
            console.log(colors.yellow + 'Possible causes:' + colors.reset);
            console.log('1. Timezone mismatch between stored data and query');
            console.log('2. Row Level Security (RLS) blocking access');
            console.log('3. Wrong database/environment');
          }
        } else {
          log(`Total users: ${slotResult.totalUsers}`, 'info');
          log(`Circles created: ${slotResult.circlesCreated}`, 'info');
          log(`Users matched: ${slotResult.usersMatched}`, 'info');
          log(`Unmatched users: ${slotResult.unmatchedUsers}`, 'info');
          
          if (slotResult.circleIds && slotResult.circleIds.length > 0) {
            log(`Circle IDs: ${slotResult.circleIds.join(', ')}`, 'success');
            console.log('\n' + colors.green + colors.bright + '✅ MATCHING SYSTEM IS WORKING!' + colors.reset);
          } else if (slotResult.totalUsers > 0 && slotResult.circlesCreated > 0) {
            log('Circles were created but IDs not returned', 'warning');
            console.log('\n' + colors.yellow + 'DIAGNOSIS: Circle creation logic has an issue.' + colors.reset);
            console.log('Check the createCirclesInDatabase function for:');
            console.log('1. UUID generation issues');
            console.log('2. Database insert errors');
            console.log('3. Missing return statements');
          }
        }
      });
    } else {
      log('No time slots were processed', 'warning');
      console.log('\n' + colors.yellow + 'DIAGNOSIS: Not at a deadline time.' + colors.reset);
      console.log('The matching runs at 10:00, 13:00, and 16:00 PST');
      console.log('Current APP_TIME_OFFSET simulation may not match these times');
    }
    
    // 4. Check server logs
    console.log(`\n${colors.bright}NEXT STEPS:${colors.reset}`);
    console.log('1. Check the server console (where npm run dev is running) for detailed logs');
    console.log('2. Look for error messages about:');
    console.log('   - Database queries');
    console.log('   - UUID format errors');
    console.log('   - Missing tables or data');
    
  } catch (error) {
    log('Verification failed: ' + error.message, 'error');
  }
}

// Run verification
console.log('Starting verification...\n');
verifyMatchingSystem();