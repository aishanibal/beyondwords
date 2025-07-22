var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { createClient } from '@supabase/supabase-js';
// Supabase configuration
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
// Function to save waitlist email
export const saveWaitlistEmail = (email_1, ...args_1) => __awaiter(void 0, [email_1, ...args_1], void 0, function* (email, source = 'website') {
    try {
        const { data, error } = yield supabase
            .from('waitlist_emails')
            .insert([
            {
                email: email,
                source: source,
                created_at: new Date().toISOString()
            }
        ]);
        if (error) {
            console.error('Error saving email:', error);
            throw error;
        }
        return { success: true, data };
    }
    catch (error) {
        console.error('Supabase error:', error);
        return { success: false, error: error.message };
    }
});
// Function to get all waitlist emails (for admin purposes)
export const getWaitlistEmails = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { data, error } = yield supabase
            .from('waitlist_emails')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) {
            console.error('Error fetching emails:', error);
            throw error;
        }
        return { success: true, data };
    }
    catch (error) {
        console.error('Supabase error:', error);
        return { success: false, error: error.message };
    }
});
