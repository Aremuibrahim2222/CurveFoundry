import { NATIVE_MINT } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import {
  ActivationType, BaseFeeMode, buildCurveWithMarketCap, CollectFeeMode, DammV2BaseFeeMode,
  DammV2DynamicFeeMode, MigratedCollectFeeMode, MigrationFeeOption, MigrationOption, TokenAuthorityOption,
  TokenDecimal, TokenType,
} from "@meteora-ag/dynamic-bonding-curve-sdk";
import type { CurveDefinition } from "@/lib/curve/definition";

/**
 * CurveDefinition -> real Meteora config via buildCurveWithMarketCap.
 * Shape follows docs.meteora.ag DBC TS SDK examples; verify against installed types (METEORA_INTEGRATION.md).
 */
export function quoteMintFor(d: CurveDefinition): PublicKey {
  if (d.quote === "SOL") return NATIVE_MINT;
  const m = process.env.NEXT_PUBLIC_USDC_MINT;
  if (!m) throw new Error("USDC quote requires NEXT_PUBLIC_USDC_MINT");
  return new PublicKey(m);
}

export const quoteDecimals = (d: CurveDefinition) => (d.quote === "SOL" ? 9 : 6);

export function buildCurveConfig(d: CurveDefinition) {
  const baseDec = d.tokenDecimals === 6 ? TokenDecimal.SIX : TokenDecimal.NINE;
  const quoteDec = d.quote === "SOL" ? TokenDecimal.NINE : TokenDecimal.SIX;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const params: any = {
    token: {
      tokenType: TokenType.SPLToken,
      tokenBaseDecimal: baseDec,
      tokenQuoteDecimal: quoteDec,
      tokenAuthorityOption: TokenAuthorityOption.PartnerUpdateAuthority,
      totalTokenSupply: d.totalSupply,
      leftover: 0,
    },
    fee: {
      baseFeeParams: {
        baseFeeMode: BaseFeeMode.FeeSchedulerExponential,
        feeSchedulerParam: {
          startingFeeBps: d.baseFee.startingBps, endingFeeBps: d.baseFee.endingBps,
          numberOfPeriod: d.baseFee.periods, totalDuration: d.baseFee.durationSeconds,
        },
      },
      dynamicFeeEnabled: d.dynamicFee,
      collectFeeMode: CollectFeeMode.QuoteToken,
      creatorTradingFeePercentage: d.creatorTradingFeePct,
      poolCreationFee: 0,
      enableFirstSwapWithMinFee: false,
    },
    migration: {
      migrationOption: MigrationOption.MET_DAMM_V2,
      migrationFeeOption: MigrationFeeOption.Customizable,
      migrationFee: { feePercentage: 0, creatorFeePercentage: 0 },
      migratedPoolFee: {
        collectFeeMode: MigratedCollectFeeMode.QuoteToken,
        dynamicFee: DammV2DynamicFeeMode.Enabled,
        poolFeeBps: 120,
        baseFeeMode: DammV2BaseFeeMode.FeeTimeSchedulerLinear,
      },
    },
    liquidityDistribution: {
      partnerLiquidityPercentage: 100 - d.lockedLiquidityPct,
      partnerPermanentLockedLiquidityPercentage: d.lockedLiquidityPct,
      creatorLiquidityPercentage: 0,
      creatorPermanentLockedLiquidityPercentage: 0,
    },
    lockedVesting: {
      totalLockedVestingAmount: 0, numberOfVestingPeriod: 0, cliffUnlockAmount: 0,
      totalVestingDuration: 0, cliffDurationFromMigrationTime: 0,
    },
    activationType: ActivationType.Timestamp,
    initialMarketCap: d.initialMarketCap,
    migrationMarketCap: d.migrationMarketCap,
  };
  return buildCurveWithMarketCap(params);
}
