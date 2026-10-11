"use client";
import Link from "next/link";
import LaunchDemo from "@/components/LaunchDemo";
import ProgressBar from "@/components/ProgressBar";
import Reveal from "@/components/Reveal";
import { useMarkets } from "@/hooks/useMarkets";
import { NETWORK } from "@/lib/solana/utils";

const steps = [
  ["Add a picture and name", "Upload an image, then choose a name and a ticker."],
  ["Pick how it grows", "Choose a launch style. We set the curve, fees and graduation for you."],
  ["Approve and trade", "Approve two wallet pop-ups. Your token is live and tradable right away."],
];
const features = [
  ["Launch styles", "Four starting points that map to real Meteora curve settings. Switch to Advanced to set every number yourself."],
  ["Fee schedules", "Start with a higher trading fee that steps down over time, add a dynamic fee, and share fees with the creator."],
  ["Curve preview", "See how the price moves along the curve before you launch anything."],
  ["Practice trades", "Try a buy in a clearly labeled simulation. No wallet, no money."],
  ["Presets", "Save your settings as a preset, or reuse settings other creators have shared."],
  ["Creator dashboard", "Track your tokens, their curve progress and whether they have graduated."],
];
const faqs = [
  ["What is a bonding curve?", "A rule built into the token's pool that sets the price from how much has been bought. There is no order book: you always trade against the curve."],
  ["What happens at graduation?", "Once enough has been bought to hit the graduation target, trading moves from the curve to a Meteora DAMM v2 pool. On mainnet, standard pools migrate automatically; custom thresholds may need a manual step."],
  ["Do you hold my funds?", "No. We never ask for your private key or seed phrase, and nothing is signed unless you approve it in your own wallet."],
  ["Can I change a token after launch?", "No. The name, ticker, image and market settings are fixed once the token is created, so check them first."],
  ["Can I lose money?", "Yes. A token's price can fall to almost nothing. Only use money you can afford to lose. Nothing here is financial advice."],
];

