import {
  ActivationType, BaseFeeMode, CollectFeeMode, DammV2BaseFeeMode, DammV2DynamicFeeMode, MigratedCollectFeeMode,
  MigrationFeeOption, MigrationOption, TokenAuthorityOption, TokenDecimal, TokenType, buildCurveWithMarketCap,
} from "@meteora-ag/dynamic-bonding-curve-sdk";
import type { CurveDefinition } from "./definition";
import { QUOTE_MINTS } from "@/lib/solana/env";

/**
 * The ONLY place a CurveDefinition becomes Meteora builder input. Shape follows the docs examples
 * (SDK 1.5.x); field names must be checked against installed types, see METEORA_INTEGRATION.md.
 */
export function toSdkCurveConfig(d: CurveDefinition) {
  const quoteDecimals = QUOTE_MINTS[d.quote].decimals;
  return buildCurveWithMarketCap({
    totalTokenSupply: d.totalSupply,
    initialMarketCap: d.initialMarketCap,
    migrationMarketCap: d.migrationMarketCap,
    migrationOption: MigrationOption.MET_DAMM_V2,
    tokenBaseDecimal: d.tokenDecimals === 6 ? TokenDecimal.SIX : TokenDecimal.NINE,
    tokenQuoteDecimal: quoteDecimals === 9 ? TokenDecimal.NINE : TokenDecimal.SIX,
    tokenType: TokenType.SPLToken,
    tokenAuthorityOption: TokenAuthorityOption.PartnerUpdateAuthority,
    lockedVestingParam: { totalLockedVestingAmount: 0, numberOfVestingPeriod: 0, cliffUnlockAmount: 0, totalVestingDuration: 0, cliffDurationFromMigrationTime: 0 },
    baseFeeParams: {
      baseFeeMode: BaseFeeMode.FeeSchedulerExponential,
      feeSchedulerParam: {
        startingFeeBps: d.baseFee.startingBps, endingFeeBps: d.baseFee.endingBps,
        numberOfPeriod: d.baseFee.periods, totalDuration: d.baseFee.durationSeconds,
      },
    },
    dynamicFeeEnabled: d.dynamicFee,
    activationType: ActivationType.Timestamp,
    collectFeeMode: CollectFeeMode.QuoteToken,
    creatorTradingFeePercentage: d.creatorTradingFeePct,
    poolCreationFee: 0,
    migrationFeeOption: MigrationFeeOption.Customizable,
    migrationFee: { feePercentage: 0, creatorFeePercentage: 0 },
    migratedPoolFee: {
      collectFeeMode: MigratedCollectFeeMode.QuoteToken, dynamicFee: DammV2DynamicFeeMode.Enabled,
      poolFeeBps: 120, baseFeeMode: DammV2BaseFeeMode.FeeTimeSchedulerLinear,
    },
    partnerLiquidityPercentage: 0, creatorLiquidityPercentage: 0,
    partnerPermanentLockedLiquidityPercentage: 100, creatorPermanentLockedLiquidityPercentage: 0,
    leftover: 0, enableFirstSwapWithMinFee: false,
  } as never);
}
