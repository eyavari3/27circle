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
  },
  {
    name: "Perfect 40-Person Test (Stanford Demographics)",
    userCount: 40,
    expectedGroups: 11,
    expectedGroupSizes: [4, 4, 4, 4, 4, 4, 4, 4, 4, 2, 2]
  }
];

// Simple age+gender matching algorithm
function simpleMatchingAlgorithm(users) {
  console.log(`\n🧮 Running simple age+gender matching for ${users.length} users...`);
  
  // Calculate age and filter valid users
  const enhancedUsers = users
    .map(user => {
      const age = calculateAge(user.date_of_birth);
      const age_group = getAgeGroup(age);
      return {
        ...user,
        age,
        age_group
      };
    })
    .filter(user => 
      user.user_id && 
      user.full_name && 
      user.gender && 
      user.age_group &&
      ['male', 'female', 'non-binary'].includes(user.gender.toLowerCase())
    );
  
  if (enhancedUsers.length !== users.length) {
    console.log(`   Filtered out ${users.length - enhancedUsers.length} users (missing age/gender data)`);
  }
  
  // Create buckets: age_group + gender
  const buckets = {};
  enhancedUsers.forEach(user => {
    const bucketKey = `${user.age_group}-${user.gender.toLowerCase()}`;
    if (!buckets[bucketKey]) {
      buckets[bucketKey] = [];
    }
    buckets[bucketKey].push(user);
  });
  
  console.log('   User distribution by bucket:');
  Object.entries(buckets).forEach(([bucket, userList]) => {
    console.log(`     ${bucket}: ${userList.length} users`);
  });
  
  // Process each bucket independently
  const allCircles = [];
  const allUnmatched = [];
  
  Object.entries(buckets).forEach(([bucketKey, bucketUsers]) => {
    console.log(`\n   Processing bucket: ${bucketKey} (${bucketUsers.length} users)`);
    
    const groupSizes = calculateOptimalGroupSizes(bucketUsers.length);
    console.log(`     Optimal group sizes: [${groupSizes.join(', ')}]`);
    
    let remainingUsers = [...bucketUsers];
    
    // Create groups according to optimal sizes
    groupSizes.forEach((size, index) => {
      if (remainingUsers.length >= size) {
        // Randomly shuffle and take first N users
        const shuffled = [...remainingUsers].sort(() => Math.random() - 0.5);
        const group = shuffled.slice(0, size);
        allCircles.push(group);
        
        // Remove selected users from remaining
        remainingUsers = remainingUsers.filter(user => !group.includes(user));
        
        console.log(`     Created group ${index + 1}: ${size} users`);
      }
    });
    
    // Add any leftover users to unmatched
    if (remainingUsers.length > 0) {
      allUnmatched.push(...remainingUsers);
      console.log(`     ${remainingUsers.length} users left unmatched`);
    }
  });
  
  return {
    circles: allCircles,
    unmatchedUsers: allUnmatched
  };
}

// Age calculation utility functions
function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  
  try {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    
    if (isNaN(birthDate.getTime())) return null;
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  } catch (error) {
    console.error('Error calculating age:', error);
    return null;
  }
}

function getAgeGroup(age) {
  if (age === null || age < 18) return null;
  return age <= 25 ? '18-25' : '26+';
}

// Optimal group sizing logic
function calculateOptimalGroupSizes(count) {
  if (count <= 1) return [];
  if (count <= 4) return [count];
  if (count === 5) return [3, 2];
  
  const groups = [];
  let remaining = count;
  
  // Maximize groups of 4
  while (remaining >= 4) {
    // Special handling to avoid leaving exactly 1 person
    if (remaining === 5) {
      groups.push(3, 2);
      remaining = 0;
    } else {
      groups.push(4);
      remaining -= 4;
    }
  }
  
  // Handle remaining people (2 or 3)
  if (remaining >= 2) {
    groups.push(remaining);
  }
  
  return groups;
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
    
    // For 40-person test: 20 female, 18 male, 2 non-binary
    // Age distribution: 80% under 26 (32 people), 20% over 25 (8 people)
    let gender, age, dateOfBirth;
    if (testCase.userCount === 40) {
      // Gender distribution
      if (i < 20) gender = 'female';
      else if (i < 38) gender = 'male';
      else gender = 'non-binary';
      
      // Age distribution: 80% are 18-25 (32 people), 20% are 26+ (8 people)
      if (i < 32) {
        // 18-25 age group
        age = 18 + Math.floor(Math.random() * 8); // Random age between 18-25
      } else {
        // 26+ age group
        age = 26 + Math.floor(Math.random() * 15); // Random age between 26-40
      }
      
      // Calculate date of birth from age
      const currentYear = new Date().getFullYear();
      const birthYear = currentYear - age;
      const birthMonth = Math.floor(Math.random() * 12) + 1;
      const birthDay = Math.floor(Math.random() * 28) + 1;
      dateOfBirth = `${birthYear}-${birthMonth.toString().padStart(2, '0')}-${birthDay.toString().padStart(2, '0')}`;
    } else {
      const genders = ['male', 'female', 'non-binary'];
      gender = genders[i % genders.length];
      
      // Random age for other tests
      age = 18 + Math.floor(Math.random() * 25);
      const currentYear = new Date().getFullYear();
      const birthYear = currentYear - age;
      const birthMonth = Math.floor(Math.random() * 12) + 1;
      const birthDay = Math.floor(Math.random() * 28) + 1;
      dateOfBirth = `${birthYear}-${birthMonth.toString().padStart(2, '0')}-${birthDay.toString().padStart(2, '0')}`;
    }
    
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
      date_of_birth: dateOfBirth,
      age,
      interests
    });
  }
  
  // Run the matching algorithm
  const result = simpleMatchingAlgorithm(testUsers);
  
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
  
  const result = simpleMatchingAlgorithm(testUsers);
  
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
  
  const result = simpleMatchingAlgorithm(testUsers);
  
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
  simpleMatchingAlgorithm,
  calculateAge,
  getAgeGroup,
  calculateOptimalGroupSizes,
  testMatchingAlgorithm,
  testInterestMatching,
  testGenderBalance,
  runAllMatchingTests
};

// Run if called directly
if (require.main === module) {
  runAllMatchingTests().catch(console.error);
}