/**
 * Supabase Client
 * Initialized with project credentials from environment
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

/**
 * The app must still render its public login state when a deployment is missing
 * its environment variables. Protected data calls remain disabled by AuthContext
 * until a real Supabase URL and anon key are available.
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
const clientUrl = supabaseUrl || "https://placeholder.supabase.co";
const clientAnonKey = supabaseAnonKey || "placeholder-anon-key";

export const supabase = createClient(clientUrl, clientAnonKey, {
  // The GitHub Pages build uses the tables created in the public schema.
  // The previous app schema made valid Auth sessions look like login failures.
  db: { schema: "public" },
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
