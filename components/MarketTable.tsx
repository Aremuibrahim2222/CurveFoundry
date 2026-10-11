"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProgressBar from "@/components/ProgressBar";
import { Live } from "@/hooks/useMarkets";
import { LaunchRow } from "@/lib/supabase/queries";
import { DEMO_MODE, formatCompact, shorten } from "@/lib/solana/utils";

export function ago(iso: string) {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`; if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`; return `${Math.floor(s / 86400)}d ago`;
}

interface Props { rows: LaunchRow[]; live: Record<string, Live>; category?: string; query?: string; showControls?: boolean }

export default function MarketTable({ rows, live, category = "all", query = "", showControls = true }: Props) {
  const router = useRouter();
  const [sort, setSort] = useState<"newest" | "trending" | "near">("trending");
  const shown = useMemo(() => {
    let r = rows.filter((x) => (category === "all" || x.category === category) && `${x.name} ${x.symbol}`.toLowerCase().includes(query.toLowerCase()));
    const p = (x: LaunchRow) => live[x.pool_address]?.progress ?? 0;
    if (sort === "near") r = r.filter((x) => p(x) >= 70 && !live[x.pool_address]?.migrated).sort((a, b) => p(b) - p(a));
    else if (sort === "trending") r = [...r].sort((a, b) => p(b) - p(a));
    else r = [...r].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    return r;
  }, [rows, live, category, query, sort]);

  return (
    <div className="space-y-3">
      {showControls && (
        <div className="flex flex-wrap items-center gap-2">
          {([["trending", "Trending"], ["newest", "Newest"], ["near", "Near graduation"]] as const).map(([id, l]) => (
            <button key={id} onClick={() => setSort(id)} className={`pill ${sort === id ? "pill-on" : ""}`}>{l}</button>
          ))}
          <Link href="/design" className="btn-primary ml-auto !py-2">Create token</Link>
        </div>
      )}
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-xs">
          <thead className="border-b border-edge text-mute">
            <tr>{["#", "Token", "Price", "Market cap", "Curve progress", "Status", "Creator", "Age"].map((h) => <th key={h} className="px-3 py-3 font-normal">{h}</th>)}</tr>
          </thead>
          <tbody>
            {shown.map((l, i) => {
              const lv = live[l.pool_address];
              return (
                <tr key={l.id} onClick={() => !DEMO_MODE && router.push(`/market/${l.pool_address}`)} className="cursor-pointer border-b border-edge/60 last:border-0 hover:bg-panel2">
                  <td className="px-3 py-3 text-mute">{i + 1}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {l.image_url ? <img src={l.image_url} alt="" className="h-9 w-9 rounded-lg object-cover" /> : <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-panel2 text-[10px] text-mute">{l.symbol.slice(0, 3)}</div>}
                      <div><div className="text-white">{l.name}</div><div className="text-mute">{l.symbol} · {l.category}</div></div>
                    </div>
                  </td>
                  <td className="px-3 py-3 font-mono">{lv ? `${lv.price.toPrecision(3)} ${l.quote}` : "n/a"}</td>
                  <td className="px-3 py-3 font-mono">{lv ? `${formatCompact(lv.marketCap)} ${l.quote}` : "n/a"}</td>
                  <td className="w-44 px-3 py-3"><div className="mb-1 font-mono">{lv ? `${lv.progress.toFixed(2)}%` : "n/a"}</div><ProgressBar pct={lv?.progress ?? 0} /></td>
                  <td className="px-3 py-3">{lv?.migrated ? <span className="text-up">Graduated</span> : lv && lv.progress >= 90 ? <span className="text-amber-300">Near graduation</span> : <span className="text-mute">On curve</span>}</td>
                  <td className="px-3 py-3 text-violet">{shorten(l.creator)}</td>
                  <td className="px-3 py-3 text-mute">{ago(l.created_at)}</td>
                </tr>
              );
            })}
            {!shown.length && <tr><td colSpan={8} className="px-3 py-8 text-center text-mute">No tokens found. <Link className="text-violet underline" href="/design">Create the first one</Link>.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-mute">Volume, owners and 24h change are not shown: they need an indexer. Only on-chain data is displayed.</p>
    </div>
  );
}
