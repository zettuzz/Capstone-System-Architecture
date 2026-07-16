// Test using SSR client approach that worked in validated tests
// Based on test-supabase-mcp-connection.js but simplified

const { createClient } = require("@supabase/ssr");

// Mock cookie store for testing
const mockCookieStore = {
  getAll: () => [],
  set: () => {}
};

async function testSupabaseSSRConnection() {
  console.log('Testing ArchAI Database with SSR Client...');
  console.log('==========================================');
  
  try {
    // Create Supabase client using environment variables (same as working tests)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://znizmdakncmrnowgwppu.supabase.co";
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_H3QNqM634R_v2eZXezu0fw_TsYl40sr";
    
    console.log('Connecting to:', supabaseUrl);
    
    const supabase = createClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() {
            return mockCookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              mockCookieStore.set(name, value, options);
            });
          }
        }
      }
    );
    
    // Test 1: Try to get server info/version (simple connectivity test)
    console.log('\nTest 1: Checking basic connectivity...');
    const { data: versionData, error: versionError } = await supabase
      .from('information_schema.tables')
      .select('table_schema, table_name')
      .limit(1);
    
    if (versionError) {
      console.log('❌ Basic connectivity test failed:', versionError.message);
      // Don't fail yet - try a different approach
      console.log('🔄 Trying alternative connectivity test...');
    } else {
      console.log('✅ Basic connectivity test passed');
      console.log('Found', versionData.length, 'tables in sample');
    }
    
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
      // This is expected in some configurations - let's try to work with what we know
      console.log('📝 Note: Schema caching issue detected, but MCP connection was validated earlier');
      console.log('   The TEST_SUPABASE_MCP.md document confirms access to specific tables.');
      
      // Let's try to access a specific table we know from the test document
      console.log('\n🔄 Trying direct access to known table from validation...');
      const { data: knownData, error: knownError } = await supabase
        .from('categories')  // From TEST_SUPABASE_MCP.md
        .select('id, name_en')
        .limit(3);
        
      if (knownError) {
        console.log('❌ Known table access also failed:', knownError.message);
        console.log('\n💡 This suggests the issue may be with direct client access vs MCP access.');
        console.log('   The validation tests show MCP is working - the issue may be in how we\'re');
        console.log('   making direct requests vs how the MCP server makes requests.');
        
        // Let's check what the environment variables actually contain
        console.log('\n🔍 Environment Variable Check:');
        console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
        console.log('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:', supabaseKey.substring(0, 20) + '...');
        
        return false; // Indicate we couldn't verify via direct client
      } else {
        console.log('✅ Known table access successful - Found', knownData.length, 'categories');
        console.log('Sample data:', knownData);
      }
    } else {
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
        return false;
      }
      
      console.log('✅ Categories access test passed');
      console.log('Sample data:', categoriesData);
      
      console.log('\n🎉 ALL TESTS PASSED - Supabase SSR connection is working!');
      return true;
    }
    
  } catch (error) {
    console.log('\n💥 UNEXPECTED ERROR:', error);
    return false;
  }
}

// Run the test
testSupabaseSSRConnection()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.log('💥 Test execution failed:', err);
    process.exit(1);
  });