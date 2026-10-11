"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import FeaturedStrip from "@/components/FeaturedStrip";
import Leaderboard from "@/components/Leaderboard";
import { useLiveMarkets } from "@/hooks/useLiveMarkets";
import { LaunchRow, listLaunches } from "@/lib/supabase/queries";
import { DEMO_MODE, NETWORK } from "@/lib/solana/utils";

const CATS = ["all", "ai", "stock", "rwa", "meme", "creator", "custom"];
const DEMO: LaunchRow[] = [
  { id: "d1", creator: "DEMO", name: "Demo Agent", symbol: "DEMO", category: "ai", image_url: null, base_mint: "demo", pool_address: "demo1", config_address: "demo", quote: "SOL", network: NETWORK, created_at: new Date().toISOString() },
];

export default function Home() {
  const [rows, setRows] = useState<LaunchRow[]>([]);
  const [cat, setCat] = useState("all");
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { (DEMO_MODE ? Promise.resolve(DEMO) : listLaunches(NETWORK)).then(setRows).catch((e) => setErr(e.message)); }, []);
  const { live, loading } = useLiveMarkets(DEMO_MODE ? [] : rows);

  const byProgress = useMemo(() => [...rows].sort((a, b) => (live[b.pool_address]?.progress ?? -1) - (live[a.pool_address]?.progress ?? -1)), [rows, live]);
  const featured = byProgress.slice(0, 3);
  const trending = byProgress.slice(0, 6);
  const shown = rows.filter((r) => cat === "all" || r.category === cat);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 py-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl">Design the market.<br /><span className="grad-text">Then launch the asset.</span></h1>
          <p className="mt-2 max-w-md text-sm text-mute">Launch a token with no code. It trades on a Meteora bonding curve, then graduates to DAMM v2.</p>
        </div>
        <div className="flex gap-2"><Link href="/design" className="btn-primary">Create token</Link><Link href="/explore" className="btn-ghost">Explore</Link></div>
      </section>

      {DEMO_MODE && <p className="text-xs text-amber-300">DEMO MODE: sample data, not on-chain.</p>}
      {err && <p className="text-sm text-down">{err}</p>}
      <FeaturedStrip rows={featured} live={live} />

      {trending.some((t) => live[t.pool_address]) && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {trending.map((t) => { const s = live[t.pool_address]; return s ? (
            <Link key={t.id} href={`/market/${t.pool_address}`} className="pill flex shrink-0 items-center gap-2 !text-white">
              <span>{t.name}</span><span className="text-mute">{s.price.toPrecision(3)} {t.quote}</span><span className="text-violet">{s.progress.toFixed(0)}%</span>
            </Link>) : null; })}
        </div>
      )}

      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="mr-2 text-lg font-bold text-white">Top tokens</h2>
          {CATS.map((c) => <button key={c} onClick={() => setCat(c)} className={`pill ${cat === c ? "pill-on" : ""}`}>{c}</button>)}
          <Link href="/design" className="btn-ghost ml-auto !py-2">Create token</Link>
        </div>
        <Leaderboard rows={shown} live={live} loading={loading} disableLinks={DEMO_MODE} />
      </section>
    </div>
  );
}
