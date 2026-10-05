# METEORA_INTEGRATION.md

Verified against docs.meteora.ag (DBC TS SDK Getting Started, Examples, Reference) on 2026-10-01.
Package: `@meteora-ag/dynamic-bonding-curve-sdk` (docs reference SDK 1.5.x; install latest and re-check types).

## Program IDs
- DBC (mainnet + devnet): `dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN`
- DAMM v2: `cpamdpZCGKUy5JxQXB4dcpGPiikHawvSWAd6mEn1sGG`

## Client
- `DynamicBondingCurveClient.create(connection, "confirmed")` (constructor is also public)
- Namespaces: `client.partner`, `client.creator`, `client.pool`, `client.state`, `client.migration`

## Config (curve) builders
- `buildCurve` (migrationQuoteThreshold + percentageSupplyOnMigration)
- `buildCurveWithMarketCap` (initialMarketCap + migrationMarketCap)
- `buildCurveWithTwoSegments`, `buildCurveWithMidPrice`, `buildCurveWithLiquidityWeights`
- `buildCurveWithCustomSqrtPrices` + `createSqrtPrices(prices, baseDecimal, quoteDecimal)`

Config param groups (from the docs example): `token`, `fee` (baseFeeParams, dynamicFeeEnabled,
collectFeeMode, creatorTradingFeePercentage, poolCreationFee, enableFirstSwapWithMinFee),
`migration` (migrationOption, migrationFeeOption, migrationFee, migratedPoolFee),
`liquidityDistribution`, `lockedVesting`, `activationType`.

Fee modes seen: `BaseFeeMode.FeeSchedulerExponential`, fee scheduler params
(`startingFeeBps`, `endingFeeBps`, `numberOfPeriod`, `totalDuration`).
Docs warn: rate limiter mode and DAMM v1 migration are deprecated for new configs. Use DAMM v2.

## Launch
1. `client.partner.createConfig({ config, feeClaimer, leftoverReceiver, payer, quoteMint, ...curveConfig })`
   (signed by payer + new config keypair)
2. `client.creator.createPool({ baseMint, config, name, symbol, uri, payer, poolCreator })`
3. Pool address: `deriveDbcPoolAddress(quoteMint, baseMint, config)`

## Quote / swap
- `client.pool.swapQuote2({ virtualPool, config, swapBaseForQuote, swapMode, amountIn, slippageBps, hasReferral, eligibleForFirstSwapWithMinFee, currentPoint })`
- `client.pool.swap2({ owner, pool, swapBaseForQuote, swapMode, amountIn, minimumAmountOut, referralTokenAccount })`
- `SwapMode.ExactIn | PartialFill | ExactOut`. Use PartialFill near graduation.
- `currentPoint`: slot if `configState.activationType === ActivationType.Slot`, else unix seconds (BN).

## State
- `client.state.getPool(pool)`, `client.state.getPoolConfig(configAddress)`
- `client.state.getPoolQuoteTokenCurveProgress(pool)`, `getPoolBaseTokenCurveProgress(pool)`
- `client.state.getPoolFeeMetrics(pool)`, `getPoolFeeBreakdown(pool)`

## Migration / graduation
- DAMM v2: optional `createLocker`, then `client.migration.migrateToDammV2({ payer, pool, dammConfig })`
- Mainnet keepers migrate eligible pools automatically (quote-mint thresholds, e.g. 10 SOL / 750 USDC).
  Keepers only migrate when `migration_quote_threshold` matches; a custom threshold may need the manual migrator.
- Devnet: use the Manual Migrator (migrator.meteora.ag) or `migrateToDammV2`.

## Not yet verified (check installed types before use)
- Exact field types of `buildCurveWithMarketCap` input
- DAMM v2 SDK pool-state API (`@meteora-ag/cp-amm-sdk`)
- Whether `swapQuote2` result exposes price impact directly (compute from price delta if not)
