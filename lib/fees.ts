// The fee round: what HIRE's central wallet does every 15 minutes, for every coin launched here.
//
// pump.fun pays every coin's creator fee to the EVERYNTH vault — in SOL for a SOL-paired coin, in
// EVYN for an EVYN-paired one. A round, per launch:
//   1. sweep — move the fee bucket off the curve (and the pool, after graduation) into the vault's
//      creator-vault PDA, measuring how much so the amount stays attributed to this launch;
//   2. collect — move the PDA's balance to the vault wallet (one instruction per quote);
//   3. split — on an EVYN pair, half the EVYN is burned first; then the launch's mechanics in
//      their signed order (nothing to the launcher, as at HIRE): buyback buys the coin back off its curve, burn
//      burns what buyback bought, holder rewards and lottery pay holders, revshare pays the
//      launcher; mechanics with no on-chain action yet (stock, loyalty, referral, LP) leave their
//      share in the vault, recorded as held.
// Amounts too small to split carry over to the next round. Every round is a row in fee_rounds.
import { randomUUID } from "node:crypto";
import { Keypair, PublicKey, SystemProgram, Transaction, type TransactionInstruction } from "@solana/web3.js";
import {
  createAssociatedTokenAccountIdempotentInstruction, createBurnInstruction, createTransferCheckedInstruction, getAssociatedTokenAddressSync,
  NATIVE_MINT, TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { creatorVaultPda, OnlinePumpSdk, PUMP_SDK } from "@pump-fun/pump-sdk";
import bs58 from "bs58";
import { query } from "./db.ts";
import { hooksOf } from "./launches.ts";
import { waterfall, type PairId } from "./launchpad.ts";
import { bondingCurvePda, buyInstructions, quoteFor, type Quote } from "./pump.ts";
import { connection, vaultWallet } from "./solana.ts";
import { largest } from "./token.ts";

/** Below this (in the quote's base units), a launch's fees carry over instead of being split: a round costs a few transactions. */
export const ROUND_MIN_LAMPORTS = Number(process.env.FEE_ROUND_MIN_LAMPORTS ?? 5_000_000);
const PAYOUT_MIN = 10_000; // base units; smaller holder payouts are noise next to the rent they'd need
/** On an EVYN pair, this much of every round's EVYN is burned before anything is split. */
export const EVYN_BURN_PCT = 50;

export type Round = {
  launch: string; ticker: string; mint: string; pair: PairId; quote: string; swept: number; burnedQuote: number; launcher: number; buyback: number; burned: number;
  holders: number; revshare: number; lottery: number; held: number; txs: string[]; graduated: boolean; note?: string;
};

/** The vault's keypair, from VAULT_SECRET (a JSON byte array or base58). Must be the vault wallet. */
export function vaultKeypair(): Keypair {
  const raw = process.env.VAULT_SECRET?.trim();
  if (!raw) throw new Error("VAULT_SECRET is not set");
  const kp = Keypair.fromSecretKey(raw.startsWith("[") ? Uint8Array.from(JSON.parse(raw)) : bs58.decode(raw));
  if (kp.publicKey.toBase58() !== vaultWallet()) throw new Error("VAULT_SECRET does not match VAULT_WALLET");
  return kp;
}

type Row = { id: string; ticker: string; mint: string; wallet: string; creator_fee: number; stack: string; status: string; carry: string; pair: string };

export async function runFeeRound(): Promise<Round[]> {
  const vault = vaultKeypair();
  const conn = connection();
  const sdk = new OnlinePumpSdk(conn);
  const [global, feeConfig] = await Promise.all([sdk.fetchGlobal(), sdk.fetchFeeConfig()]);
  const launches = await query<Row>(
    `select id, ticker, mint, wallet, creator_fee, stack, status, carry::text as carry, pair from launches where mint is not null and status in ('launched','graduated') order by created_at`,
  );
  const send = async (ixs: TransactionInstruction[], signers: Keypair[] = []) => {
    const latest = await conn.getLatestBlockhash();
    const tx = new Transaction({ feePayer: vault.publicKey, ...latest }).add(...ixs);
    tx.sign(vault, ...signers);
    const sig = await conn.sendRawTransaction(tx.serialize());
    await conn.confirmTransaction({ signature: sig, ...latest }, "confirmed");
    return sig;
  };
  const quotes: Record<string, Quote> = {};
  const quoteOf = async (pair: string): Promise<Quote> => (quotes[pair] ??= await quoteFor(sdk, pair === "evyn" ? "evyn" : "sol"));
  // what sits in the creator-vault PDA for a quote: lamports for SOL, the PDA's quote ATA for a token
  const pdaBalance = async (q: Quote) => {
    if (q.pair === "sol") return Number((await sdk.getCreatorVaultBalanceBothPrograms(vault.publicKey)).toString());
    return tokenBalance(getAssociatedTokenAddressSync(q.mint, creatorVaultPda(vault.publicKey), true, q.tokenProgram));
  };
  const tokenBalance = async (ata: PublicKey) => { try { return Number((await conn.getTokenAccountBalance(ata)).value.amount); } catch { return 0; } };

  const rounds: Round[] = [];
  // 1. sweep, per launch, measuring the PDA before and after so the amount stays attributed
  const swept = new Map<string, { amount: number; txs: string[]; graduated: boolean }>();
  for (const l of launches) {
    const mint = new PublicKey(l.mint);
    const curve = await sdk.fetchBondingCurve(mint).catch(() => null);
    if (!curve) continue;
    const q = await quoteOf(l.pair);
    const graduated = curve.complete;
    if (graduated && l.status === "launched") await query(`update launches set status = 'graduated' where id = $1`, [l.id]);
    const txs: string[] = [];
    let amount = 0;
    const ixs: TransactionInstruction[] = [];
    const quoteMint = q.pair === "sol" ? NATIVE_MINT : q.mint;
    if (curve.creatorFee.gtn(0)) ixs.push(await PUMP_SDK.sweepCreatorFeeInstruction({ payer: vault.publicKey, mint, creator: vault.publicKey, quoteMint, quoteTokenProgram: q.tokenProgram }));
    if (graduated) ixs.push(await PUMP_SDK.sweepPoolCreatorFeeInstruction({ payer: vault.publicKey, mint, coinCreator: vault.publicKey, quoteMint, quoteTokenProgram: q.tokenProgram }));
    if (ixs.length) {
      const before = await pdaBalance(q);
      try { txs.push(await send(ixs)); amount = Math.max(0, (await pdaBalance(q)) - before); } catch { /* an empty pool bucket refuses the sweep; nothing to attribute */ }
    }
    swept.set(l.id, { amount, txs, graduated });
  }

  // 2. collect everything the sweeps moved (and anything older) into the vault wallet, per quote
  for (const q of Object.values(quotes)) {
    if ((await pdaBalance(q)) <= 0) continue;
    try {
      if (q.pair === "sol") await send(await sdk.collectCoinCreatorFeeInstructions(vault.publicKey));
      else await send([
        createAssociatedTokenAccountIdempotentInstruction(vault.publicKey, getAssociatedTokenAddressSync(q.mint, vault.publicKey, false, q.tokenProgram), vault.publicKey, q.mint, q.tokenProgram),
        ...(await sdk.collectCoinCreatorFeeV2Instructions(vault.publicKey, q.mint, q.tokenProgram)),
      ]);
    } catch (e) {
      if ([...swept.values()].some((s) => s.amount > 0)) throw e;
    }
  }

  // 3. split, per launch, in the signed order
  for (const l of launches) {
    const s = swept.get(l.id);
    if (!s) continue;
    const q = await quoteOf(l.pair);
    const pot = s.amount + Number(l.carry);
    const round: Round = { launch: l.id, ticker: l.ticker, mint: l.mint, pair: q.pair, quote: q.pair === "sol" ? "SOL" : "EVYN", swept: s.amount, burnedQuote: 0, launcher: 0, buyback: 0, burned: 0, holders: 0, revshare: 0, lottery: 0, held: 0, txs: [...s.txs], graduated: s.graduated };
    if (pot < ROUND_MIN_LAMPORTS) {
      await query(`update launches set carry = $1 where id = $2`, [pot, l.id]);
      if (s.amount > 0) await record(l.id, round);
      round.note = `carried ${pot}`;
      rounds.push(round);
      continue;
    }
    const mint = new PublicKey(l.mint);
    const launcher = new PublicKey(l.wallet);
    const vaultQuoteAta = getAssociatedTokenAddressSync(q.mint, vault.publicKey, false, q.tokenProgram);
    const transfers: TransactionInstruction[] = [];
    // paying someone in the quote: lamports, or a transfer of the quote token into their account
    const pay = (to: PublicKey, amount: number) => {
      if (q.pair === "sol") { transfers.push(SystemProgram.transfer({ fromPubkey: vault.publicKey, toPubkey: to, lamports: amount })); return; }
      const ata = getAssociatedTokenAddressSync(q.mint, to, true, q.tokenProgram);
      transfers.push(
        createAssociatedTokenAccountIdempotentInstruction(vault.publicKey, ata, to, q.mint, q.tokenProgram),
        createTransferCheckedInstruction(vaultQuoteAta, q.mint, ata, vault.publicKey, BigInt(amount), q.decimals, [], q.tokenProgram),
      );
    };
    let rest = pot;
    // on an EVYN pair, the burn comes first: it is the platform's rule, not the launcher's choice
    if (q.pair === "evyn") {
      round.burnedQuote = Math.floor((rest * EVYN_BURN_PCT) / 100);
      if (round.burnedQuote > 0) transfers.push(createBurnInstruction(vaultQuoteAta, q.mint, vault.publicKey, BigInt(round.burnedQuote), [], q.tokenProgram));
      rest -= round.burnedQuote;
    }
    // HIRE's rule: the creator fee is the vault's in full, nothing to the launcher. The column stays
    // at zero so older rounds, when launches still carried a share, keep their figures.
    round.launcher = 0;
    if (round.launcher > 0) pay(launcher, round.launcher);
    rest -= round.launcher;
    const stack = hooksOf(l.stack);
    const holdersList = stack.some((h) => h === "holder" || h === "lottery") ? await holderWallets(mint, [vault.publicKey, bondingCurvePda(mint)]) : [];
    for (const step of waterfall(stack)) {
      const amt = Math.floor((rest * step.got) / 100);
      if (amt <= 0) continue;
      switch (step.hook.id) {
        case "buyback": {
          const ata = getAssociatedTokenAddressSync(mint, vault.publicKey, false, TOKEN_2022_PROGRAM_ID);
          const before = await tokenBalance(ata);
          try {
            round.txs.push(await send(await buybackInstructions({ sdk, global, feeConfig, mint, vault: vault.publicKey, amount: amt, q })));
            round.buyback = amt;
            const bought = (await tokenBalance(ata)) - before;
            if (bought > 0 && stack.includes("burn")) {
              round.txs.push(await send([createBurnInstruction(ata, mint, vault.publicKey, BigInt(bought), [], TOKEN_2022_PROGRAM_ID)]));
              round.burned = bought;
            }
          } catch { round.held += amt; }
          break;
        }
        case "holder": {
          const paid = proRata(amt, holdersList);
          for (const p of paid) pay(p.owner, p.amount);
          round.holders = paid.reduce((n, p) => n + p.amount, 0);
          round.held += amt - round.holders;
          break;
        }
        case "lottery": {
          const winner = weightedPick(holdersList);
          if (winner && amt >= PAYOUT_MIN) { pay(winner, amt); round.lottery = amt; }
          else round.held += amt;
          break;
        }
        case "revshare":
          pay(launcher, amt);
          round.revshare = amt;
          break;
        default:
          round.held += amt; // stock, loyalty, referral, LP: no on-chain action yet, the share waits in the vault
      }
    }
    rest -= round.buyback + round.holders + round.lottery + round.revshare;
    round.held += rest - round.held; // whatever the waterfall left unspent stays with the vault, as HIRE's costs share does
    // token payouts carry an account-creation each; keep a transaction to a handful of them
    for (let i = 0; i < transfers.length; i += q.pair === "sol" ? 20 : 8) round.txs.push(await send(transfers.slice(i, i + (q.pair === "sol" ? 20 : 8))));
    await query(`update launches set carry = 0 where id = $1`, [l.id]);
    await record(l.id, round);
    rounds.push(round);
  }
  return rounds;
}

/** Buy the coin back off its curve with `amount` of the quote: SOL straight in, or EVYN already held. */
async function buybackInstructions(p: { sdk: OnlinePumpSdk; global: Parameters<typeof buyInstructions>[0]["global"]; feeConfig: Parameters<typeof buyInstructions>[0]["feeConfig"]; mint: PublicKey; vault: PublicKey; amount: number; q: Quote }) {
  if (p.q.pair === "sol") return buyInstructions({ sdk: p.sdk, global: p.global, feeConfig: p.feeConfig, mint: p.mint, user: p.vault, sol: p.amount / 1e9, slippage: 5, quote: p.q });
  // the vault holds EVYN already, so this is a plain buy on the coin's EVYN-quoted curve
  const { getBuyV3TokenAmountFromQuoteAmount } = await import("@pump-fun/pump-sdk");
  const BN = (await import("bn.js")).default;
  const { bondingCurve, associatedUserAccountInfo, quoteTokenProgram, curveBaseTokenBalance } = await p.sdk.fetchBuyState(p.mint, p.vault, TOKEN_2022_PROGRAM_ID, p.q.mint);
  const quoteAmount = new BN(p.amount);
  const out = getBuyV3TokenAmountFromQuoteAmount({ global: p.global, feeConfig: p.feeConfig, mintSupply: bondingCurve.tokenTotalSupply, bondingCurve, amount: quoteAmount, curveBaseTokenBalance });
  return PUMP_SDK.buyExactQuoteInV3Instructions({ bondingCurve, associatedUserAccountInfo, mint: p.mint, user: p.vault, quoteAmount, amount: out, slippage: 5, tokenProgram: TOKEN_2022_PROGRAM_ID, quoteTokenProgram });
}

const record = (launchId: string, r: Round) =>
  query(
    `insert into fee_rounds (id, launch_id, swept, launcher, buyback, burned, holders, revshare, lottery, held, txs, quote, burned_quote)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    [randomUUID(), launchId, r.swept, r.launcher, r.buyback, r.burned, r.holders, r.revshare, r.lottery, r.held, JSON.stringify(r.txs), r.quote, r.burnedQuote],
  );

/** The holders as wallets with their balances, minus the accounts that are not people. */
async function holderWallets(mint: PublicKey, exclude: PublicKey[]) {
  const top = await largest(mint.toBase58(), true); // a payout reads the chain now, never a cached minute-old list
  const skip = new Set(exclude.map((k) => k.toBase58()));
  return (top ?? []).filter((h) => h.owner && !skip.has(h.owner)).map((h) => ({ owner: new PublicKey(h.owner), amount: Number(h.amount) }));
}

function proRata(total: number, holders: { owner: PublicKey; amount: number }[]) {
  const held = holders.reduce((n, h) => n + h.amount, 0);
  if (!held) return [];
  return holders.map((h) => ({ owner: h.owner, amount: Math.floor((total * h.amount) / held) })).filter((p) => p.amount >= PAYOUT_MIN);
}

function weightedPick(holders: { owner: PublicKey; amount: number }[]): PublicKey | null {
  const total = holders.reduce((n, h) => n + h.amount, 0);
  if (!total) return null;
  let r = Math.random() * total;
  for (const h of holders) { r -= h.amount; if (r <= 0) return h.owner; }
  return holders[holders.length - 1].owner;
}
