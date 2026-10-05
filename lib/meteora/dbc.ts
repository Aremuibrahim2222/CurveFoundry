import BN from "bn.js";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import {
  ActivationType, DynamicBondingCurveClient, SwapMode, deriveDbcPoolAddress,
} from "@meteora-ag/dynamic-bonding-curve-sdk";

/** The only module that calls the DBC SDK. Components import from here. */
export const getDbcClient = (c: Connection) => DynamicBondingCurveClient.create(c, "confirmed");
export const derivePoolAddress = (quote: PublicKey, base: PublicKey, config: PublicKey) =>
  deriveDbcPoolAddress(quote, base, config);

export async function buildCreateConfigTx(
  client: DynamicBondingCurveClient,
  a: { config: PublicKey; wallet: PublicKey; quoteMint: PublicKey; curveConfig: object },
): Promise<Transaction> {
  const tx = await client.partner.createConfig({
    config: a.config, feeClaimer: a.wallet, leftoverReceiver: a.wallet, payer: a.wallet,
    quoteMint: a.quoteMint, ...a.curveConfig,
  } as never);
  tx.feePayer = a.wallet;
  return tx;
}

export async function buildCreatePoolTx(
  client: DynamicBondingCurveClient,
  a: { baseMint: PublicKey; config: PublicKey; name: string; symbol: string; uri: string; wallet: PublicKey },
): Promise<Transaction> {
  const tx = await client.creator.createPool({
    baseMint: a.baseMint, config: a.config, name: a.name, symbol: a.symbol, uri: a.uri,
    payer: a.wallet, poolCreator: a.wallet,
  });
  tx.feePayer = a.wallet;
  return tx;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface PoolSnapshot {
  pool: PublicKey; poolState: any; raw: any; config: any; progress: number; currentPoint: BN;
  baseMint: PublicKey; quoteMint: PublicKey; creator: PublicKey; isMigrated: boolean; sqrtPrice: number;
}

/** Handles both `getPool` return shapes (flat account, or wrapper with .poolState). */
export async function getPoolSnapshot(client: DynamicBondingCurveClient, connection: Connection, pool: PublicKey): Promise<PoolSnapshot> {
  const raw: any = await client.state.getPool(pool);
  if (!raw) throw new Error("Pool not found on this network");
  const ps = raw.poolState ?? raw;
  const config: any = await client.state.getPoolConfig(ps.config);
  const progress = Number(await client.state.getPoolQuoteTokenCurveProgress(pool));
  const currentPoint = config.activationType === ActivationType.Slot
    ? new BN(await connection.getSlot()) : new BN(Math.floor(Date.now() / 1000));
  return {
    pool, poolState: ps, raw, config, progress, currentPoint,
    baseMint: ps.baseMint, quoteMint: config.quoteMint, creator: ps.creator,
    isMigrated: Number(ps.isMigrated) > 0, sqrtPrice: Number(ps.sqrtPrice.toString()) / 2 ** 64,
  };
}

export const priceFromSnapshot = (s: PoolSnapshot, baseDec: number, quoteDec: number) =>
  s.sqrtPrice * s.sqrtPrice * 10 ** (baseDec - quoteDec);

export function quoteSwap(client: DynamicBondingCurveClient, s: PoolSnapshot, a: { amountIn: BN; buy: boolean; slippageBps: number }) {
  return client.pool.swapQuote2({
    virtualPool: s.raw, config: s.config, swapBaseForQuote: !a.buy,
    swapMode: a.buy ? SwapMode.PartialFill : SwapMode.ExactIn,
    amountIn: a.amountIn, slippageBps: a.slippageBps, hasReferral: false,
    eligibleForFirstSwapWithMinFee: false, currentPoint: s.currentPoint,
  });
}

export async function buildSwapTx(
  client: DynamicBondingCurveClient,
  a: { owner: PublicKey; pool: PublicKey; buy: boolean; amountIn: BN; minimumAmountOut: BN },
): Promise<Transaction> {
  return client.pool.swap2({
    owner: a.owner, pool: a.pool, swapBaseForQuote: !a.buy,
    swapMode: a.buy ? SwapMode.PartialFill : SwapMode.ExactIn,
    amountIn: a.amountIn, minimumAmountOut: a.minimumAmountOut, referralTokenAccount: null,
  });
}

export async function buildMigrateToDammV2Tx(
  client: DynamicBondingCurveClient, a: { payer: PublicKey; pool: PublicKey; dammConfig: PublicKey },
) {
  const { transaction } = await client.migration.migrateToDammV2(a);
  return transaction;
}
