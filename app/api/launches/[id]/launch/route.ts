import { PublicKey } from "@solana/web3.js";
import { NATIVE_MINT } from "@solana/spl-token";
import { OnlinePumpSdk } from "@pump-fun/pump-sdk";
import { query } from "@/lib/db";
import { getLaunch } from "@/lib/launches";
import { allow, callerKey, tooMany } from "@/lib/limit";
import { PAIR_MINT, PUMP_SUPPLY } from "@/lib/pump";
import { sessionWallet } from "@/lib/session";
import { connection, vaultWallet } from "@/lib/solana";

const bad = (error: string, status = 400) => Response.json({ error }, { status });

/**
 * The launcher reports "I launched it on pump.fun". We never trust that: the chain decides. The
 * transaction must be confirmed and paid by the launcher, the mint must be in it, and the bonding
 * curve pump.fun created for that mint must name the EVERYNTH vault as the coin's creator and
 * carry the fixed supply. Then, and only then, the launch is 'launched'.
 */
export async function POST(request: Request, { params }: RouteContext<"/api/launches/[id]/launch">) {
  const wallet = await sessionWallet();
  if (!wallet) return bad("sign in first", 401);
  const l = await getLaunch((await params).id);
  if (!l || l.wallet !== wallet) return bad("launch not found", 404);
  if (l.status !== "frozen") return bad(`this launch is already ${l.status}`, 409);
  if (!(await allow("tokenMint", callerKey(request, wallet)))) return tooMany("tokenMint");

  const b = ((await request.json().catch(() => null)) ?? {}) as { signature?: string; mint?: string };
  let mintPk: PublicKey;
  try { mintPk = new PublicKey(String(b.mint ?? "")); } catch { return bad("mint address is required"); }
  const signature = String(b.signature ?? "");
  if (!/^[1-9A-HJ-NP-Za-km-z]{64,100}$/.test(signature)) return bad("transaction signature is required");

  const conn = connection();
  const tx = await conn.getTransaction(signature, { commitment: "confirmed", maxSupportedTransactionVersion: 0 }).catch(() => null);
  if (!tx || tx.meta?.err) return bad("transaction not confirmed yet", 402);
  const keys = tx.transaction.message.staticAccountKeys.map((k) => k.toBase58());
  if (keys[0] !== wallet) return bad("that transaction was not paid by your wallet", 402);
  if (!keys.includes(mintPk.toBase58())) return bad("that transaction did not create this coin", 402);

  const curve = await new OnlinePumpSdk(conn).fetchBondingCurve(mintPk).catch(() => null);
  if (!curve) return bad("no bonding curve for that mint yet", 402);
  if (curve.creator.toBase58() !== vaultWallet()) return bad("the coin's creator is not the EVERYNTH vault — launch it from the launch page", 402);
  if (curve.tokenTotalSupply.toString() !== String(BigInt(PUMP_SUPPLY) * 1_000_000n)) return bad("the curve's supply is not the launchpad's", 402);
  // The quote must be the one in the signed terms: EVYN for an EVYN launch, SOL (the zero key on the curve) otherwise.
  const quote = curve.quoteMint.toBase58();
  const wantsEvyn = l.pair === "evyn";
  if (wantsEvyn && (!PAIR_MINT || quote !== PAIR_MINT.toBase58())) return bad("the terms say EVYN, but the curve is not quoted in EVYN", 402);
  if (!wantsEvyn && quote !== PublicKey.default.toBase58() && quote !== NATIVE_MINT.toBase58()) return bad("the terms say SOL, but the curve is quoted in a token", 402);

  const rows = await query(
    `update launches set mint = $1, mint_signature = $2, status = 'launched', minted_at = now() where id = $3 and status = 'frozen' returning id`,
    [mintPk.toBase58(), signature, l.id],
  );
  if (!rows.length) return bad("this launch was launched meanwhile", 409);
  return Response.json({ ok: true, mint: mintPk.toBase58(), status: "launched" });
}
