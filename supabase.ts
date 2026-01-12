
import { createClient } from '@supabase/supabase-js';

// Safety check for process.env to prevent "process is not defined" error in browser ESM environments
const getEnv = (key: string): string | undefined => {
  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key];
    }
  } catch (e) {
    // Fallback if process is partially defined or proxied
  }
  return undefined;
};

const supabaseUrl = getEnv('SUPABASE_URL') || 'https://your-project.supabase.co';
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY') || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Utility for handling standard Supabase responses
export const handleResponse = <T,>(promise: Promise<{ data: T | null; error: any }>) => {
  return promise.then(({ data, error }) => {
    if (error) throw error;
    return data;
  });
};
