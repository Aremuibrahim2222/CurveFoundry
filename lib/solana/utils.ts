import { Connection, PublicKey } from "@solana/web3.js";

export const NETWORK = (process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "devnet") as "devnet" | "mainnet-beta";
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export function getConnection(): Connection {
  const url = process.env.NEXT_PUBLIC_RPC_URL ?? "https://api.devnet.solana.com";
  return new Connection(url, "confirmed");
}

export function isValidPublicKey(value: string): boolean {
  try { new PublicKey(value); return true; } catch { return false; }
}

export function toPublicKey(value: string): PublicKey {
  if (!isValidPublicKey(value)) throw new Error(`Invalid public key: ${value}`);
  return new PublicKey(value);
}

export const shorten = (a: string, n = 4) => (a.length > n * 2 + 1 ? `${a.slice(0, n)}…${a.slice(-n)}` : a);

export function explorerUrl(kind: "tx" | "address", value: string): string {
  const cluster = NETWORK === "mainnet-beta" ? "" : `?cluster=${NETWORK}`;
  return `https://explorer.solana.com/${kind}/${value}${cluster}`;
}

/** Convert a UI decimal string to raw integer string without float error. Returns null if invalid. */
export function toRawAmount(input: string, decimals: number): string | null {
  const s = input.trim();
  if (!/^\d*\.?\d*$/.test(s) || s === "" || s === ".") return null;
  const [whole, frac = ""] = s.split(".");
  if (frac.length > decimals) return null;
  const raw = (whole || "0") + frac.padEnd(decimals, "0");
  const trimmed = raw.replace(/^0+(?=\d)/, "");
  return trimmed === "0" ? null : trimmed;
}

export function fromRawAmount(raw: string, decimals: number, maxFrac = 6): string {
  const neg = raw.startsWith("-");
  const digits = (neg ? raw.slice(1) : raw).padStart(decimals + 1, "0");
  const whole = digits.slice(0, digits.length - decimals);
  const frac = digits.slice(digits.length - decimals).slice(0, maxFrac).replace(/0+$/, "");
  return `${neg ? "-" : ""}${whole}${frac ? "." + frac : ""}`;
}

export function formatCompact(n: number): string {
  if (!isFinite(n)) return "—";
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(2) + "K";
  return n.toFixed(n < 1 ? 6 : 2);
}
