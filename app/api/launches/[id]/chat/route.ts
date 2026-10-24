import { ChatError, messages, post } from "@/lib/community";
import { getLaunch } from "@/lib/launches";
import { allow, tooMany } from "@/lib/limit";
import { sessionWallet } from "@/lib/session";

// A coin's community room. GET is public (`?after=<id>` returns only newer messages, for polling);
// POST takes a signed-in wallet that holds the coin, or the launcher.
export async function GET(request: Request, { params }: RouteContext<"/api/launches/[id]/chat">) {
  const l = await getLaunch((await params).id);
  if (!l) return Response.json({ error: "not found" }, { status: 404 });
  const after = new URL(request.url).searchParams.get("after") ?? undefined;
  return Response.json({ messages: await messages(l.id, after) }, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request, { params }: RouteContext<"/api/launches/[id]/chat">) {
  const wallet = await sessionWallet();
  if (!wallet) return Response.json({ error: "sign in first" }, { status: 401 });
  const l = await getLaunch((await params).id);
  if (!l) return Response.json({ error: "not found" }, { status: 404 });
  if (!(await allow("chat", `w:${wallet}`))) return tooMany("chat");
  const b = ((await request.json().catch(() => null)) ?? {}) as { body?: unknown; replyTo?: unknown };
  try {
    return Response.json({ message: await post(l, wallet, b.body, b.replyTo) });
  } catch (e) {
    if (e instanceof ChatError) return Response.json({ error: e.message }, { status: e.status });
    throw e;
  }
}