function Part({ n, tag, title, bullets, children, flip }: { n: string; tag: string; title: string; bullets: string[]; children: React.ReactNode; flip?: boolean }) {
  return (
    <div className="grid items-center gap-8 lg:grid-cols-2">
      <Reveal className={flip ? "lg:order-2" : ""}>
        <p className="text-xs text-violet">Part {n} · {tag}</p>
        <h3 className="mt-2 text-2xl font-bold text-white">{title}</h3>
        <ul className="mt-4 space-y-2 text-sm text-mute">{bullets.map((b) => <li key={b} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet" />{b}</li>)}</ul>
      </Reveal>
      <Reveal delay={120}>{children}</Reveal>
    </div>
  );
}

export default function Landing() {
  const { rows, live, loading } = useMarkets();
  const ticker = rows.slice(0, 12);
  const graduated = Object.values(live).filter((l) => l.migrated).length;

  return (
    <div className="space-y-24 pb-6">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="orb-a absolute -left-24 top-24 h-80 w-80 rounded-full bg-violet/20 blur-3xl" />
        <div className="orb-b absolute -right-20 top-[28rem] h-96 w-96 rounded-full bg-violet/15 blur-3xl" />
      </div>

      <section className="grid items-center gap-10 pt-8 lg:grid-cols-[1.05fr_1fr]">
        <div className="space-y-6">
          <p className="anim-up glass w-fit rounded-full border px-4 py-1.5 text-[11px] text-mute" style={{ animationDelay: "0ms" }}>Live on Solana {NETWORK}</p>
          <h1 className="text-4xl font-bold leading-[1.1] text-white sm:text-6xl">
            <span className="anim-up block" style={{ animationDelay: "80ms" }}>Design the market.</span>
            <span className="anim-up grad-text block" style={{ animationDelay: "200ms" }}>Then launch the asset.</span>
          </h1>
          <p className="anim-up max-w-lg text-sm leading-relaxed text-mute" style={{ animationDelay: "340ms" }}>
            Choose how your token&apos;s price moves, preview it before you spend anything, and launch it on a Meteora bonding curve. When the curve fills, the token moves to a DAMM v2 pool.
          </p>
          <div className="anim-up flex flex-wrap gap-3" style={{ animationDelay: "460ms" }}>
            <Link href="/design" className="btn-primary btn-shine">Design a Market</Link>
            <Link href="/explore" className="btn-ghost glass">Explore Markets</Link>
          </div>
          <p className="anim-up text-[11px] text-mute" style={{ animationDelay: "560ms" }}>No code · Two wallet approvals · Your keys stay in your wallet</p>
        </div>
        <div className="anim-up" style={{ animationDelay: "300ms" }}><LaunchDemo /></div>
      </section>

      {ticker.length > 0 && (
        <section aria-label="Latest tokens" className="overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
          <div className="marquee gap-3">
            {[...ticker, ...ticker].map((t, i) => {
              const lv = live[t.pool_address];
              return (
                <Link key={`${t.id}-${i}`} href={`/market/${t.pool_address}`} className="glass mr-3 flex shrink-0 items-center gap-3 rounded-xl border px-4 py-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {t.image_url ? <img src={t.image_url} alt="" className="h-8 w-8 rounded-lg object-cover" /> : <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-panel2 text-[10px] text-mute">{t.symbol.slice(0, 3)}</span>}
                  <span className="text-xs"><span className="block text-white">{t.name}</span><span className="text-mute">{lv ? `${lv.progress.toFixed(0)}% to graduation` : t.symbol}</span></span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section className="space-y-6">
        <Reveal><h2 className="text-3xl font-bold text-white">Live in minutes.</h2><p className="mt-2 text-sm text-mute">Three steps from an idea to a token people can trade.</p></Reveal>
        <div className="grid gap-4 sm:grid-cols-3">
          {steps.map(([t, d], i) => (
            <Reveal key={t} delay={i * 120}><div className="glass h-full rounded-2xl border p-6"><div className="mb-4 flex h-8 w-8 items-center justify-center rounded-full bg-violet/15 text-sm text-violet">{i + 1}</div><div className="text-white">{t}</div><p className="mt-2 text-xs leading-relaxed text-mute">{d}</p></div></Reveal>
          ))}
        </div>
        <Reveal><div className="grid grid-cols-3 gap-3 text-center">
          {[["Tokens launched", loading ? "—" : String(rows.length)], ["Graduated", loading ? "—" : String(graduated)], ["Network", NETWORK]].map(([k, v]) => (
            <div key={k} className="glass rounded-xl border p-4"><div className="text-[11px] text-mute">{k}</div><div className="mt-1 text-lg font-bold text-white">{v}</div></div>
          ))}
        </div></Reveal>
      </section>

      <section className="space-y-20">
        <Part n="01" tag="Create" title="Pick the mechanics, not just the name" bullets={["Four launch styles that map to real Meteora curve settings", "Preview the curve and try a practice trade before launching", "Open Advanced to set supply, fees and graduation yourself"]}>
          <div className="glass rounded-2xl border p-5">
            <span className="rounded-lg bg-panel2/70 px-2 py-1 text-[10px] text-mute">EXAMPLE</span>
            <div className="mt-3 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-dashed border-edge text-[10px] text-mute">Image</div>
              <div className="flex-1 space-y-2"><div className="rounded-lg border border-edge bg-panel2/70 px-3 py-2 text-xs text-mute">Name</div><div className="rounded-lg border border-edge bg-panel2/70 px-3 py-2 text-xs text-mute">Ticker</div></div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2"><span className="pill pill-on">Slow &amp; steady</span><span className="pill">Long runway</span><span className="pill">Quick launch</span></div>
            <div className="btn-primary mt-4 text-center">Create token</div>
          </div>
        </Part>
        <Part n="02" tag="Trade" title="Buy and sell on the curve from day one" bullets={["The price moves with every trade", "See the estimated output, price impact and minimum received before you confirm", "Every transaction links to Solana Explorer"]} flip>
          <div className="glass rounded-2xl border p-5">
            <span className="rounded-lg bg-panel2/70 px-2 py-1 text-[10px] text-mute">EXAMPLE</span>
            <div className="mt-3 grid grid-cols-2 overflow-hidden rounded-lg border border-edge text-xs font-bold"><div className="bg-violet/10 py-2 text-center text-violet">BUY</div><div className="py-2 text-center text-mute">SELL</div></div>
            <div className="mt-3 rounded-lg border border-edge bg-panel2/70 px-3 py-2 text-xs text-mute">Amount in SOL</div>
            <div className="mt-2 grid grid-cols-4 gap-2 text-center text-xs">{["0.05", "0.2", "1", "2"].map((q) => <span key={q} className="pill !px-1">{q}</span>)}</div>
            <dl className="mt-3 space-y-1 text-xs">{["Estimated output", "Minimum received", "Price impact"].map((k) => <div key={k} className="flex justify-between"><dt className="text-mute">{k}</dt><dd className="text-mute">calculated live</dd></div>)}</dl>
          </div>
        </Part>
        <Part n="03" tag="Graduate" title="When the curve fills, liquidity moves to DAMM v2" bullets={["Graduation progress is visible on every token page", "Standard pools migrate automatically on mainnet; custom thresholds may need a manual step", "The token keeps trading after it graduates"]}>
          <div className="glass rounded-2xl border p-5">
            <span className="rounded-lg bg-panel2/70 px-2 py-1 text-[10px] text-mute">EXAMPLE</span>
            <div className="mt-4 flex justify-between text-xs"><span className="text-mute">Bonding curve</span><span className="text-white">100% → DAMM v2</span></div>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-edge"><div className="fill-bar h-full rounded-full" style={{ background: "linear-gradient(90deg,#3b9eff,#7fc0ff)" }} /></div>
            <p className="mt-3 text-xs text-up">GRADUATED · now trading through Meteora DAMM v2</p>
          </div>
        </Part>
      </section>

      <section className="space-y-6">
        <Reveal><h2 className="text-3xl font-bold text-white">What you get</h2></Reveal>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(([t, d], i) => <Reveal key={t} delay={(i % 3) * 100}><div className="glass h-full rounded-2xl border p-5"><div className="text-sm text-white">{t}</div><p className="mt-2 text-xs leading-relaxed text-mute">{d}</p></div></Reveal>)}
        </div>
      </section>

      {ticker.length > 0 && (
        <section className="space-y-4">
          <Reveal><div className="flex items-center justify-between"><h2 className="text-2xl font-bold text-white">Latest tokens</h2><Link href="/explore" className="text-xs text-violet underline">See all</Link></div></Reveal>
          <div className="grid gap-3 sm:grid-cols-3">
            {[...rows].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 3).map((l, i) => {
              const lv = live[l.pool_address];
              return (
                <Reveal key={l.id} delay={i * 100}>
                  <Link href={`/market/${l.pool_address}`} className="glass flex items-center gap-3 rounded-2xl border p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {l.image_url ? <img src={l.image_url} alt="" className="h-12 w-12 rounded-lg object-cover" /> : <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-panel2 text-xs text-mute">{l.symbol.slice(0, 3)}</span>}
                    <div className="min-w-0 flex-1 text-xs"><div className="truncate text-sm text-white">{l.name} <span className="text-mute">{l.symbol}</span></div><div className="mb-1 text-mute">{lv ? `${lv.progress.toFixed(1)}% to graduation` : "n/a"}</div><ProgressBar pct={lv?.progress ?? 0} /></div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <Reveal><h2 className="text-3xl font-bold text-white">Good to know</h2></Reveal>
        {faqs.map(([q, a], i) => <Reveal key={q} delay={i * 60}><details className="glass rounded-2xl border p-5"><summary className="cursor-pointer text-sm text-white">{q}</summary><p className="mt-3 text-xs leading-relaxed text-mute">{a}</p></details></Reveal>)}
        <Link href="/about" className="text-xs text-violet underline">More on the About page</Link>
      </section>

      <Reveal>
        <section className="glass flex flex-col items-start gap-5 rounded-3xl border p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
          <div><h2 className="text-2xl font-bold text-white sm:text-3xl">Launch your first token.</h2><p className="mt-2 text-sm text-mute">It takes a picture, a name and two wallet approvals.</p></div>
          <Link href="/design" className="btn-primary btn-shine">Create token</Link>
        </section>
      </Reveal>
    </div>
  );
}
