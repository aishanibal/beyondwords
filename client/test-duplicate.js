const { createClient } = require('@supabase/supabase-js');

// Supabase configuration from your .env file
const supabaseUrl = 'https://wadiibjlgmgkfxkeobwv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhZGlpYmpsZ21na2Z4a2VvYnd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjE4MzIsImV4cCI6MjA2NjUzNzgzMn0.cBfvCxsS6-708v1Yq6weV58C2Nnyr8qnUe52wCUnhdI';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Function to save waitlist email (copied from supabase.js)
const saveWaitlistEmail = async (email, source = 'website') => {
  try {
    const { data, error } = await supabase
      .from('waitlist_emails')
      .insert([
        { 
          email: email,
          source: source,
          created_at: new Date().toISOString()
        }
      ])
    
    if (error) {
      console.error('Error saving email:', error)
      
      // Check if it's a duplicate email error
      if (error.message && error.message.includes('duplicate key value violates unique constraint')) {
        return { 
          success: false, 
          error: 'This email is already on our waitlist! Thank you for your interest.' 
        }
      }
      
      throw error
    }
    
    return { success: true, data }
  } catch (error) {
    console.error('Supabase error:', error)
    
    // Check if it's a duplicate email error in the catch block too
    if (error.message && error.message.includes('duplicate key value violates unique constraint')) {
      return { 
        success: false, 
        error: 'This email is already on our waitlist! Thank you for your interest.' 
      }
    }
    
    return { success: false, error: error.message }
  }
};

async function testDuplicateEmail() {
  console.log('Testing duplicate email handling...');
  
  const testEmail = 'test-duplicate@example.com';
  
  // First insertion should succeed
  console.log('1. Testing first insertion...');
  const result1 = await saveWaitlistEmail(testEmail, 'test');
  console.log('Result 1:', result1);
  
  // Second insertion should fail with duplicate message
  console.log('2. Testing duplicate insertion...');
  const result2 = await saveWaitlistEmail(testEmail, 'test');
  console.log('Result 2:', result2);
  
  // Clean up
  console.log('3. Cleaning up test data...');
  const { error: deleteError } = await supabase
    .from('waitlist_emails')
    .delete()
    .eq('email', testEmail);
  
  if (deleteError) {
    console.error('Cleanup failed:', deleteError);
  } else {
    console.log('✅ Test data cleaned up!');
  }
  
  // Verify the duplicate detection worked
  if (result1.success && !result2.success && result2.error.includes('already on our waitlist')) {
    console.log('🎉 Duplicate email detection is working correctly!');
  } else {
    console.log('❌ Duplicate email detection failed!');
  }
}

testDuplicateEmail(); 