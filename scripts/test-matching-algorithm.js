/**
 * Comprehensive Matching Algorithm Test Suite
 * Tests edge cases, gender balance, interest matching, and group sizes
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Test cases for different scenarios
const MATCHING_TEST_CASES = [
  {
    name: "Perfect Groups of 4",
    userCount: 16,
    expectedGroups: 4,
    expectedGroupSizes: [4, 4, 4, 4]
  },
  {
    name: "Mixed Group Sizes",
    userCount: 14,
    expectedGroups: 4,
    expectedGroupSizes: [4, 4, 3, 3]
  },
  {
    name: "Some Groups of 2",
    userCount: 10,
    expectedGroups: 3,
    expectedGroupSizes: [4, 3, 3]
  },
  {
    name: "Edge Case: 1 Leftover",
    userCount: 13,
    expectedGroups: 3,
    expectedGroupSizes: [4, 4, 4],
    expectedLeftover: 1
  },
  {
    name: "Minimum Viable",
    userCount: 2,
    expectedGroups: 1,
    expectedGroupSizes: [2]
  },
  {
    name: "Below Minimum",
    userCount: 1,
    expectedGroups: 0,
    expectedGroupSizes: [],
    expectedLeftover: 1
  }
];

// Advanced matching algorithm with interest and gender balance
function advancedMatchingAlgorithm(users) {
  console.log(`\n🧮 Running advanced matching for ${users.length} users...`);
  
  // Step 1: Analyze user interests
  const interestGroups = {};
  users.forEach(user => {
    const interests = user.interests || [];
    const interestKey = interests.sort().join(',');
    if (!interestGroups[interestKey]) {
      interestGroups[interestKey] = [];
    }
    interestGroups[interestKey].push(user);
  });
  
  console.log('   Interest distribution:');
  Object.entries(interestGroups).forEach(([interests, userList]) => {
    console.log(`     ${interests || 'no interests'}: ${userList.length} users`);
  });
  
  // Step 2: Create balanced groups
  const circles = [];
  let remainingUsers = [...users];
  
  // Try to create groups of 4 first
  while (remainingUsers.length >= 4) {
    const group = createBalancedGroup(remainingUsers, 4);
    circles.push(group);
    remainingUsers = remainingUsers.filter(user => !group.includes(user));
  }
  
  // Then groups of 3
  while (remainingUsers.length >= 3) {
    const group = createBalancedGroup(remainingUsers, 3);
    circles.push(group);
    remainingUsers = remainingUsers.filter(user => !group.includes(user));
  }
  
  // Finally groups of 2
  while (remainingUsers.length >= 2) {
    const group = createBalancedGroup(remainingUsers, 2);
    circles.push(group);
    remainingUsers = remainingUsers.filter(user => !group.includes(user));
  }
  
  return {
    circles,
    unmatchedUsers: remainingUsers
  };
}

// Helper function to create a balanced group
function createBalancedGroup(availableUsers, targetSize) {
  if (availableUsers.length < targetSize) {
    return availableUsers.slice(0, targetSize);
  }
  
  // Strategy: Try to balance gender and interests
  const group = [];
  const remaining = [...availableUsers];
  
  // First, try to get gender diversity
  const genderCounts = { male: 0, female: 0, 'non-binary': 0 };
  
  for (let i = 0; i < targetSize; i++) {
    let bestUser = null;
    let bestScore = -1;
    
    remaining.forEach(user => {
      let score = 0;
      
      // Prefer gender balance
      const currentGenderCount = genderCounts[user.gender] || 0;
      const totalSelected = group.length;
      const maxGenderCount = Math.ceil(targetSize / 3);
      
      if (currentGenderCount < maxGenderCount) {
        score += 10;
      }
      
      // Prefer interest diversity
      const userInterests = new Set(user.interests || []);
      const groupInterests = new Set();
      group.forEach(member => {
        (member.interests || []).forEach(interest => groupInterests.add(interest));
      });
      
      const sharedInterests = [...userInterests].filter(interest => groupInterests.has(interest));
      const newInterests = [...userInterests].filter(interest => !groupInterests.has(interest));
      
      score += newInterests.length * 5; // Bonus for new interests
      score += sharedInterests.length * 2; // Small bonus for shared interests
      
      // Random factor to avoid deterministic behavior
      score += Math.random() * 3;
      
      if (score > bestScore) {
        bestScore = score;
        bestUser = user;
      }
    });
    
    if (bestUser) {
      group.push(bestUser);
      genderCounts[bestUser.gender] = (genderCounts[bestUser.gender] || 0) + 1;
      const userIndex = remaining.indexOf(bestUser);
      remaining.splice(userIndex, 1);
    }
  }
  
  return group;
}

// Test the matching algorithm
async function testMatchingAlgorithm(testCase) {
  console.log(`\n🧪 Testing: ${testCase.name}`);
  console.log(`   Users: ${testCase.userCount}`);
  console.log(`   Expected groups: ${testCase.expectedGroups}`);
  console.log(`   Expected sizes: [${testCase.expectedGroupSizes.join(', ')}]`);
  
  // Create test users with diverse profiles
  const testUsers = [];
  for (let i = 0; i < testCase.userCount; i++) {
    const userId = `test-user-${i + 1}`;
    const genders = ['male', 'female', 'non-binary'];
    const gender = genders[i % genders.length];
    
    // Create diverse interest combinations
    const allInterests = ['deep_thinking', 'spiritual_growth', 'new_activities', 'community_service'];
    const interests = [];
    
    if (i < testCase.userCount * 0.3) {
      interests.push('deep_thinking', 'new_activities');
    } else if (i < testCase.userCount * 0.6) {
      interests.push('spiritual_growth', 'community_service');
    } else if (i < testCase.userCount * 0.8) {
      interests.push(...allInterests);
    } else {
      interests.push(allInterests[i % allInterests.length]);
    }
    
    testUsers.push({
      user_id: userId,
      full_name: `Test User ${i + 1}`,
      gender,
      interests
    });
  }
  
  // Run the matching algorithm
  const result = advancedMatchingAlgorithm(testUsers);
  
  // Validate results
  const actualGroups = result.circles.length;
  const actualGroupSizes = result.circles.map(circle => circle.length).sort((a, b) => b - a);
  const actualUnmatched = result.unmatchedUsers.length;
  
  console.log(`\n📊 Results:`);
  console.log(`   Actual groups: ${actualGroups}`);
  console.log(`   Actual sizes: [${actualGroupSizes.join(', ')}]`);
  console.log(`   Unmatched: ${actualUnmatched}`);
  
  // Detailed group analysis
  result.circles.forEach((circle, index) => {
    console.log(`\n   Group ${index + 1} (${circle.length} members):`);
    const genderCount = {};
    const interestCount = {};
    
    circle.forEach(user => {
      genderCount[user.gender] = (genderCount[user.gender] || 0) + 1;
      user.interests.forEach(interest => {
        interestCount[interest] = (interestCount[interest] || 0) + 1;
      });
      console.log(`     - ${user.full_name} (${user.gender}): ${user.interests.join(', ')}`);
    });
    
    console.log(`     Gender balance: ${Object.entries(genderCount).map(([g, c]) => `${g}:${c}`).join(', ')}`);
    console.log(`     Interest overlap: ${Object.entries(interestCount).map(([i, c]) => `${i}:${c}`).join(', ')}`);
  });
  
  // Validation
  const passed = 
    actualGroups === testCase.expectedGroups &&
    JSON.stringify(actualGroupSizes) === JSON.stringify(testCase.expectedGroupSizes) &&
    actualUnmatched === (testCase.expectedLeftover || 0);
  
  console.log(`\n${passed ? '✅ PASSED' : '❌ FAILED'}`);
  
  return {
    passed,
    actualGroups,
    actualGroupSizes,
    actualUnmatched,
    result
  };
}

// Test interest-based matching
async function testInterestMatching() {
  console.log('\n🎯 Testing Interest-Based Matching...');
  
  const testUsers = [
    { user_id: '1', full_name: 'Alice', gender: 'female', interests: ['deep_thinking', 'new_activities'] },
    { user_id: '2', full_name: 'Bob', gender: 'male', interests: ['deep_thinking', 'new_activities'] },
    { user_id: '3', full_name: 'Charlie', gender: 'non-binary', interests: ['spiritual_growth', 'community_service'] },
    { user_id: '4', full_name: 'Diana', gender: 'female', interests: ['spiritual_growth', 'community_service'] },
    { user_id: '5', full_name: 'Ethan', gender: 'male', interests: ['deep_thinking', 'spiritual_growth'] },
    { user_id: '6', full_name: 'Fiona', gender: 'female', interests: ['new_activities', 'community_service'] },
    { user_id: '7', full_name: 'Gabriel', gender: 'male', interests: ['deep_thinking', 'new_activities'] },
    { user_id: '8', full_name: 'Hannah', gender: 'female', interests: ['spiritual_growth', 'community_service'] }
  ];
  
  const result = advancedMatchingAlgorithm(testUsers);
  
  console.log('\nInterest matching analysis:');
  result.circles.forEach((circle, index) => {
    console.log(`\nGroup ${index + 1}:`);
    const allInterests = new Set();
    const sharedInterests = {};
    
    circle.forEach(user => {
      user.interests.forEach(interest => {
        allInterests.add(interest);
        sharedInterests[interest] = (sharedInterests[interest] || 0) + 1;
      });
    });
    
    const fullySharedInterests = Object.entries(sharedInterests)
      .filter(([_, count]) => count === circle.length)
      .map(([interest]) => interest);
    
    const partiallySharedInterests = Object.entries(sharedInterests)
      .filter(([_, count]) => count > 1 && count < circle.length)
      .map(([interest, count]) => `${interest}(${count})`);
    
    console.log(`   Fully shared: ${fullySharedInterests.join(', ') || 'none'}`);
    console.log(`   Partially shared: ${partiallySharedInterests.join(', ') || 'none'}`);
    console.log(`   Total unique interests: ${allInterests.size}`);
  });
}

// Test gender balance
async function testGenderBalance() {
  console.log('\n⚖️ Testing Gender Balance...');
  
  const testUsers = [
    { user_id: '1', full_name: 'Alice', gender: 'female', interests: ['deep_thinking'] },
    { user_id: '2', full_name: 'Bob', gender: 'male', interests: ['deep_thinking'] },
    { user_id: '3', full_name: 'Charlie', gender: 'male', interests: ['deep_thinking'] },
    { user_id: '4', full_name: 'Diana', gender: 'female', interests: ['deep_thinking'] },
    { user_id: '5', full_name: 'Ethan', gender: 'male', interests: ['deep_thinking'] },
    { user_id: '6', full_name: 'Fiona', gender: 'female', interests: ['deep_thinking'] },
    { user_id: '7', full_name: 'Gabriel', gender: 'male', interests: ['deep_thinking'] },
    { user_id: '8', full_name: 'Hannah', gender: 'female', interests: ['deep_thinking'] }
  ];
  
  const result = advancedMatchingAlgorithm(testUsers);
  
  console.log('\nGender balance analysis:');
  result.circles.forEach((circle, index) => {
    const genderCount = {};
    circle.forEach(user => {
      genderCount[user.gender] = (genderCount[user.gender] || 0) + 1;
    });
    
    const balance = Object.entries(genderCount)
      .map(([gender, count]) => `${gender}:${count}`)
      .join(', ');
    
    const maxGenderCount = Math.max(...Object.values(genderCount));
    const minGenderCount = Math.min(...Object.values(genderCount));
    const balanceScore = 1 - (maxGenderCount - minGenderCount) / circle.length;
    
    console.log(`   Group ${index + 1}: ${balance} (balance score: ${balanceScore.toFixed(2)})`);
  });
}

// Run all matching tests
async function runAllMatchingTests() {
  console.log('🔄 Running Comprehensive Matching Algorithm Tests\n');
  
  let passedTests = 0;
  let totalTests = 0;
  
  // Test all standard cases
  for (const testCase of MATCHING_TEST_CASES) {
    const result = await testMatchingAlgorithm(testCase);
    if (result.passed) passedTests++;
    totalTests++;
  }
  
  // Test interest-based matching
  await testInterestMatching();
  
  // Test gender balance
  await testGenderBalance();
  
  console.log(`\n📊 Test Results: ${passedTests}/${totalTests} passed`);
  console.log(`Success rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
}

// Export functions
module.exports = {
  advancedMatchingAlgorithm,
  testMatchingAlgorithm,
  testInterestMatching,
  testGenderBalance,
  runAllMatchingTests
};

// Run if called directly
if (require.main === module) {
  runAllMatchingTests().catch(console.error);
}