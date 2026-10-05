import { Connection, PublicKey } from "@solana/web3.js";
import { CpAmm } from "@meteora-ag/cp-amm-sdk";

/**
 * DAMM v2 reads. After graduation the DBC pool is flagged migrated; locate the DAMM v2 pool address from the
 * migration transaction / Meteora UI and pass it here. API (CpAmm.fetchPoolState) must be verified on the installed version.
 */
export async function fetchDammPoolState(connection: Connection, pool: PublicKey) {
  const amm = new CpAmm(connection);
  return amm.fetchPoolState(pool);
}

export const DAMM_V2_PROGRAM_ID = "cpamdpZCGKUy5JxQXB4dcpGPiikHawvSWAd6mEn1sGG";
