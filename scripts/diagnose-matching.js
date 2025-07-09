/**
 * Enhanced Matching System Diagnostic
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

async function diagnoseMatching() {
  console.log(`${colors.bright}========================================`);
  console.log(`   MATCHING SYSTEM DIAGNOSTIC`);
  console.log(`========================================${colors.reset}\n`);

  try {
    // 1. Test the endpoint
    log('Testing matching endpoint...', 'info');
    
    const response = await fetch(`${BASE_URL}/api/cron/matching`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    log(`Response status: ${response.status}`, 'debug');
    log(`Content-Type: ${response.headers.get('content-type')}`, 'debug');
    
    // Get raw response text
    const rawText = await response.text();
    
    // Check if it's HTML (error page)
    if (rawText.startsWith('<') || rawText.includes('<!DOCTYPE')) {
      log('Received HTML error page instead of JSON', 'error');
      
      // Try to extract error message from HTML
      const titleMatch = rawText.match(/<title>(.*?)<\/title>/);
      const bodyMatch = rawText.match(/<body>(.*?)<\/body>/s);
      
      if (titleMatch) {
        log(`Error page title: ${titleMatch[1]}`, 'error');
      }
      
      if (bodyMatch) {
        const bodyText = bodyMatch[1].replace(/<[^>]*>/g, '').trim();
        log(`Error message: ${bodyText}`, 'error');
      }
      
      console.log('\n' + colors.yellow + 'DIAGNOSIS:' + colors.reset);
      console.log('The API endpoint is returning an error page.');
      console.log('\nPossible causes:');
      console.log('1. Route file has syntax errors');
      console.log('2. Import errors in the route');
      console.log('3. Runtime errors when executing the route');
      
      console.log('\n' + colors.yellow + 'RECOMMENDED ACTIONS:' + colors.reset);
      console.log('1. Check the Next.js server console for error details');
      console.log('2. Look for red error messages about:');
      console.log('   - Module not found');
      console.log('   - Syntax errors');
      console.log('   - Type errors');
      console.log('3. Check if all imports in route.ts are correct');
      
      // Show first part of response for debugging
      console.log('\n' + colors.cyan + 'Raw response preview:' + colors.reset);
      console.log(rawText.substring(0, 500) + '...');
      
    } else {
      // Try to parse as JSON
      try {
        const result = JSON.parse(rawText);
        
        log('Received valid JSON response', 'success');
        console.log('\n' + colors.cyan + 'Response data:' + colors.reset);
        console.log(JSON.stringify(result, null, 2));
        
        // Analyze the response
        if (result.success) {
          log('API call successful', 'success');
          
          if (result.results && result.results.length > 0) {
            result.results.forEach(slot => {
              if (slot.circleIds && slot.circleIds.length > 0) {
                log(`✅ SYSTEM WORKING: ${slot.circleIds.length} circles created`, 'success');
              } else if (slot.totalUsers > 0) {
                log(`⚠️ PARTIAL SUCCESS: Found ${slot.totalUsers} users but no circles created`, 'warning');
              } else {
                log(`ℹ️ No users found for slot ${slot.slot}:00`, 'info');
              }
            });
          }
        } else {
          log('API returned error: ' + result.error, 'error');
        }
        
      } catch (parseError) {
        log('Failed to parse response as JSON', 'error');
        console.log('\n' + colors.cyan + 'Raw response:' + colors.reset);
        console.log(rawText);
      }
    }
    
  } catch (error) {
    log('Network error: ' + error.message, 'error');
    console.log('\n' + colors.yellow + 'Make sure:' + colors.reset);
    console.log('1. Next.js dev server is running (npm run dev)');
    console.log('2. Server is accessible at ' + BASE_URL);
  }
}

// Run diagnostic
diagnoseMatching();