import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let supabaseAdminClient: SupabaseClient | null = null;

export function getSupabaseAdmin() {
  if (supabaseAdminClient) {
    return supabaseAdminClient;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  }

  if (supabaseServiceRoleKey && supabaseAnonKey && supabaseServiceRoleKey === supabaseAnonKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY must be the service role key, not the anon key. Revisa tu .env');
  }

  supabaseAdminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return supabaseAdminClient;
}

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = getSupabaseAdmin();
    return Reflect.get(client, prop, receiver);
  },
  apply(_target, _thisArg, args) {
    const client = getSupabaseAdmin();
    return Reflect.apply(client as never, _thisArg, args);
  },
});
