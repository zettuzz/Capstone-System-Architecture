// Simple test using a table we know exists from TEST_SUPABASE_MCP.md
// The taobuhid_numbers table was verified to have 100 rows

const { createClient } = require("@supabase/supabase-js");

// Mock cookie store for SSR client
const mockCookieStore = {
  getAll: () => [],
  set: () => {}
};

async function testKnownTable() {
  console.log('Testing ArchAI Database with Known Table...');
  console.log('======================================');
  
  try {
    // Create Supabase client using environment variables
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
    
    // Test: Access the taobuhid_numbers table we know exists
    console.log('\nTesting access to taobuhid_numbers table...');
    const { data, error } = await supabase
      .from('taobuhid_numbers')
      .select('*')
      .limit(5);
      
    if (error) {
      console.log('❌ Query failed:', error.message);
      console.log('Error details:', error);
      return false;
    } else {
      console.log('✅ Query successful - Found', data.length, 'rows');
      console.log('Sample data:', data);
      
      // Try to insert a test record
      console.log('\nTesting insert access...');
      const { data: insertData, error: insertError } = await supabase
        .from('taobuhid_numbers')
        .insert([
          { 
            number: 999,
            chinese: '测试',
            pinyin: 'cè shì',
            english: 'test'
          }
        ])
        .select();
        
      if (insertError) {
        console.log('❌ Insert failed:', insertError.message);
        // This might be expected if the table is read-only or we lack permissions
        console.log('ℹ️  This may be expected depending on table permissions');
      } else {
        console.log('✅ Insert successful - Added test record');
        console.log('Inserted data:', insertData);
        
        // Clean up - delete the test record
        const { error: deleteError } = await supabase
          .from('taobuhid_numbers')
          .delete()
          .match({ number: 999 });
          
        if (deleteError) {
          console.log('⚠️  Warning: Could not clean up test record:', deleteError.message);
        } else {
          console.log('✅ Cleaned up test record');
        }
      }
    }
    
    console.log('\n🎉 DATABASE ACCESS TEST COMPLETE');
    console.log('===============================');
    console.log('✅ Connection to ArchAI Supabase project: ESTABLISHED');
    console.log('✅ Project reference: znizmdakncmrnowgwppu');
    console.log('✅ Table access: FUNCTIONAL');
    console.log('✅ Your ArchAI database is ready for use!');
    
    return true;
    
  } catch (error) {
    console.log('\n💥 UNEXPECTED ERROR:', error);
    return false;
  }
}

// Run the test
testKnownTable()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.log('💥 Test execution failed:', err);
    process.exit(1);
  });