import type { CurvePoint } from "./preview";

/** Walks the SDK-derived curve. Excludes trading fees. Simulation only. */
export interface SimResult { tokens: number; quote: number; priceAfter: number; impactPct: number; progressPct: number; marketCapAfter: number }

const totalRaised = (pts: CurvePoint[]) => pts[pts.length - 1]?.raised ?? 0;

function interp(pts: CurvePoint[], key: "raised" | "tokensSold", v: number): CurvePoint {
  if (!pts.length) throw new Error("empty curve");
  if (v <= pts[0][key]) return pts[0];
  for (let i = 1; i < pts.length; i++) {
    if (v <= pts[i][key]) {
      const a = pts[i - 1], b = pts[i], t = (v - a[key]) / (b[key] - a[key] || 1);
      return {
        tokensSold: a.tokensSold + (b.tokensSold - a.tokensSold) * t, price: a.price + (b.price - a.price) * t,
        raised: a.raised + (b.raised - a.raised) * t, marketCap: a.marketCap + (b.marketCap - a.marketCap) * t,
      };
    }
  }
  return pts[pts.length - 1];
}

/** startPct = hypothetical curve position (0-100) by quote raised. */
export function simulateBuy(pts: CurvePoint[], quoteIn: number, startPct: number): SimResult | null {
  if (!pts.length || !(quoteIn > 0)) return null;
  const T = totalRaised(pts), from = interp(pts, "raised", (startPct / 100) * T);
  const to = interp(pts, "raised", Math.min(T, from.raised + quoteIn));
  const spent = to.raised - from.raised, tokens = to.tokensSold - from.tokensSold;
  return { tokens, quote: spent, priceAfter: to.price, impactPct: (to.price / from.price - 1) * 100, progressPct: (to.raised / T) * 100, marketCapAfter: to.marketCap };
}

export function simulateSell(pts: CurvePoint[], tokensIn: number, startPct: number): SimResult | null {
  if (!pts.length || !(tokensIn > 0)) return null;
  const T = totalRaised(pts), from = interp(pts, "raised", (startPct / 100) * T);
  const to = interp(pts, "tokensSold", Math.max(0, from.tokensSold - tokensIn));
  return { tokens: from.tokensSold - to.tokensSold, quote: from.raised - to.raised, priceAfter: to.price, impactPct: (to.price / from.price - 1) * 100, progressPct: (to.raised / T) * 100, marketCapAfter: to.marketCap };
}
