import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const hasValidConfig = supabaseUrl && supabaseUrl.startsWith('https://') && supabaseAnonKey;

export const supabase = hasValidConfig
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signOut: () => Promise.resolve({ error: null }),
        signInWithPassword: () => Promise.resolve({ error: { message: 'Supabase not configured' } }),
        signUp: () => Promise.resolve({ error: { message: 'Supabase not configured' } }),
      },
      from: () => ({ select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }) }) }) }),
    };
