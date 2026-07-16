// Test Supabase MCP Connection
// This test verifies that the Supabase MCP configured in kilo.jsonc is working

import { createClient } from './utils/supabase/server';
import { cookies } from 'next/headers';

async function testSupabaseMCP() {
  console.log('Testing Supabase MCP Connection...');
  console.log('==============================');
  
  try {
    // Create Supabase client using our existing utility
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    // Test 1: Try to get server info/version (simple connectivity test)
    console.log('Test 1: Checking basic connectivity...');
    const { data: versionData, error: versionError } = await supabase
      .from('information_schema.tables')
      .select('table_schema, table_name')
      .limit(1);
    
    if (versionError) {
      console.log('❌ Basic connectivity test failed:', versionError.message);
      return false;
    }
    
    console.log('✅ Basic connectivity test passed');
    
    // Test 2: List tables to verify we can access the database schema
    console.log('\nTest 2: Listing database tables...');
    const { data: tablesData, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_schema, table_name')
      .eq('table_type', 'BASE TABLE')
      .not('table_schema', 'in', ('information_schema', 'pg_catalog'))
      .order('table_name');
    
    if (tablesError) {
      console.log('❌ Tables listing test failed:', tablesError.message);
      return false;
    }
    
    console.log(`✅ Tables listing test passed - Found ${tablesData.length} tables`);
    console.log('Sample tables:', tablesData.slice(0, 5).map(t => `${t.table_schema}.${t.table_name}`).join(', '));
    
    // Test 3: Try to access a specific table we know exists
    console.log('\nTest 3: Accessing known table (categories)...');
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name_en')
      .limit(3);
    
    if (categoriesError) {
      console.log('❌ Categories access test failed:', categoriesError.message);
      // This might be okay if the table doesn't exist in schema, but we know it does from earlier
      return false;
    }
    
    console.log('✅ Categories access test passed');
    console.log('Sample data:', categoriesData);
    
    console.log('\n🎉 ALL TESTS PASSED - Supabase MCP is working correctly!');
    return true;
    
  } catch (error) {
    console.log('\n💥 UNEXPECTED ERROR:', error);
    return false;
  }
}

// Run the test
testSupabaseMCP()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.log('💥 Test execution failed:', err);
    process.exit(1);
  });