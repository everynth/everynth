import { PublicKey, SystemProgram, type TransactionInstruction } from "@solana/web3.js";

export type Order = {
  reference: string; // unique per purchase, rides along in the tx so it cannot pay for anything else
  creator: string;
  creatorAmount: number; // lamports
  treasury: string;
  fee: number; // lamports
};

// No program of ours: one atomic tx with two plain SOL transfers. Funds never touch the platform.
export function buildPaymentInstructions(buyer: PublicKey, order: Order): TransactionInstruction[] {
  const instructions = [...payouts(order)].map(([owner, lamports]) =>
    SystemProgram.transfer({ fromPubkey: buyer, toPubkey: new PublicKey(owner), lamports }),
  );
  // Solana Pay convention: reference is a read-only, non-signer key on a transfer instruction.
  instructions[0].keys.push({ pubkey: new PublicKey(order.reference), isSigner: false, isWritable: false });
  return instructions;
}

// Owner -> lamports owed. Merges the two legs when creator and treasury are the same wallet.
function payouts(order: Order): Map<string, number> {
  const owed = new Map<string, number>();
  for (const [owner, amount] of [[order.creator, order.creatorAmount], [order.treasury, order.fee]] as const) {
    if (amount > 0) owed.set(owner, (owed.get(owner) ?? 0) + amount);
  }
  return owed;
}

export type PaidTx = {
  meta: { err: unknown; preBalances: number[]; postBalances: number[] } | null;
  transaction: { message: { accountKeys: { pubkey: { toBase58(): string } }[] } };
};

// Returns null when the on-chain tx really pays this order, otherwise the reason it does not.
// Checks lamport deltas per account instead of parsing instructions, so it holds however the tx was built.
export function verifyPayment(tx: PaidTx | null, order: Order): string | null {
  if (!tx?.meta) return "transaction not found";
  if (tx.meta.err) return "transaction failed on-chain";
  const keys = tx.transaction.message.accountKeys.map((k) => k.pubkey.toBase58());
  if (!keys.includes(order.reference)) return "transaction does not carry this order's reference";

  const delta = new Map<string, number>();
  keys.forEach((key, i) => {
    delta.set(key, (delta.get(key) ?? 0) + (tx.meta!.postBalances[i] ?? 0) - (tx.meta!.preBalances[i] ?? 0));
  });
  for (const [owner, amount] of payouts(order)) {
    if ((delta.get(owner) ?? 0) < amount) return `underpaid: ${owner} did not receive ${amount} lamports`;
  }
  return null;
}
