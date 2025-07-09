/**
 * Manual Matching Algorithm Trigger for Testing
 * Use this to test the cron job matching algorithm
 */

const BASE_URL = 'http://localhost:3000';

async function triggerMatching() {
  console.log('🚀 Triggering matching algorithm...');
  console.log(`📍 URL: ${BASE_URL}/api/cron/matching`);
  
  // Add timeout to prevent hanging
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
  
  try {
    console.log('📡 Sending request...');
    const response = await fetch(`${BASE_URL}/api/cron/matching`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log(`📨 Response status: ${response.status}`);
    
    const text = await response.text();
    console.log('📄 Raw response:', text);
    
    let result;
    try {
      result = JSON.parse(text);
    } catch (e) {
      console.error('❌ Failed to parse JSON response');
      console.error('Response was:', text);
      return;
    }
    
    if (result.success) {
      console.log('✅ Matching algorithm completed successfully!');
      console.log(`⏰ Processed at: ${result.processedAt}`);
      
      if (result.results && result.results.length > 0) {
        console.log('\n📊 Results:');
        result.results.forEach(slotResult => {
          console.log(`\n   ${slotResult.slot}:00 Slot:`);
          console.log(`     Total users: ${slotResult.totalUsers}`);
          console.log(`     Circles created: ${slotResult.circlesCreated}`);
          console.log(`     Users matched: ${slotResult.usersMatched}`);
          console.log(`     Unmatched users: ${slotResult.unmatchedUsers}`);
          if (slotResult.circleIds) {
            console.log(`     Circle IDs: ${slotResult.circleIds.join(', ')}`);
          }
        });
      } else {
        console.log('ℹ️  No slots processed (not at deadline time)');
        console.log('💡 Since APP_TIME_OFFSET is set to 10, the matching should process the 11AM slot');
      }
    } else {
      console.log('❌ Matching algorithm failed:');
      console.log(result.error);
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('❌ Request timed out after 30 seconds');
      console.error('💡 Make sure your dev server is running: npm run dev');
    } else {
      console.error('❌ Error triggering matching:', error.message);
      console.error('💡 Common issues:');
      console.error('   - Is the dev server running? (npm run dev)');
      console.error('   - Is the server running on port 3000?');
      console.error('   - Check the terminal running npm run dev for errors');
    }
  }
  
  process.exit(0);
}

// Check if fetch is available (Node 18+)
if (typeof fetch === 'undefined') {
  console.error('❌ This script requires Node.js 18 or higher');
  console.error('💡 Your Node version:', process.version);
  console.error('💡 To upgrade: brew upgrade node');
  process.exit(1);
}

// Run the trigger
triggerMatching();