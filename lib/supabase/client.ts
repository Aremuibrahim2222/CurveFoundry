import { createClient, SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;
export function getSupabase(): SupabaseClient | null {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!raw || !key) return null;
  let url: string;
  try { url = new URL(raw).origin; } catch { return null; }
  return (client ??= createClient(url, key));
}
