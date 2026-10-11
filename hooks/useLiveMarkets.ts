"use client";
import { useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { NATIVE_MINT } from "@solana/spl-token";
import { useDbc } from "@/hooks/useDbc";
import { getPoolSnapshot, priceFromSnapshot } from "@/lib/meteora/dbc";
import type { LaunchRow } from "@/lib/supabase/queries";

export interface LiveStat { progress: number; migrated: boolean; price: number; mcap: number }

/** Reads real on-chain state for each listed pool. Pools that fail to load are simply left out (shown as n/a). */
export function useLiveMarkets(rows: LaunchRow[], max = 20) {
  const { connection, client } = useDbc();
  const [live, setLive] = useState<Record<string, LiveStat>>({});
  const [loading, setLoading] = useState(false);
  const key = rows.map((r) => r.pool_address).join(",");

  useEffect(() => {
    let cancelled = false;
    if (!rows.length) { setLive({}); setLoading(false); return; }
    setLoading(true);
    (async () => {
      const out: Record<string, LiveStat> = {};
      await Promise.all(rows.slice(0, max).map(async (l) => {
        try {
          const s = await getPoolSnapshot(client, connection, new PublicKey(l.pool_address));
          const bs = await connection.getTokenSupply(s.baseMint);
          const qDec = s.quoteMint.equals(NATIVE_MINT) ? 9 : (await connection.getTokenSupply(s.quoteMint)).value.decimals;
          const price = priceFromSnapshot(s, bs.value.decimals, qDec);
          out[l.pool_address] = { progress: s.progress > 1 ? s.progress : s.progress * 100, migrated: s.isMigrated, price, mcap: price * (bs.value.uiAmount ?? 0) };
        } catch { /* leave out */ }
      }));
      if (!cancelled) { setLive(out); setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  return { live, loading };
}
