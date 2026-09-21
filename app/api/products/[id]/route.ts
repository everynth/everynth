import { query } from "@/lib/db";
import { parseCover, parseFields } from "@/lib/product-form";
import { sessionWallet } from "@/lib/session";

const bad = (error: string, status = 400) => Response.json({ error }, { status });

// Edit listing details (not the encrypted content: relaunch for that). Creator only.
export async function PATCH(request: Request, { params }: RouteContext<"/api/products/[id]">) {
  const { id } = await params;
  const wallet = await sessionWallet();
  if (!wallet) return bad("sign in first", 401);
  const form = await request.formData().catch(() => null);
  if (!form) return bad("expected multipart form data");
  const fields = parseFields(form);
  if (typeof fields === "string") return bad(fields);
  const cover = await parseCover(form);
  if (typeof cover === "string") return bad(cover);

  const rows = await query(
    `update products set title = $1, description = $2, category = $3, price = $4,
       cover = coalesce($5, cover), cover_type = coalesce($6, cover_type)
     where id = $7 and creator = $8 returning id`,
    [fields.title, fields.description, fields.category, fields.price, cover?.bytes ?? null, cover?.type ?? null, id, wallet],
  );
  return rows.length ? Response.json({ ok: true }) : bad("not found or not yours", 404);
}
