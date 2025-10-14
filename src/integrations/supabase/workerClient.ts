import { createClient, SupabaseClient } from '@supabase/supabase-js';

export function createWorkerSupabaseClient(supabaseUrl: string, supabaseKey: string): SupabaseClient {
  // console.log e console.error são seguros para usar em Cloudflare Workers
  // pois o ambiente WebWorker inclui o console global.
  console.log('Worker Supabase Client Init: URL =', supabaseUrl);
  console.log('Worker Supabase Client Init: Key (first 5 chars) =', supabaseKey ? supabaseKey.substring(0, 5) + '...' : 'N/A');

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase URL or Key is missing in worker environment variables.');
    throw new Error('Supabase environment variables are not set for the worker.');
  }
  return createClient(supabaseUrl, supabaseKey);
}