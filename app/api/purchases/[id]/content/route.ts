import { query } from "@/lib/db";
import { masterKey, unwrapKey } from "@/lib/keywrap";
import { sessionWallet } from "@/lib/session";

type Row = { kind: string; file_name: string | null; file_type: string | null; payload: Uint8Array; wrapped_key: string };

// Hands the ciphertext and its key to the buyer of a PAID purchase only. Decryption happens in their browser.
export async function GET(_request: Request, { params }: RouteContext<"/api/purchases/[id]/content">) {
  const { id } = await params;
  const buyer = await sessionWallet();
  if (!buyer) return Response.json({ error: "sign in first" }, { status: 401 });
  const [row] = await query<Row>(
    `select p.kind, p.file_name, p.file_type, p.payload, p.wrapped_key
     from purchases x join products p on p.id = x.product_id
     where x.id = $1 and x.buyer = $2 and x.status = 'paid'`,
    [id, buyer],
  );
  if (!row) return Response.json({ error: "no paid purchase found" }, { status: 404 });
  return Response.json(
    {
      kind: row.kind,
      fileName: row.file_name,
      fileType: row.file_type,
      key: unwrapKey(row.wrapped_key, masterKey()).toString("base64"),
      payload: Buffer.from(row.payload).toString("base64"),
    },
    { headers: { "cache-control": "no-store" } },
  );
}
