import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | null = null;

function getEnv(key: string): string | undefined {
  try {
    return import.meta.env[key];
  } catch {
    // empty
  }
  try {
    return (globalThis as any).process?.env?.[key];
  } catch {
    return undefined;
  }
}

export function getSupabase(): SupabaseClient {
  if (supabaseInstance) return supabaseInstance;

  const supabaseUrl = getEnv("VITE_SUPABASE_URL");
  const supabaseAnonKey = getEnv("VITE_SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseAnonKey) {
    supabaseInstance = createClient("https://placeholder.supabase.co", "placeholder-key");
    return supabaseInstance;
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseInstance;
}