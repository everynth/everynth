import { CATEGORIES, KINDS, MAX_PAYLOAD_BYTES } from "@/lib/config";
import { query } from "@/lib/db";
import { masterKey, wrapKey } from "@/lib/keywrap";
import { parseSol } from "@/lib/money";
import { sessionWallet } from "@/lib/session";

const bad = (error: string, status = 400) => Response.json({ error }, { status });

// Launch a product. The payload arrives already encrypted by the creator's browser.
export async function POST(request: Request) {
  const creator = await sessionWallet();
  if (!creator) return bad("sign in first", 401);

  const form = await request.formData().catch(() => null);
  if (!form) return bad("expected multipart form data");
  const text = (name: string) => (typeof form.get(name) === "string" ? (form.get(name) as string).trim() : "");

  const title = text("title");
  const description = text("description");
  const category = text("category");
  const kind = text("kind");
  const price = parseSol(text("price"));
  const key = Buffer.from(text("key"), "base64");
  const payload = form.get("payload");

  if (title.length < 3 || title.length > 80) return bad("title must be 3-80 characters");
  if (description.length < 10 || description.length > 4000) return bad("description must be 10-4000 characters");
  if (!(CATEGORIES as readonly string[]).includes(category)) return bad("unknown category");
  if (!(KINDS as readonly string[]).includes(kind)) return bad("unknown kind");
  if (price === null) return bad("price must be between 0.02 and 1,000,000 SOL, max 9 decimals");
  if (key.length !== 32) return bad("content key must be 32 bytes");
  if (!(payload instanceof Blob) || payload.size <= 28) return bad("encrypted payload is missing");
  if (payload.size > MAX_PAYLOAD_BYTES + 28) return bad("payload too large (max 4 MB)", 413);

  const id = crypto.randomUUID();
  await query(
    `insert into products (id, creator, title, description, category, price, kind, file_name, file_type, payload, wrapped_key)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [
      id, creator, title, description, category, price, kind,
      kind === "file" ? text("fileName").slice(0, 200) || "download" : null,
      kind === "file" ? text("fileType").slice(0, 100) || "application/octet-stream" : null,
      new Uint8Array(await payload.arrayBuffer()),
      wrapKey(key, masterKey()),
    ],
  );
  return Response.json({ id });
}
