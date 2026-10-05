import { describe, it, expect } from "vitest";
import { simulateBuy, simulateSell } from "./simulate";
import type { CurvePoint } from "./preview";

// Linear toy curve: price = 1 + sold/100, raised accumulates trapezoids.
const pts: CurvePoint[] = Array.from({ length: 101 }, (_, i) => ({
  tokensSold: i, price: 1 + i / 100, raised: i + (i * i) / 200, marketCap: (1 + i / 100) * 1000,
}));

describe("simulate", () => {
  it("buy moves price up and progress forward", () => {
    const r = simulateBuy(pts, 10, 0)!;
    expect(r.tokens).toBeGreaterThan(0); expect(r.impactPct).toBeGreaterThan(0); expect(r.progressPct).toBeGreaterThan(0);
  });
  it("buy is capped at graduation", () => expect(simulateBuy(pts, 1e9, 0)!.progressPct).toBeCloseTo(100));
  it("sell moves price down", () => expect(simulateSell(pts, 10, 50)!.impactPct).toBeLessThan(0));
  it("rejects bad input", () => { expect(simulateBuy(pts, 0, 0)).toBeNull(); expect(simulateBuy([], 1, 0)).toBeNull(); });
});
