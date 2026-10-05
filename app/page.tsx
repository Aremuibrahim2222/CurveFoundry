import Link from "next/link";

const lifecycle = ["Choose asset", "Design market", "Simulate", "Deploy DBC", "Trade", "Graduate", "DAMM v2"];

export default function Landing() {
  return (
    <div className="py-10">
      <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
        Design the market. <span className="grad-text">Then launch the asset.</span>
      </h1>
      <p className="mt-5 max-w-xl text-mute">
        Design custom launch mechanics, simulate price discovery, and launch assets through Meteora&apos;s Dynamic Bonding Curve.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/design" className="btn-primary">Design a Market</Link>
        <Link href="/explore" className="btn-ghost">Explore Markets</Link>
      </div>
      <ol className="mt-16 grid gap-px overflow-hidden rounded-lg border border-edge bg-edge sm:grid-cols-7">
        {lifecycle.map((s, i) => (
          <li key={s} className="bg-panel p-4 text-sm">
            <div className="text-xs text-mute">{i + 1}</div>
            <div className="mt-1">{s}</div>
          </li>
        ))}
      </ol>
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          ["Real curves", "Every preset maps to Meteora's curve builders. The chart is drawn from the config the SDK produces."],
          ["Real quotes", "Live pages quote and swap with the DBC SDK. Simulations are labeled and never sent on-chain."],
          ["Real graduation", "Pools migrate into Meteora DAMM v2 under the configured rules. Nothing is faked."],
        ].map(([t, d]) => (
          <div key={t} className="card p-4"><h3 className="font-medium">{t}</h3><p className="mt-1 text-sm text-mute">{d}</p></div>
        ))}
      </div>
    </div>
  );
}
