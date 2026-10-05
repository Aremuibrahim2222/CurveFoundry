import { describe, it, expect } from "vitest";
import { defaultDefinition } from "./definition";
import { curvePoints, simulateBuy, simulateSell, totalQuoteToGraduate } from "./math";

const d = defaultDefinition("rwa");
describe("curve preview math", () => {
  it("starts at initial and ends at migration market cap", () => {
    const p = curvePoints(d);
    expect(p[0].marketCap).toBeCloseTo(d.initialMarketCap, 6);
    expect(p[p.length - 1].marketCap).toBeCloseTo(d.migrationMarketCap, 4);
  });
  it("buying the full graduation amount reaches graduation", () => {
    const r = simulateBuy(d, totalQuoteToGraduate(d) * 1.01);
    expect(r.reachesGraduation).toBe(true);
    expect(r.progress).toBeCloseTo(1, 6);
  });
  it("buy then sell is lossy only by nothing (no fee) and impact is positive", () => {
    const b = simulateBuy(d, 5);
    expect(b.impactPct).toBeGreaterThan(0);
    const s = simulateSell(d, b.tokensOut, 5);
    expect(s.quoteOut).toBeCloseTo(5, 4);
  });
});
