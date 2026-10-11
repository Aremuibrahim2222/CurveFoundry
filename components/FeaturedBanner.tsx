"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Live } from "@/hooks/useMarkets";
import { LaunchRow } from "@/lib/supabase/queries";
import { DEMO_MODE, formatCompact } from "@/lib/solana/utils";

export default function FeaturedBanner({ rows, live }: { rows: LaunchRow[]; live: Record<string, Live> }) {
  const top = useMemo(
    () => [...rows].sort((a, b) => (live[b.pool_address]?.progress ?? 0) - (live[a.pool_address]?.progress ?? 0)).slice(0, 3),
    [rows, live],
  );
  const [i, setI] = useState(0);
  useEffect(() => {
    if (top.length < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % top.length), 6000);
    return () => clearInterval(t);
  }, [top.length]);

  if (!top.length) {
    return (
      <section className="card flex flex-col items-start gap-4 p-6 sm:p-10">
        <p className="text-xs text-violet">Built on Meteora Dynamic Bonding Curve</p>
        <h2 className="text-2xl font-bold text-white sm:text-4xl">Launch the first token</h2>
        <p className="max-w-md text-sm text-mute">Add a picture and a name. Your token trades on a bonding curve and graduates to Meteora DAMM v2.</p>
        <Link href="/design" className="btn-primary">Create token</Link>
      </section>
    );
  }
  const cur = top[Math.min(i, top.length - 1)];
  const lv = live[cur.pool_address];
  return (
    <section className="card relative overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {cur.image_url && <img src={cur.image_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30 blur-sm" />}
      <div className="relative flex min-h-[220px] flex-col justify-between gap-6 bg-gradient-to-r from-ink/90 to-transparent p-6 sm:min-h-[280px] sm:flex-row sm:items-end sm:p-8">
        <div className="space-y-3">
          <span className="rounded-lg bg-violet/15 px-2 py-1 text-[11px] text-violet">Featured</span>
          <h2 className="text-2xl font-bold text-white sm:text-4xl">{cur.name} <span className="text-mute">{cur.symbol}</span></h2>
          <p className="text-sm text-mute">{lv ? `${lv.progress.toFixed(1)}% to graduation · market cap ${formatCompact(lv.marketCap)} ${cur.quote}` : "Live stats unavailable"}</p>
          <Link href={DEMO_MODE ? "#" : `/market/${cur.pool_address}`} className="btn-primary inline-block">Trade token</Link>
        </div>
        <div className="flex gap-2">
          {top.map((t, k) => (
            <button key={t.id} onClick={() => setI(k)} aria-label={`Show ${t.name}`} className={`h-14 w-14 overflow-hidden rounded-lg border ${k === i ? "border-violet" : "border-edge opacity-70"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {t.image_url ? <img src={t.image_url} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center bg-panel2 text-[10px] text-mute">{t.symbol.slice(0, 3)}</span>}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
