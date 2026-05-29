import { createClient } from '@supabase/supabase-js';

// Supabase configuration
// Project URL is decoded from the JWT ref parameter: rrfldkxgwbcclpchuyxef
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://rrfldkxgwbcclpchuyxef.supabase.co';

// public-anon-key provided by the user
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJyZmxka3hnd2JjbHBjaHV5eGVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4Njg2MTMsImV4cCI6MjA5NTQ0NDYxM30.NXfxKJMAtwX90CqPRu-wg_PLqxaMGrvfUPloJkTD9I4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function getSupabaseConfig() {
  return {
    url: supabaseUrl,
    projectRef: 'rrfldkxgwbcclpchuyxef',
    hasKey: !!supabaseAnonKey,
  };
}
