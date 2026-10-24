import { PublicKey } from "@solana/web3.js";
import { getLaunch } from "@/lib/launches";
import { allow, callerKey, tooMany } from "@/lib/limit";
import { baseUnits } from "@/lib/mint";
import { balanceOf } from "@/lib/token";

// The holder gate, answered from the chain: does this wallet hold enough of the token to unlock
// the utility? CORS open, like /api/verify, so the utility's own app can ask.
export async function GET(request: Request, { params }: RouteContext<"/api/launches/[id]/gate">) {
  const l = await getLaunch((await params).id);
  if (!l) return Response.json({ error: "not found" }, { status: 404 });
  if (!l.mint) return Response.json({ error: "not launched yet" }, { status: 409 });
  const wallet = new URL(request.url).searchParams.get("wallet") ?? "";
  try { new PublicKey(wallet); } catch { return Response.json({ error: "wallet is required" }, { status: 400 }); }
  if (!(await allow("verify", callerKey(request)))) return tooMany("verify");

  const held = await balanceOf(l.mint, wallet);
  const needed = baseUnits(l.gate_balance);
  return Response.json(
    { mint: l.mint, wallet, balance: held.toString(), needed: needed.toString(), unlocked: held >= needed, unlocks: l.gate_unlocks },
    { headers: { "access-control-allow-origin": "*", "cache-control": "no-store" } },
  );
}
