import { query } from "@/lib/db";
import { sessionWallet } from "@/lib/session";
import { PURCHASE_COLS, settle, type Purchase } from "@/lib/settle";

// Buyer reports "I paid". We never trust that: the chain decides.
export async function POST(request: Request, { params }: RouteContext<"/api/orders/[id]/confirm">) {
  const { id } = await params;
  const buyer = await sessionWallet();
  if (!buyer) return Response.json({ error: "sign in first" }, { status: 401 });
  const [purchase] = await query<Purchase>(`select ${PURCHASE_COLS} from purchases where id = $1 and buyer = $2`, [id, buyer]);
  if (!purchase) return Response.json({ error: "order not found" }, { status: 404 });

  const { signature } = (await request.json().catch(() => null)) ?? {};
  const error = await settle(purchase, typeof signature === "string" ? signature : undefined);
  return error ? Response.json({ error }, { status: 402 }) : Response.json({ ok: true });
}
