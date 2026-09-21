import { query } from "@/lib/db";

// Ownership check for apps hosted by creators: GET /api/verify?product=<id>&wallet=<address>
// Public and CORS-open so a creator's front-end can call it. The creator's app must still make the
// visitor prove they control the wallet (e.g. sign a message) before trusting the answer.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const product = url.searchParams.get("product") ?? "";
  const wallet = url.searchParams.get("wallet") ?? "";
  const headers = { "access-control-allow-origin": "*", "cache-control": "no-store" };
  if (!product || !wallet) return Response.json({ error: "product and wallet are required" }, { status: 400, headers });
  const [row] = await query<{ created_at: Date }>(
    `select created_at from purchases where product_id = $1 and buyer = $2 and status = 'paid' order by created_at limit 1`,
    [product, wallet],
  );
  return Response.json({ owned: !!row, since: row?.created_at ?? null }, { headers });
}
