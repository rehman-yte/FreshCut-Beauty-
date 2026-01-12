
import { createClient } from '@supabase/supabase-js';

// Since we're in a managed environment, we assume Supabase is configured via process.env
// Note: In a real project, these would be your actual Supabase URL and Key
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Utility for handling standard Supabase responses
export const handleResponse = <T,>(promise: Promise<{ data: T | null; error: any }>) => {
  return promise.then(({ data, error }) => {
    if (error) throw error;
    return data;
  });
};
