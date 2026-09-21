import { query } from "@/lib/db";

export async function GET(_request: Request, { params }: RouteContext<"/api/products/[id]/cover">) {
  const { id } = await params;
  const [row] = await query<{ cover: Uint8Array | null; cover_type: string | null }>(
    `select cover, cover_type from products where id = $1`,
    [id],
  );
  if (!row?.cover) return new Response(null, { status: 404 });
  return new Response(Buffer.from(row.cover), {
    headers: { "content-type": row.cover_type ?? "image/png", "cache-control": "public, max-age=300" },
  });
}
