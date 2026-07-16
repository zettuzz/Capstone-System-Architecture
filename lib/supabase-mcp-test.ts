import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

// Simple test to verify Supabase MCP connection
export async function testSupabaseMCPConnection() {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    
    // Test 1: Try to get server version (this will work if connection is alive)
    const { data, error } = await supabase.rpc('version')
    
    if (error) {
      // If version RPC doesn't exist, try a simpler approach
      console.log('Version RPC not available, trying table query...')
      
      // Test 2: Try to query a table we know exists from our earlier test
      const { data: tableData, error: tableError } = await supabase
        .from('categories')
        .select('count')
        .limit(1)
        
      if (tableError) {
        // If categories table doesn't exist, try information_schema
        const { data: schemaData, error: schemaError } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .limit(1)
          
        if (schemaError) {
          return {
            success: false,
            error: `All tests failed. Version RPC: ${error.message}, Table query: ${tableError.message}, Schema query: ${schemaError.message}`
          }
        }
        
        return {
          success: true,
          message: 'Supabase MCP connection is working! (via information_schema)',
          schemaData: schemaData.slice(0, 3) // Show first 3 tables
        }
      }
      
      return {
        success: true,
        message: 'Supabase MCP connection is working! (via categories table)',
        tableData: tableData
      }
    }
    
    return {
      success: true,
      message: 'Supabase MCP connection is working! (via version RPC)',
      version: data
    }
   } catch (err) {
     const message = err instanceof Error ? err.message : String(err);
     return {
       success: false,
       error: `Connection test failed with exception: ${message}`
     }
   }
}

// Export for testing
export default testSupabaseMCPConnection