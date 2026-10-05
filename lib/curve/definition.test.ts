import { describe, it, expect } from "vitest";
import { applyPreset, defaultDefinition, parseDefinition, serializeDefinition, validateDefinition } from "./definition";

describe("CurveDefinition", () => {
  it("defaults validate", () => {
    for (const c of ["ai", "stock", "rwa", "meme", "creator", "custom"] as const) expect(validateDefinition(defaultDefinition(c))).toEqual([]);
  });
  it("rejects graduation cap below initial", () => expect(validateDefinition({ ...defaultDefinition("ai"), migrationMarketCap: 1 }).length).toBeGreaterThan(0));
  it("rejects fee ordering", () => {
    const d = defaultDefinition("ai"); d.baseFee.endingBps = 9999;
    expect(validateDefinition(d).length).toBeGreaterThan(0);
  });
  it("presets change market caps", () => expect(applyPreset(defaultDefinition("ai"), "fast").migrationMarketCap).toBe(150));
  it("round-trips JSON and rejects invalid", () => {
    const d = defaultDefinition("rwa");
    expect(parseDefinition(serializeDefinition(d))).toEqual(d);
    expect(() => parseDefinition(JSON.stringify({ ...d, totalSupply: -1 }))).toThrow();
  });
});
