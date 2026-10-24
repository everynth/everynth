import { getLaunch } from "@/lib/launches";
import { getImage } from "@/lib/images";

// The 3:1 banner Prism drew for the token site; 404 until it exists.
export async function GET(_request: Request, { params }: RouteContext<"/api/launches/[id]/banner">) {
  const l = await getLaunch((await params).id);
  if (!l) return new Response("not found", { status: 404 });
  const img = await getImage(l.id, "banner");
  if (!img) return new Response("no banner yet", { status: 404 });
  return new Response(Buffer.from(img.data), { headers: { "content-type": "image/png", "cache-control": "public, max-age=60" } });
}
