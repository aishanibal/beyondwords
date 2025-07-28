/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@supabase/supabase-js';

// TODO: Ensure .env.local uses NEXT_PUBLIC_ variables for Next.js.
// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Function to save waitlist email
export const saveWaitlistEmail = async (email: string, source: string = 'website'):
  Promise<{ success: boolean; data?: any; error?: string }> => {
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
  } catch (error: any) {
    console.error('Supabase error:', error)
    return { success: false, error: error.message }
  }
}

// Function to get all waitlist emails (for admin purposes)
export const getWaitlistEmails = async ():
  Promise<{ success: boolean; data?: any; error?: string }> => {
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
  } catch (error: any) {
    console.error('Supabase error:', error)
    return { success: false, error: error.message }
  }
} 