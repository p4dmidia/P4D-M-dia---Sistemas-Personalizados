import { createClient, SupabaseClient } from '@supabase/supabase-js';

export function createWorkerSupabaseClient(supabaseUrl: string, supabaseAnonKey: string): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase URL or Anon Key is missing in worker environment variables.');
    throw new Error('Supabase environment variables are not set for the worker.');
  }
  return createClient(supabaseUrl, supabaseAnonKey);
}