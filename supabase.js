// supabase.js - Supabase client configuration
// Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file.
// See README.md for full setup instructions.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// The client is always created; operations will return errors if credentials are missing.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// True when real Supabase credentials are provided via environment variables.
export const isSupabaseConfigured =
  supabaseUrl.startsWith('https://') && supabaseAnonKey.length > 0;
