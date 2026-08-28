import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// -- Debug check on startup (only in development) --
if (import.meta.env.DEV) {
  if (!supabaseUrl || supabaseUrl === 'undefined') {
    console.error('[Supabase] MISSING: VITE_SUPABASE_URL is not set in your .env file');
  } else {
    console.log('[Supabase] URL loaded:', supabaseUrl);
  }

  if (!supabaseAnonKey || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY_HERE') {
    console.error('[Supabase] MISSING: VITE_SUPABASE_ANON_KEY is not set or is still a placeholder');
  } else {
    console.log('[Supabase] Anon key loaded (first 20 chars):', supabaseAnonKey.slice(0, 20) + '...');
  }
}

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Check your .env for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
