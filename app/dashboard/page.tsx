"use client";
import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import Leaderboard from "@/components/Leaderboard";
import { useLiveMarkets } from "@/hooks/useLiveMarkets";
import { LaunchRow, PresetRow, listByOwner } from "@/lib/supabase/queries";
import { shorten } from "@/lib/solana/utils";

export default function Dashboard() {
  const { publicKey } = useWallet();
  const [d, setD] = useState<{ launches: LaunchRow[]; presets: PresetRow[] } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { if (publicKey) listByOwner(publicKey.toBase58()).then(setD).catch((e) => setErr(e.message)); }, [publicKey]);
  const launches = d?.launches ?? [];
  const { live, loading } = useLiveMarkets(launches);

  if (!publicKey) return <p className="text-sm text-mute">Connect a wallet to see your tokens and presets.</p>;
  const stats = Object.values(live);
  const tiles: [string, string][] = [
    ["Tokens created", d ? String(launches.length) : "—"],
    ["Graduated", loading || !d ? "—" : String(stats.filter((s) => s.migrated).length)],
    ["Near graduation", loading || !d ? "—" : String(stats.filter((s) => !s.migrated && s.progress >= 90).length)],
    ["Presets saved", d ? String(d.presets.length) : "—"],
  ];

  return (
    <div className="space-y-6">
      <div><h1 className="text-lg font-bold text-white">My profile</h1><p className="text-xs text-mute">{shorten(publicKey.toBase58(), 6)}</p></div>
      {err && <p className="text-sm text-down">{err}</p>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map(([k, v]) => <div key={k} className="card p-4"><div className="text-[11px] text-mute">{k}</div><div className="mt-1 text-2xl text-white">{v}</div></div>)}
      </div>
      <section className="space-y-3"><h2 className="text-lg font-bold text-white">My tokens</h2>
        <Leaderboard rows={launches} live={live} loading={loading} showCreator={false} /></section>
      <section className="space-y-3"><h2 className="text-lg font-bold text-white">My presets</h2>
        {!d?.presets.length ? <div className="card p-6 text-sm text-mute">No presets yet. Save one from the Create page.</div> : (
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[560px] text-xs">
              <thead className="border-b border-edge text-mute"><tr>{["#", "Name", "Category", "Curve", "Graduation cap", "Visibility", "Used"].map((h) => <th key={h} className="px-3 py-3 text-left font-normal">{h}</th>)}</tr></thead>
              <tbody>{d.presets.map((p, i) => (
                <tr key={p.id} className="border-b border-edge/60 last:border-0">
                  <td className="px-3 py-3 text-mute">{i + 1}</td><td className="px-3 py-3 text-white">{p.name}</td><td className="px-3 py-3">{p.category}</td>
                  <td className="px-3 py-3">{p.definition.preset}</td><td className="px-3 py-3">{p.definition.migrationMarketCap} {p.definition.quote}</td>
                  <td className="px-3 py-3">{p.is_public ? "Public" : "Private"}</td><td className="px-3 py-3">{p.usage_count}</td>
                </tr>))}</tbody>
            </table>
          </div>)}
      </section>
    </div>
  );
}
