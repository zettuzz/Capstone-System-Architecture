// Simple test to verify Supabase MCP connection
const { createClient } = require("@supabase/ssr");
const { cookies } = require("next/headers");

async function testSupabaseMCPConnection() {
  try {
    // Create a mock cookie store for testing
    const mockCookieStore = {
      getAll: () => [],
      set: () => {}
    };
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      {
        cookies: {
          getAll() {
            return mockCookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              mockCookieStore.set(name, value, options)
            })
          }
        }
      }
    );
    
    // Test: Try to query a table we know exists from our earlier test
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .limit(1)
      
    if (error) {
      return {
        success: false,
        error: `Schema query failed: ${error.message}`
      }
    }
    
    return {
      success: true,
      message: 'Supabase MCP connection is working!',
      sampleData: data
    }
  } catch (err) {
    return {
      success: false,
      error: `Connection test failed with exception: ${err.message}`
    }
  }
}

// For direct testing
if (require.main === module) {
  testSupabaseMCPConnection().then(result => {
    console.log('Test Result:', JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
  }).catch(err => {
    console.error('Test failed with exception:', err);
    process.exit(1);
  })
}

module.exports = { testSupabaseMCPConnection };