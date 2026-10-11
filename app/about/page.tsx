import Link from "next/link";

export const metadata = { title: "About CurveFoundry", description: "How CurveFoundry works: bonding curves, launch styles, fees, graduation to Meteora DAMM v2, and what is live today." };

const steps = [
  ["Add a picture, name and ticker", "Upload an image and give your token a name and a short ticker. You can also add a description and social links."],
  ["Choose how it grows", "Pick a launch style. We turn it into a real Meteora bonding curve with fees and graduation settings. Advanced users can change every number."],
  ["Create the token", "You approve two wallet pop-ups: one saves the market settings on-chain, the other creates your token and its trading pool."],
  ["People trade on the curve", "Buyers and sellers trade against the curve. The price moves up as more is bought and down as tokens are sold back."],
  ["Graduate to DAMM v2", "When the curve fills, the token graduates and its liquidity moves to a Meteora DAMM v2 pool."],
];
const styles = [
  ["Slow & steady", "The price grows gradually. A balanced default for most projects."],
  ["Long runway", "Takes longer to fill the curve. Suits projects that want a slow, wide discovery period."],
  ["Quick launch", "Fills sooner. Good for fast, high-energy launches."],
  ["Small start", "Starts at a low market cap. Suits thinner early liquidity, such as new tokenized stocks."],
];
const faqs = [
  ["What is a bonding curve?", "A bonding curve is a rule built into the token's pool that sets the price from how much has been bought. Buying pushes the price up along the curve. Selling pushes it back down. There is no order book: you always trade against the curve."],
  ["Do I need to know how curves work to launch?", "No. Pick a launch style and CurveFoundry sets the curve for you. The Advanced section is there if you want to tune supply, market caps and fees."],
  ["What does graduation mean?", "Each token has a graduation target. When enough has been bought to reach it, trading moves from the bonding curve to a Meteora DAMM v2 pool, where liquidity is provided by the migrated funds."],
  ["Is migration automatic?", "On mainnet, Meteora's keepers migrate pools that match their standard thresholds. Custom thresholds may need a manual migration. On devnet, migration is done manually with Meteora's migrator tool."],
  ["What are the fees?", "Each market has a base trading fee that can start higher and step down over time, an optional dynamic fee that adjusts with market activity, and an optional share of trading fees for the creator. You can see and change these under Advanced before you create."],
  ["Can I change my token after creating it?", "No. Name, ticker, image and market settings cannot be changed once the token is created, so check everything first."],
  ["Does CurveFoundry hold my funds or keys?", "No. We never ask for your private key or seed phrase, and nothing is signed without your approval in your own wallet."],
  ["Can I lose money?", "Yes. Token prices can fall to near zero, and nothing here is financial advice. Only use money you can afford to lose, and do your own research on any token."],
  ["What is a preset?", "A preset is a saved set of market settings that others can reuse. You can save yours from the Create page and browse others on the Presets page."],
];

export default function About() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <section className="space-y-3">
        <p className="text-xs text-violet">About</p>
        <h1 className="text-3xl font-bold text-white sm:text-4xl">Design the market. <span className="grad-text">Then launch the asset.</span></h1>
        <p className="text-sm text-mute">CurveFoundry is a launchpad where you decide how a token launches and trades, not just whether it launches. You pick the mechanics, preview how the price behaves, and launch through Meteora&apos;s Dynamic Bonding Curve. When it grows enough, it graduates to Meteora DAMM v2.</p>
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
        <div className="grid gap-3 sm:grid-cols-2">
          {styles.map(([t, d]) => <div key={t} className="card p-4"><div className="text-sm text-white">{t}</div><p className="mt-1 text-xs text-mute">{d}</p></div>)}
        </div>
        <p className="text-xs text-mute">Each style maps to real Meteora curve settings. The create page shows a preview of the curve before you launch.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">Built on Meteora</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="card p-4"><div className="text-sm text-white">Dynamic Bonding Curve (DBC)</div><p className="mt-1 text-xs text-mute">Runs the launch: the curve, the fees and the graduation target.</p></div>
          <div className="card p-4"><div className="text-sm text-white">DAMM v2</div><p className="mt-1 text-xs text-mute">Takes over after graduation as the token&apos;s liquidity pool.</p></div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">What is live today</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="card p-4 text-xs"><div className="mb-2 text-sm text-up">Working</div><ul className="space-y-1 text-mute"><li>Create a token with a curve preview</li><li>Buy and sell on the curve</li><li>Curve progress and graduation status</li><li>Save and browse presets</li><li>Creator profile page</li></ul></div>
          <div className="card p-4 text-xs"><div className="mb-2 text-sm text-amber-300">Early or coming</div><ul className="space-y-1 text-mute"><li>Runs on devnet while we test</li><li>Volume, holders and parsed trades need an indexer</li><li>Paid presets</li><li>AI market copilot</li></ul></div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">Questions</h2>
        <div className="space-y-2">
          {faqs.map(([q, a]) => (
            <details key={q} className="card p-4"><summary className="cursor-pointer text-sm text-white">{q}</summary><p className="mt-2 text-xs leading-relaxed text-mute">{a}</p></details>
          ))}
        </div>
      </section>

      <p className="text-[11px] text-mute">CurveFoundry is software, not financial advice. Tokens are risky and you can lose everything you put in.</p>
    </div>
  );
}
