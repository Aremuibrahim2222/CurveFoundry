"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { LAMPORTS_PER_SOL, PublicKey, ConfirmedSignatureInfo } from "@solana/web3.js";
import { NATIVE_MINT } from "@solana/spl-token";
import { useWallet } from "@solana/wallet-adapter-react";
import CurveChart from "@/components/CurveChart";
import ProgressBar from "@/components/ProgressBar";
import TradePanel from "@/components/TradePanel";
import { useDbc } from "@/hooks/useDbc";
import { PoolSnapshot, getPoolSnapshot, priceFromSnapshot } from "@/lib/meteora/dbc";
import { DAMM_V2_PROGRAM_ID } from "@/lib/meteora/damm";
import { previewFromConfig } from "@/lib/curve/preview";
import { explorerUrl, formatCompact, fromRawAmount, isValidPublicKey, shorten } from "@/lib/solana/utils";
import { getSupabase } from "@/lib/supabase/client";

export default function MarketPage() {
  const { pool } = useParams<{ pool: string }>();
  const { connection, client } = useDbc();
  const wallet = useWallet();
  const [snap, setSnap] = useState<PoolSnapshot | null>(null);
  const [dec, setDec] = useState<{ base: number; quote: number; supply: number } | null>(null);
  const [meta, setMeta] = useState<{ name: string; symbol: string; category: string; image_url: string | null } | null>(null);
  const [sigs, setSigs] = useState<ConfirmedSignatureInfo[]>([]);
  const [bal, setBal] = useState({ base: "—", quote: "—" });
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<"chart" | "tx">("chart");

  const load = useCallback(async () => {
    if (!isValidPublicKey(pool)) return setErr("Invalid pool address");
    try {
      const pk = new PublicKey(pool);
      const s = await getPoolSnapshot(client, connection, pk);
      const [bs, qs] = await Promise.all([
        connection.getTokenSupply(s.baseMint),
        s.quoteMint.equals(NATIVE_MINT) ? Promise.resolve(null) : connection.getTokenSupply(s.quoteMint),
      ]);
      setSnap(s); setDec({ base: bs.value.decimals, quote: qs ? qs.value.decimals : 9, supply: bs.value.uiAmount ?? 0 });
      setSigs(await connection.getSignaturesForAddress(pk, { limit: 12 }));
      if (wallet.publicKey) {
        const q = s.quoteMint.equals(NATIVE_MINT)
          ? (await connection.getBalance(wallet.publicKey)) / LAMPORTS_PER_SOL + ""
          : await tokenBal(wallet.publicKey, s.quoteMint);
        setBal({ base: await tokenBal(wallet.publicKey, s.baseMint), quote: q });
      }
      setErr(null);
    } catch (e) { setErr((e as Error).message); }
  }, [pool, client, connection, wallet.publicKey]); // eslint-disable-line react-hooks/exhaustive-deps

  async function tokenBal(owner: PublicKey, mint: PublicKey) {
    const r = await connection.getParsedTokenAccountsByOwner(owner, { mint });
    return String(r.value.reduce((a, x) => a + (x.account.data.parsed.info.tokenAmount.uiAmount ?? 0), 0));
  }

  useEffect(() => { void load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, [load]);
  useEffect(() => {
    const sb = getSupabase(); if (!sb) return;
    sb.from("launches").select("name,symbol,category,image_url").eq("pool_address", pool).maybeSingle().then(({ data }) => data && setMeta(data));
  }, [pool]);

  const points = useMemo(() => (snap && dec ? previewFromConfig(snap.config, dec.base, dec.quote, dec.supply) : []), [snap, dec]);
  if (err) return <div className="card p-4 text-sm text-down">{err}</div>;
  if (!snap || !dec) return <div className="text-sm text-mute">Loading pool {pool.slice(0, 6)}…</div>;

  const pct = snap.progress > 1 ? snap.progress : snap.progress * 100;
  const quoteSym = snap.quoteMint.equals(NATIVE_MINT) ? "SOL" : shorten(snap.quoteMint.toBase58());
  const price = priceFromSnapshot(snap, dec.base, dec.quote);
  const symbol = meta?.symbol ?? shorten(snap.baseMint.toBase58());
  const marker = points.length ? (points.find((p) => p.raised / points[points.length - 1].raised >= pct / 100) ?? points[0]).tokensSold : undefined;
  const status = snap.isMigrated ? "GRADUATED" : pct >= 90 ? "NEAR GRADUATION" : "BONDING CURVE";

  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_340px]">
      <div className="space-y-3">
        <div className="card flex flex-col gap-4 p-3 sm:flex-row">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {meta?.image_url ? <img src={meta.image_url} alt="" className="h-40 w-full rounded-lg object-cover sm:w-40" /> : <div className="flex h-40 w-full items-center justify-center rounded-lg bg-panel2 text-3xl font-bold text-mute sm:w-40">{symbol.slice(0, 4)}</div>}
          <div className="min-w-0 flex-1 space-y-2 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base font-bold text-violet">{meta?.name ?? "Token"} / {symbol}</h1>
              {meta && <span className="rounded-lg border border-edge px-2 py-0.5 text-mute">{meta.category}</span>}
              <span className={`rounded-lg px-2 py-0.5 ${snap.isMigrated ? "bg-up/20 text-up" : pct >= 90 ? "bg-amber-500/20 text-amber-300" : "bg-edge text-mute"}`}>{status}</span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-mute">
              <span>Ca <a className="text-violet underline" target="_blank" rel="noreferrer" href={explorerUrl("address", snap.baseMint.toBase58())}>{shorten(snap.baseMint.toBase58())}</a></span>
              <span>by <a className="text-violet underline" target="_blank" rel="noreferrer" href={explorerUrl("address", snap.creator.toBase58())}>{shorten(snap.creator.toBase58())}</a></span>
            </div>
            <div className="flex justify-between"><span>Progress {fromRawAmount(String(snap.poolState.quoteReserve?.toString() ?? "0"), dec.quote, 2)} {quoteSym}</span><span>{pct.toFixed(2)}% → DAMM v2</span></div>
            <ProgressBar pct={pct} />
            <div className="flex flex-wrap gap-x-5 gap-y-1">
              <span><span className="text-mute">Price</span> {price.toPrecision(4)} {quoteSym}</span>
              <span><span className="text-mute">Mcap</span> {formatCompact(price * dec.supply)} {quoteSym}</span>
              <span className="text-mute">Volume n/a</span><span className="text-mute">Holders n/a</span>
            </div>
            {snap.isMigrated
              ? <p className="text-up">Now trading through Meteora DAMM v2. Find the migrated pool via the program <a className="underline" target="_blank" rel="noreferrer" href={explorerUrl("address", DAMM_V2_PROGRAM_ID)}>{shorten(DAMM_V2_PROGRAM_ID)}</a> or the pool&apos;s migration transaction.</p>
              : <p className="text-mute">Trades follow the bonding curve. When the progress bar fills, the token graduates to Meteora DAMM v2.</p>}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="grid grid-cols-2 border-b border-edge text-xs font-bold">
            <button onClick={() => setTab("chart")} className={`py-3 ${tab === "chart" ? "bg-violet/10 text-violet" : "text-mute"}`}>CHART</button>
            <button onClick={() => setTab("tx")} className={`py-3 ${tab === "tx" ? "bg-violet/10 text-violet" : "text-mute"}`}>TRANSACTIONS</button>
          </div>
          <div className="p-3">
            {tab === "chart" ? <CurveChart points={points} quoteLabel={quoteSym} markerSold={marker} height={320} /> : (
              <div>
                <p className="mb-2 text-[11px] text-mute">Raw signatures from the pool account. Buy/sell parsing needs an indexer and is not shown.</p>
                <ul className="space-y-1 text-xs">
                  {sigs.map((s) => (
                    <li key={s.signature} className="flex justify-between">
                      <a className="text-violet underline" target="_blank" rel="noreferrer" href={explorerUrl("tx", s.signature)}>{shorten(s.signature, 8)}</a>
                      <span className={s.err ? "text-down" : "text-mute"}>{s.err ? "failed" : "ok"} · {s.blockTime ? new Date(s.blockTime * 1000).toLocaleTimeString() : "—"}</span>
                    </li>
                  ))}
                  {!sigs.length && <li className="text-mute">No transactions yet.</li>}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      <aside className="space-y-3">
        <TradePanel snap={snap} baseDec={dec.base} quoteDec={dec.quote} quoteSymbol={quoteSym} symbol={symbol} balances={bal} onDone={load} />
        <div className="card space-y-1 p-4 text-xs">
          <Addr k="Pool" v={pool} /><Addr k="Config" v={snap.poolState.config.toBase58()} /><Addr k="Quote" v={snap.quoteMint.toBase58()} />
        </div>
      </aside>
    </div>
  );
}
const Addr = ({ k, v }: { k: string; v: string }) => (
  <div className="flex justify-between gap-2"><span className="text-mute">{k}</span>
    <a className="text-violet underline" target="_blank" rel="noreferrer" href={explorerUrl("address", v)}>{shorten(v)}</a></div>
);
