import { randomUUID } from "node:crypto";
import { verifyAction } from "@/lib/auth";
import { query } from "@/lib/db";
import { tokenFields } from "@/lib/launch-message";
import { problemWith, STEPS, type Draft } from "@/lib/launchpad";
import { allow, callerKey, tooMany } from "@/lib/limit";
import { sessionWallet } from "@/lib/session";

const bad = (error: string, status = 400) => Response.json({ error }, { status });

type Body = {
  productId: string; name: string; ticker: string; supply: string;
  stack: string[]; gateBalance: string; gateUnlocks: string;
  issuedAt: number; signature: string;
};

/**
 * Freeze a token launch. The launcher signs the exact terms (see tokenFields), the server rebuilds
 * them from what was submitted and checks the signature, then stores the row as 'frozen'.
 *
 * Nothing on-chain happens here. The program and the pool do not exist yet, so a row is a signed
 * intent — real signature, real terms, no token. The status column says exactly that.
 */
export async function POST(request: Request) {
  const wallet = await sessionWallet();
  if (!wallet) return bad("sign in first", 401);
  if (!(await allow("tokenLaunch", callerKey(request, wallet)))) return tooMany("tokenLaunch");

  const b = ((await request.json().catch(() => null)) ?? {}) as Partial<Body>;
  const productId = String(b.productId ?? "");
  const stack = Array.isArray(b.stack) ? b.stack.map(String) : [];

  // The utility has to be something this wallet really owns: listed by it, or bought from it.
  const [product] = await query<{ id: string; title: string; kind: string; creator: string }>(
    `select p.id, p.title, p.kind, p.creator from products p
     where p.id = $1 and p.status = 'live'
       and (p.creator = $2 or exists (select 1 from purchases x where x.product_id = p.id and x.buyer = $2 and x.status = 'paid'))`,
    [productId, wallet],
  );
  if (!product) return bad("that utility is not live, or not yours", 404);

  // Same rules as the browser flow, so the server cannot accept what the steps would have refused.
  const draft: Draft = {
    utility: { id: product.id, title: product.title, kind: product.kind, source: product.creator === wallet ? "launched" : "bought" },
    name: String(b.name ?? ""),
    ticker: String(b.ticker ?? ""),
    supply: String(b.supply ?? ""),
    stack,
    gate: { balance: String(b.gateBalance ?? ""), unlocks: String(b.gateUnlocks ?? "") },
  };
  for (const s of STEPS) {
    const why = problemWith(s.id, draft);
    if (why) return bad(why);
  }

  const supply = Number(draft.supply);
  const gateBalance = Number(draft.gate.balance);
  const fields = tokenFields({ productId: product.id, name: draft.name, ticker: draft.ticker, supply, stack, gateBalance, gateUnlocks: draft.gate.unlocks });
  const issuedAt = Number(b.issuedAt);
  if (!verifyAction(request.headers.get("host") ?? "", wallet, "launch token", fields, issuedAt, String(b.signature ?? ""))) {
    return bad("confirmation signature is missing, expired, or does not match these terms", 401);
  }

  const id = randomUUID();
  await query(
    `insert into launches (id, wallet, product_id, name, ticker, supply, stack, gate_balance, gate_unlocks, signature, issued_at)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [id, wallet, product.id, draft.name, draft.ticker, supply, JSON.stringify(stack), gateBalance, draft.gate.unlocks, String(b.signature), issuedAt],
  );
  return Response.json({ id, status: "frozen" });
}

/** The caller's own frozen launches, newest first. */
export async function GET() {
  const wallet = await sessionWallet();
  if (!wallet) return bad("sign in first", 401);
  const rows = await query(
    `select l.id, l.name, l.ticker, l.status, l.created_at, p.title as utility
     from launches l join products p on p.id = l.product_id
     where l.wallet = $1 order by l.created_at desc limit 50`,
    [wallet],
  );
  return Response.json({ launches: rows });
}
