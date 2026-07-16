import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

// Test function to verify Supabase MCP connection
export async function testSupabaseConnection() {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    
    // Test 1: Simple query to get server version
    const { data: versionData, error: versionError } = await supabase.rpc('version')
    
    if (versionError) {
      console.error('Version check failed:', versionError)
      return { success: false, error: versionError.message }
    }
    
     // Test 2: List tables from the database (using our existing knowledge)
      const { data: tablesData, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_schema, table_name')
        .eq('table_type', 'BASE TABLE')
        .not('table_schema', 'in', ['information_schema', 'pg_catalog'])
    if (tablesError) {
      console.error('Tables query failed:', tablesError)
      return { success: false, error: tablesError.message }
    }
    
    // Test 3: Check if we can access a specific table we know exists
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('categories')
      .select('count')
      .limit(1)
    
    if (categoriesError && categoriesError.code !== '42P01') { // 42P01 = undefined table
      console.error('Categories query failed:', categoriesError)
      return { success: false, error: categoriesError.message }
    }
    
    return {
      success: true,
      message: 'Supabase MCP connection is working!',
      version: versionData,
      tablesCount: tablesData?.length || 0,
      canAccessCategories: !categoriesError
    }
   } catch (error) {
     const message = error instanceof Error ? error.message : String(error);
     console.error('Supabase connection test failed:', message);
     return { success: false, error: message }
   }
}

// For direct testing
if (require.main === module) {
  testSupabaseConnection().then(result => {
    console.log('Test Result:', JSON.stringify(result, null, 2))
    process.exit(result.success ? 0 : 1)
  }).catch(err => {
    console.error('Test failed with exception:', err)
    process.exit(1)
  })
}

export default testSupabaseConnection