import { randomUUID } from "node:crypto";
import { verifyAction } from "@/lib/auth";
import { query } from "@/lib/db";
import { tokenFields } from "@/lib/launch-message";
import { EMPTY, problemWith, STEPS, type Draft, type TemplateId } from "@/lib/launchpad";
import { allow, callerKey, tooMany } from "@/lib/limit";
import { sessionWallet } from "@/lib/session";

const bad = (error: string, status = 400) => Response.json({ error }, { status });

type Body = {
  productId: string; name: string; ticker: string; supply: string;
  project: Partial<Draft["project"]>;
  stack: string[]; devBuy: string; gateBalance: string; gateUnlocks: string;
  issuedAt: number; signature: string;
};

const str = (v: unknown, max: number) => String(v ?? "").slice(0, max);

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
  const p = (b.project ?? {}) as Partial<Draft["project"]>;

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
    name: str(b.name, 24),
    ticker: str(b.ticker, 10),
    supply: str(b.supply, 15),
    project: {
      ...EMPTY.project,
      pair: str(p.pair, 8) as Draft["project"]["pair"], fee: Number(p.fee), slug: str(p.slug, 24), description: str(p.description, 281), theme: str(p.theme, 61),
      color: str(p.color, 7).toLowerCase(), template: str(p.template, 16) as TemplateId,
      logo: "mark", // the logo choice is the browser's: the image arrives by its own route after the freeze
      website: str(p.website, 200), x: str(p.x, 40), telegram: str(p.telegram, 40), github: str(p.github, 40), utilityUrl: str(p.utilityUrl, 200),
    },
    stack,
    devBuy: str(b.devBuy, 8),
    gate: { balance: str(b.gateBalance, 15), unlocks: str(b.gateUnlocks, 80) },
  };
  for (const s of STEPS) {
    const why = problemWith(s.id, draft);
    if (why) return bad(why);
  }
  if ((await query(`select 1 from launches where slug = $1`, [draft.project.slug])).length) return bad("that permalink is taken", 409);

  const supply = Number(draft.supply);
  const gateBalance = Number(draft.gate.balance);
  const fields = tokenFields({
    productId: product.id, name: draft.name, ticker: draft.ticker, supply, pair: draft.project.pair, stack, devBuy: draft.devBuy,
    gateBalance, gateUnlocks: draft.gate.unlocks, slug: draft.project.slug, template: draft.project.template,
  });
  const issuedAt = Number(b.issuedAt);
  if (!verifyAction(request.headers.get("host") ?? "", wallet, "launch token", fields, issuedAt, String(b.signature ?? ""))) {
    return bad("confirmation signature is missing, expired, or does not match these terms", 401);
  }

  const id = randomUUID();
  const pr = draft.project;
  await query(
    `insert into launches (id, wallet, product_id, name, ticker, supply, stack, gate_balance, gate_unlocks, signature, issued_at,
                           creator_fee, dev_buy, slug, description, theme, color, template, website, x, telegram, github, utility_url, pair)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)`,
    [id, wallet, product.id, draft.name, draft.ticker, supply, JSON.stringify(stack), gateBalance, draft.gate.unlocks, String(b.signature), issuedAt,
     pr.fee, Number(draft.devBuy), pr.slug, pr.description.trim(), pr.theme.trim(), pr.color, pr.template, pr.website, pr.x, pr.telegram, pr.github, pr.utilityUrl, pr.pair],
  );
  return Response.json({ id, slug: pr.slug, status: "frozen" });
}

/** The caller's own frozen launches, newest first. */
export async function GET() {
  const wallet = await sessionWallet();
  if (!wallet) return bad("sign in first", 401);
  const rows = await query(
    `select l.id, l.slug, l.name, l.ticker, l.status, l.created_at, p.title as utility
     from launches l join products p on p.id = l.product_id
     where l.wallet = $1 order by l.created_at desc limit 50`,
    [wallet],
  );
  return Response.json({ launches: rows });
}
