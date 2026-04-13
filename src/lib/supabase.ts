import { createClient } from '@supabase/supabase-js';

// Placeholder for Supabase client setup.
// Replace these with your actual Supabase URL and anonymous key.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'public-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
