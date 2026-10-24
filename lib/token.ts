// Server-side reads of a launched token, straight from the chain.
import { PublicKey } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID, unpackAccount } from "@solana/spl-token";
import { computeFeesBps, OnlinePumpSdk } from "@pump-fun/pump-sdk";
import type { PairId } from "./launchpad.ts";
import { ataOf } from "./mint.ts";
import { bondingCurvePda, curveStats, quoteFor, quotePriceSol } from "./pump.ts";
import { connection } from "./solana.ts";

// The bonding curve, read with the Pump SDK; null when there is none or the RPC did not answer.
// Cached briefly: the public RPC is slow and a page view should not cost three round-trips.
// `fees` is what a trade on this curve pays right now, from pump.fun's own fee tiers (they step
// with market cap), so the site quotes the same rates pump.fun does.
export type CurveStats = ReturnType<typeof curveStats> & { fees: { protocolBps: number; creatorBps: number } | null };
const curveCache = new Map<string, { at: number; s: CurveStats | null }>();
export async function curve(mint: string, pair: PairId = "sol"): Promise<CurveStats | null> {
  const hit = curveCache.get(mint);
  if (hit && Date.now() - hit.at < 15_000) return hit.s;
  let s: CurveStats | null = null;
  try {
    const conn = connection();
    const sdk = new OnlinePumpSdk(conn);
    const [c, g, q, feeConfig] = await Promise.all([sdk.fetchBondingCurve(new PublicKey(mint)), sdk.fetchGlobal(), quoteFor(sdk, pair), sdk.fetchFeeConfig().catch(() => null)]);
    let fees: CurveStats["fees"] = null;
    try {
      const f = computeFeesBps({ global: g, feeConfig, mintSupply: c.tokenTotalSupply, virtualQuoteReserves: c.virtualQuoteReserves, virtualTokenReserves: c.virtualTokenReserves, quoteMint: q.mint });
      fees = { protocolBps: f.protocolFeeBps.toNumber(), creatorBps: f.creatorFeeBps.toNumber() };
    } catch { /* an SDK the fee program has moved past; the site then omits the rates */ }
    s = { ...curveStats(c, g, { pair, decimals: q.decimals, priceSol: await quotePriceSol(sdk, conn, q) }), fees };
  } catch { /* no curve yet, or RPC down */ }
  curveCache.set(mint, { at: Date.now(), s });
  return s;
}

/**
 * The last trades on the curve, newest first, read the way pump.fun's list shows them: the trader,
 * buy or sell, the SOL that moved into or out of the curve (fees excluded) and the tokens that
 * changed hands. Transactions that touch the curve without trading (the create, a fee sweep) are
 * left out. A confirmed transaction never changes, so each one is parsed once and remembered.
 */
export type Trade = {
  signature: string; at: Date | null; account: string; side: "buy" | "sell"; sol: number; tokens: number;
  /** Tokens left in the curve's own account after this trade: the chart's history comes from it. */
  curveTokens: number;
};
const tradeCache = new Map<string, Trade | null>();
export async function trades(mint: string, limit = 60): Promise<Trade[] | null> {
  try {
    const conn = connection();
    const curvePda = bondingCurvePda(new PublicKey(mint)).toBase58();
    const sigs = await conn.getSignaturesForAddress(new PublicKey(curvePda), { limit });
    const out: Trade[] = [];
    for (const s of sigs) {
      if (s.err) continue;
      if (!tradeCache.has(s.signature)) {
        let t: Trade | null = null;
        try {
          const tx = await conn.getParsedTransaction(s.signature, { maxSupportedTransactionVersion: 0 });
          const keys = tx?.transaction.message.accountKeys ?? [];
          const signerIx = keys.findIndex((k) => k.signer);
          const curveIx = keys.findIndex((k) => k.pubkey.toBase58() === curvePda);
          const signer = signerIx >= 0 ? keys[signerIx].pubkey.toBase58() : null;
          const bal = (list: typeof tx extends null ? never : NonNullable<NonNullable<typeof tx>["meta"]>["preTokenBalances"]) =>
            Number(list?.find((b) => b.mint === mint && b.owner === signer)?.uiTokenAmount.uiAmount ?? 0);
          const tokens = bal(tx?.meta?.postTokenBalances) - bal(tx?.meta?.preTokenBalances);
          const sol = tx?.meta && curveIx >= 0 ? (tx.meta.postBalances[curveIx] - tx.meta.preBalances[curveIx]) / 1e9 : 0;
          const curveTokens = Number(tx?.meta?.postTokenBalances?.find((b) => b.mint === mint && b.owner === curvePda)?.uiTokenAmount.uiAmount ?? 0);
          if (signer && tokens !== 0) t = { signature: s.signature, at: s.blockTime ? new Date(s.blockTime * 1000) : null, account: signer, side: tokens > 0 ? "buy" : "sell", sol: Math.abs(sol), tokens: Math.abs(tokens), curveTokens };
        } catch { /* leave it out this time; try again on the next view */ continue; }
        tradeCache.set(s.signature, t);
      }
      const t = tradeCache.get(s.signature);
      if (t) out.push(t);
    }
    return out;
  } catch {
    return null;
  }
}

