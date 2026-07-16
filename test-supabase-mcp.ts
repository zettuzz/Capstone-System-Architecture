import { testSupabaseMCPConnection } from './lib/supabase-mcp-test'

// Test the Supabase MCP connection
async function runTest() {
  console.log('Testing Supabase MCP connection...')
  console.log('Timestamp:', new Date().toISOString())
  
  try {
    const result = await testSupabaseMCPConnection()
    
    if (result.success) {
      console.log('✅ SUCCESS:', result.message)
      if (result.version !== undefined) {
        console.log('Version data:', result.version)
      }
      if (result.tableData) {
        console.log('Sample table data:', result.tableData)
      }
      if (result.schemaData) {
        console.log('Sample schema data:', result.schemaData)
      }
      return true
    } else {
      console.log('❌ FAILED:', result.error)
      return false
    }
   } catch (error) {
     const message = error instanceof Error ? error.message : String(error);
     console.log('❌ EXCEPTION:', message);
     return false;
   }
}

// Run the test if this file is executed directly
if (import.meta.url === `file:///${process.argv[1]}`) {
  runTest().then(success => {
    process.exit(success ? 0 : 1)
  }).catch(err => {
    console.error('Unhandled error:', err)
    process.exit(1)
  })
}