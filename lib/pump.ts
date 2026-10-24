// The launchpad's trading venue: pump.fun's bonding curve, the same mechanism hireagents.fun runs
// on. A launch is a `create_v2` on the Pump program (a Token-2022 mint, 1 billion supply, 6
// decimals); the dev buy follows in its own transaction; trades are `buy_v3` / `sell_v3` against
// the curve, or a multi-hop swap through EVYN when the coin is quoted in it; at 100% the curve
// migrates to a PumpSwap pool. We write no program of our own.
//
// The coin's creator (the wallet pump.fun pays creator fees to) is the EVERYNTH vault, as HIRE's
// vault is for every coin launched there; the desk then runs the launch's mechanics on what the
// vault collects. Shared by browser and server.
import { PublicKey, type Connection } from "@solana/web3.js";
import { NATIVE_MINT, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  bondingCurvePda, getBuyV3TokenAmountFromQuoteAmount, getSellSolAmountFromTokenAmount, OnlinePumpSdk, PUMP_PROGRAM_ID, PUMP_SDK,
  type BondingCurve, type FeeConfig, type Global, type ResolvedQuoteMint,
} from "@pump-fun/pump-sdk";
import BN from "bn.js";
import type { PairId } from "./launchpad.ts";

export { bondingCurvePda, PUMP_PROGRAM_ID };
export const PUMP_SUPPLY = 1_000_000_000; // every pump coin: fixed by the curve
export const LAMPORTS = 1e9;
/** EVYN, the platform's pump.fun coin, as the quote for launches paired with it. Unset = SOL only. */
export const PAIR_MINT = process.env.NEXT_PUBLIC_PAIR_MINT ? new PublicKey(process.env.NEXT_PUBLIC_PAIR_MINT) : null;

export type Quote = { pair: PairId; mint: PublicKey; tokenProgram: PublicKey; decimals: number; resolved?: ResolvedQuoteMint };

/** What a launch is quoted in, resolved on chain for EVYN (the SDK needs its curve or pool accounts). */
export async function quoteFor(sdk: OnlinePumpSdk, pair: PairId): Promise<Quote> {
  if (pair === "sol") return { pair, mint: NATIVE_MINT, tokenProgram: TOKEN_PROGRAM_ID, decimals: 9 };
  if (!PAIR_MINT) throw new Error("EVYN pairing is not configured on this deployment");
  const resolved = await sdk.resolveQuoteMint(PAIR_MINT);
  return { pair, mint: resolved.mint, tokenProgram: resolved.quoteTokenProgram, decimals: resolved.decimals, resolved };
}

/** The create, exactly as the Pump SDK builds it; quoted in SOL or in EVYN. The dev buy goes in a second transaction. */
export const createInstruction = (p: { mint: PublicKey; name: string; symbol: string; uri: string; creator: PublicKey; user: PublicKey; quote: Quote }) =>
  PUMP_SDK.createV2Instruction({
    mint: p.mint, name: p.name, symbol: p.symbol, uri: p.uri, creator: p.creator, user: p.user, mayhemMode: false,
    ...(p.quote.pair === "sol" ? {} : { quoteMint: p.quote.mint, quoteTokenProgram: p.quote.tokenProgram, pumpQuote: p.quote.resolved?.pumpQuote?.accounts }),
  });

/** A buy spending exactly `sol`, fees included. SOL pair: straight onto the curve. EVYN pair: SOL → EVYN → coin in one transaction. */
export async function buyInstructions(p: { sdk: OnlinePumpSdk; global: Global; feeConfig: FeeConfig; mint: PublicKey; user: PublicKey; sol: number; slippage?: number; quote: Quote }) {
  const amountIn = new BN(Math.round(p.sol * LAMPORTS));
  const slip = p.slippage ?? 1;
  if (p.quote.pair === "sol") {
    const { bondingCurve, associatedUserAccountInfo, quoteTokenProgram, curveBaseTokenBalance } = await p.sdk.fetchBuyState(p.mint, p.user, TOKEN_2022_PROGRAM_ID);
    const amount = getBuyV3TokenAmountFromQuoteAmount({ global: p.global, feeConfig: p.feeConfig, mintSupply: bondingCurve.tokenTotalSupply, bondingCurve, amount: amountIn, curveBaseTokenBalance });
    return PUMP_SDK.buyExactQuoteInV3Instructions({ bondingCurve, associatedUserAccountInfo, mint: p.mint, user: p.user, quoteAmount: amountIn, amount, slippage: slip, tokenProgram: TOKEN_2022_PROGRAM_ID, quoteTokenProgram });
  }
  const hops = await p.sdk.resolveMultiHopRoute([NATIVE_MINT, p.quote.mint, p.mint], "buy");
  const out = await p.sdk.simulateMultiHopSwap({ user: p.user, hops, side: "buy", amountIn });
  return PUMP_SDK.multiHopSwapInstructions({ user: p.user, hops, side: "buy", amountIn, minAmountOut: out.muln(100 - slip).divn(100) });
}