// ponytail: getTokenLargestAccounts returns the top 20, so 20 means "20 or more"; a full count needs
// an indexer (Helius DAS) and is not worth it before anything trades. Cached a minute per mint
// because the public RPC is slow and the number barely moves.
const HOLDERS_TTL = 60_000;
export type Holder = { account: string; owner: string; amount: bigint };
const holdersCache = new Map<string, { at: number; top: Holder[] | null }>();

/**
 * Holders from the trades themselves: the wallets whose token balance of this mint changed in the
 * last trades on the curve, re-read now. Works on any RPC, because getTokenLargestAccounts and
 * getProgramAccounts are refused by the public ones. ponytail: bounded to the last 40 trades; a
 * coin with hundreds of holders wants an indexer (Helius DAS), not a longer loop.
 */
export async function holdersFromTrades(mint: string, limit = 30): Promise<Holder[] | null> {
  try {
    const conn = connection();
    const mintPk = new PublicKey(mint);
    const sigs = await conn.getSignaturesForAddress(bondingCurvePda(mintPk), { limit });
    const owners = new Set<string>();
    // One at a time with a breath between: the public RPC refuses the batched form outright.
    for (const s of sigs) {
      const tx = await conn.getParsedTransaction(s.signature, { maxSupportedTransactionVersion: 0 }).catch(() => null);
      for (const b of tx?.meta?.postTokenBalances ?? []) if (b.mint === mint && b.owner) owners.add(b.owner);
      await new Promise((r) => setTimeout(r, 200));
    }
    const curve = bondingCurvePda(mintPk).toBase58();
    const out: Holder[] = [];
    for (const owner of owners) {
      if (owner === curve) continue;
      const ata = ataOf(mintPk, new PublicKey(owner));
      const amount = await conn.getTokenAccountBalance(ata).then((b) => BigInt(b.value.amount)).catch(() => 0n);
      if (amount > 0n) out.push({ account: ata.toBase58(), owner, amount });
    }
    return out.sort((a, b) => (b.amount > a.amount ? 1 : -1));
  } catch {
    return null;
  }
}

/** The largest holders, amounts in base units. null when the RPC did not answer either way. */
export async function largest(mint: string, fresh = false): Promise<Holder[] | null> {
  const hit = holdersCache.get(mint);
  if (!fresh && hit && Date.now() - hit.at < HOLDERS_TTL) return hit.top;
  let top: Holder[] | null = null;
  try {
    const conn = connection();
    const r = await conn.getTokenLargestAccounts(new PublicKey(mint));
    const nonzero = r.value.filter((a) => BigInt(a.amount) > 0n);
    const infos = await conn.getMultipleAccountsInfo(nonzero.map((a) => a.address));
    top = nonzero.map((a, i) => ({ account: a.address.toBase58(), owner: infos[i] ? unpackAccount(a.address, infos[i], TOKEN_2022_PROGRAM_ID).owner.toBase58() : "", amount: BigInt(a.amount) }));
  } catch {
    top = await holdersFromTrades(mint); // the public RPC refuses the direct call
  }
  holdersCache.set(mint, { at: Date.now(), top });
  return top;
}
export const holders = async (mint: string): Promise<number | null> => (await largest(mint))?.length ?? null;

/** A wallet's balance of the token, in base units. 0 when it has no account. */
export async function balanceOf(mint: string, wallet: string): Promise<bigint> {
  try {
    const b = await connection().getTokenAccountBalance(ataOf(new PublicKey(mint), new PublicKey(wallet)));
    return BigInt(b.value.amount);
  } catch {
    return 0n;
  }
}
