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
  const [slipPct, setSlipPct] = useState("1");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [quote, setQuote] = useState<any>(null);
  const [qErr, setQErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string; sig?: string } | null>(null);

  const inDec = buy ? quoteDec : baseDec, outDec = buy ? baseDec : quoteDec;
  const inSym = buy ? quoteSymbol : symbol, outSym = buy ? symbol : quoteSymbol;
  const raw = toRawAmount(amount, inDec);
  const slipBps = Math.round(Number(slipPct) * 100);
  const slipOk = Number.isFinite(slipBps) && slipBps >= 1 && slipBps <= 5000;
  const bal = Number(buy ? balances.quote : balances.base);

  useEffect(() => {
    setQuote(null); setQErr(null);
    if (!raw || snap.isMigrated || !slipOk) return;
    try { setQuote(quoteSwap(client, snap, { amountIn: new BN(raw), buy, slippageBps: slipBps })); }
    catch (e) { setQErr((e as Error).message); }
  }, [raw, buy, slipBps, slipOk, snap, client]);

  function setPct(p: number) {
    if (!Number.isFinite(bal) || bal <= 0) return;
    const spendable = buy && quoteSymbol === "SOL" ? Math.max(0, bal - 0.01) : bal;
    setAmount(String(Number(((spendable * p) / 100).toFixed(Math.min(inDec, 6)))));
  }

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
  const quick = buy && quoteSymbol === "SOL" ? ["0.05", "0.2", "1", "2"] : null;

  return (
    <div className="card overflow-hidden">
      <div className="grid grid-cols-2 border-b border-edge text-xs font-bold">
        <button onClick={() => { setBuy(true); setAmount(""); }} className={`py-3 ${buy ? "bg-violet/10 text-violet" : "text-mute"}`}>BUY</button>
        <button onClick={() => { setBuy(false); setAmount(""); }} className={`py-3 ${!buy ? "bg-violet/10 text-violet" : "text-mute"}`}>SELL</button>
      </div>
      <div className="space-y-3 p-4">
        <p className="text-xs text-mute">My holdings {balances.base} {symbol}</p>
        <div className="relative">
          <input className="field pr-16 font-mono" inputMode="decimal" placeholder={`Amount to ${buy ? "buy" : "sell"} in ${inSym}`} value={amount} onChange={(e) => setAmount(e.target.value)} disabled={snap.isMigrated} />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-mute">{inSym}</span>
        </div>
        {amount && !raw && <p className="text-xs text-down">Enter a valid amount (max {inDec} decimals).</p>}
        <p className="text-xs text-mute">You will receive <span className="text-white">{fmt(quote?.outputAmount, outDec)} {outSym}</span></p>
        <div className="grid grid-cols-5 gap-2">
          {quick ? quick.map((q) => <button key={q} className="pill !px-1 text-center" onClick={() => setAmount(q)}>{q}</button>)
            : [25, 50, 75].map((p) => <button key={p} className="pill !px-1 text-center" onClick={() => setPct(p)}>{p}%</button>)}
          {quick ? null : <span />}
          <button className="pill !px-1 text-center" onClick={() => setPct(100)}>MAX</button>
        </div>
        <button className="btn-primary w-full" disabled={!wallet.publicKey || !quote || busy || snap.isMigrated} onClick={submit}>
          {busy ? "Waiting for wallet…" : !wallet.publicKey ? "Connect wallet" : buy ? "Buy" : "Sell"}
        </button>
        <details>
          <summary className="cursor-pointer text-xs text-violet">Custom settings</summary>
          <div className="mt-3 space-y-3">
            <div className="flex items-center justify-between gap-3 text-xs"><span className="text-mute">Slippage</span>
              <div className="relative w-28"><input className="field !py-2 pr-7 text-right" value={slipPct} onChange={(e) => setSlipPct(e.target.value)} inputMode="decimal" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-mute">%</span></div></div>
            {!slipOk && <p className="text-xs text-down">Slippage must be between 0.01% and 50%.</p>}
            <dl className="space-y-1 text-xs">
              <Row k="Minimum received" v={`${fmt(quote?.minimumAmountOut, outDec)} ${outSym}`} />
              <Row k="Price impact" v={impact} />
              <Row k="Network fee" v="~0.000005 SOL" />
            </dl>
          </div>
        </details>
        {qErr && <p className="text-xs text-down">{qErr}</p>}
        {msg && <p className={`text-xs ${msg.ok ? "text-up" : "text-down"}`}>{msg.text}{msg.sig && <> · <a className="underline" target="_blank" rel="noreferrer" href={explorerUrl("tx", msg.sig)}>view tx</a></>}</p>}
        <p className="text-[11px] text-mute">Balance: {buy ? balances.quote : balances.base} {inSym}</p>
      </div>
    </div>
  );
}
const Row = ({ k, v }: { k: string; v: string }) => <div className="flex justify-between"><dt className="text-mute">{k}</dt><dd className="font-mono">{v}</dd></div>;
