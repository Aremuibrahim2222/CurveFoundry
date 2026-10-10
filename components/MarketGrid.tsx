"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PublicKey } from "@solana/web3.js";
import ProgressBar from "@/components/ProgressBar";
import { useDbc } from "@/hooks/useDbc";
import { getPoolSnapshot } from "@/lib/meteora/dbc";
import { LaunchRow, listLaunches } from "@/lib/supabase/queries";
import { DEMO_MODE, NETWORK, shorten } from "@/lib/solana/utils";

interface Live { progress: number; migrated: boolean }
const CATS = ["all", "ai", "stock", "rwa", "meme", "creator", "custom"];
const DEMO: LaunchRow[] = [
  { id: "d1", creator: "DEMO", name: "Demo Agent", symbol: "DEMO", category: "ai", image_url: null, base_mint: "demo", pool_address: "demo1", config_address: "demo", quote: "SOL", network: NETWORK, created_at: new Date().toISOString() },
];

function ago(iso: string) {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s} sec ago`; if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`; return `${Math.floor(s / 86400)}d ago`;
}

export default function MarketGrid() {
  const { connection, client } = useDbc();
  const [rows, setRows] = useState<LaunchRow[]>([]);
  const [live, setLive] = useState<Record<string, Live>>({});
  const [q, setQ] = useState(""); const [cat, setCat] = useState("all"); const [sort, setSort] = useState("newest");
  const [err, setErr] = useState<string | null>(null); const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = DEMO_MODE ? DEMO : await listLaunches(NETWORK);
        setRows(r);
        if (!DEMO_MODE) {
          const entries = await Promise.all(r.map(async (l) => {
            try { const s = await getPoolSnapshot(client, connection, new PublicKey(l.pool_address)); return [l.pool_address, { progress: s.progress > 1 ? s.progress : s.progress * 100, migrated: s.isMigrated }] as const; }
            catch { return null; }
          }));
          setLive(Object.fromEntries(entries.filter((e): e is NonNullable<typeof e> => !!e)));
        }
      } catch (e) { setErr((e as Error).message); } finally { setLoading(false); }
    })();
  }, [client, connection]);

  const shown = useMemo(() => {
    let r = rows.filter((x) => (cat === "all" || x.category === cat) && `${x.name} ${x.symbol}`.toLowerCase().includes(q.toLowerCase()));
    if (sort === "near") r = r.filter((x) => (live[x.pool_address]?.progress ?? 0) >= 70 && !live[x.pool_address]?.migrated).sort((a, b) => (live[b.pool_address]?.progress ?? 0) - (live[a.pool_address]?.progress ?? 0));
    else if (sort === "trending") r = [...r].sort((a, b) => (live[b.pool_address]?.progress ?? 0) - (live[a.pool_address]?.progress ?? 0));
    else r = [...r].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    return r;
  }, [rows, live, q, cat, sort]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select className="field !w-auto !py-2" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="newest">Newest</option><option value="trending">Trending</option><option value="near">Near graduation</option>
        </select>
        <input className="field ml-auto !w-full sm:!w-64 !py-2" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="flex flex-wrap gap-2">{CATS.map((c) => <button key={c} onClick={() => setCat(c)} className={`pill ${cat === c ? "pill-on" : ""}`}>{c}</button>)}</div>
      {DEMO_MODE && <p className="text-xs text-amber-300">DEMO MODE: sample data, not on-chain.</p>}
      {err && <p className="text-sm text-down">{err}</p>}
      {!loading && !shown.length && <p className="text-sm text-mute">No tokens yet. <Link className="text-violet underline" href="/design">Create the first one</Link>. Listings need Supabase.</p>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((l) => {
          const lv = live[l.pool_address];
          return (
            <Link key={l.id} href={DEMO_MODE ? "#" : `/market/${l.pool_address}`} className="card block overflow-hidden transition hover:border-violet">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {l.image_url ? <img src={l.image_url} alt="" className="aspect-[4/3] w-full object-cover" /> : <div className="flex aspect-[4/3] w-full items-center justify-center bg-panel2 text-3xl font-bold text-mute">{l.symbol.slice(0, 4)}</div>}
              <div className="space-y-1.5 p-3 text-xs">
                <div className="flex justify-between gap-2"><span className="truncate text-sm text-white">{l.name} / {l.symbol}</span><span className="shrink-0 text-mute">{ago(l.created_at)}</span></div>
                <div className="flex justify-between text-mute"><span>{l.category}</span><span>by <span className="text-violet">{shorten(l.creator)}</span></span></div>
                <div className="flex justify-between"><span className="text-mute">Progress</span><span>{lv ? `${lv.progress.toFixed(2)}%` : "n/a"}</span></div>
                <ProgressBar pct={lv?.progress ?? 0} />
                {lv?.migrated && <div className="text-up">GRADUATED</div>}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
