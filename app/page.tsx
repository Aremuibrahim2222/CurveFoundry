"use client";
import Link from "next/link";
import LaunchDemo from "@/components/LaunchDemo";
import Reveal from "@/components/Reveal";
import { useMarkets } from "@/hooks/useMarkets";
import { NETWORK } from "@/lib/solana/utils";

const steps = [
  ["Add a picture and name", "Upload an image, choose a name and a ticker."],
  ["Pick how it grows", "Choose a launch style. We set the rest."],
  ["Approve and trade", "Two wallet approvals and your token is live."],
];
const faqs = [
  ["What is a bonding curve?", "A rule in the token's pool that sets the price from how much has been bought. You always trade against the curve."],
  ["What happens at graduation?", "When the curve fills, trading moves to a Meteora DAMM v2 pool."],
  ["Can I lose money?", "Yes. A token's price can fall to almost nothing. Nothing here is financial advice."],
];

export default function Landing() {
  const { rows, live } = useMarkets();
  const ticker = rows.slice(0, 12);

  return (
    <div className="space-y-20 pb-6">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="orb-a absolute -left-24 top-24 h-80 w-80 rounded-full bg-violet/20 blur-3xl" />
        <div className="orb-b absolute -right-20 top-[28rem] h-96 w-96 rounded-full bg-violet/15 blur-3xl" />
      </div>

      <section className="grid items-center gap-10 pt-8 lg:grid-cols-[1.05fr_1fr]">
        <div className="space-y-6">
          <p className="anim-up glass w-fit rounded-full border px-4 py-1.5 text-[11px] text-mute">Live on Solana {NETWORK}</p>
          <h1 className="text-4xl font-bold leading-[1.1] text-white sm:text-6xl">
            <span className="anim-up block" style={{ animationDelay: "80ms" }}>Design the market.</span>
            <span className="anim-up grad-text block" style={{ animationDelay: "200ms" }}>Then launch the asset.</span>
          </h1>
          <p className="anim-up max-w-md text-sm leading-relaxed text-mute" style={{ animationDelay: "340ms" }}>
            Pick how your token&apos;s price moves, preview it, and launch it on a Meteora bonding curve.
          </p>
          <div className="anim-up flex flex-wrap gap-3" style={{ animationDelay: "460ms" }}>
            <Link href="/design" className="btn-primary btn-shine">Design a Market</Link>
            <Link href="/explore" className="btn-ghost glass">Explore Markets</Link>
          </div>
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
        <Reveal><h2 className="text-3xl font-bold text-white">Live in minutes</h2></Reveal>
        <div className="grid gap-4 sm:grid-cols-3">
          {steps.map(([t, d], i) => (
            <Reveal key={t} delay={i * 120}><div className="glass h-full rounded-2xl border p-6"><div className="mb-4 flex h-8 w-8 items-center justify-center rounded-full bg-violet/15 text-sm text-violet">{i + 1}</div><div className="text-white">{t}</div><p className="mt-2 text-xs leading-relaxed text-mute">{d}</p></div></Reveal>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <Reveal><h2 className="text-3xl font-bold text-white">From curve to DAMM v2</h2></Reveal>
        <div className="grid gap-4 sm:grid-cols-3">
          <Reveal><div className="glass h-full rounded-2xl border p-6"><div className="text-sm text-white">Trade on the curve</div><p className="mt-2 text-xs leading-relaxed text-mute">Price moves with every buy and sell. See the estimated output and price impact before you confirm.</p></div></Reveal>
          <Reveal delay={120}><div className="glass h-full rounded-2xl border p-6"><div className="text-sm text-white">Watch it fill</div><p className="mt-2 text-xs leading-relaxed text-mute">Every token page shows how close it is to graduating.</p><div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-edge"><div className="fill-bar h-full rounded-full" style={{ background: "linear-gradient(90deg,#3b9eff,#7fc0ff)" }} /></div></div></Reveal>
          <Reveal delay={240}><div className="glass h-full rounded-2xl border p-6"><div className="text-sm text-white">Graduate</div><p className="mt-2 text-xs leading-relaxed text-mute">When the curve fills, liquidity moves to a Meteora DAMM v2 pool and trading continues.</p></div></Reveal>
        </div>
      </section>

      <section className="space-y-3">
        <Reveal><h2 className="text-3xl font-bold text-white">Good to know</h2></Reveal>
        {faqs.map(([q, a], i) => <Reveal key={q} delay={i * 60}><details className="glass rounded-2xl border p-5"><summary className="cursor-pointer text-sm text-white">{q}</summary><p className="mt-3 text-xs leading-relaxed text-mute">{a}</p></details></Reveal>)}
        <Link href="/about" className="text-xs text-violet underline">More on the About page</Link>
      </section>

      <Reveal>
        <section className="glass flex flex-col items-start gap-5 rounded-3xl border p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
          <div><h2 className="text-2xl font-bold text-white sm:text-3xl">Launch your first token.</h2><p className="mt-2 text-sm text-mute">A picture, a name and two wallet approvals.</p></div>
          <Link href="/design" className="btn-primary btn-shine">Create token</Link>
        </section>
      </Reveal>
    </div>
  );
}
