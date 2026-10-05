import BN from "bn.js";
import { PublicKey } from "@solana/web3.js";

export const shortAddr = (a: string, n = 4) => (a.length > n * 2 + 1 ? `${a.slice(0, n)}…${a.slice(-n)}` : a);

export function isValidPublicKey(v: string): boolean {
  try { new PublicKey(v); return true; } catch { return false; }
}

/** "1.5" + 9 decimals -> BN(1_500_000_000). Throws on invalid input. */
export function toUnits(input: string, decimals: number): BN {
  const s = input.trim();
  if (!/^\d*\.?\d+$|^\d+\.?$/.test(s)) throw new Error("Enter a valid amount");
  const [whole, frac = ""] = s.split(".");
  if (frac.length > decimals) throw new Error(`Max ${decimals} decimal places`);
  return new BN((whole || "0") + frac.padEnd(decimals, "0"));
}

export function fromUnits(v: BN, decimals: number, maxFrac = 4): string {
  const s = v.toString().padStart(decimals + 1, "0");
  const whole = s.slice(0, s.length - decimals);
  const frac = s.slice(s.length - decimals).slice(0, maxFrac).replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : whole;
}

export const fmtNum = (n: number, max = 2) =>
  Number.isFinite(n) ? n.toLocaleString("en-US", { maximumFractionDigits: max }) : "—";
