const { createClient } = require('@supabase/supabase-js');

// Supabase configuration from your .env file
const supabaseUrl = 'https://wadiibjlgmgkfxkeobwv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhZGlpYmpsZ21na2Z4a2VvYnd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjE4MzIsImV4cCI6MjA2NjUzNzgzMn0.cBfvCxsS6-708v1Yq6weV58C2Nnyr8qnUe52wCUnhdI';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSupabaseConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    // Test 1: Check if we can connect
    console.log('1. Testing basic connection...');
    const { data: testData, error: testError } = await supabase
      .from('waitlist_emails')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Connection failed:', testError.message);
      
      // Check if it's a table not found error
      if (testError.message.includes('relation "waitlist_emails" does not exist')) {
        console.log('⚠️  The waitlist_emails table does not exist. You need to run the SQL setup script.');
        console.log('Go to your Supabase dashboard → SQL Editor and run the contents of supabase_setup.sql');
      }
      return;
    }
    
    console.log('✅ Connection successful!');
    
    // Test 2: Try to insert a test email
    console.log('2. Testing email insertion...');
    const testEmail = `test-${Date.now()}@example.com`;
    const { data: insertData, error: insertError } = await supabase
      .from('waitlist_emails')
      .insert([
        { 
          email: testEmail,
          source: 'test',
          created_at: new Date().toISOString()
        }
      ]);
    
    if (insertError) {
      console.error('❌ Insert failed:', insertError.message);
      return;
    }
    
    console.log('✅ Email insertion successful!');
    
    // Test 3: Try to read the test email
    console.log('3. Testing email retrieval...');
    const { data: readData, error: readError } = await supabase
      .from('waitlist_emails')
      .select('*')
      .eq('email', testEmail);
    
    if (readError) {
      console.error('❌ Read failed:', readError.message);
      return;
    }
    
    console.log('✅ Email retrieval successful!');
    console.log('📧 Retrieved email:', readData[0]);
    
    // Clean up: Delete the test email
    console.log('4. Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('waitlist_emails')
      .delete()
      .eq('email', testEmail);
    
    if (deleteError) {
      console.error('⚠️  Cleanup failed:', deleteError.message);
    } else {
      console.log('✅ Test data cleaned up!');
    }
    
    console.log('\n🎉 All tests passed! Your Supabase setup is working correctly.');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testSupabaseConnection(); 