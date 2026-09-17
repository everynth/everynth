import { Connection, PublicKey } from "@solana/web3.js";
import { RPC_URL } from "./config.ts";

// Server-side chain access. RPC_URL (private, e.g. a Helius key) wins over the public one.
export const connection = () => new Connection(process.env.RPC_URL ?? RPC_URL, "confirmed");

export function treasuryWallet(): string {
  return new PublicKey(process.env.TREASURY_WALLET ?? "").toBase58(); // throws if unset or malformed
}
