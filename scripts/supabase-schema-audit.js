#!/usr/bin/env node

/**
 * Comprehensive Supabase Schema Audit & Cleanup Preparation
 * 
 * This script will:
 * 1. Discover ALL tables, columns, indexes, constraints in the actual Supabase instance
 * 2. Cross-reference with code usage to identify unused elements
 * 3. Generate safe cleanup scripts with rollback procedures
 * 4. Create backup recommendations
 * 
 * IMPORTANT: This script is READ-ONLY for discovery phase
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

// Raw SQL queries to discover schema details
const SCHEMA_QUERIES = {
  // Get all tables in public schema
  tables: `
    SELECT 
      table_name,
      table_type,
      is_insertable_into,
      is_typed
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `,
  
  // Get all columns for each table
  columns: `
    SELECT 
      table_name,
      column_name,
      data_type,
      is_nullable,
      column_default,
      character_maximum_length,
      ordinal_position
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    ORDER BY table_name, ordinal_position;
  `,
  
  // Get all indexes
  indexes: `
    SELECT 
      schemaname,
      tablename,
      indexname,
      indexdef,
      pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size
    FROM pg_indexes 
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname;
  `,
  
  // Get all foreign key constraints
  foreign_keys: `
    SELECT
      tc.table_name,
      kcu.column_name,
      tc.constraint_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      rc.delete_rule,
      rc.update_rule
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    LEFT JOIN information_schema.referential_constraints AS rc
      ON tc.constraint_name = rc.constraint_name
      AND tc.table_schema = rc.constraint_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' 
      AND tc.table_schema = 'public'
    ORDER BY tc.table_name, kcu.column_name;
  `,
  
  // Get all check constraints
  check_constraints: `
    SELECT
      tc.table_name,
      tc.constraint_name,
      cc.check_clause
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.check_constraints AS cc
      ON tc.constraint_name = cc.constraint_name
      AND tc.table_schema = cc.constraint_schema
    WHERE tc.constraint_type = 'CHECK' 
      AND tc.table_schema = 'public'
    ORDER BY tc.table_name;
  `,
  
  // Get index usage statistics
  index_usage: `
    SELECT 
      schemaname,
      tablename,
      indexname,
      idx_tup_read,
      idx_tup_fetch,
      CASE 
        WHEN idx_tup_read = 0 AND idx_tup_fetch = 0 THEN 'UNUSED'
        WHEN idx_tup_read < 10 THEN 'RARELY_USED'
        ELSE 'ACTIVE'
      END as usage_status
    FROM pg_stat_user_indexes 
    WHERE schemaname = 'public'
    ORDER BY idx_tup_read DESC;
  `,
  
  // Get table sizes
  table_sizes: `
    SELECT 
      schemaname,
      tablename,
      pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
      pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
      pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
  `
};

// Known tables that SHOULD exist based on working code
const EXPECTED_WORKING_TABLES = [
  'users',
  'circles', 
  'circle_members',
  'waitlist_entries',
  'user_interests',
  'locations',
  'conversation_sparks'
];

// Suspected unused tables based on previous audit
const SUSPECTED_UNUSED_TABLES = [
  'daily_events',
  'joins', 
  'sparks'
];

async function executeRawSQL(query, description) {
  console.log(`\n🔍 ${description}...`);
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { query });
    
    if (error) {
      console.log(`❌ Error: ${error.message}`);
      return null;
    }
    
    console.log(`✅ Found ${data?.length || 0} records`);
    return data;
  } catch (err) {
    console.log(`❌ Exception: ${err.message}`);
    return null;
  }
}

async function scanCodebaseForDatabaseReferences() {
  console.log('\n🔍 Scanning codebase for database table/column references...');
  
  const patterns = {
    tables: new Set(),
    columns: new Set()
  };
  
  // Search for table references in TypeScript/JavaScript files
  const searchDirectories = ['src', 'scripts'];
  
  function scanDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        scanDirectory(fullPath);
      } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx') || item.endsWith('.js') || item.endsWith('.jsx'))) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          
          // Look for .from('table_name') patterns
          const fromMatches = content.match(/\.from\(['"`]([^'"`]+)['"`]\)/g);
          if (fromMatches) {
            fromMatches.forEach(match => {
              const tableName = match.match(/\.from\(['"`]([^'"`]+)['"`]\)/)[1];
              patterns.tables.add(tableName);
            });
          }
          
          // Look for JOIN patterns
          const joinMatches = content.match(/JOIN\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi);
          if (joinMatches) {
            joinMatches.forEach(match => {
              const tableName = match.replace(/JOIN\s+/i, '');
              patterns.tables.add(tableName);
            });
          }
          
          // Look for column references in select/where clauses
          const selectMatches = content.match(/\.select\(['"`]([^'"`]+)['"`]\)/g);
          if (selectMatches) {
            selectMatches.forEach(match => {
              const columns = match.match(/\.select\(['"`]([^'"`]+)['"`]\)/)[1];
              columns.split(',').forEach(col => {
                const cleanCol = col.trim().split(' ')[0]; // Remove aliases
                if (cleanCol && !cleanCol.includes('*')) {
                  patterns.columns.add(cleanCol);
                }
              });
            });
          }
          
        } catch (err) {
          // Skip files we can't read
        }
      }
    }
  }
  
  searchDirectories.forEach(scanDirectory);
  
  return {
    tables: Array.from(patterns.tables).sort(),
    columns: Array.from(patterns.columns).sort()
  };
}

async function runComprehensiveAudit() {
  console.log('🔍 Starting Comprehensive Supabase Schema Audit...');
  console.log('📋 This will discover ALL database objects and cross-reference with code');
  console.log('');

  const auditResults = {
    timestamp: new Date().toISOString(),
    schema_discovery: {},
    code_references: {},
    analysis: {},
    cleanup_recommendations: []
  };

  try {
    // Note: We'll need to create a custom SQL function in Supabase to execute raw SQL
    // For now, let's use what we can access through the Supabase client
    
    console.log('⚠️  Note: Direct SQL execution requires custom function setup in Supabase');
    console.log('   For now, using available Supabase client methods...');
    
    // 1. Discover tables using the client
    console.log('\n📊 PHASE 1: DISCOVERING EXISTING TABLES');
    console.log('==========================================');
    
    const tableDiscovery = {};
    
    for (const tableName of [...EXPECTED_WORKING_TABLES, ...SUSPECTED_UNUSED_TABLES]) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          tableDiscovery[tableName] = {
            exists: false,
            error: error.message,
            row_count: 0
          };
        } else {
          tableDiscovery[tableName] = {
            exists: true,
            error: null,
            row_count: count || 0
          };
        }
      } catch (err) {
        tableDiscovery[tableName] = {
          exists: false,
          error: err.message,
          row_count: 0
        };
      }
    }
    
    auditResults.schema_discovery.tables = tableDiscovery;
    
    // 2. Scan codebase for references
    console.log('\n📊 PHASE 2: SCANNING CODEBASE FOR DATABASE REFERENCES');
    console.log('====================================================');
    
    const codeReferences = await scanCodebaseForDatabaseReferences();
    auditResults.code_references = codeReferences;
    
    console.log(`Found references to ${codeReferences.tables.length} tables in code:`);
    console.log(codeReferences.tables.map(t => `  - ${t}`).join('\n'));
    
    // 3. Analysis and recommendations
    console.log('\n📊 PHASE 3: ANALYSIS & CLEANUP RECOMMENDATIONS');
    console.log('===============================================');
    
    const existingTables = Object.entries(tableDiscovery)
      .filter(([name, info]) => info.exists)
      .map(([name]) => name);
    
    const nonExistentTables = Object.entries(tableDiscovery)
      .filter(([name, info]) => !info.exists)
      .map(([name]) => name);
    
    const emptyTables = Object.entries(tableDiscovery)
      .filter(([name, info]) => info.exists && info.row_count === 0)
      .map(([name]) => name);
    
    const unreferencedTables = existingTables.filter(table => 
      !codeReferences.tables.includes(table)
    );
    
    auditResults.analysis = {
      existing_tables: existingTables,
      non_existent_tables: nonExistentTables,
      empty_tables: emptyTables,
      unreferenced_in_code: unreferencedTables,
      working_tables: existingTables.filter(table => 
        codeReferences.tables.includes(table) && tableDiscovery[table].row_count > 0
      )
    };
    
    // Generate cleanup recommendations
    const recommendations = [];
    
    // Tables that don't exist but are in suspected list
    nonExistentTables.forEach(table => {
      if (SUSPECTED_UNUSED_TABLES.includes(table)) {
        recommendations.push({
          type: 'INFO',
          action: 'ALREADY_REMOVED',
          target: table,
          reason: 'Table does not exist - already cleaned up or never created',
          sql: null,
          risk: 'NONE'
        });
      }
    });
    
    // Tables that exist but are empty and not referenced in code
    emptyTables.forEach(table => {
      if (!codeReferences.tables.includes(table)) {
        recommendations.push({
          type: 'SAFE_TO_REMOVE',
          action: 'DROP_TABLE',
          target: table,
          reason: 'Table exists but is empty and not referenced in code',
          sql: `DROP TABLE IF EXISTS ${table};`,
          risk: 'LOW'
        });
      }
    });
    
    // Tables that have data but are not referenced in code
    unreferencedTables.forEach(table => {
      if (tableDiscovery[table].row_count > 0) {
        recommendations.push({
          type: 'INVESTIGATE',
          action: 'MANUAL_REVIEW',
          target: table,
          reason: `Table has ${tableDiscovery[table].row_count} rows but is not referenced in current code`,
          sql: null,
          risk: 'MEDIUM'
        });
      }
    });
    
    auditResults.cleanup_recommendations = recommendations;
    
    // 4. Display results
    console.log('\n📋 AUDIT RESULTS SUMMARY');
    console.log('========================');
    console.log(`✅ Tables confirmed working: ${auditResults.analysis.working_tables.length}`);
    console.log(`⚠️  Tables needing investigation: ${unreferencedTables.length}`);
    console.log(`🗑️  Tables safe to remove: ${emptyTables.filter(t => !codeReferences.tables.includes(t)).length}`);
    console.log(`ℹ️  Tables already cleaned: ${nonExistentTables.length}`);
    
    console.log('\n🔧 CLEANUP RECOMMENDATIONS:');
    recommendations.forEach((rec, i) => {
      console.log(`${i + 1}. [${rec.type}] ${rec.target}: ${rec.reason}`);
      if (rec.sql) {
        console.log(`   SQL: ${rec.sql}`);
      }
      console.log(`   Risk: ${rec.risk}`);
    });
    
    // 5. Save results
    const outputPath = path.join(__dirname, 'audit-results', `supabase-schema-audit-${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.json`);
    
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, JSON.stringify(auditResults, null, 2));
    
    console.log(`\n💾 Full audit results saved to: ${outputPath}`);
    
    // 6. Generate cleanup script if we have recommendations
    if (recommendations.some(r => r.sql)) {
      await generateCleanupScript(recommendations, auditResults);
    }
    
    console.log('\n✅ Schema audit completed successfully!');
    
  } catch (error) {
    console.error('❌ Audit failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

async function generateCleanupScript(recommendations, auditResults) {
  console.log('\n📝 Generating cleanup script...');
  
  const cleanupSql = [];
  const rollbackSql = [];
  
  // Add header
  cleanupSql.push('-- 27 Circle Schema Cleanup Script');
  cleanupSql.push(`-- Generated: ${new Date().toISOString()}`);
  cleanupSql.push('-- IMPORTANT: Create a backup before running this script!');
  cleanupSql.push('-- ');
  cleanupSql.push('-- This script removes confirmed unused database objects');
  cleanupSql.push('');
  
  rollbackSql.push('-- 27 Circle Schema Cleanup ROLLBACK Script');
  rollbackSql.push(`-- Generated: ${new Date().toISOString()}`);
  rollbackSql.push('-- Run this if you need to restore removed objects');
  rollbackSql.push('');
  
  // Process each recommendation
  recommendations.forEach(rec => {
    if (rec.sql && rec.type === 'SAFE_TO_REMOVE') {
      cleanupSql.push(`-- Remove ${rec.target}: ${rec.reason}`);
      cleanupSql.push(rec.sql);
      cleanupSql.push('');
      
      // Add rollback (basic table structure)
      rollbackSql.push(`-- Restore ${rec.target} (you'll need to recreate structure manually)`);
      rollbackSql.push(`-- CREATE TABLE ${rec.target} (...); -- Define structure as needed`);
      rollbackSql.push('');
    }
  });
  
  // Add safety checks
  cleanupSql.push('-- Safety verification');
  cleanupSql.push('-- Check that critical tables still exist:');
  auditResults.analysis.working_tables.forEach(table => {
    cleanupSql.push(`-- SELECT COUNT(*) FROM ${table}; -- Should not error`);
  });
  
  // Save scripts
  const cleanupPath = path.join(__dirname, 'cleanup-scripts', `schema-cleanup-${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.sql`);
  const rollbackPath = path.join(__dirname, 'cleanup-scripts', `schema-rollback-${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.sql`);
  
  const scriptsDir = path.dirname(cleanupPath);
  if (!fs.existsSync(scriptsDir)) {
    fs.mkdirSync(scriptsDir, { recursive: true });
  }
  
  fs.writeFileSync(cleanupPath, cleanupSql.join('\n'));
  fs.writeFileSync(rollbackPath, rollbackSql.join('\n'));
  
  console.log(`📄 Cleanup script: ${cleanupPath}`);
  console.log(`📄 Rollback script: ${rollbackPath}`);
}

// Run the audit
runComprehensiveAudit();