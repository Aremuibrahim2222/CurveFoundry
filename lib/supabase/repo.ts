import { supabase } from "./client";
import type { CurveDefinition } from "../curve/definition";

export interface LaunchRow {
  pool_address: string; config_address: string; base_mint: string; quote_mint: string; creator: string;
  name: string; symbol: string; category: string; image_uri: string | null; metadata_uri: string | null;
  definition: CurveDefinition; created_at: string;
}
export interface PresetRow {
  id: string; name: string; description: string; category: string; tags: string[]; definition: CurveDefinition;
  is_public: boolean; price_usdc: number; usage_count: number; creator: string; created_at: string;
}

export const listLaunches = async (): Promise<LaunchRow[]> => {
  if (!supabase) return [];
  const { data, error } = await supabase.from("launches").select("*").order("created_at", { ascending: false }).limit(60);
  if (error) throw error;
  return (data ?? []) as LaunchRow[];
};
export const launchesByCreator = async (creator: string): Promise<LaunchRow[]> => {
  if (!supabase) return [];
  const { data, error } = await supabase.from("launches").select("*").eq("creator", creator).order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as LaunchRow[];
};
export const insertLaunch = async (row: LaunchRow) => {
  if (!supabase) return;
  const { error } = await supabase.from("launches").insert(row);
  if (error) throw error;
};
export const listPresets = async (): Promise<PresetRow[]> => {
  if (!supabase) return [];
  const { data, error } = await supabase.from("presets").select("*").eq("is_public", true).order("usage_count", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PresetRow[];
};
export const presetsByCreator = async (creator: string): Promise<PresetRow[]> => {
  if (!supabase) return [];
  const { data, error } = await supabase.from("presets").select("*").eq("creator", creator);
  if (error) throw error;
  return (data ?? []) as PresetRow[];
};
export const insertPreset = async (row: Omit<PresetRow, "id" | "created_at" | "usage_count">) => {
  if (!supabase) throw new Error("Supabase is not configured");
  const { error } = await supabase.from("presets").insert({ ...row, usage_count: 0 });
  if (error) throw error;
};
export const recordTransaction = async (row: { signature: string; pool_address: string; wallet: string; side: "buy" | "sell" }) => {
  if (!supabase) return;
  await supabase.from("transactions").insert(row);
};
