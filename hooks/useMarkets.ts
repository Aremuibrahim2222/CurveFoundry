"use client";
import { useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { NATIVE_MINT } from "@solana/spl-token";
import { useDbc } from "@/hooks/useDbc";
import { getPoolSnapshot, priceFromSnapshot } from "@/lib/meteora/dbc";
import { LaunchRow, listLaunches } from "@/lib/supabase/queries";
import { DEMO_MODE, NETWORK } from "@/lib/solana/utils";

export interface Live { progress: number; migrated: boolean; price: number; marketCap: number }

const DEMO: LaunchRow[] = [
  { id: "d1", creator: "DEMO", name: "Demo Agent", symbol: "DEMO", category: "ai", image_url: null, base_mint: "demo", pool_address: "demo1", config_address: "demo", quote: "SOL", network: NETWORK, created_at: new Date().toISOString() },
];

/** Real on-chain stats for each launch (progress, price, market cap). Skipped in demo mode. */
export function useLiveStats(rows: LaunchRow[]) {
  const { connection, client } = useDbc();
  const [live, setLive] = useState<Record<string, Live>>({});
  const key = rows.map((r) => r.pool_address).join(",");
  useEffect(() => {
    if (DEMO_MODE || !rows.length) { setLive({}); return; }
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(rows.slice(0, 30).map(async (l) => {
        try {
          const s = await getPoolSnapshot(client, connection, new PublicKey(l.pool_address));
          const [bs, qs] = await Promise.all([
            connection.getTokenSupply(s.baseMint),
            s.quoteMint.equals(NATIVE_MINT) ? Promise.resolve(null) : connection.getTokenSupply(s.quoteMint),
          ]);
          const price = priceFromSnapshot(s, bs.value.decimals, qs ? qs.value.decimals : 9);
          return [l.pool_address, { progress: s.progress > 1 ? s.progress : s.progress * 100, migrated: s.isMigrated, price, marketCap: price * (bs.value.uiAmount ?? 0) }] as const;
        } catch { return null; }
      }));
      if (!cancelled) setLive(Object.fromEntries(entries.filter((e): e is NonNullable<typeof e> => !!e)));
    })();
    return () => { cancelled = true; };
  }, [key, client, connection]); // eslint-disable-line react-hooks/exhaustive-deps
  return live;
}

export function useMarkets() {
  const [rows, setRows] = useState<LaunchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    (DEMO_MODE ? Promise.resolve(DEMO) : listLaunches(NETWORK))
      .then(setRows).catch((e) => setErr((e as Error).message)).finally(() => setLoading(false));
  }, []);
  const live = useLiveStats(rows);
  return { rows, live, loading, err };
}
