"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ProgressBar from "@/components/ProgressBar";
import type { LaunchRow } from "@/lib/supabase/queries";
import type { LiveStat } from "@/hooks/useLiveMarkets";
import { formatCompact, shorten } from "@/lib/solana/utils";

type SortKey = "progress" | "mcap" | "price" | "new";

function ago(iso: string) {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m`; if (s < 86400) return `${Math.floor(s / 3600)}h`; return `${Math.floor(s / 86400)}d`;
}

interface Props { rows: LaunchRow[]; live: Record<string, LiveStat>; loading: boolean; showCreator?: boolean; disableLinks?: boolean }

export default function Leaderboard({ rows, live, loading, showCreator = true, disableLinks }: Props) {
  const router = useRouter();
  const [sort, setSort] = useState<SortKey>("progress");
  const sorted = useMemo(() => {
    const v = (l: LaunchRow) => (sort === "new" ? +new Date(l.created_at) : (live[l.pool_address]?.[sort] ?? -1));
    return [...rows].sort((a, b) => v(b) - v(a));
  }, [rows, live, sort]);

  const Th = ({ k, children, right }: { k?: SortKey; children: React.ReactNode; right?: boolean }) => (
    <th className={`px-3 py-3 font-normal ${right ? "text-right" : "text-left"} ${k ? "cursor-pointer hover:text-white" : ""}`} onClick={k ? () => setSort(k) : undefined}>
      {children}{k && sort === k ? " ▼" : ""}
    </th>
  );

  if (!rows.length) return <div className="card p-6 text-sm text-mute">{loading ? "Loading…" : "No tokens yet."}</div>;

  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[760px] text-xs">
        <thead className="border-b border-edge text-mute">
          <tr>
            <Th>#</Th><Th>Token</Th><Th k="price" right>Price</Th><Th k="mcap" right>Market cap</Th>
            <Th k="progress">Curve progress</Th><Th>Status</Th>{showCreator && <Th>Creator</Th>}<Th k="new" right>Age</Th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((l, i) => {
            const s = live[l.pool_address];
            return (
              <tr key={l.id} onClick={disableLinks ? undefined : () => router.push(`/market/${l.pool_address}`)} className={`border-b border-edge/60 last:border-0 ${disableLinks ? "" : "cursor-pointer hover:bg-panel2"}`}>
                <td className="px-3 py-3 text-mute">{i + 1}</td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {l.image_url ? <img src={l.image_url} alt="" className="h-9 w-9 rounded-lg object-cover" /> : <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-panel2 text-[10px] text-mute">{l.symbol.slice(0, 3)}</div>}
                    <div><div className="text-sm text-white">{l.name}</div><div className="text-mute">${l.symbol} · {l.category}</div></div>
                  </div>
                </td>
                <td className="px-3 py-3 text-right font-mono">{s ? `${s.price.toPrecision(4)} ${l.quote}` : "n/a"}</td>
                <td className="px-3 py-3 text-right font-mono">{s ? `${formatCompact(s.mcap)} ${l.quote}` : "n/a"}</td>
                <td className="w-48 px-3 py-3">{s ? <div className="space-y-1"><div className="text-mute">{s.progress.toFixed(1)}%</div><ProgressBar pct={s.progress} /></div> : <span className="text-mute">n/a</span>}</td>
                <td className="px-3 py-3">{s ? (s.migrated ? <span className="text-up">Graduated</span> : s.progress >= 90 ? <span className="text-amber-300">Near graduation</span> : <span className="text-mute">On curve</span>) : <span className="text-mute">—</span>}</td>
                {showCreator && <td className="px-3 py-3 text-violet">{shorten(l.creator)}</td>}
                <td className="px-3 py-3 text-right text-mute">{ago(l.created_at)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="border-t border-edge px-3 py-2 text-[11px] text-mute">Price and market cap are read from the chain. 24h change and volume need an indexer and are not shown.</p>
    </div>
  );
}
