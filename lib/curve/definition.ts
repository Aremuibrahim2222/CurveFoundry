/**
 * CurveDefinition: app-level model edited by the Market Designer.
 * lib/meteora/build.ts is the only place it becomes Meteora builder input.
 */
export type AssetCategory = "ai" | "stock" | "rwa" | "meme" | "creator" | "custom";
export type CurvePreset = "steady" | "long" | "fast" | "thin" | "custom";

export interface CurveDefinition {
  preset: CurvePreset;
  totalSupply: number;
  tokenDecimals: 6 | 9;
  quote: "SOL" | "USDC";
  initialMarketCap: number;
  migrationMarketCap: number;
  baseFee: { startingBps: number; endingBps: number; periods: number; durationSeconds: number };
  dynamicFee: boolean;
  creatorTradingFeePct: number;
  lockedLiquidityPct: number; // % of migrated liquidity permanently locked (partner side)
  migrationDestination: "DAMM_V2";
}

export const CATEGORY_LABELS: Record<AssetCategory, string> = {
  ai: "AI Agent", stock: "Tokenized Stock", rwa: "RWA", meme: "Meme", creator: "Creator Asset", custom: "Custom",
};

export const PRESET_INFO: Record<Exclude<CurvePreset, "custom">, { label: string; blurb: string; values: Partial<CurveDefinition> }> = {
  steady: { label: "Steady", blurb: "Gradual price discovery.", values: { initialMarketCap: 30, migrationMarketCap: 300 } },
  long: { label: "Long Curve", blurb: "Longer discovery period, high graduation cap.", values: { initialMarketCap: 20, migrationMarketCap: 900 } },
  fast: { label: "Fast Launch", blurb: "Reaches graduation quickly.", values: { initialMarketCap: 30, migrationMarketCap: 150 } },
  thin: { label: "Thin Market", blurb: "Low starting cap for thin early liquidity.", values: { initialMarketCap: 10, migrationMarketCap: 200 } },
};

export const CATEGORY_DEFAULTS: Record<AssetCategory, CurvePreset> = {
  ai: "long", stock: "thin", rwa: "steady", meme: "fast", creator: "steady", custom: "custom",
};

export function applyPreset(d: CurveDefinition, preset: CurvePreset): CurveDefinition {
  return preset === "custom" ? { ...d, preset } : { ...d, ...PRESET_INFO[preset].values, preset };
}

export function defaultDefinition(category: AssetCategory): CurveDefinition {
  const base: CurveDefinition = {
    preset: "custom", totalSupply: 1_000_000_000, tokenDecimals: 6, quote: "SOL",
    initialMarketCap: 30, migrationMarketCap: 300,
    baseFee: { startingBps: 500, endingBps: 100, periods: 10, durationSeconds: 600 },
    dynamicFee: true, creatorTradingFeePct: 0, lockedLiquidityPct: 100, migrationDestination: "DAMM_V2",
  };
  return applyPreset(base, CATEGORY_DEFAULTS[category]);
}

export function validateDefinition(d: CurveDefinition): string[] {
  const e: string[] = [];
  if (!(d.totalSupply > 0)) e.push("Total supply must be positive");
  if (!(d.initialMarketCap > 0)) e.push("Initial market cap must be positive");
  if (!(d.migrationMarketCap > d.initialMarketCap)) e.push("Graduation market cap must exceed initial market cap");
  const { startingBps, endingBps, periods, durationSeconds } = d.baseFee;
  if (startingBps < endingBps) e.push("Starting fee must be at least the ending fee");
  if (startingBps < 0 || startingBps > 9900) e.push("Starting fee must be 0-9900 bps");
  if (endingBps < 0) e.push("Ending fee cannot be negative");
  if (periods < 0 || durationSeconds < 0) e.push("Fee schedule values cannot be negative");
  if (d.creatorTradingFeePct < 0 || d.creatorTradingFeePct > 100) e.push("Creator fee share must be 0-100%");
  if (d.lockedLiquidityPct < 0 || d.lockedLiquidityPct > 100) e.push("Locked liquidity must be 0-100%");
  if (d.tokenDecimals !== 6 && d.tokenDecimals !== 9) e.push("Token decimals must be 6 or 9");
  return e;
}

export const serializeDefinition = (d: CurveDefinition) => JSON.stringify(d, null, 2);
export const parseDefinition = (s: string): CurveDefinition => {
  const d = JSON.parse(s) as CurveDefinition;
  const errs = validateDefinition(d);
  if (errs.length) throw new Error(errs.join("; "));
  return d;
};
