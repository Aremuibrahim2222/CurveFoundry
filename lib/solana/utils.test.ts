import { describe, it, expect } from "vitest";
import { isValidPublicKey, toRawAmount, fromRawAmount, shorten } from "./utils";

describe("solana utils", () => {
  it("validates public keys", () => {
    expect(isValidPublicKey("dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN")).toBe(true);
    expect(isValidPublicKey("nope")).toBe(false);
  });
  it("converts amounts without float error", () => {
    expect(toRawAmount("1.5", 9)).toBe("1500000000");
    expect(toRawAmount("0.1", 9)).toBe("100000000");
    expect(toRawAmount("1.1234567891", 9)).toBeNull();
    expect(toRawAmount("abc", 9)).toBeNull();
    expect(toRawAmount("0", 9)).toBeNull();
  });
  it("formats raw amounts", () => {
    expect(fromRawAmount("1500000000", 9)).toBe("1.5");
    expect(fromRawAmount("5", 6)).toBe("0.000005");
  });
  it("shortens", () => expect(shorten("abcdefghijklmnop")).toBe("abcd…mnop"));
});
