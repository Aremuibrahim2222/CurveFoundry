import Link from "next/link";
import MarketGrid from "@/components/MarketGrid";

const steps = [
  ["1", "Add a picture and name", "Upload an image, pick a name and symbol. That is all you need."],
  ["2", "Choose how it grows", "Pick a style. We set the curve, fees and graduation for you."],
  ["3", "Create and trade", "Approve in your wallet. Your token is live and tradable at once."],
];

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="card flex flex-col gap-5 p-6 sm:p-8">
        <h1 className="text-3xl font-bold leading-tight text-white sm:text-5xl">
          Design the market.<br /><span className="grad-text">Then launch the asset.</span>
        </h1>
        <p className="max-w-xl text-sm text-mute">
          Launch a token in minutes with no code. It trades on a Meteora bonding curve and graduates to Meteora DAMM v2 when it grows enough.
        </p>
        <div className="flex gap-3">
          <Link href="/design" className="btn-primary">Design a Market</Link>
          <a href="#how" className="btn-ghost">How it works</a>
        </div>
      </section>
      <MarketGrid />
      <section id="how" className="space-y-3">
        <h2 className="text-lg font-bold text-white">How it works</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {steps.map(([n, t, d]) => (
            <div key={n} className="card p-4"><div className="text-violet">{n}</div><div className="mt-1 text-white">{t}</div><p className="mt-1 text-xs text-mute">{d}</p></div>
          ))}
        </div>
      </section>
    </div>
  );
}
