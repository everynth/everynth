import { verifyLaunch } from "@/lib/auth";
import { BLOCKED_EXTENSIONS, KINDS, MAX_SECRET_BYTES } from "@/lib/config";
import { query } from "@/lib/db";
import { allow, callerKey, tooMany } from "@/lib/limit";
import { checkRepoAdmin, REPO_RE } from "@/lib/github";
import { masterKey, wrapKey } from "@/lib/keywrap";
import { formText, parseCover, parseFields } from "@/lib/product-form";
import { sessionWallet } from "@/lib/session";

const bad = (error: string, status = 400) => Response.json({ error }, { status });

// Only ciphertext the creator's browser put in OUR blob store is accepted as a file payload.
function isOurBlob(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname.endsWith(".public.blob.vercel-storage.com");
  } catch {
    return false;
  }
}

// Launch a product. The payload arrives already encrypted by the creator's browser:
// secrets inline (small), files as a URL in Vercel Blob (uploaded directly, see /api/upload).
export async function POST(request: Request) {
  const creator = await sessionWallet();
  if (!creator) return bad("sign in first", 401);
  if (!(await allow("launch", callerKey(request, creator)))) return tooMany("launch");
  if ((await query(`select 1 from blocked_wallets where wallet = $1`, [creator])).length) {
    return bad("this wallet is blocked from launching", 403);
  }

  const form = await request.formData().catch(() => null);
  if (!form) return bad("expected multipart form data");
  const fields = parseFields(form);
  if (typeof fields === "string") return bad(fields);
  const cover = await parseCover(form);
  if (typeof cover === "string") return bad(cover);

  const kind = formText(form, "kind");
  if (!(KINDS as readonly string[]).includes(kind)) return bad("unknown kind");

  // Second signature: the creator confirms these exact terms in their wallet. The session cookie
  // alone is not enough to put something on sale under their address.
  const issuedAt = Number(formText(form, "issuedAt"));
  const terms = { title: fields.title, price: fields.price, kind };
  if (!verifyLaunch(request.headers.get("host") ?? "", creator, terms, issuedAt, formText(form, "signature"))) {
    return bad("launch confirmation signature is missing, expired, or does not match these terms", 401);
  }

  // What gets wrapped with the master key: the content key, or (github) the creator's token.
  let secret: Buffer;
  let payload: Buffer | null = null;
  let payloadUrl: string | null = null;
  let fileName: string | null = null;
  let fileType: string | null = null;
  let githubRepo: string | null = null;
  if (kind === "github") {
    githubRepo = formText(form, "repo");
    const token = formText(form, "token");
    if (!REPO_RE.test(githubRepo)) return bad("repository must look like owner/name");
    if (!token) return bad("a GitHub token is required");
    const problem = await checkRepoAdmin(githubRepo, token);
    if (problem) return bad(problem);
    secret = Buffer.from(token);
  } else {
    secret = Buffer.from(formText(form, "key"), "base64");
    if (secret.length !== 32) return bad("content key must be 32 bytes");
  }
  if (kind === "file") {
    fileName = formText(form, "fileName").slice(0, 200) || "download";
    fileType = formText(form, "fileType").slice(0, 100) || "application/octet-stream";
    payloadUrl = formText(form, "payloadUrl");
    if (BLOCKED_EXTENSIONS.test(fileName)) return bad("executables and installers cannot be sold here; zip source code or documents instead");
    if (!isOurBlob(payloadUrl)) return bad("encrypted file upload is missing");
  } else if (kind === "secret") {
    const blob = form.get("payload");
    if (!(blob instanceof Blob) || blob.size <= 28) return bad("encrypted payload is missing");
    if (blob.size > MAX_SECRET_BYTES + 28) return bad("secret text is too long", 413);
    payload = Buffer.from(await blob.arrayBuffer()); // Buffer, not Uint8Array: pg serializes only Buffer as bytea
  }

  const id = crypto.randomUUID();
  await query(
    `insert into products (id, creator, title, description, category, price, kind, file_name, file_type, payload, payload_url, github_repo, wrapped_key, cover, cover_type, preview_url)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
    [
      id, creator, fields.title, fields.description, fields.category, fields.price, kind,
      fileName, fileType, payload, payloadUrl, githubRepo, wrapKey(secret, masterKey()), cover?.bytes ?? null, cover?.type ?? null,
      fields.previewUrl ?? (githubRepo ? `https://github.com/${githubRepo}` : null), // repos preview to their GitHub page by default
    ],
  );
  return Response.json({ id });
}
