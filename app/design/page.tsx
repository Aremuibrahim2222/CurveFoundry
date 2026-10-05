"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Keypair } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import CurveChart from "@/components/CurveChart";
import { useDbc } from "@/hooks/useDbc";
import {
  AssetCategory, CATEGORY_LABELS, CurveDefinition, CurvePreset, PRESET_INFO, applyPreset, defaultDefinition,
  serializeDefinition, validateDefinition,
} from "@/lib/curve/definition";
import { previewFromConfig } from "@/lib/curve/preview";
import { simulateBuy, simulateSell } from "@/lib/curve/simulate";
import { buildCurveConfig, quoteDecimals, quoteMintFor } from "@/lib/meteora/build";
import { buildCreateConfigTx, buildCreatePoolTx, derivePoolAddress } from "@/lib/meteora/dbc";
import { insertLaunch, insertPreset } from "@/lib/supabase/queries";
import { DEMO_MODE, NETWORK, explorerUrl, formatCompact } from "@/lib/solana/utils";

type Step = { label: string; status: "idle" | "active" | "done" | "error"; sig?: string };

export default function DesignPage() {
  const { connection, client } = useDbc();
  const wallet = useWallet();
  const [category, setCategory] = useState<AssetCategory>("ai");
  const [def, setDef] = useState<CurveDefinition>(() => defaultDefinition("ai"));
  const [meta, setMeta] = useState({ name: "", symbol: "", description: "", imageUrl: "", uri: "" });
  const [simBuy, setSimBuy] = useState("1");
  const [simStart, setSimStart] = useState(0);
  const [showJson, setShowJson] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [result, setResult] = useState<{ token: string; pool: string; config: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [presetName, setPresetName] = useState("");
  const [presetMsg, setPresetMsg] = useState<string | null>(null);

  const errors = useMemo(() => validateDefinition(def), [def]);
  const built = useMemo(() => {
    if (errors.length) return { error: null as string | null, points: [] as ReturnType<typeof previewFromConfig>, cfg: null as unknown };
    try {
      const cfg = buildCurveConfig(def);
      return { error: null, points: previewFromConfig(cfg, def.tokenDecimals, quoteDecimals(def), def.totalSupply), cfg };
    } catch (e) { return { error: (e as Error).message, points: [], cfg: null }; }
  }, [def, errors]);

  const buy = simulateBuy(built.points, Number(simBuy), simStart);
  const sell = buy ? simulateSell(built.points, buy.tokens, Math.min(100, simStart + buy.progressPct - simStart)) : null;
  const set = <K extends keyof CurveDefinition>(k: K, v: CurveDefinition[K]) => setDef((d) => ({ ...d, [k]: v, preset: k === "initialMarketCap" || k === "migrationMarketCap" ? "custom" : d.preset }));
  const num = (v: string) => (v === "" ? 0 : Number(v));

  async function deploy() {
    setError(null); setResult(null);
    if (!wallet.publicKey || !wallet.sendTransaction) return setError("Connect a wallet first.");
    if (errors.length || !built.cfg) return setError(errors[0] ?? built.error ?? "Invalid configuration.");
    if (!meta.name || !meta.symbol || !meta.uri) return setError("Name, symbol and metadata URI are required.");
    if (DEMO_MODE) return setError("Demo mode is on: deployment is disabled. Set NEXT_PUBLIC_DEMO_MODE=false.");
    const s: Step[] = ["Validate configuration", "Create DBC config", "Create DBC pool", "Confirmed"].map((label) => ({ label, status: "idle" }));
    s[0].status = "done"; setSteps([...s]);
    try {
      const configKp = Keypair.generate(), baseKp = Keypair.generate();
      const quoteMint = quoteMintFor(def);
      s[1].status = "active"; setSteps([...s]);
      const tx1 = await buildCreateConfigTx(client, { config: configKp.publicKey, wallet: wallet.publicKey, quoteMint, curveConfig: built.cfg as object });
      const sig1 = await wallet.sendTransaction(tx1, connection, { signers: [configKp] });
      await connection.confirmTransaction(sig1, "confirmed");
      s[1] = { ...s[1], status: "done", sig: sig1 }; s[2].status = "active"; setSteps([...s]);
      const tx2 = await buildCreatePoolTx(client, { baseMint: baseKp.publicKey, config: configKp.publicKey, name: meta.name, symbol: meta.symbol, uri: meta.uri, wallet: wallet.publicKey });
      const sig2 = await wallet.sendTransaction(tx2, connection, { signers: [baseKp] });
      await connection.confirmTransaction(sig2, "confirmed");
      s[2] = { ...s[2], status: "done", sig: sig2 }; s[3].status = "done"; setSteps([...s]);
      const pool = derivePoolAddress(quoteMint, baseKp.publicKey, configKp.publicKey);
      setResult({ token: baseKp.publicKey.toBase58(), pool: pool.toBase58(), config: configKp.publicKey.toBase58() });
      try {
        await insertLaunch({ creator: wallet.publicKey.toBase58(), name: meta.name, symbol: meta.symbol, category, image_url: meta.imageUrl || null, base_mint: baseKp.publicKey.toBase58(), pool_address: pool.toBase58(), config_address: configKp.publicKey.toBase58(), quote: def.quote, network: NETWORK });
      } catch { /* metadata indexing is optional; chain state is the source of truth */ }
    } catch (e) {
      const i = s.findIndex((x) => x.status === "active"); if (i >= 0) s[i].status = "error"; setSteps([...s]);
      setError((e as Error).message);
    }
  }

  async function savePreset() {
    setPresetMsg(null);
    if (!wallet.publicKey) return setPresetMsg("Connect a wallet to save a preset.");
    try {
      await insertPreset({ owner: wallet.publicKey.toBase58(), name: presetName || `${CATEGORY_LABELS[category]} preset`, description: meta.description || null, category, tags: [def.preset], is_public: true, price_sol: 0, definition: def });
      setPresetMsg("Preset saved.");
    } catch (e) { setPresetMsg((e as Error).message); }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Market designer</h1>
        <section className="card space-y-3 p-4">
          <h2 className="text-sm font-medium">Asset</h2>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(CATEGORY_LABELS) as AssetCategory[]).map((c) => (
              <button key={c} onClick={() => { setCategory(c); setDef(defaultDefinition(c)); }}
                className={`rounded-md border px-2 py-2 text-xs ${category === c ? "border-violet text-white" : "border-edge text-mute"}`}>{CATEGORY_LABELS[c]}</button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="label">Name</label><input className="field" value={meta.name} onChange={(e) => setMeta({ ...meta, name: e.target.value })} /></div>
            <div><label className="label">Symbol</label><input className="field" value={meta.symbol} maxLength={10} onChange={(e) => setMeta({ ...meta, symbol: e.target.value.toUpperCase() })} /></div>
          </div>
          <div><label className="label">Description</label><textarea className="field" rows={2} value={meta.description} onChange={(e) => setMeta({ ...meta, description: e.target.value })} /></div>
          <div><label className="label">Image URL (listing only)</label><input className="field" value={meta.imageUrl} onChange={(e) => setMeta({ ...meta, imageUrl: e.target.value })} /></div>
          <div><label className="label">Token metadata URI (JSON with name, symbol, image)</label><input className="field" placeholder="https://…/token.json" value={meta.uri} onChange={(e) => setMeta({ ...meta, uri: e.target.value })} /></div>
          <div className="grid grid-cols-3 gap-2">
            <div><label className="label">Supply</label><input className="field" value={def.totalSupply} onChange={(e) => set("totalSupply", num(e.target.value))} /></div>
            <div><label className="label">Decimals</label>
              <select className="field" value={def.tokenDecimals} onChange={(e) => set("tokenDecimals", Number(e.target.value) as 6 | 9)}><option value={6}>6</option><option value={9}>9</option></select></div>
            <div><label className="label">Quote</label>
              <select className="field" value={def.quote} onChange={(e) => set("quote", e.target.value as "SOL" | "USDC")}><option>SOL</option><option disabled={!process.env.NEXT_PUBLIC_USDC_MINT}>USDC</option></select></div>
          </div>
        </section>

        <section className="card space-y-3 p-4">
          <h2 className="text-sm font-medium">Curve</h2>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(PRESET_INFO) as Exclude<CurvePreset, "custom">[]).map((p) => (
              <button key={p} onClick={() => setDef(applyPreset(def, p))} className={`rounded-md border p-2 text-left ${def.preset === p ? "border-violet" : "border-edge"}`}>
                <div className="text-sm">{PRESET_INFO[p].label}</div><div className="text-[11px] text-mute">{PRESET_INFO[p].blurb}</div>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="label">Initial market cap ({def.quote})</label><input className="field" value={def.initialMarketCap} onChange={(e) => set("initialMarketCap", num(e.target.value))} /></div>
            <div><label className="label">Graduation market cap ({def.quote})</label><input className="field" value={def.migrationMarketCap} onChange={(e) => set("migrationMarketCap", num(e.target.value))} /></div>
          </div>
        </section>

        <section className="card space-y-3 p-4">
          <h2 className="text-sm font-medium">Fees and graduation</h2>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="label">Starting fee (bps)</label><input className="field" value={def.baseFee.startingBps} onChange={(e) => set("baseFee", { ...def.baseFee, startingBps: num(e.target.value) })} /></div>
            <div><label className="label">Ending fee (bps)</label><input className="field" value={def.baseFee.endingBps} onChange={(e) => set("baseFee", { ...def.baseFee, endingBps: num(e.target.value) })} /></div>
            <div><label className="label">Fee periods</label><input className="field" value={def.baseFee.periods} onChange={(e) => set("baseFee", { ...def.baseFee, periods: num(e.target.value) })} /></div>
            <div><label className="label">Schedule duration (s)</label><input className="field" value={def.baseFee.durationSeconds} onChange={(e) => set("baseFee", { ...def.baseFee, durationSeconds: num(e.target.value) })} /></div>
            <div><label className="label">Creator fee share (%)</label><input className="field" value={def.creatorTradingFeePct} onChange={(e) => set("creatorTradingFeePct", num(e.target.value))} /></div>
            <div><label className="label">Locked LP at graduation (%)</label><input className="field" value={def.lockedLiquidityPct} onChange={(e) => set("lockedLiquidityPct", num(e.target.value))} /></div>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={def.dynamicFee} onChange={(e) => set("dynamicFee", e.target.checked)} /> Dynamic fee</label>
          <p className="text-xs text-mute">Lifecycle: DBC discovery → graduation → Meteora DAMM v2 liquidity. Mainnet keepers only auto-migrate pools that match their thresholds; otherwise use the manual migrator.</p>
        </section>
      </div>

      <div className="space-y-4">
        {errors.length > 0 && <div className="card border-down/50 p-3 text-sm text-down">{errors.join(" · ")}</div>}
        {built.error && <div className="card border-down/50 p-3 text-sm text-down">Meteora config error: {built.error}</div>}
        <CurveChart points={built.points} quoteLabel={def.quote} markerSold={built.points.length ? interpSold(built.points, simStart) : undefined} />

        <section className="card space-y-3 p-4">
          <div className="flex items-center justify-between"><h2 className="text-sm font-medium">Market simulator</h2>
            <span className="rounded bg-amber-500/15 px-2 py-0.5 text-[11px] text-amber-300">SIMULATION — NOT AN ON-CHAIN TRANSACTION</span></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Buy with ({def.quote})</label><input className="field" value={simBuy} onChange={(e) => setSimBuy(e.target.value)} /></div>
            <div><label className="label">Starting curve position: {simStart}%</label><input type="range" min={0} max={95} value={simStart} onChange={(e) => setSimStart(Number(e.target.value))} className="w-full" /></div>
          </div>
          {buy ? (
            <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              <Stat k="Tokens out" v={formatCompact(buy.tokens)} /><Stat k="Price after" v={buy.priceAfter.toPrecision(4)} />
              <Stat k="Price impact" v={`${buy.impactPct.toFixed(2)}%`} /><Stat k="Progress" v={`${buy.progressPct.toFixed(1)}%`} />
              <Stat k="Market cap after" v={`${formatCompact(buy.marketCapAfter)} ${def.quote}`} />
              {sell && <Stat k="Sell same tokens back" v={`${formatCompact(sell.quote)} ${def.quote}`} />}
            </dl>
          ) : <p className="text-sm text-mute">Enter a positive amount.</p>}
          <p className="text-[11px] text-mute">Walks the curve derived from the SDK config; excludes trading fees. Live pages quote with the SDK&apos;s swapQuote2.</p>
        </section>

        <section className="card space-y-3 p-4">
          <h2 className="text-sm font-medium">Review</h2>
          <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
            <Stat k="Asset" v={`${meta.name || "—"} (${meta.symbol || "—"})`} /><Stat k="Category" v={CATEGORY_LABELS[category]} /><Stat k="Quote" v={def.quote} />
            <Stat k="Curve" v={def.preset} /><Stat k="Fee" v={`${def.baseFee.startingBps}→${def.baseFee.endingBps} bps`} /><Stat k="Graduation cap" v={`${def.migrationMarketCap} ${def.quote}`} />
          </dl>
          <button className="text-xs text-sky underline" onClick={() => setShowJson(!showJson)}>{showJson ? "Hide" : "Inspect"} configuration JSON</button>
          {showJson && <pre className="max-h-64 overflow-auto rounded bg-ink p-3 text-xs">{serializeDefinition(def)}</pre>}
          <div className="flex flex-wrap items-center gap-2">
            <button className="btn-primary" onClick={deploy} disabled={errors.length > 0 || !!built.error}>Deploy Market</button>
            <span className="text-xs text-mute">Two wallet signatures: config, then pool. Nothing is signed automatically.</span>
          </div>
          {steps.length > 0 && (
            <ol className="space-y-1 text-sm">
              {steps.map((s) => (
                <li key={s.label} className={s.status === "error" ? "text-down" : s.status === "done" ? "text-up" : "text-mute"}>
                  {s.status === "done" ? "✓" : s.status === "error" ? "✕" : s.status === "active" ? "…" : "○"} {s.label}
                  {s.sig && <> · <a className="underline" target="_blank" rel="noreferrer" href={explorerUrl("tx", s.sig)}>tx</a></>}
                </li>
              ))}
            </ol>
          )}
          {error && <p className="text-sm text-down">{error}</p>}
          {result && (
            <div className="rounded border border-up/40 p-3 text-sm">
              <p className="font-medium text-up">Market deployed</p>
              <p className="break-all">Token: <a className="underline" target="_blank" rel="noreferrer" href={explorerUrl("address", result.token)}>{result.token}</a></p>
              <p className="break-all">Pool: <a className="underline" target="_blank" rel="noreferrer" href={explorerUrl("address", result.pool)}>{result.pool}</a></p>
              <p className="break-all">Config: {result.config}</p>
              <Link className="mt-2 inline-block underline" href={`/market/${result.pool}`}>Open trading page</Link>
            </div>
          )}
        </section>

        <section className="card space-y-2 p-4">
          <h2 className="text-sm font-medium">Save as preset</h2>
          <p className="text-xs text-mute">Stores configuration only. Public and free in this MVP.</p>
          <div className="flex gap-2"><input className="field" placeholder="Preset name" value={presetName} onChange={(e) => setPresetName(e.target.value)} />
            <button className="btn-ghost" onClick={savePreset}>Save</button></div>
          {presetMsg && <p className="text-xs text-mute">{presetMsg}</p>}
        </section>
      </div>
    </div>
  );
}

function interpSold(pts: { tokensSold: number; raised: number }[], pct: number) {
  const T = pts[pts.length - 1].raised * (pct / 100);
  return (pts.find((p) => p.raised >= T) ?? pts[0]).tokensSold;
}
function Stat({ k, v }: { k: string; v: string }) {
  return <div><dt className="text-[11px] text-mute">{k}</dt><dd className="font-mono text-sm">{v}</dd></div>;
}
