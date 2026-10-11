import Link from "next/link";
import ProgressBar from "@/components/ProgressBar";
import type { LaunchRow } from "@/lib/supabase/queries";
import type { LiveStat } from "@/hooks/useLiveMarkets";

export default function FeaturedStrip({ rows, live }: { rows: LaunchRow[]; live: Record<string, LiveStat> }) {
  if (!rows.length) return null;
  return (
    <div className="flex snap-x gap-3 overflow-x-auto pb-1">
      {rows.map((l) => {
        const s = live[l.pool_address];
        return (
          <div key={l.id} className="card relative h-48 min-w-[280px] flex-1 snap-start overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {l.image_url ? <img src={l.image_url} alt="" className="absolute inset-0 h-full w-full object-cover" /> : <div className="absolute inset-0 bg-panel2" />}
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 space-y-2 p-4">
              <div><div className="text-base font-bold text-white">{l.name}</div><div className="text-xs text-mute">${l.symbol} · {l.category}</div></div>
              {s && <div className="space-y-1"><div className="text-[11px] text-mute">{s.progress.toFixed(1)}% to DAMM v2</div><ProgressBar pct={s.progress} /></div>}
              <Link href={`/market/${l.pool_address}`} className="btn-primary inline-block !px-4 !py-2 text-xs">Trade</Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
