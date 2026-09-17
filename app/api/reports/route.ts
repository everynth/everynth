import { query } from "@/lib/db";
import { sessionWallet } from "@/lib/session";

// One report per wallet per product; admins review them on /admin.
export async function POST(request: Request) {
  const reporter = await sessionWallet();
  if (!reporter) return Response.json({ error: "sign in first" }, { status: 401 });
  const { productId, reason } = (await request.json().catch(() => null)) ?? {};
  if (typeof productId !== "string" || typeof reason !== "string" || reason.trim().length < 5 || reason.length > 1000) {
    return Response.json({ error: "productId and a reason (5-1000 characters) are required" }, { status: 400 });
  }
  const [product] = await query(`select id from products where id = $1`, [productId]);
  if (!product) return Response.json({ error: "product not found" }, { status: 404 });
  await query(
    `insert into reports (id, product_id, reporter, reason) values ($1,$2,$3,$4) on conflict (product_id, reporter) do nothing`,
    [crypto.randomUUID(), productId, reporter, reason.trim()],
  );
  return Response.json({ ok: true });
}
