"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import MarketTable from "@/components/MarketTable";
import { useLiveStats } from "@/hooks/useMarkets";
import { LaunchRow, PresetRow, listByOwner } from "@/lib/supabase/queries";
import { NETWORK, shorten } from "@/lib/solana/utils";

export default function Dashboard() {
  const { publicKey } = useWallet();
  const [d, setD] = useState<{ launches: LaunchRow[]; presets: PresetRow[] } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<"tokens" | "presets">("tokens");
  const [copied, setCopied] = useState(false);
  const launches = d?.launches ?? [];
  const live = useLiveStats(launches);

  useEffect(() => { if (publicKey) listByOwner(publicKey.toBase58()).then(setD).catch((e) => setErr(e.message)); }, [publicKey]);

  if (!publicKey) return <div className="card p-8 text-center text-sm text-mute">Connect your wallet (top right) to see your profile.</div>;
  const addr = publicKey.toBase58();
  const graduated = launches.filter((l) => live[l.pool_address]?.migrated).length;

  return (
    <div className="space-y-4">
      <section className="card flex flex-wrap items-center gap-4 p-5">
        <div className="h-14 w-14 rounded-full" style={{ background: "linear-gradient(135deg,#3b9eff,#7fc0ff)" }} />
        <div className="min-w-0">
          <div className="text-lg font-bold text-white">{shorten(addr, 6)}</div>
          <div className="flex items-center gap-3 text-xs text-mute">
            <span>{NETWORK}</span>
            <button className="text-violet underline" onClick={() => { void navigator.clipboard.writeText(addr); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>{copied ? "Copied" : "Copy address"}</button>
          </div>
        </div>
        <Link href="/design" className="btn-primary ml-auto">Create token</Link>
      </section>

      <div className="grid grid-cols-3 gap-3">
        {[["Tokens created", launches.length], ["Graduated", graduated], ["Presets saved", d?.presets.length ?? 0]].map(([k, v]) => (
          <div key={k as string} className="card p-4"><div className="text-[11px] text-mute">{k}</div><div className="mt-1 text-xl font-bold text-white">{v}</div></div>
        ))}
      </div>

      {err && <p className="text-sm text-down">{err}</p>}

      <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-edge text-xs font-bold">
        <button onClick={() => setTab("tokens")} className={`py-3 ${tab === "tokens" ? "bg-violet/10 text-violet" : "bg-panel text-mute"}`}>MY TOKENS</button>
        <button onClick={() => setTab("presets")} className={`py-3 ${tab === "presets" ? "bg-violet/10 text-violet" : "bg-panel text-mute"}`}>MY PRESETS</button>
      </div>

      {tab === "tokens" ? <MarketTable rows={launches} live={live} showControls={false} /> : (
        !d?.presets.length ? <p className="text-sm text-mute">No presets yet. Save one from the Create page.</p> : (
          <div className="grid gap-3 sm:grid-cols-2">
            {d.presets.map((p) => (
              <div key={p.id} className="card p-4 text-xs">
                <div className="text-sm text-white">{p.name}</div>
                <div className="mt-1 text-mute">{p.category} · {p.definition.preset} · {p.is_public ? "public" : "private"}</div>
                <div className="mt-2">Fee {p.definition.baseFee.startingBps}→{p.definition.baseFee.endingBps} bps · graduates at {p.definition.migrationMarketCap} {p.definition.quote}</div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
