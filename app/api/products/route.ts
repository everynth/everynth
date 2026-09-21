import { KINDS, MAX_PAYLOAD_BYTES } from "@/lib/config";
import { query } from "@/lib/db";
import { masterKey, wrapKey } from "@/lib/keywrap";
import { formText, parseCover, parseFields } from "@/lib/product-form";
import { sessionWallet } from "@/lib/session";

const bad = (error: string, status = 400) => Response.json({ error }, { status });

// Launch a product. The payload arrives already encrypted by the creator's browser.
export async function POST(request: Request) {
  const creator = await sessionWallet();
  if (!creator) return bad("sign in first", 401);

  const form = await request.formData().catch(() => null);
  if (!form) return bad("expected multipart form data");
  const fields = parseFields(form);
  if (typeof fields === "string") return bad(fields);
  const cover = await parseCover(form);
  if (typeof cover === "string") return bad(cover);

  const kind = formText(form, "kind");
  const key = Buffer.from(formText(form, "key"), "base64");
  const payload = form.get("payload");
  if (!(KINDS as readonly string[]).includes(kind)) return bad("unknown kind");
  if (key.length !== 32) return bad("content key must be 32 bytes");
  if (!(payload instanceof Blob) || payload.size <= 28) return bad("encrypted payload is missing");
  if (payload.size > MAX_PAYLOAD_BYTES + 28) return bad("payload too large (max 4 MB)", 413);

  const id = crypto.randomUUID();
  await query(
    `insert into products (id, creator, title, description, category, price, kind, file_name, file_type, payload, wrapped_key, cover, cover_type)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    [
      id, creator, fields.title, fields.description, fields.category, fields.price, kind,
      kind === "file" ? formText(form, "fileName").slice(0, 200) || "download" : null,
      kind === "file" ? formText(form, "fileType").slice(0, 100) || "application/octet-stream" : null,
      Buffer.from(await payload.arrayBuffer()), // Buffer, not Uint8Array: pg serializes only Buffer as bytea
      wrapKey(key, masterKey()),
      cover?.bytes ?? null,
      cover?.type ?? null,
    ],
  );
  return Response.json({ id });
}
