const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runSeedScript() {
  try {
    console.log('🌱 Starting database seed...');
    
    const seedFile = path.join(__dirname, 'bulletproof-seed.sql');
    const seedSQL = fs.readFileSync(seedFile, 'utf8');
    
    // Split SQL into individual statements
    const statements = seedSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.includes('SELECT') && statement.includes('UNION')) {
        // Skip validation queries for now
        continue;
      }
      
      console.log(`⚡ Executing statement ${i + 1}/${statements.length}`);
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        console.error(`❌ Error in statement ${i + 1}:`, error);
        // Continue with other statements
      }
    }
    
    console.log('✅ Seed script completed');
    
    // Verify the data was inserted
    const { data: locations } = await supabase.from('locations').select('count', { count: 'exact' });
    const { data: sparks } = await supabase.from('conversation_sparks').select('count', { count: 'exact' });
    const { data: users } = await supabase.from('users').select('count', { count: 'exact' });
    
    console.log(`📊 Verification:
    - Locations: ${locations?.[0]?.count || 0}
    - Sparks: ${sparks?.[0]?.count || 0}
    - Users: ${users?.[0]?.count || 0}`);
    
  } catch (error) {
    console.error('❌ Seed script failed:', error);
    process.exit(1);
  }
}

runSeedScript();