import { query } from "@/lib/db";
import { isAdmin, sessionWallet } from "@/lib/session";

export async function POST(request: Request) {
  if (!isAdmin(await sessionWallet())) return Response.json({ error: "not allowed" }, { status: 404 });
  const { wallet } = (await request.json().catch(() => null)) ?? {};
  if (typeof wallet !== "string") return Response.json({ error: "wallet is required" }, { status: 400 });
  await query(`delete from blocked_wallets where wallet = $1`, [wallet]);
  return Response.json({ ok: true }); // their products stay removed; the creator relists what they want
}
