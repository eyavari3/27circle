#!/usr/bin/env node

/**
 * Deep Schema Audit using Raw SQL
 * 
 * This script uses a custom PostgreSQL function to run raw SQL queries
 * and inspect the ACTUAL schema metadata in Supabase
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment
let supabaseUrl, supabaseServiceKey;
try {
  const envFile = fs.readFileSync('.env.local', 'utf8');
  const envLines = envFile.split('\n');
  for (const line of envLines) {
    const [key, value] = line.split('=');
    if (key === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = value;
    if (key === 'SUPABASE_SERVICE_ROLE_KEY') supabaseServiceKey = value;
  }
} catch (error) {
  console.error('❌ Could not read .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Raw SQL queries to get ACTUAL schema information
const DEEP_AUDIT_QUERIES = {
  // Get all tables with row counts and sizes
  tables_detailed: `
    SELECT 
      t.table_name,
      t.table_type,
      COALESCE(s.n_live_tup, 0) as estimated_rows,
      pg_size_pretty(pg_total_relation_size('public.' || t.table_name)) as total_size,
      pg_size_pretty(pg_relation_size('public.' || t.table_name)) as table_size
    FROM information_schema.tables t
    LEFT JOIN pg_stat_user_tables s ON s.relname = t.table_name
    WHERE t.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
    ORDER BY pg_total_relation_size('public.' || t.table_name) DESC
  `,

  // Get ALL columns with their full definitions
  columns_complete: `
    SELECT 
      c.table_name,
      c.column_name,
      c.ordinal_position,
      c.column_default,
      c.is_nullable,
      c.data_type,
      c.character_maximum_length,
      c.numeric_precision,
      c.numeric_scale,
      c.udt_name,
      c.is_updatable,
      CASE 
        WHEN pk.column_name IS NOT NULL THEN true 
        ELSE false 
      END as is_primary_key
    FROM information_schema.columns c
    LEFT JOIN (
      SELECT ku.table_name, ku.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage ku 
        ON tc.constraint_name = ku.constraint_name
        AND tc.table_schema = ku.table_schema
      WHERE tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_schema = 'public'
    ) pk ON c.table_name = pk.table_name AND c.column_name = pk.column_name
    WHERE c.table_schema = 'public'
    ORDER BY c.table_name, c.ordinal_position
  `,

  // Get all indexes with usage statistics
  indexes_complete: `
    SELECT 
      i.schemaname,
      i.tablename,
      i.indexname,
      i.indexdef,
      pg_size_pretty(pg_relation_size(i.indexname::regclass)) as index_size,
      s.idx_tup_read,
      s.idx_tup_fetch,
      CASE 
        WHEN s.idx_tup_read = 0 AND s.idx_tup_fetch = 0 THEN 'NEVER_USED'
        WHEN s.idx_tup_read < 10 THEN 'RARELY_USED'
        WHEN s.idx_tup_read < 100 THEN 'OCCASIONALLY_USED'
        ELSE 'FREQUENTLY_USED'
      END as usage_level
    FROM pg_indexes i
    LEFT JOIN pg_stat_user_indexes s ON s.indexrelname = i.indexname
    WHERE i.schemaname = 'public'
    ORDER BY s.idx_tup_read DESC NULLS LAST
  `,

  // Get all constraints
  constraints_all: `
    SELECT 
      tc.table_name,
      tc.constraint_name,
      tc.constraint_type,
      kcu.column_name,
      ccu.table_name AS referenced_table,
      ccu.column_name AS referenced_column,
      rc.delete_rule,
      rc.update_rule
    FROM information_schema.table_constraints tc
    LEFT JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    LEFT JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    LEFT JOIN information_schema.referential_constraints rc
      ON tc.constraint_name = rc.constraint_name
      AND tc.table_schema = rc.constraint_schema
    WHERE tc.table_schema = 'public'
    ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name
  `,

  // Check for unused columns by looking at actual data patterns
  column_usage_analysis: `
    SELECT 
      schemaname,
      tablename,
      attname as column_name,
      n_distinct,
      most_common_vals,
      most_common_freqs,
      null_frac * 100 as null_percentage,
      avg_width
    FROM pg_stats 
    WHERE schemaname = 'public'
    ORDER BY tablename, attname
  `,

  // Get triggers and functions
  triggers_and_functions: `
    SELECT 
      t.trigger_name,
      t.event_manipulation,
      t.event_object_table,
      t.action_timing,
      t.action_statement
    FROM information_schema.triggers t
    WHERE t.trigger_schema = 'public'
    ORDER BY t.event_object_table, t.trigger_name
  `
};

async function executeSchemaQuery(queryName, query) {
  console.log(`\n🔍 Running ${queryName}...`);
  
  try {
    const { data, error } = await supabase.rpc('schema_audit', { query_text: query });
    
    if (error) {
      console.log(`❌ Error: ${error.message}`);
      return null;
    }
    
    if (!data || data.length === 0) {
      console.log(`ℹ️  No results for ${queryName}`);
      return [];
    }
    
    console.log(`✅ Found ${data.length} records`);
    return data;
    
  } catch (err) {
    console.log(`❌ Exception in ${queryName}: ${err.message}`);
    return null;
  }
}

async function analyzeSchemaResults(results) {
  console.log('\n📊 DEEP SCHEMA ANALYSIS');
  console.log('=======================');
  
  const analysis = {
    tables_summary: {},
    potential_issues: [],
    cleanup_candidates: [],
    performance_issues: []
  };
  
  // Analyze tables
  if (results.tables_detailed) {
    console.log('\n📋 TABLE ANALYSIS:');
    results.tables_detailed.forEach(table => {
      console.log(`  ${table.table_name}: ${table.estimated_rows} rows, ${table.total_size}`);
      analysis.tables_summary[table.table_name] = {
        rows: table.estimated_rows,
        size: table.total_size
      };
    });
  }
  
  // Analyze columns for potential issues
  if (results.columns_complete) {
    console.log('\n📋 COLUMN ANALYSIS:');
    const columnsByTable = {};
    
    results.columns_complete.forEach(col => {
      if (!columnsByTable[col.table_name]) {
        columnsByTable[col.table_name] = [];
      }
      columnsByTable[col.table_name].push(col);
    });
    
    for (const [tableName, columns] of Object.entries(columnsByTable)) {
      console.log(`\n  ${tableName} (${columns.length} columns):`);
      
      columns.forEach(col => {
        let flags = [];
        if (col.is_primary_key) flags.push('PK');
        if (col.is_nullable === 'YES') flags.push('NULL');
        if (col.column_default) flags.push('DEFAULT');
        
        console.log(`    ${col.column_name}: ${col.data_type} ${flags.join(', ')}`);
        
        // Check for potential issues
        if (col.data_type === 'text' && col.character_maximum_length === null) {
          analysis.potential_issues.push({
            type: 'UNBOUNDED_TEXT',
            table: tableName,
            column: col.column_name,
            issue: 'TEXT column without length limit'
          });
        }
      });
    }
  }
  
  // Analyze indexes
  if (results.indexes_complete) {
    console.log('\n📋 INDEX ANALYSIS:');
    
    const unusedIndexes = results.indexes_complete.filter(idx => 
      idx.usage_level === 'NEVER_USED' && !idx.indexname.includes('_pkey')
    );
    
    console.log(`  Total indexes: ${results.indexes_complete.length}`);
    console.log(`  Unused indexes: ${unusedIndexes.length}`);
    
    if (unusedIndexes.length > 0) {
      console.log('\n  🚨 UNUSED INDEXES FOUND:');
      unusedIndexes.forEach(idx => {
        console.log(`    ${idx.indexname} on ${idx.tablename} (${idx.index_size})`);
        analysis.cleanup_candidates.push({
          type: 'UNUSED_INDEX',
          name: idx.indexname,
          table: idx.tablename,
          size: idx.index_size,
          sql: `DROP INDEX IF EXISTS ${idx.indexname};`
        });
      });
    }
    
    results.indexes_complete.forEach(idx => {
      if (idx.usage_level !== 'NEVER_USED') {
        console.log(`    ${idx.indexname}: ${idx.usage_level} (${idx.idx_tup_read || 0} reads)`);
      }
    });
  }
  
  // Analyze column usage statistics
  if (results.column_usage_analysis) {
    console.log('\n📋 COLUMN USAGE STATISTICS:');
    
    const highNullColumns = results.column_usage_analysis.filter(stat => 
      stat.null_percentage > 90 && stat.null_percentage < 100
    );
    
    if (highNullColumns.length > 0) {
      console.log('\n  ⚠️  COLUMNS WITH >90% NULL VALUES:');
      highNullColumns.forEach(stat => {
        console.log(`    ${stat.tablename}.${stat.column_name}: ${stat.null_percentage.toFixed(1)}% null`);
        analysis.potential_issues.push({
          type: 'HIGH_NULL_PERCENTAGE',
          table: stat.tablename,
          column: stat.column_name,
          null_percentage: stat.null_percentage,
          suggestion: 'Consider if this column is actually needed'
        });
      });
    }
  }
  
  return analysis;
}

async function runDeepSchemaAudit() {
  console.log('🚀 Starting Deep Schema Audit with Raw SQL...');
  console.log('📋 This will inspect the ACTUAL schema metadata in Supabase');
  console.log('');
  
  // First, check if our audit function exists
  console.log('🔧 Checking for schema audit function...');
  
  try {
    const testResult = await supabase.rpc('schema_audit', { 
      query_text: 'SELECT 1 as test' 
    });
    
    if (testResult.error) {
      console.log('❌ Schema audit function not found. Creating it...');
      console.log('');
      console.log('📋 SETUP REQUIRED:');
      console.log('=================');
      console.log('1. Go to your Supabase Dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Run the SQL from: scripts/create-schema-audit-function.sql');
      console.log('4. Then re-run this script');
      console.log('');
      console.log('The SQL creates a secure function that lets us inspect schema metadata.');
      return;
    }
    
    console.log('✅ Schema audit function is ready');
    
  } catch (err) {
    console.log(`❌ Cannot access schema audit function: ${err.message}`);
    console.log('Please run the SQL setup script first.');
    return;
  }
  
  // Run all the deep audit queries
  const results = {};
  
  for (const [queryName, query] of Object.entries(DEEP_AUDIT_QUERIES)) {
    results[queryName] = await executeSchemaQuery(queryName, query);
  }
  
  // Analyze the results
  const analysis = await analyzeSchemaResults(results);
  
  // Generate comprehensive report
  const report = {
    timestamp: new Date().toISOString(),
    audit_type: 'DEEP_SCHEMA_AUDIT',
    raw_results: results,
    analysis: analysis,
    summary: {
      total_tables: results.tables_detailed?.length || 0,
      total_indexes: results.indexes_complete?.length || 0,
      unused_indexes: analysis.cleanup_candidates.filter(c => c.type === 'UNUSED_INDEX').length,
      potential_issues: analysis.potential_issues.length,
      cleanup_opportunities: analysis.cleanup_candidates.length
    }
  };
  
  // Save detailed report
  const reportPath = path.join(__dirname, 'audit-results', `deep-schema-audit-${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.json`);
  
  const dir = path.dirname(reportPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Display summary
  console.log('\n📊 DEEP AUDIT SUMMARY');
  console.log('=====================');
  console.log(`Tables: ${report.summary.total_tables}`);
  console.log(`Indexes: ${report.summary.total_indexes}`);
  console.log(`Unused indexes: ${report.summary.unused_indexes}`);
  console.log(`Potential issues: ${report.summary.potential_issues}`);
  console.log(`Cleanup opportunities: ${report.summary.cleanup_opportunities}`);
  
  if (analysis.cleanup_candidates.length > 0) {
    console.log('\n🔧 CLEANUP RECOMMENDATIONS:');
    analysis.cleanup_candidates.forEach((item, i) => {
      console.log(`${i + 1}. ${item.type}: ${item.name || item.table}`);
      if (item.sql) {
        console.log(`   SQL: ${item.sql}`);
      }
    });
  } else {
    console.log('\n✅ No cleanup opportunities found - schema is clean!');
  }
  
  console.log(`\n💾 Full report saved to: ${reportPath}`);
  console.log('\n✅ Deep schema audit completed!');
}

// Run the deep audit
runDeepSchemaAudit();