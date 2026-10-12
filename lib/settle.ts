import { PublicKey } from "@solana/web3.js";
import { query } from "./db.ts";
import { verifyPayment } from "./payment.ts";
import { connection } from "./solana.ts";

export type Purchase = {
  id: string;
  product_id: string;
  buyer: string;
  reference: string;
  creator: string;
  creator_amount: number;
  treasury: string;
  fee: number;
  status: "pending" | "paid";
};
export const PURCHASE_COLS =
  "id, product_id, buyer, reference, creator, creator_amount::float8 as creator_amount, treasury, fee::float8 as fee, status";

// Marks a pending purchase as paid if the chain agrees. Returns null on success, else the reason.
// Without a signature it finds the tx through the order's reference, which also recovers
// payments where the browser died between sending the tx and telling us about it.
export async function settle(p: Purchase, signature?: string): Promise<string | null> {
  if (p.status === "paid") return null;
  try {
    const conn = connection();
    signature ??= (await conn.getSignaturesForAddress(new PublicKey(p.reference), { limit: 1 }))[0]?.signature;
    if (!signature) return "payment not found yet";
    const tx = await conn.getParsedTransaction(signature, { maxSupportedTransactionVersion: 0 });
    const error = verifyPayment(tx, {
      reference: p.reference,
      creator: p.creator,
      creatorAmount: p.creator_amount,
      treasury: p.treasury,
      fee: p.fee,
    });
    if (error) return error;
    // `signature` is unique: one tx carrying two references still settles only one purchase.
    await query(`update purchases set status = 'paid', signature = $1 where id = $2`, [signature, p.id]);
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : "could not verify payment";
  }
}
