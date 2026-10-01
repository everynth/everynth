import { query } from "@/lib/db";
import { parseReview, upsertReview } from "@/lib/reviews";
import { sessionWallet } from "@/lib/session";

// Review a product you actually paid for. The purchase id is the proof and the key:
// one paid purchase, one review, rewritable by its buyer.
export async function POST(request: Request, { params }: RouteContext<"/api/purchases/[id]/review">) {
  const { id } = await params;
  const wallet = await sessionWallet();
  if (!wallet) return Response.json({ error: "sign in first" }, { status: 401 });

  const parsed = parseReview(await request.json().catch(() => null));
  if (typeof parsed === "string") return Response.json({ error: parsed }, { status: 400 });

  // Same 404 for "no such purchase" and "not yours": nothing leaks about other people's orders.
  const [purchase] = await query<{ product_id: string }>(
    `select product_id from purchases where id = $1 and buyer = $2 and status = 'paid'`,
    [id, wallet],
  );
  if (!purchase) return Response.json({ error: "no paid purchase found" }, { status: 404 });

  await upsertReview(id, purchase.product_id, wallet, parsed.rating, parsed.body);
  return Response.json({ ok: true });
}
