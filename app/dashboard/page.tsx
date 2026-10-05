"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { LaunchRow, PresetRow, listByOwner } from "@/lib/supabase/queries";
import { shorten } from "@/lib/solana/utils";

export default function Dashboard() {
  const { publicKey } = useWallet();
  const [d, setD] = useState<{ launches: LaunchRow[]; presets: PresetRow[] } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { if (publicKey) listByOwner(publicKey.toBase58()).then(setD).catch((e) => setErr(e.message)); }, [publicKey]);
  if (!publicKey) return <p className="text-sm text-mute">Connect a wallet to see your markets and presets.</p>;
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Creator dashboard</h1>
      {err && <p className="text-sm text-down">{err}</p>}
      <section><h2 className="mb-2 text-sm font-medium">My markets</h2>
        {!d?.launches.length ? <p className="text-sm text-mute">No markets yet.</p> : (
          <div className="card divide-y divide-edge">
            {d.launches.map((l) => (
              <Link key={l.id} href={`/market/${l.pool_address}`} className="grid grid-cols-2 gap-2 p-3 text-xs hover:bg-ink sm:grid-cols-5">
                <span className="font-medium">{l.name} ${l.symbol}</span><span className="font-mono">token {shorten(l.base_mint)}</span>
                <span className="font-mono">pool {shorten(l.pool_address)}</span><span className="font-mono">config {shorten(l.config_address)}</span>
                <span className="text-mute">{new Date(l.created_at).toLocaleDateString()}</span>
              </Link>
            ))}
          </div>)}
        <p className="mt-1 text-[11px] text-mute">Open a market to see live curve progress and whether it has graduated.</p>
      </section>
      <section><h2 className="mb-2 text-sm font-medium">My presets</h2>
        {!d?.presets.length ? <p className="text-sm text-mute">No presets yet.</p> : <ul className="space-y-1 text-sm">{d.presets.map((p) => <li key={p.id}>{p.name} <span className="text-mute">({p.category}, {p.is_public ? "public" : "private"})</span></li>)}</ul>}
      </section>
    </div>
  );
}
