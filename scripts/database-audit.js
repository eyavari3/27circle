#!/usr/bin/env node

/**
 * 27 Circle Database Audit Script
 * READ-ONLY audit to understand current database state vs documentation
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually load environment variables from .env.local
let supabaseUrl, supabaseServiceKey;

try {
  const envFile = fs.readFileSync('.env.local', 'utf8');
  const envLines = envFile.split('\n');
  
  for (const line of envLines) {
    const [key, value] = line.split('=');
    if (key === 'NEXT_PUBLIC_SUPABASE_URL') {
      supabaseUrl = value;
    } else if (key === 'SUPABASE_SERVICE_ROLE_KEY') {
      supabaseServiceKey = value;
    }
  }
} catch (error) {
  console.error('❌ Could not read .env.local file:', error.message);
  process.exit(1);
}

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runAudit() {
  console.log('🔍 Starting 27 Circle Database Audit...');
  console.log('⚠️  This is a READ-ONLY audit - no changes will be made');
  console.log('');

  const results = [];
  const log = (section, data) => {
    console.log(`\n${section}`);
    console.log('='.repeat(section.length));
    if (typeof data === 'string') {
      console.log(data);
      results.push(`\n${section}\n${'='.repeat(section.length)}\n${data}`);
    } else {
      console.table(data);
      results.push(`\n${section}\n${'='.repeat(section.length)}\n${JSON.stringify(data, null, 2)}`);
    }
  };

  try {
    // 1. Check which tables exist and have data
    log('1. TABLE ROW COUNTS', 'Checking all tables for data...');
    
    const tables = ['users', 'circles', 'circle_members', 'waitlist_entries', 
                   'user_interests', 'locations', 'conversation_sparks',
                   'daily_events', 'joins', 'sparks']; // Include suspected unused tables
    
    const tableCounts = {};
    for (const table of tables) {
      try {
        const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        if (error) {
          tableCounts[table] = `ERROR: ${error.message}`;
        } else {
          tableCounts[table] = count || 0;
        }
      } catch (err) {
        tableCounts[table] = `ERROR: ${err.message}`;
      }
    }
    
    log('Table Row Counts', tableCounts);

    // 2. Critical data completeness check
    log('2. CRITICAL DATA COMPLETENESS', 'Checking users table for missing data...');
    
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, full_name, date_of_birth, gender, phone_number');
    
    if (usersError) {
      log('Users Data Check', `ERROR: ${usersError.message}`);
    } else {
      const userStats = {
        total_users: users.length,
        users_with_name: users.filter(u => u.full_name).length,
        users_with_birthdate: users.filter(u => u.date_of_birth).length,
        users_with_gender: users.filter(u => u.gender).length,
        users_with_phone: users.filter(u => u.phone_number).length,
        missing_birthdates: users.filter(u => !u.date_of_birth).length,
        missing_names: users.filter(u => !u.full_name).length,
      };
      log('Users Data Completeness', userStats);
    }

    // 3. Check conversation_sparks vs sparks
    log('3. SPARKS COMPARISON', 'Checking for potential duplication...');
    
    const { data: convSparks, error: convError } = await supabase
      .from('conversation_sparks')
      .select('id, spark_text');
    
    const { data: sparks, error: sparksError } = await supabase
      .from('sparks')
      .select('*');
    
    const sparksComparison = {
      conversation_sparks_count: convError ? `ERROR: ${convError.message}` : (convSparks?.length || 0),
      sparks_count: sparksError ? `ERROR: ${sparksError.message}` : (sparks?.length || 0),
      conversation_sparks_sample: convError ? 'ERROR' : (convSparks?.slice(0, 3) || []),
      sparks_sample: sparksError ? 'ERROR' : (sparks?.slice(0, 3) || [])
    };
    
    log('Sparks Comparison', sparksComparison);

    // 4. Circles and matching analysis
    log('4. CIRCLES ANALYSIS', 'Checking how circles are created...');
    
    const { data: circles, error: circlesError } = await supabase
      .from('circles')
      .select('id, time_slot, location_id, conversation_spark_id, status, created_at');
    
    if (circlesError) {
      log('Circles Analysis', `ERROR: ${circlesError.message}`);
    } else {
      const circleStats = {
        total_circles: circles.length,
        unique_dates: [...new Set(circles.map(c => c.time_slot?.split('T')[0]))].length,
        circles_with_location: circles.filter(c => c.location_id).length,
        circles_with_sparks: circles.filter(c => c.conversation_spark_id).length,
        oldest_circle: circles.length > 0 ? Math.min(...circles.map(c => new Date(c.created_at).getTime())) : null,
        newest_circle: circles.length > 0 ? Math.max(...circles.map(c => new Date(c.created_at).getTime())) : null,
        sample_circle_ids: circles.slice(0, 3).map(c => c.id)
      };
      log('Circles Analysis', circleStats);
    }

    // 5. Circle membership analysis
    log('5. CIRCLE MEMBERSHIP', 'Checking circle members...');
    
    const { data: members, error: membersError } = await supabase
      .from('circle_members')
      .select('circle_id, user_id');
    
    if (membersError) {
      log('Membership Analysis', `ERROR: ${membersError.message}`);
    } else {
      const membershipStats = {
        total_memberships: members.length,
        unique_circles_with_members: [...new Set(members.map(m => m.circle_id))].length,
        unique_users_in_circles: [...new Set(members.map(m => m.user_id))].length,
      };
      log('Membership Analysis', membershipStats);
    }

    // 6. Waitlist analysis
    log('6. WAITLIST ANALYSIS', 'Checking waitlist entries...');
    
    const { data: waitlist, error: waitlistError } = await supabase
      .from('waitlist_entries')
      .select('user_id, time_slot, created_at');
    
    if (waitlistError) {
      log('Waitlist Analysis', `ERROR: ${waitlistError.message}`);
    } else {
      const waitlistStats = {
        total_entries: waitlist.length,
        unique_users: [...new Set(waitlist.map(w => w.user_id))].length,
        unique_time_slots: [...new Set(waitlist.map(w => w.time_slot))].length,
        earliest_slot: waitlist.length > 0 ? Math.min(...waitlist.map(w => new Date(w.time_slot).getTime())) : null,
        latest_slot: waitlist.length > 0 ? Math.max(...waitlist.map(w => new Date(w.time_slot).getTime())) : null,
      };
      log('Waitlist Analysis', waitlistStats);
    }

    // 7. User interests check
    log('7. USER INTERESTS', 'Checking user interest data...');
    
    const { data: interests, error: interestsError } = await supabase
      .from('user_interests')
      .select('user_id, interest_type');
    
    if (interestsError) {
      log('Interests Analysis', `ERROR: ${interestsError.message}`);
    } else {
      const interestStats = {
        total_interest_entries: interests.length,
        users_with_interests: [...new Set(interests.map(i => i.user_id))].length,
        interest_types: [...new Set(interests.map(i => i.interest_type))],
      };
      log('Interests Analysis', interestStats);
    }

    // 8. Summary and recommendations
    log('8. AUDIT SUMMARY', 'Key findings and recommendations...');
    
    const emptyTables = Object.entries(tableCounts)
      .filter(([table, count]) => count === 0)
      .map(([table]) => table);
    
    const errorTables = Object.entries(tableCounts)
      .filter(([table, count]) => typeof count === 'string' && count.includes('ERROR'))
      .map(([table, error]) => ({ table, error }));
    
    const summary = {
      empty_tables: emptyTables,
      tables_with_errors: errorTables,
      total_users: tableCounts.users || 0,
      total_circles: tableCounts.circles || 0,
      critical_issues: []
    };
    
    // Add critical issues based on findings
    if (tableCounts.users > 0 && users && users.filter(u => !u.date_of_birth).length > 0) {
      summary.critical_issues.push('MISSING_BIRTHDATE_DATA_FOR_MATCHING');
    }
    
    if (emptyTables.includes('daily_events') && tableCounts.circles > 0) {
      summary.critical_issues.push('MATCHING_BYPASSES_DAILY_EVENTS_TABLE');
    }
    
    if (tableCounts.conversation_sparks > 0 && tableCounts.sparks === 0) {
      summary.critical_issues.push('SPARKS_TABLE_APPEARS_UNUSED');
    }
    
    log('Audit Summary', summary);

    // Save results to file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const outputPath = path.join(__dirname, 'audit-results', `database-audit-${timestamp}.json`);
    
    // Ensure directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const auditData = {
      timestamp: new Date().toISOString(),
      table_counts: tableCounts,
      user_stats: users ? userStats : null,
      sparks_comparison: sparksComparison,
      summary: summary
    };
    
    fs.writeFileSync(outputPath, JSON.stringify(auditData, null, 2));
    
    console.log('\n✅ Audit completed successfully!');
    console.log(`📁 Results saved to: ${outputPath}`);
    console.log('\n🔧 Next steps based on findings:');
    
    if (emptyTables.length > 0) {
      console.log(`   📋 Empty tables found: ${emptyTables.join(', ')}`);
      console.log('      → These may be safe to remove');
    }
    
    if (summary.critical_issues.length > 0) {
      console.log(`   ⚠️  Critical issues: ${summary.critical_issues.join(', ')}`);
    }
    
    console.log('   🔍 Review the JSON file for detailed analysis');

  } catch (error) {
    console.error('❌ Audit failed:', error.message);
    process.exit(1);
  }
}

// Run the audit
runAudit();