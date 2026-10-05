"use client";
import { useMemo } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { getDbcClient } from "@/lib/meteora/dbc";

export function useDbc() {
  const { connection } = useConnection();
  return useMemo(() => ({ connection, client: getDbcClient(connection) }), [connection]);
}
