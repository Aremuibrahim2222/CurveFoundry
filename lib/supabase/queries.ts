import { getSupabase } from "./client";
import type { CurveDefinition } from "@/lib/curve/definition";

export interface LaunchRow {
  id: string; creator: string; name: string; symbol: string; category: string; image_url: string | null;
  base_mint: string; pool_address: string; config_address: string; quote: string; network: string; created_at: string;
}
export interface PresetRow {
  id: string; owner: string; name: string; description: string | null; category: string; tags: string[];
  is_public: boolean; price_sol: number; usage_count: number; definition: CurveDefinition; created_at: string;
}

const need = () => { const s = getSupabase(); if (!s) throw new Error("Supabase is not configured"); return s; };

export async function listLaunches(network: string): Promise<LaunchRow[]> {
  const s = getSupabase(); if (!s) return [];
  const { data, error } = await s.from("launches").select("*").eq("network", network).order("created_at", { ascending: false }).limit(100);
  if (error) throw error; return (data ?? []) as LaunchRow[];
}
export async function insertLaunch(row: Omit<LaunchRow, "id" | "created_at">) {
  const { error } = await need().from("launches").insert(row); if (error) throw error;
}
export async function listPresets(): Promise<PresetRow[]> {
  const s = getSupabase(); if (!s) return [];
  const { data, error } = await s.from("presets").select("*").eq("is_public", true).order("usage_count", { ascending: false });
  if (error) throw error; return (data ?? []) as PresetRow[];
}
export async function insertPreset(row: Omit<PresetRow, "id" | "created_at" | "usage_count">) {
  const { error } = await need().from("presets").insert(row); if (error) throw error;
}
export async function listByOwner(wallet: string) {
  const s = need();
  const [l, p] = await Promise.all([
    s.from("launches").select("*").eq("creator", wallet).order("created_at", { ascending: false }),
    s.from("presets").select("*").eq("owner", wallet).order("created_at", { ascending: false }),
  ]);
  return { launches: (l.data ?? []) as LaunchRow[], presets: (p.data ?? []) as PresetRow[] };
}
export async function recordTransaction(row: { signature: string; pool_address: string; wallet: string; side: string }) {
  const s = getSupabase(); if (!s) return; await s.from("transactions").upsert(row);
}
