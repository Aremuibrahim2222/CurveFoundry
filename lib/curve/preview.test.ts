import { describe, it, expect } from "vitest";
import { defaultDefinition } from "./definition";
import { curvePoints, previewTrade, totalToGraduate } from "./preview";

describe("preview math", () => {
  const d = defaultDefinition("rwa");
  it("starts at initial and ends at graduation market cap", () => {
    const pts = curvePoints(d);
    expect(pts[0].marketCap).toBeCloseTo(d.initialMarketCap, 6);
    expect(pts[pts.length - 1].marketCap).toBeCloseTo(d.migrationMarketCap, 6);
  });
  it("buying the full graduation cost reaches graduation", () => {
    expect(previewTrade(d, 0, "buy", totalToGraduate(d) * 1.01).reachesGraduation).toBe(true);
  });
  it("buy then sell is symmetric", () => {
    const b = previewTrade(d, 0, "buy", 10);
    const s = previewTrade(d, b.endProgress, "sell", b.tokens);
    expect(s.quote).toBeCloseTo(10, 6);
  });
});
