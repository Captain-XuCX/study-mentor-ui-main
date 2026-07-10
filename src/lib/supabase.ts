import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | null = null;

function getEnv(key: string): string | undefined {
  if (typeof process !== "undefined" && process.env) {
    return process.env[key];
  }
  try {
    return import.meta.env[key];
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