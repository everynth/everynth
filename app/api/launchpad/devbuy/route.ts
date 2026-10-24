import { NATIVE_MINT } from "@solana/spl-token";
import { getBuyTokenAmountFromSolAmount, OnlinePumpSdk } from "@pump-fun/pump-sdk";
import BN from "bn.js";
import { DEV_BUY_MAX } from "@/lib/launchpad";
import { allow, callerKey, tooMany } from "@/lib/limit";
import { LAMPORTS, PUMP_SUPPLY, quoteFor, quotePriceSol, type Quote } from "@/lib/pump";
import { connection } from "@/lib/solana";

// What a dev buy of `sol` gets on a brand-new curve of either pair, priced with the Pump SDK the way
// create_v2 seeds it. The launch flow asks as the launcher types; nothing is signed or sent.
// ponytail: one cached read of the curve settings and EVYN's price per minute per instance; plenty for a preview.
let cache: { at: number; pair: string; v: Promise<{ global: Awaited<ReturnType<OnlinePumpSdk["fetchGlobal"]>>; feeConfig: Awaited<ReturnType<OnlinePumpSdk["fetchFeeConfig"]>>; quote: Quote; priceSol: number }> } | null = null;
const settings = (pair: "evyn" | "sol") => {
  if (cache && cache.pair === pair && Date.now() - cache.at < 60_000) return cache.v;
  const conn = connection();
  const sdk = new OnlinePumpSdk(conn);
  const v = (async () => {
    const [global, feeConfig, quote] = await Promise.all([sdk.fetchGlobal(), sdk.fetchFeeConfig(), quoteFor(sdk, pair)]);
    return { global, feeConfig, quote, priceSol: await quotePriceSol(sdk, conn, quote) };
  })();
  cache = { at: Date.now(), pair, v };
  v.catch(() => { cache = null; });
  return v;
};

export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const pair = sp.get("pair") === "sol" ? "sol" : "evyn";
  const sol = Number(sp.get("sol"));
  if (!Number.isFinite(sol) || sol <= 0 || sol > DEV_BUY_MAX) return Response.json({ error: `sol is between 0 and ${DEV_BUY_MAX}` }, { status: 400 });
  if (!(await allow("verify", callerKey(request)))) return tooMany("verify");
  try {
    const { global, feeConfig, quote, priceSol } = await settings(pair);
    // On an EVYN pair the SOL first becomes EVYN at EVYN's price (the hop's own fee is left out).
    const quoteIn = pair === "sol" ? sol * LAMPORTS : (sol / priceSol) * 10 ** quote.decimals;
    const tokens = getBuyTokenAmountFromSolAmount({
      global, feeConfig, mintSupply: new BN(String(BigInt(PUMP_SUPPLY) * 1_000_000n)), bondingCurve: null,
      amount: new BN(Math.floor(quoteIn).toString()), quoteMint: pair === "sol" ? NATIVE_MINT : quote.mint, pumpQuote: quote.resolved?.pumpQuote?.curve,
    });
    const whole = Number(tokens.toString()) / 1e6;
    return Response.json(
      { pair, sol, quoteIn: pair === "sol" ? sol : quoteIn / 10 ** quote.decimals, tokens: whole, pct: (whole / PUMP_SUPPLY) * 100 },
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    return Response.json({ error: "could not read the curve settings just now" }, { status: 502 });
  }
}
