import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (supabaseInstance) return supabaseInstance;

  let supabaseUrl: string | undefined;
  let supabaseAnonKey: string | undefined;

  try {
    supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  } catch {
    supabaseUrl = undefined;
    supabaseAnonKey = undefined;
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    supabaseInstance = createClient("https://placeholder.supabase.co", "placeholder-key");
    return supabaseInstance;
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseInstance;
}