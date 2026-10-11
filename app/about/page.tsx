import Link from "next/link";

export const metadata = { title: "About CurveFoundry", description: "What CurveFoundry is, how a launch works, and what is live today." };

const steps = [
  ["Add a picture, name and ticker", "Upload an image and choose a name and ticker."],
  ["Choose how it grows", "Pick a launch style. Advanced users can change every setting."],
  ["Create the token", "Approve two wallet pop-ups: market settings first, then your token."],
  ["Trade, then graduate", "People trade on the curve. When it fills, liquidity moves to Meteora DAMM v2."],
];
const styles = [
  ["Slow & steady", "Price grows gradually."],
  ["Long runway", "A longer discovery period."],
  ["Quick launch", "Reaches graduation sooner."],
  ["Small start", "A low starting market cap."],
];
const faqs = [
  ["What is a bonding curve?", "A rule in the token's pool that sets the price from how much has been bought. There is no order book: you always trade against the curve."],
  ["Is migration automatic?", "On mainnet, Meteora's keepers migrate pools that meet their standard thresholds. Custom thresholds may need a manual migration. On devnet, migrate with Meteora's migrator tool."],
  ["Can I change a token after creating it?", "No. Name, ticker, image and market settings are fixed once it is created."],
  ["Do you hold my funds or keys?", "No. We never ask for your private key or seed phrase, and nothing is signed without your approval."],
  ["Can I lose money?", "Yes. Prices can fall to almost nothing. Nothing here is financial advice."],
];

export default function About() {
  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <section className="space-y-3">
        <p className="text-xs text-violet">About</p>
        <h1 className="text-3xl font-bold text-white sm:text-4xl">Design the market. <span className="grad-text">Then launch the asset.</span></h1>
        <p className="text-sm text-mute">CurveFoundry lets you choose how a token launches and trades, preview it, and launch it on Meteora&apos;s Dynamic Bonding Curve. When the curve fills, the token graduates to a Meteora DAMM v2 pool.</p>
        <div className="flex gap-3"><Link href="/design" className="btn-primary">Create token</Link><Link href="/explore" className="btn-ghost">Explore markets</Link></div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">How a launch works</h2>
        <ol className="space-y-2">
          {steps.map(([t, d], i) => (
            <li key={t} className="card flex gap-4 p-4"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet/15 text-xs text-violet">{i + 1}</span><div><div className="text-sm text-white">{t}</div><p className="mt-1 text-xs text-mute">{d}</p></div></li>
          ))}
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">Launch styles</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {styles.map(([t, d]) => <div key={t} className="card p-4"><div className="text-sm text-violet">{t}</div><p className="mt-1 text-xs text-mute">{d}</p></div>)}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">What is live today</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="card p-4 text-xs"><div className="mb-2 text-sm text-up">Working</div><ul className="space-y-1 text-mute"><li>Create a token with a curve preview</li><li>Buy and sell on the curve</li><li>Graduation progress and presets</li></ul></div>
          <div className="card p-4 text-xs"><div className="mb-2 text-sm text-amber-300">Early or coming</div><ul className="space-y-1 text-mute"><li>Runs on devnet while we test</li><li>Volume and holders need an indexer</li><li>Paid presets</li></ul></div>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold text-white">Questions</h2>
        {faqs.map(([q, a]) => <details key={q} className="card p-4"><summary className="cursor-pointer text-sm text-white">{q}</summary><p className="mt-2 text-xs leading-relaxed text-mute">{a}</p></details>)}
      </section>

      <p className="text-[11px] text-mute">CurveFoundry is software, not financial advice. Tokens are risky and you can lose everything you put in.</p>
    </div>
  );
}
