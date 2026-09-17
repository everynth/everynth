import { query } from "@/lib/db";
import { isAdmin, sessionWallet } from "@/lib/session";

// Unlist a product: its creator or an admin (takedown). Existing buyers keep their access.
export async function POST(_request: Request, { params }: RouteContext<"/api/products/[id]/remove">) {
  const { id } = await params;
  const wallet = await sessionWallet();
  if (!wallet) return Response.json({ error: "sign in first" }, { status: 401 });
  const rows = await query(
    `update products set status = 'removed' where id = $1 and (creator = $2 or $3) returning id`,
    [id, wallet, isAdmin(wallet)],
  );
  return rows.length ? Response.json({ ok: true }) : Response.json({ error: "not found or not allowed" }, { status: 404 });
}
