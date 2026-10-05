"use client";
import { useEffect, useState } from "react";
import BN from "bn.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { useDbc } from "@/hooks/useDbc";
import { PoolSnapshot, buildSwapTx, quoteSwap } from "@/lib/meteora/dbc";
import { recordTransaction } from "@/lib/supabase/queries";
import { explorerUrl, fromRawAmount, toRawAmount } from "@/lib/solana/utils";

interface Props { snap: PoolSnapshot; baseDec: number; quoteDec: number; quoteSymbol: string; symbol: string; balances: { base: string; quote: string }; onDone: () => void }

export default function TradePanel({ snap, baseDec, quoteDec, quoteSymbol, symbol, balances, onDone }: Props) {
  const { connection, client } = useDbc();
  const wallet = useWallet();
  const [buy, setBuy] = useState(true);
  const [amount, setAmount] = useState("");
  const [slip, setSlip] = useState(100);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [quote, setQuote] = useState<any>(null);
  const [qErr, setQErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string; sig?: string } | null>(null);

  const inDec = buy ? quoteDec : baseDec, outDec = buy ? baseDec : quoteDec;
  const inSym = buy ? quoteSymbol : symbol, outSym = buy ? symbol : quoteSymbol;
  const raw = toRawAmount(amount, inDec);

  useEffect(() => {
    setQuote(null); setQErr(null);
    if (!raw || snap.isMigrated) return;
    try { setQuote(quoteSwap(client, snap, { amountIn: new BN(raw), buy, slippageBps: slip })); }
    catch (e) { setQErr((e as Error).message); }
  }, [raw, buy, slip, snap, client]);

  async function submit() {
    setMsg(null);
    if (!wallet.publicKey || !raw || !quote) return;
    setBusy(true);
    try {
      const tx = await buildSwapTx(client, { owner: wallet.publicKey, pool: snap.pool, buy, amountIn: new BN(raw), minimumAmountOut: quote.minimumAmountOut });
      const sig = await wallet.sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, "confirmed");
      setMsg({ ok: true, text: "Confirmed", sig });
      void recordTransaction({ signature: sig, pool_address: snap.pool.toBase58(), wallet: wallet.publicKey.toBase58(), side: buy ? "buy" : "sell" });
      setAmount(""); onDone();
    } catch (e) { setMsg({ ok: false, text: (e as Error).message }); }
    finally { setBusy(false); }
  }

  const fmt = (v: unknown, d: number) => (v == null ? "—" : fromRawAmount(String(v.toString()), d, 6));
  const impact = quote?.priceImpact != null ? `${Number(quote.priceImpact.toString()).toFixed(2)}%` : "—";

  return (
    <div className="card space-y-3 p-4">
      <div className="grid grid-cols-2 gap-1 rounded-md bg-ink p-1 text-sm">
        <button onClick={() => setBuy(true)} className={`rounded py-1.5 ${buy ? "bg-up/20 text-up" : "text-mute"}`}>Buy</button>
        <button onClick={() => setBuy(false)} className={`rounded py-1.5 ${!buy ? "bg-down/20 text-down" : "text-mute"}`}>Sell</button>
      </div>
      <div>
        <div className="flex justify-between"><label className="label">Amount ({inSym})</label>
          <span className="text-xs text-mute">Balance {buy ? balances.quote : balances.base}</span></div>
        <input className="field font-mono" inputMode="decimal" placeholder="0.0" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={snap.isMigrated} />
        {amount && !raw && <p className="mt-1 text-xs text-down">Enter a valid amount (max {inDec} decimals).</p>}
      </div>
      <div className="flex items-center gap-2 text-xs text-mute">Slippage
        {[50, 100, 300].map((b) => <button key={b} onClick={() => setSlip(b)} className={`rounded border px-2 py-0.5 ${slip === b ? "border-violet text-white" : "border-edge"}`}>{b / 100}%</button>)}</div>
      <dl className="space-y-1 rounded-md bg-ink p-3 text-xs">
        <Row k={`Estimated ${outSym}`} v={fmt(quote?.outputAmount, outDec)} />
        <Row k="Minimum received" v={fmt(quote?.minimumAmountOut, outDec)} />
        <Row k="Price impact" v={impact} />
        <Row k="Network fee" v="~0.000005 SOL + priority" />
      </dl>
      {qErr && <p className="text-xs text-down">{qErr}</p>}
      <button className="btn-primary w-full" disabled={!wallet.publicKey || !quote || busy || snap.isMigrated} onClick={submit}>
        {busy ? "Waiting for wallet…" : !wallet.publicKey ? "Connect wallet" : `${buy ? "Buy" : "Sell"} ${symbol}`}
      </button>
      {msg && <p className={`text-xs ${msg.ok ? "text-up" : "text-down"}`}>{msg.text}{msg.sig && <> · <a className="underline" target="_blank" rel="noreferrer" href={explorerUrl("tx", msg.sig)}>view tx</a></>}</p>}
    </div>
  );
}
const Row = ({ k, v }: { k: string; v: string }) => <div className="flex justify-between"><dt className="text-mute">{k}</dt><dd className="font-mono">{v}</dd></div>;
