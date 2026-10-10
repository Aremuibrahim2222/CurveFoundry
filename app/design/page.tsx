"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Keypair } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import CurveChart from "@/components/CurveChart";
import { useDbc } from "@/hooks/useDbc";
import {
  AssetCategory, CATEGORY_LABELS, CurveDefinition, CurvePreset, applyPreset, defaultDefinition,
  serializeDefinition, validateDefinition,
} from "@/lib/curve/definition";
import { previewFromConfig } from "@/lib/curve/preview";
import { simulateBuy } from "@/lib/curve/simulate";
import { buildCurveConfig, quoteDecimals, quoteMintFor } from "@/lib/meteora/build";
import { buildCreateConfigTx, buildCreatePoolTx, derivePoolAddress } from "@/lib/meteora/dbc";
import { insertLaunch, insertPreset } from "@/lib/supabase/queries";
import { uploadTokenMetadata } from "@/lib/supabase/storage";
import { DEMO_MODE, NETWORK, explorerUrl, formatCompact } from "@/lib/solana/utils";

const STYLES: { id: Exclude<CurvePreset, "custom">; label: string; blurb: string }[] = [
  { id: "steady", label: "Slow & steady", blurb: "Price grows gradually." },
  { id: "long", label: "Long runway", blurb: "Takes longer to graduate." },
  { id: "fast", label: "Quick launch", blurb: "Graduates sooner." },
  { id: "thin", label: "Small start", blurb: "Low starting price." },
];
type Step = { label: string; status: "idle" | "active" | "done" | "error"; sig?: string };
const MAX_IMG = 5 * 1024 * 1024;

