import { query } from "@/lib/db";
import { SLUG } from "@/lib/launchpad";

// Is this permalink free? The launch flow asks as the launcher types, so the answer arrives before
// the signature instead of as a 409 after it. Public: the slugs themselves are public pages.
export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("slug") ?? "";
  if (!SLUG.test(slug)) return Response.json({ error: "a permalink is 1–24 lowercase letters, digits or dashes" }, { status: 400 });
  const taken = (await query(`select 1 from launches where slug = $1`, [slug])).length > 0;
  return Response.json({ slug, taken }, { headers: { "cache-control": "no-store" } });
}
