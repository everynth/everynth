import { Connection, PublicKey } from "@solana/web3.js";
import { RPC_URL } from "./config.ts";

// Server-side chain access. RPC_URL (private, e.g. a Helius key) wins over the public one.
export const connection = () => new Connection(process.env.RPC_URL ?? RPC_URL, "confirmed");

export function treasuryWallet(): string {
  return new PublicKey(process.env.TREASURY_WALLET ?? "").toBase58(); // throws if unset or malformed
}

/**
 * The launchpad's vault: the creator of every coin, the wallet pump.fun pays creator fees to, and
 * the signer of every fee round (VAULT_SECRET is its key). Kept apart from the treasury so the
 * market's 5% can stay in a cold wallet while the vault stays hot. Falls back to the treasury.
 */
export function vaultWallet(): string {
  return new PublicKey(process.env.VAULT_WALLET || process.env.TREASURY_WALLET || "").toBase58();
}
