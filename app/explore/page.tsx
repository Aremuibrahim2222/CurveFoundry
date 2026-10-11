"use client";
import { useState } from "react";
import Link from "next/link";
import FeaturedBanner from "@/components/FeaturedBanner";
import MarketTable from "@/components/MarketTable";
import { useMarkets } from "@/hooks/useMarkets";
import { DEMO_MODE } from "@/lib/solana/utils";

const CATS = ["all", "ai", "stock", "rwa", "meme", "creator", "custom"];

export default function Markets() {
  const { rows, live, loading, err } = useMarkets();
  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");
  const trending = [...rows].sort((a, b) => (live[b.pool_address]?.progress ?? 0) - (live[a.pool_address]?.progress ?? 0)).slice(0, 10);

  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-bold text-white">Markets</h1><p className="mt-1 text-xs text-mute">Every token launched on CurveFoundry, with live curve progress.</p></div>
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
    </div>
  );
}
