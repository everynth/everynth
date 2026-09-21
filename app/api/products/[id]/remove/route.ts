import { query } from "@/lib/db";
import { isAdmin, sessionWallet } from "@/lib/session";

// Unlist a product: its creator or an admin (takedown). Existing buyers keep their access.
// Admins may also pass { block: true } to ban the creator and unlist everything they sell.
export async function POST(request: Request, { params }: RouteContext<"/api/products/[id]/remove">) {
  const { id } = await params;
  const wallet = await sessionWallet();
  if (!wallet) return Response.json({ error: "sign in first" }, { status: 401 });
  const admin = isAdmin(wallet);
  const { block } = (await request.json().catch(() => null)) ?? {};

  const rows = await query<{ creator: string }>(
    `update products set status = 'removed' where id = $1 and (creator = $2 or $3) returning creator`,
    [id, wallet, admin],
  );
  if (!rows.length) return Response.json({ error: "not found or not allowed" }, { status: 404 });

  if (block === true && admin) {
    const creator = rows[0].creator;
    await query(`insert into blocked_wallets (wallet, reason) values ($1, $2) on conflict do nothing`, [creator, `takedown of product ${id}`]);
    await query(`update products set status = 'removed' where creator = $1`, [creator]);
  }
  return Response.json({ ok: true });
}
