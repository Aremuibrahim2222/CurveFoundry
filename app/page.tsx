"use client";
import { useState } from "react";
import Link from "next/link";
import FeaturedBanner from "@/components/FeaturedBanner";
import MarketTable from "@/components/MarketTable";
import { useMarkets } from "@/hooks/useMarkets";
import { DEMO_MODE, formatCompact } from "@/lib/solana/utils";

const CATS = ["all", "ai", "stock", "rwa", "meme", "creator", "custom"];
const steps = [
  ["1", "Add a picture and name", "Upload an image, pick a name and ticker. That is all you need."],
  ["2", "Choose how it grows", "Pick a style. We set the curve, fees and graduation for you."],
  ["3", "Create and trade", "Approve in your wallet. Your token is live and tradable at once."],
];

export default function Home() {
  const { rows, live, loading, err } = useMarkets();
  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");
  const trending = [...rows].sort((a, b) => (live[b.pool_address]?.progress ?? 0) - (live[a.pool_address]?.progress ?? 0)).slice(0, 10);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Design the market. <span className="grad-text">Then launch the asset.</span></h1>
        <p className="mt-1 text-xs text-mute">Launch tokens on Meteora&apos;s bonding curve. They graduate to Meteora DAMM v2 automatically.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {CATS.map((c) => <button key={c} onClick={() => setCat(c)} className={`pill ${cat === c ? "pill-on" : ""}`}>{c === "all" ? "All" : c}</button>)}
        <input className="field ml-auto !w-full !py-2 sm:!w-64" placeholder="Search tokens…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {DEMO_MODE && <p className="text-xs text-amber-300">DEMO MODE: sample data, not on-chain.</p>}
      {err && <p className="text-sm text-down">{err}</p>}

      <FeaturedBanner rows={rows} live={live} />

      {trending.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {trending.map((t) => {
            const lv = live[t.pool_address];
            return (
              <Link key={t.id} href={DEMO_MODE ? "#" : `/market/${t.pool_address}`} className="card flex shrink-0 items-center gap-3 px-3 py-2 hover:border-violet">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {t.image_url ? <img src={t.image_url} alt="" className="h-8 w-8 rounded-lg object-cover" /> : <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-panel2 text-[10px] text-mute">{t.symbol.slice(0, 3)}</span>}
                <span className="text-xs"><span className="block text-white">{t.name}</span><span className="text-mute">{lv ? `${lv.price.toPrecision(3)} ${t.quote} · ${lv.progress.toFixed(0)}%` : "n/a"}</span></span>
              </Link>
            );
          })}
        </div>
      )}

      {loading ? <p className="text-sm text-mute">Loading markets…</p> : <MarketTable rows={rows} live={live} category={cat} query={q} />}

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">How it works</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {steps.map(([n, t, d]) => (
            <div key={n} className="card p-4"><div className="text-violet">{n}</div><div className="mt-1 text-white">{t}</div><p className="mt-1 text-xs text-mute">{d}</p></div>
          ))}
        </div>
        <p className="text-[11px] text-mute">{rows.length} token{rows.length === 1 ? "" : "s"} listed{rows.length ? ` · total market cap ${formatCompact(Object.values(live).reduce((a, x) => a + x.marketCap, 0))} (SOL-quoted tokens)` : ""}.</p>
      </section>
    </div>
  );
}
