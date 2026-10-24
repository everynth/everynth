import { getLaunch } from "@/lib/launches";
import { getImage, LOGO, markSvg, normalize, putImage, rasterize } from "@/lib/images";
import { sessionWallet } from "@/lib/session";

const MAX_UPLOAD = 2 * 1024 * 1024;
const TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
const png = (data: Buffer | Uint8Array) =>
  new Response(Buffer.from(data), { headers: { "content-type": "image/png", "cache-control": "public, max-age=60", "access-control-allow-origin": "*" } });

// The token's image, always a PNG (pump.fun and wallets will not show an SVG): the launcher's upload
// or Prism's drawing; the utility's cover when it has one; otherwise the initial on the project colour.
export async function GET(request: Request, { params }: RouteContext<"/api/launches/[id]/logo">) {
  const l = await getLaunch((await params).id);
  if (!l) return new Response("not found", { status: 404 });
  const own = await getImage(l.id, "logo");
  if (own) return png(own.data);
  if (l.has_cover) return Response.redirect(`${new URL(request.url).origin}/api/products/${l.product_id}/cover`, 307);
  return png(await rasterize(markSvg(l.name || l.ticker, l.color), LOGO));
}

/** The launcher's own logo, as multipart `file`. Set it before the coin is created: pump.fun keeps the first image it sees. */
export async function PUT(request: Request, { params }: RouteContext<"/api/launches/[id]/logo">) {
  const wallet = await sessionWallet();
  if (!wallet) return Response.json({ error: "sign in first" }, { status: 401 });
  const l = await getLaunch((await params).id);
  if (!l || l.wallet !== wallet) return Response.json({ error: "not found" }, { status: 404 });
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return Response.json({ error: "send the image as `file`" }, { status: 400 });
  if (!TYPES.has(file.type)) return Response.json({ error: "PNG, JPEG, WebP or GIF" }, { status: 415 });
  if (file.size > MAX_UPLOAD) return Response.json({ error: "keep the logo under 2 MB" }, { status: 413 });
  try {
    await putImage(l.id, "logo", "upload", await normalize(Buffer.from(await file.arrayBuffer()), LOGO));
  } catch {
    return Response.json({ error: "that file could not be read as an image" }, { status: 400 });
  }
  return Response.json({ ok: true, source: "upload" });
}
