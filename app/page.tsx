"use client";
import Link from "next/link";
import ProgressBar from "@/components/ProgressBar";
import { useMarkets } from "@/hooks/useMarkets";
import { NETWORK } from "@/lib/solana/utils";

const flow = [
  ["Create", "Add a picture, name and ticker."],
  ["Trade on the curve", "Price moves with every buy and sell."],
  ["Graduate", "The curve fills and the token graduates."],
  ["Trade on DAMM v2", "Liquidity moves to a Meteora DAMM v2 pool."],
];
const features = [
  ["Made for beginners", "Pick a type, add a picture and a name. We set up the curve, fees and graduation for you."],
  ["Real Meteora curves", "Every launch style maps to real Meteora Dynamic Bonding Curve settings, not a mock-up."],
  ["Fee schedules", "Start with a higher fee that steps down over time, add a dynamic fee, and share fees with the creator."],
  ["Curve preview", "See how the price moves before you launch, and try a practice trade with no real money."],
  ["Presets", "Save your market settings, or reuse settings other creators have shared."],
  ["Built-in graduation", "When the curve fills, the token graduates to a Meteora DAMM v2 pool."],
];
const styles = [
  ["Slow & steady", "Price grows gradually."],
  ["Long runway", "A longer discovery period."],
  ["Quick launch", "Reaches graduation sooner."],
  ["Small start", "A low starting market cap."],
];
const faqs = [
  ["What is a bonding curve?", "A rule built into the token's pool that sets the price from how much has been bought. You always trade against the curve."],
  ["Do I need to code?", "No. Launching takes a picture, a name and a ticker, and you approve two wallet pop-ups."],
  ["Can I lose money?", "Yes. Token prices can fall to near zero. Nothing here is financial advice."],
];

export default function Landing() {
  const { rows, live, loading } = useMarkets();
  const latest = [...rows].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 3);
  const graduated = Object.values(live).filter((l) => l.migrated).length;
  const stats = [
    ["Tokens launched", loading ? "—" : String(rows.length)],
    ["Graduated", loading ? "—" : String(graduated)],
    ["Network", NETWORK],
    ["Powered by", "Meteora"],
  ];

  return (
    <div className="space-y-14 pb-4">
      <section className="grid items-center gap-8 pt-6 lg:grid-cols-2">
        <div className="space-y-5">
          <p className="w-fit rounded-lg border border-edge px-3 py-1 text-[11px] text-mute">Built on Meteora Dynamic Bonding Curve</p>
          <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl">Design the market.<br /><span className="grad-text">Then launch the asset.</span></h1>
          <p className="max-w-lg text-sm leading-relaxed text-mute">Choose how your token launches and trades, preview how the price behaves, and go live in minutes. When it grows enough, it graduates to Meteora DAMM v2.</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/design" className="btn-primary">Design a Market</Link>
            <Link href="/explore" className="btn-ghost">Explore Markets</Link>
          </div>
        </div>
        <div className="card p-4">
          <svg viewBox="0 0 400 240" className="w-full" role="img" aria-label="Illustration of a bonding curve rising to a graduation point">
            <defs><linearGradient id="hg" x1="0" x2="1"><stop offset="0" stopColor="#8b5cf6" /><stop offset="1" stopColor="#38bdf8" /></linearGradient></defs>
            {[40, 90, 140, 190].map((y) => <line key={y} x1="20" x2="385" y1={y} y2={y} className="stroke-edge" />)}
            <path d="M20,212 C120,208 200,186 262,124 S348,34 380,22" fill="none" stroke="url(#hg)" strokeWidth="3" />
            <line x1="300" x2="300" y1="16" y2="220" stroke="#8b5cf6" strokeDasharray="4 4" />
            <circle cx="300" cy="86" r="5" fill="#34d399" className="stroke-ink" strokeWidth="2" />
            <text x="294" y="30" textAnchor="end" fontSize="10" fill="#a78bfa">Graduation → DAMM v2</text>
            <text x="200" y="236" textAnchor="middle" fontSize="10" className="fill-mute">Tokens sold along the curve</text>
          </svg>
          <p className="mt-1 text-[11px] text-mute">Illustration of a bonding curve. Real curves are previewed on the Create page.</p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(([k, v]) => <div key={k} className="card p-4"><div className="text-[11px] text-mute">{k}</div><div className="mt-1 text-lg font-bold text-white">{v}</div></div>)}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">From idea to DAMM v2</h2>
        <ol className="grid gap-3 sm:grid-cols-4">
          {flow.map(([t, d], i) => (
            <li key={t} className="card p-4"><div className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-violet/15 text-xs text-violet">{i + 1}</div><div className="text-sm text-white">{t}</div><p className="mt-1 text-xs text-mute">{d}</p></li>
          ))}
        </ol>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">Why CurveFoundry</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(([t, d]) => <div key={t} className="card p-5"><div className="text-sm text-white">{t}</div><p className="mt-2 text-xs leading-relaxed text-mute">{d}</p></div>)}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">Pick how it grows</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {styles.map(([t, d]) => <div key={t} className="card p-4"><div className="text-sm text-violet">{t}</div><p className="mt-1 text-xs text-mute">{d}</p></div>)}
        </div>
      </section>

      {latest.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between"><h2 className="text-xl font-bold text-white">Latest tokens</h2><Link href="/explore" className="text-xs text-violet underline">See all</Link></div>
          <div className="grid gap-3 sm:grid-cols-3">
            {latest.map((l) => {
              const lv = live[l.pool_address];
              return (
                <Link key={l.id} href={`/market/${l.pool_address}`} className="card flex items-center gap-3 p-4 hover:border-violet">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {l.image_url ? <img src={l.image_url} alt="" className="h-12 w-12 rounded-lg object-cover" /> : <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-panel2 text-xs text-mute">{l.symbol.slice(0, 3)}</span>}
                  <div className="min-w-0 flex-1 text-xs"><div className="truncate text-sm text-white">{l.name} <span className="text-mute">{l.symbol}</span></div><div className="mb-1 text-mute">{lv ? `${lv.progress.toFixed(1)}% to graduation` : "n/a"}</div><ProgressBar pct={lv?.progress ?? 0} /></div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">Quick answers</h2>
        {faqs.map(([q, a]) => <details key={q} className="card p-4"><summary className="cursor-pointer text-sm text-white">{q}</summary><p className="mt-2 text-xs leading-relaxed text-mute">{a}</p></details>)}
        <Link href="/about" className="text-xs text-violet underline">Read more on the About page</Link>
      </section>

      <section className="card flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div><h2 className="text-xl font-bold text-white">Ready to launch?</h2><p className="mt-1 text-xs text-mute">It takes a picture, a name and two wallet approvals.</p></div>
        <Link href="/design" className="btn-primary">Create token</Link>
      </section>
    </div>
  );
}
