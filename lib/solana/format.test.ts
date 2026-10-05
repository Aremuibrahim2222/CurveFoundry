import { describe, it, expect } from "vitest";
import { toUnits, fromUnits, isValidPublicKey, shortAddr } from "./format";

describe("format", () => {
  it("parses and formats units", () => {
    expect(toUnits("1.5", 9).toString()).toBe("1500000000");
    expect(fromUnits(toUnits("1.5", 9), 9)).toBe("1.5");
  });
  it("rejects bad amounts", () => {
    expect(() => toUnits("abc", 9)).toThrow();
    expect(() => toUnits("1.1234567891", 9)).toThrow();
  });
  it("validates public keys", () => {
    expect(isValidPublicKey("So11111111111111111111111111111111111111112")).toBe(true);
    expect(isValidPublicKey("nope")).toBe(false);
  });
  it("shortens", () => expect(shortAddr("So11111111111111111111111111111111111111112")).toBe("So11…1112"));
});
