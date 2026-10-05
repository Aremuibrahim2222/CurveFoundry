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
  const [meta, setMeta] = useState<{ name: string; symbol: string; category: string } | null>(null);
  const [sigs, setSigs] = useState<ConfirmedSignatureInfo[]>([]);
  const [bal, setBal] = useState({ base: "—", quote: "—" });
  const [err, setErr] = useState<string | null>(null);

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
    sb.from("launches").select("name,symbol,category").eq("pool_address", pool).maybeSingle().then(({ data }) => data && setMeta(data));
  }, [pool]);

  const points = useMemo(() => (snap && dec ? previewFromConfig(snap.config, dec.base, dec.quote, dec.supply) : []), [snap, dec]);
  if (err) return <div className="card p-4 text-sm text-down">{err}</div>;
  if (!snap || !dec) return <div className="text-sm text-mute">Loading pool from {pool.slice(0, 6)}…</div>;

  const pct = snap.progress > 1 ? snap.progress : snap.progress * 100;
  const quoteSym = snap.quoteMint.equals(NATIVE_MINT) ? "SOL" : shorten(snap.quoteMint.toBase58());
  const price = priceFromSnapshot(snap, dec.base, dec.quote);
  const symbol = meta?.symbol ?? shorten(snap.baseMint.toBase58());
  const marker = points.length ? (points.find((p) => p.raised / points[points.length - 1].raised >= pct / 100) ?? points[0]).tokensSold : undefined;
  const status = snap.isMigrated ? "GRADUATED" : pct >= 90 ? "NEAR GRADUATION" : "BONDING CURVE";

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold">{meta?.name ?? "Token"} <span className="text-mute">${symbol}</span></h1>
          {meta && <span className="rounded border border-edge px-2 py-0.5 text-xs text-mute">{meta.category}</span>}
          <span className={`rounded px-2 py-0.5 text-xs ${snap.isMigrated ? "bg-up/20 text-up" : pct >= 90 ? "bg-amber-500/20 text-amber-300" : "bg-edge text-mute"}`}>{status}</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Tile k="Price" v={`${price.toPrecision(4)} ${quoteSym}`} />
          <Tile k="Market cap" v={`${formatCompact(price * dec.supply)} ${quoteSym}`} />
          <Tile k="Volume" v="n/a (needs indexer)" />
          <Tile k="Holders" v="n/a (needs indexer)" />
        </div>
        <CurveChart points={points} quoteLabel={quoteSym} markerSold={marker} />
        <div className="card space-y-2 p-4">
          <div className="flex justify-between text-sm"><span>Bonding curve</span><span className="font-mono">{pct.toFixed(1)}% → DAMM v2</span></div>
          <ProgressBar pct={pct} />
          {snap.isMigrated && <p className="text-sm text-up">Now trading through Meteora DAMM v2. Find the migrated pool via the program <a className="underline" target="_blank" rel="noreferrer" href={explorerUrl("address", DAMM_V2_PROGRAM_ID)}>{shorten(DAMM_V2_PROGRAM_ID)}</a> or the pool’s migration transaction.</p>}
        </div>
        <div className="card p-4">
          <h2 className="mb-2 text-sm font-medium">Recent pool transactions</h2>
          <p className="mb-2 text-[11px] text-mute">Raw signatures from the pool account. Buy/sell parsing needs an indexer and is not shown.</p>
          <ul className="space-y-1 text-xs font-mono">
            {sigs.map((s) => (
              <li key={s.signature} className="flex justify-between">
                <a className="underline" target="_blank" rel="noreferrer" href={explorerUrl("tx", s.signature)}>{shorten(s.signature, 8)}</a>
                <span className={s.err ? "text-down" : "text-mute"}>{s.err ? "failed" : "ok"} · {s.blockTime ? new Date(s.blockTime * 1000).toLocaleTimeString() : "—"}</span>
              </li>
            ))}
            {!sigs.length && <li className="text-mute">No transactions yet.</li>}
          </ul>
        </div>
      </div>
      <aside className="space-y-4">
        <TradePanel snap={snap} baseDec={dec.base} quoteDec={dec.quote} quoteSymbol={quoteSym} symbol={symbol} balances={bal} onDone={load} />
        <div className="card space-y-1 p-4 text-xs">
          <Addr k="Token" v={snap.baseMint.toBase58()} /><Addr k="Pool" v={pool} /><Addr k="Creator" v={snap.creator.toBase58()} />
          <Addr k="Config" v={snap.poolState.config.toBase58()} /><Addr k="Quote" v={snap.quoteMint.toBase58()} />
          <div className="flex justify-between"><span className="text-mute">Quote reserve</span><span className="font-mono">{fromRawAmount(String(snap.poolState.quoteReserve?.toString() ?? "0"), dec.quote, 4)} {quoteSym}</span></div>
        </div>
      </aside>
    </div>
  );
}
const Tile = ({ k, v }: { k: string; v: string }) => <div className="card p-3"><div className="text-[11px] text-mute">{k}</div><div className="font-mono text-sm">{v}</div></div>;
const Addr = ({ k, v }: { k: string; v: string }) => (
  <div className="flex justify-between gap-2"><span className="text-mute">{k}</span>
    <a className="font-mono underline" target="_blank" rel="noreferrer" href={explorerUrl("address", v)}>{shorten(v)}</a></div>
);
