import {
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { PublicKey, type TransactionInstruction } from "@solana/web3.js";
import { USDC_DECIMALS } from "./config.ts";

export type Order = {
  mint: string;
  reference: string; // unique per purchase, rides along in the tx so it cannot pay for anything else
  creator: string;
  creatorAmount: number;
  treasury: string;
  fee: number;
};

// No program of ours: one atomic tx with two plain USDC transfers. Funds never touch the platform.
export function buildPaymentInstructions(buyer: PublicKey, order: Order): TransactionInstruction[] {
  const mint = new PublicKey(order.mint);
  const from = getAssociatedTokenAddressSync(mint, buyer);
  const instructions: TransactionInstruction[] = [];
  for (const [owner, amount] of payouts(order)) {
    const ownerKey = new PublicKey(owner);
    const to = getAssociatedTokenAddressSync(mint, ownerKey, true);
    // Recipient may never have held USDC; buyer covers the one-time account rent if so.
    instructions.push(createAssociatedTokenAccountIdempotentInstruction(buyer, to, ownerKey, mint));
    instructions.push(createTransferCheckedInstruction(from, mint, to, buyer, amount, USDC_DECIMALS));
  }
  // Solana Pay convention: reference is a read-only, non-signer key on a transfer instruction.
  instructions[1].keys.push({ pubkey: new PublicKey(order.reference), isSigner: false, isWritable: false });
  return instructions;
}

// Owner -> amount owed. Merges the two legs when creator and treasury are the same wallet.
function payouts(order: Order): Map<string, number> {
  const owed = new Map<string, number>();
  for (const [owner, amount] of [[order.creator, order.creatorAmount], [order.treasury, order.fee]] as const) {
    if (amount > 0) owed.set(owner, (owed.get(owner) ?? 0) + amount);
  }
  return owed;
}

type TokenBalance = { mint: string; owner?: string; uiTokenAmount: { amount: string } };
export type PaidTx = {
  meta: { err: unknown; preTokenBalances?: TokenBalance[] | null; postTokenBalances?: TokenBalance[] | null } | null;
  transaction: { message: { accountKeys: { pubkey: { toBase58(): string } }[] } };
};

// Returns null when the on-chain tx really pays this order, otherwise the reason it does not.
// Checks balance deltas per owner instead of parsing instructions, so it holds however the tx was built.
export function verifyPayment(tx: PaidTx | null, order: Order): string | null {
  if (!tx?.meta) return "transaction not found";
  if (tx.meta.err) return "transaction failed on-chain";
  const keys = tx.transaction.message.accountKeys.map((k) => k.pubkey.toBase58());
  if (!keys.includes(order.reference)) return "transaction does not carry this order's reference";

  const delta = new Map<string, bigint>();
  const add = (balances: TokenBalance[] | null | undefined, sign: bigint) => {
    for (const b of balances ?? []) {
      if (b.mint !== order.mint || !b.owner) continue;
      delta.set(b.owner, (delta.get(b.owner) ?? 0n) + sign * BigInt(b.uiTokenAmount.amount));
    }
  };
  add(tx.meta.postTokenBalances, 1n);
  add(tx.meta.preTokenBalances, -1n);

  for (const [owner, amount] of payouts(order)) {
    if ((delta.get(owner) ?? 0n) < BigInt(amount)) return `underpaid: ${owner} did not receive ${amount}`;
  }
  return null;
}
