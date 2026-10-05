import type { CurveDefinition } from "./definition";

/**
 * Single-segment constant-product PREVIEW of a CurveDefinition (price = quote per base token).
 *   base sold x = L(1/sp0 - 1/sp),  quote paid y = L(sp - sp0),  sp = sqrt(price)
 * Assumes the whole supply sits on the curve and ignores fees, so it is an approximation.
 * The deployed on-chain config is authoritative; live pages use real SDK quotes, never this.
 */
function params(d: CurveDefinition) {
  const sp0 = Math.sqrt(d.initialMarketCap / d.totalSupply);
  const sp1 = Math.sqrt(d.migrationMarketCap / d.totalSupply);
  const L = d.totalSupply / (1 / sp0 - 1 / sp1);
  return { sp0, sp1, L };
}

export interface CurvePoint { sold: number; marketCap: number; price: number; quoteRaised: number }

export function curvePoints(d: CurveDefinition, n = 60): CurvePoint[] {
  const { sp0, sp1, L } = params(d);
  return Array.from({ length: n + 1 }, (_, i) => {
    const f = i / n;
    const sp = 1 / (1 / sp0 - f * (1 / sp0 - 1 / sp1));
    return { sold: f, price: sp * sp, marketCap: sp * sp * d.totalSupply, quoteRaised: L * (sp - sp0) };
  });
}

export function totalQuoteToGraduate(d: CurveDefinition) {
  const { sp0, sp1, L } = params(d);
  return L * (sp1 - sp0);
}

export function simulateBuy(d: CurveDefinition, quoteIn: number, alreadyRaised = 0) {
  const { sp0, sp1, L } = params(d);
  const spStart = sp0 + alreadyRaised / L;
  const spEnd = Math.min(spStart + quoteIn / L, sp1);
  const tokensOut = L * (1 / spStart - 1 / spEnd);
  const spent = L * (spEnd - spStart);
  return {
    tokensOut, spent, avgPrice: tokensOut > 0 ? spent / tokensOut : 0,
    priceAfter: spEnd * spEnd, impactPct: (spEnd * spEnd) / (spStart * spStart) * 100 - 100,
    marketCapAfter: spEnd * spEnd * d.totalSupply, progress: (spEnd - sp0) / (sp1 - sp0), reachesGraduation: spEnd >= sp1,
  };
}

export function simulateSell(d: CurveDefinition, tokensIn: number, alreadyRaised = 0) {
  const { sp0, L } = params(d);
  const spStart = sp0 + alreadyRaised / L;
  const soldNow = L * (1 / sp0 - 1 / spStart);
  const x = Math.min(tokensIn, soldNow);
  const spEnd = 1 / (1 / spStart + x / L);
  return { quoteOut: L * (spStart - spEnd), priceAfter: spEnd * spEnd, impactPct: (spEnd * spEnd) / (spStart * spStart) * 100 - 100 };
}
