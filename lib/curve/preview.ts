/**
 * Curve preview derived from the SDK-built config's `curve` segments (sqrtPrice + liquidity, Q64.64).
 * Math (floats, preview only): base = (L/2^64)(1/s_lo - 1/s_hi), quote = (L/2^64)(s_hi - s_lo), s = sqrtPrice/2^64.
 * Verify against docs.meteora.ag/core-products/dbc/formulas.
 */
export interface CurvePoint { tokensSold: number; price: number; raised: number; marketCap: number }

const Q64 = 2 ** 64;
const num = (v: unknown): number => Number((v as { toString(): string }).toString());

export function previewFromConfig(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cfg: any, baseDecimals: number, quoteDecimals: number, totalSupply: number, stepsPerSegment = 40,
): CurvePoint[] {
  const segs: { sqrtPrice: unknown; liquidity: unknown }[] = (cfg?.curve ?? []).filter(
    (s: { liquidity: unknown }) => num(s.liquidity) > 0,
  );
  const start = num(cfg?.sqrtStartPrice) / Q64;
  if (!segs.length || !start) return [];
  const scale = 10 ** (baseDecimals - quoteDecimals);
  const pts: CurvePoint[] = [];
  let lo = start, sold = 0, raised = 0;
  const push = (s: number) => {
    const price = s * s * scale;
    pts.push({ tokensSold: sold / 10 ** baseDecimals, price, raised: raised / 10 ** quoteDecimals, marketCap: price * totalSupply });
  };
  push(lo);
  for (const seg of segs) {
    const hi = num(seg.sqrtPrice) / Q64;
    const L = num(seg.liquidity) / Q64;
    if (hi <= lo) continue;
    for (let i = 1; i <= stepsPerSegment; i++) {
      const s = lo + ((hi - lo) * i) / stepsPerSegment;
      const prev = lo + ((hi - lo) * (i - 1)) / stepsPerSegment;
      sold += L * (1 / prev - 1 / s);
      raised += L * (s - prev);
      push(s);
    }
    lo = hi;
  }
  return pts;
}
