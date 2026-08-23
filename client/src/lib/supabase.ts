/**
 * Supabase Client
 * Initialized with project credentials from environment
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase credentials. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: { schema: "app" },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Helper to call Edge Functions
 */
export async function callEdgeFunction<T>(
  functionName: string,
  data: Record<string, any>
): Promise<T> {
  const { data: response, error } = await supabase.functions.invoke<T>(
    functionName,
    {
      body: data,
    }
  );

  if (error) {
    throw new Error(`Edge Function error: ${error.message}`);
  }

  return response as T;
}

/**
 * Get auth token from session
 */
export async function getAuthToken(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token || null;
}