/** A sell of `tokens` whole tokens. SOL pair: onto the curve. EVYN pair: coin → EVYN → SOL in one transaction. */
export async function sellInstructions(p: { sdk: OnlinePumpSdk; global: Global; feeConfig: FeeConfig; mint: PublicKey; user: PublicKey; tokens: number; slippage?: number; quote: Quote }) {
  const amount = new BN(Math.round(p.tokens * 1e6));
  const slip = p.slippage ?? 1;
  if (p.quote.pair === "sol") {
    const { bondingCurve, quoteTokenProgram } = await p.sdk.fetchSellState(p.mint, p.user, TOKEN_2022_PROGRAM_ID);
    const quoteAmount = getSellSolAmountFromTokenAmount({ global: p.global, feeConfig: p.feeConfig, mintSupply: bondingCurve.tokenTotalSupply, bondingCurve, amount });
    return PUMP_SDK.sellV3Instructions({ bondingCurve, mint: p.mint, user: p.user, amount, quoteAmount, slippage: slip, tokenProgram: TOKEN_2022_PROGRAM_ID, quoteTokenProgram });
  }
  const hops = await p.sdk.resolveMultiHopRoute([p.mint, p.quote.mint, NATIVE_MINT], "sell"); // a sell's path runs from the coin to the currency
  const out = await p.sdk.simulateMultiHopSwap({ user: p.user, hops, side: "sell", amountIn: amount });
  return PUMP_SDK.multiHopSwapInstructions({ user: p.user, hops, side: "sell", amountIn: amount, minAmountOut: out.muln(100 - slip).divn(100) });
}

/** EVYN's own price in SOL, off its curve (or, once migrated, its pool's vaults). 1 for a SOL quote. */
export async function quotePriceSol(sdk: OnlinePumpSdk, conn: Connection, quote: Quote): Promise<number> {
  if (quote.pair === "sol") return 1;
  const pool = quote.resolved?.pumpQuote?.accounts.pool;
  if (pool) {
    const [base, sol] = await Promise.all([conn.getTokenAccountBalance(pool.baseVault), conn.getTokenAccountBalance(pool.quoteVault)]);
    return (Number(sol.value.amount) / LAMPORTS) / (Number(base.value.amount) / 10 ** quote.decimals);
  }
  const c = await sdk.fetchBondingCurve(quote.mint);
  return (Number(c.virtualQuoteReserves.toString()) / LAMPORTS) / (Number(c.virtualTokenReserves.toString()) / 10 ** quote.decimals);
}

/** What the site shows about a curve, read straight off the account. Amounts in the quote, and in SOL. */
export function curveStats(c: BondingCurve, g: Global, quote: { pair: PairId; decimals: number; priceSol: number }) {
  const unit = 10 ** quote.decimals;
  const vQ = Number(c.virtualQuoteReserves.toString()) / unit, vTok = Number(c.virtualTokenReserves.toString()) / 1e6;
  const price = vQ / vTok; // quote per whole token
  const supply = Number(c.tokenTotalSupply.toString()) / 1e6;
  const initialReal = Number(g.initialRealTokenReserves.toString());
  const sold = initialReal - Number(c.realTokenReserves.toString());
  const raised = Number(c.realQuoteReserves.toString()) / unit;
  return {
    pair: quote.pair,
    priceQuote: price, marketCapQuote: price * supply, raisedQuote: raised,
    priceSol: price * quote.priceSol, marketCapSol: price * supply * quote.priceSol, raisedSol: raised * quote.priceSol,
    progress: Math.max(0, Math.min(100, (sold / initialReal) * 100)),
    complete: c.complete,
    creator: c.creator.toBase58(),
  };
}

export const pumpUrl = (mint: string) => `https://pump.fun/coin/${mint}`;