export default function CreatePage() {
  const { connection, client } = useDbc();
  const wallet = useWallet();
  const [category, setCategory] = useState<AssetCategory>("meme");
  const [def, setDef] = useState<CurveDefinition>(() => defaultDefinition("meme"));
  const [meta, setMeta] = useState({ name: "", symbol: "", description: "" });
  const [links, setLinks] = useState({ telegram: "", twitter: "", website: "" });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileErr, setFileErr] = useState<string | null>(null);
  const [advUri, setAdvUri] = useState("");
  const [simBuy, setSimBuy] = useState("1");
  const [showJson, setShowJson] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [result, setResult] = useState<{ token: string; pool: string; config: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [presetMsg, setPresetMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const u = URL.createObjectURL(file); setPreview(u); return () => URL.revokeObjectURL(u);
  }, [file]);

  const errors = useMemo(() => validateDefinition(def), [def]);
  const built = useMemo(() => {
    if (errors.length) return { error: null as string | null, points: [] as ReturnType<typeof previewFromConfig>, cfg: null as unknown };
    try {
      const cfg = buildCurveConfig(def);
      return { error: null, points: previewFromConfig(cfg, def.tokenDecimals, quoteDecimals(def), def.totalSupply), cfg };
    } catch (e) { return { error: (e as Error).message, points: [], cfg: null }; }
  }, [def, errors]);

  const sim = simulateBuy(built.points, Number(simBuy), 0);
  const num = (v: string) => (v === "" ? 0 : Number(v));
  const setField = <K extends keyof CurveDefinition>(k: K, v: CurveDefinition[K]) =>
    setDef((d) => ({ ...d, [k]: v, preset: k === "initialMarketCap" || k === "migrationMarketCap" ? "custom" : d.preset }));
  const ready = meta.name.trim().length > 0 && meta.symbol.trim().length >= 2 && (!!file || advUri.trim().length > 0) && errors.length === 0 && !built.error;

  function pickFile(f: File | undefined | null) {
    setFileErr(null);
    if (!f) return;
    if (!f.type.startsWith("image/")) return setFileErr("Please choose an image (JPG, PNG, GIF or SVG).");
    if (f.size > MAX_IMG) return setFileErr("Image is over 5 MB.");
    setFile(f);
  }

  async function deploy() {
    setError(null); setResult(null);
    if (!wallet.publicKey || !wallet.sendTransaction) return setError("Connect your wallet first (top right).");
    if (errors.length || !built.cfg) return setError(errors[0] ?? built.error ?? "Something is off with the settings.");
    if (DEMO_MODE) return setError("Demo mode is on, so creating is turned off.");
    const s: Step[] = ["Prepare token info", "Create market settings", "Create your token", "Done"].map((label) => ({ label, status: "idle" as const }));
    s[0].status = "active"; setSteps([...s]);
    try {
      let uri = advUri.trim(), imageUrl = "";
      if (!uri && file) {
        const r = await uploadTokenMetadata({ name: meta.name.trim(), symbol: meta.symbol.trim(), description: meta.description.trim(), image: file, links });
        uri = r.uri; imageUrl = r.imageUrl;
      }
      s[0].status = "done"; s[1].status = "active"; setSteps([...s]);
      const configKp = Keypair.generate(), baseKp = Keypair.generate();
      const quoteMint = quoteMintFor(def);
      const tx1 = await buildCreateConfigTx(client, { config: configKp.publicKey, wallet: wallet.publicKey, quoteMint, curveConfig: built.cfg as object });
      const sig1 = await wallet.sendTransaction(tx1, connection, { signers: [configKp] });
      await connection.confirmTransaction(sig1, "confirmed");
      s[1] = { ...s[1], status: "done", sig: sig1 }; s[2].status = "active"; setSteps([...s]);
      const tx2 = await buildCreatePoolTx(client, { baseMint: baseKp.publicKey, config: configKp.publicKey, name: meta.name.trim(), symbol: meta.symbol.trim(), uri, wallet: wallet.publicKey });
      const sig2 = await wallet.sendTransaction(tx2, connection, { signers: [baseKp] });
      await connection.confirmTransaction(sig2, "confirmed");
      s[2] = { ...s[2], status: "done", sig: sig2 }; s[3].status = "done"; setSteps([...s]);
      const pool = derivePoolAddress(quoteMint, baseKp.publicKey, configKp.publicKey);
      setResult({ token: baseKp.publicKey.toBase58(), pool: pool.toBase58(), config: configKp.publicKey.toBase58() });
      try {
        await insertLaunch({ creator: wallet.publicKey.toBase58(), name: meta.name.trim(), symbol: meta.symbol.trim(), category, image_url: imageUrl || null, base_mint: baseKp.publicKey.toBase58(), pool_address: pool.toBase58(), config_address: configKp.publicKey.toBase58(), quote: def.quote, network: NETWORK });
      } catch { /* listing is optional; chain state is the source of truth */ }
    } catch (e) {
      const i = s.findIndex((x) => x.status === "active"); if (i >= 0) s[i].status = "error"; setSteps([...s]);
      setError((e as Error).message);
    }
  }

  async function savePreset() {
    setPresetMsg(null);
    if (!wallet.publicKey) return setPresetMsg("Connect a wallet to save a preset.");
    try {
      await insertPreset({ owner: wallet.publicKey.toBase58(), name: `${meta.name || CATEGORY_LABELS[category]} preset`, description: meta.description || null, category, tags: [def.preset], is_public: true, price_sol: 0, definition: def });
      setPresetMsg("Preset saved.");
    } catch (e) { setPresetMsg((e as Error).message); }
  }

  return (
    <div className="mx-auto max-w-xl space-y-3">
      <h1 className="text-xs font-bold uppercase tracking-wider text-violet">Create a new token</h1>

      <label
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); pickFile(e.dataTransfer.files?.[0]); }}
        className="card flex cursor-pointer flex-col items-center gap-3 border-dashed p-6 text-center"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Token preview" className="h-32 w-32 rounded-lg object-cover" />
        ) : (<>
          <div className="text-sm text-white">Upload an image</div>
          <div className="text-xs text-mute">Drag and drop an image here<br />or click to select from your device</div>
        </>)}
        <span className="btn-ghost !py-2">{preview ? "Change file" : "Select the file"}</span>
        <span className="text-[11px] text-mute">JPG, PNG, GIF or SVG. Maximum 5 MB.</span>
        <input type="file" accept="image/*" className="hidden" onChange={(e) => pickFile(e.target.files?.[0])} />
        {fileErr && <span className="text-xs text-down">{fileErr}</span>}
      </label>

      <section className="card space-y-3 p-4">
        <h2 className="section-title">1. Basic data</h2>
        <p className="text-xs text-mute">Once your token is created, this information cannot be changed.</p>
        <div>
          <label className="label">Type</label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(CATEGORY_LABELS) as AssetCategory[]).map((c) => (
              <button key={c} onClick={() => { setCategory(c); setDef(defaultDefinition(c)); }} className={`pill ${category === c ? "pill-on" : ""}`}>{CATEGORY_LABELS[c]}</button>
            ))}
          </div>
        </div>
        <input className="field" placeholder="Name" value={meta.name} onChange={(e) => setMeta({ ...meta, name: e.target.value })} />
        <input className="field" placeholder="Ticker (2 to 10 letters)" maxLength={10} value={meta.symbol} onChange={(e) => setMeta({ ...meta, symbol: e.target.value.toUpperCase() })} />
        <textarea className="field" rows={2} placeholder="Description" value={meta.description} onChange={(e) => setMeta({ ...meta, description: e.target.value })} />
      </section>

      <details className="card p-4">
        <summary className="section-title cursor-pointer">2. Advanced</summary>
        <div className="mt-3 space-y-3">
          <div>
            <label className="label">How should it grow?</label>
            <div className="flex flex-wrap gap-2">
              {STYLES.map((p) => <button key={p.id} onClick={() => setDef(applyPreset(def, p.id))} className={`pill ${def.preset === p.id ? "pill-on" : ""}`}>{p.label}</button>)}
            </div>
            <p className="mt-2 text-xs text-mute">{STYLES.find((p) => p.id === def.preset)?.blurb ?? "Custom settings."}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Total supply</label><input className="field" value={def.totalSupply} onChange={(e) => setField("totalSupply", num(e.target.value))} /></div>
            <div><label className="label">Decimals</label><select className="field" value={def.tokenDecimals} onChange={(e) => setField("tokenDecimals", Number(e.target.value) as 6 | 9)}><option value={6}>6</option><option value={9}>9</option></select></div>
            <div><label className="label">Quote currency</label><select className="field" value={def.quote} onChange={(e) => setField("quote", e.target.value as "SOL" | "USDC")}><option>SOL</option><option disabled={!process.env.NEXT_PUBLIC_USDC_MINT}>USDC</option></select></div>
            <div><label className="label">Dynamic fee</label><select className="field" value={String(def.dynamicFee)} onChange={(e) => setField("dynamicFee", e.target.value === "true")}><option value="true">On</option><option value="false">Off</option></select></div>
            <div><label className="label">Start market cap ({def.quote})</label><input className="field" value={def.initialMarketCap} onChange={(e) => setField("initialMarketCap", num(e.target.value))} /></div>
            <div><label className="label">Graduation market cap ({def.quote})</label><input className="field" value={def.migrationMarketCap} onChange={(e) => setField("migrationMarketCap", num(e.target.value))} /></div>
            <div><label className="label">Starting fee (bps)</label><input className="field" value={def.baseFee.startingBps} onChange={(e) => setField("baseFee", { ...def.baseFee, startingBps: num(e.target.value) })} /></div>
            <div><label className="label">Ending fee (bps)</label><input className="field" value={def.baseFee.endingBps} onChange={(e) => setField("baseFee", { ...def.baseFee, endingBps: num(e.target.value) })} /></div>
            <div><label className="label">Fee periods</label><input className="field" value={def.baseFee.periods} onChange={(e) => setField("baseFee", { ...def.baseFee, periods: num(e.target.value) })} /></div>
            <div><label className="label">Fee duration (s)</label><input className="field" value={def.baseFee.durationSeconds} onChange={(e) => setField("baseFee", { ...def.baseFee, durationSeconds: num(e.target.value) })} /></div>
            <div><label className="label">Creator fee share (%)</label><input className="field" value={def.creatorTradingFeePct} onChange={(e) => setField("creatorTradingFeePct", num(e.target.value))} /></div>
            <div><label className="label">Locked liquidity (%)</label><input className="field" value={def.lockedLiquidityPct} onChange={(e) => setField("lockedLiquidityPct", num(e.target.value))} /></div>
          </div>
          <div><label className="label">Already have a metadata link? Paste it instead of uploading an image</label><input className="field" placeholder="https://…/token.json" value={advUri} onChange={(e) => setAdvUri(e.target.value)} /></div>
        </div>
      </details>

      <details className="card p-4">
        <summary className="section-title cursor-pointer">3. Social (optional)</summary>
        <div className="mt-3 space-y-3">
          <p className="text-xs text-mute">Add social links for your project.</p>
          <input className="field" placeholder="Telegram link" value={links.telegram} onChange={(e) => setLinks({ ...links, telegram: e.target.value })} />
          <input className="field" placeholder="X (Twitter) link" value={links.twitter} onChange={(e) => setLinks({ ...links, twitter: e.target.value })} />
          <input className="field" placeholder="Website link" value={links.website} onChange={(e) => setLinks({ ...links, website: e.target.value })} />
        </div>
      </details>

      <details className="card p-4">
        <summary className="section-title cursor-pointer">Preview the curve and try a practice trade</summary>
        <div className="mt-3 space-y-3">
          <CurveChart points={built.points} quoteLabel={def.quote} />
          <span className="inline-block rounded-lg bg-amber-500/15 px-3 py-1 text-[11px] text-amber-300">SIMULATION — NOT AN ON-CHAIN TRANSACTION</span>
          <input className="field" value={simBuy} onChange={(e) => setSimBuy(e.target.value)} placeholder={`Buy with ${def.quote}`} />
          {sim ? <p className="text-sm">You would get about <b>{formatCompact(sim.tokens)}</b> tokens. Price moves {sim.impactPct.toFixed(2)}%.</p> : <p className="text-sm text-mute">Enter an amount.</p>}
          <button className="text-xs text-violet underline" onClick={() => setShowJson(!showJson)}>{showJson ? "Hide" : "Show"} settings JSON</button>
          {showJson && <pre className="max-h-56 overflow-auto rounded-lg bg-ink p-3 text-xs">{serializeDefinition(def)}</pre>}
          <div><button className="btn-ghost !py-2" onClick={savePreset}>Save settings as a preset</button>{presetMsg && <p className="mt-1 text-xs text-mute">{presetMsg}</p>}</div>
        </div>
      </details>

      <p className="text-xs text-mute">Starts at {def.initialMarketCap} {def.quote} market cap and graduates to Meteora DAMM v2 at {def.migrationMarketCap} {def.quote}. You will approve two wallet pop-ups.</p>
      {errors.length > 0 && <p className="text-sm text-down">{errors.join(" · ")}</p>}
      {built.error && <p className="text-sm text-down">Settings error: {built.error}</p>}
      <button className="btn-primary w-full" onClick={deploy} disabled={!ready}>Create token</button>
      {!ready && <p className="text-center text-[11px] text-mute">Add an image, a name and a ticker to continue.</p>}

      {steps.length > 0 && (
        <ol className="card space-y-1 p-4 text-sm">
          {steps.map((s) => (
            <li key={s.label} className={s.status === "error" ? "text-down" : s.status === "done" ? "text-up" : "text-mute"}>
              {s.status === "done" ? "✓" : s.status === "error" ? "✕" : s.status === "active" ? "…" : "○"} {s.label}
              {s.sig && <> · <a className="underline" target="_blank" rel="noreferrer" href={explorerUrl("tx", s.sig)}>view</a></>}
            </li>
          ))}
        </ol>
      )}
      {error && <p className="text-sm text-down">{error}</p>}
      {result && (
        <div className="card border-up/40 p-4 text-sm">
          <p className="text-base font-bold text-up">Your token is live</p>
          <p className="mt-2 break-all">Token: <a className="text-violet underline" target="_blank" rel="noreferrer" href={explorerUrl("address", result.token)}>{result.token}</a></p>
          <p className="break-all">Market: <a className="text-violet underline" target="_blank" rel="noreferrer" href={explorerUrl("address", result.pool)}>{result.pool}</a></p>
          <Link className="btn-primary mt-4 inline-block" href={`/market/${result.pool}`}>Open trading page</Link>
        </div>
      )}
    </div>
  );
}
