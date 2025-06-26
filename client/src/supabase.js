import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Function to save waitlist email
export const saveWaitlistEmail = async (email, source = 'website') => {
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
      throw error
    }
    
    return { success: true, data }
  } catch (error) {
    console.error('Supabase error:', error)
    return { success: false, error: error.message }
  }
}

// Function to get all waitlist emails (for admin purposes)
export const getWaitlistEmails = async () => {
  try {
    const { data, error } = await supabase
      .from('waitlist_emails')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching emails:', error)
      throw error
    }
    
    return { success: true, data }
  } catch (error) {
    console.error('Supabase error:', error)
    return { success: false, error: error.message }
  }
} 