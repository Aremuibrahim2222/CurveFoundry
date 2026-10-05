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

export default function Explore() {
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
            try { const s = await getPoolSnapshot(client, connection, new PublicKey(l.pool_address)); return [l.pool_address, { progress: (s.progress > 1 ? s.progress : s.progress * 100), migrated: s.isMigrated }] as const; }
            catch { return null; }
          }));
          setLive(Object.fromEntries(entries.filter((e): e is NonNullable<typeof e> => !!e)));
        }
      } catch (e) { setErr((e as Error).message); } finally { setLoading(false); }
    })();
  }, [client, connection]);

  const shown = useMemo(() => {
    let r = rows.filter((x) => (cat === "all" || x.category === cat) && (`${x.name} ${x.symbol}`.toLowerCase().includes(q.toLowerCase())));
    if (sort === "near") r = r.filter((x) => (live[x.pool_address]?.progress ?? 0) >= 70 && !live[x.pool_address]?.migrated).sort((a, b) => (live[b.pool_address]?.progress ?? 0) - (live[a.pool_address]?.progress ?? 0));
    else if (sort === "trending") r = [...r].sort((a, b) => (live[b.pool_address]?.progress ?? 0) - (live[a.pool_address]?.progress ?? 0));
    else r = [...r].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    return r;
  }, [rows, live, q, cat, sort]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold">Markets</h1>
        {DEMO_MODE && <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs text-amber-300">DEMO MODE — sample data, not on-chain</span>}
        <input className="field ml-auto max-w-xs" placeholder="Search name or symbol" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="field max-w-[170px]" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="newest">Newest</option><option value="trending">Trending (by progress)</option><option value="near">Near graduation</option>
        </select>
      </div>
      <div className="flex flex-wrap gap-2">{CATS.map((c) => <button key={c} onClick={() => setCat(c)} className={`rounded-full border px-3 py-1 text-xs ${cat === c ? "border-violet text-white" : "border-edge text-mute"}`}>{c}</button>)}</div>
      {err && <p className="text-sm text-down">{err}</p>}
      {!loading && !shown.length && <p className="text-sm text-mute">No markets yet. <Link className="underline" href="/design">Design the first one</Link>. Listings need Supabase configured.</p>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((l) => {
          const lv = live[l.pool_address];
          return (
            <Link key={l.id} href={DEMO_MODE ? "#" : `/market/${l.pool_address}`} className="card block space-y-2 p-4 hover:border-violet">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {l.image_url ? <img src={l.image_url} alt="" className="h-10 w-10 rounded-md object-cover" /> : <div className="h-10 w-10 rounded-md bg-edge" />}
                <div><div className="font-medium">{l.name} <span className="text-mute">${l.symbol}</span></div><div className="text-xs text-mute">{l.category} · by {shorten(l.creator)} · {new Date(l.created_at).toLocaleDateString()}</div></div>
              </div>
              <ProgressBar pct={lv?.progress ?? 0} />
              <div className="flex justify-between text-xs text-mute"><span>{lv ? `${lv.progress.toFixed(1)}% curve` : "state unavailable"}</span><span>{lv?.migrated ? "GRADUATED" : "on curve"}</span></div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
