import { ChatError, pin } from "@/lib/community";
import { getLaunch } from "@/lib/launches";
import { sessionWallet } from "@/lib/session";

// The launcher pins one message to the top of the coin's room (`{ "id": "<message id>" }`), or clears it (`{ "id": null }`).
export async function PUT(request: Request, { params }: RouteContext<"/api/launches/[id]/chat/pin">) {
  const wallet = await sessionWallet();
  if (!wallet) return Response.json({ error: "sign in first" }, { status: 401 });
  const l = await getLaunch((await params).id);
  if (!l) return Response.json({ error: "not found" }, { status: 404 });
  const b = ((await request.json().catch(() => null)) ?? {}) as { id?: unknown };
  try {
    return Response.json({ pinned: await pin(l, wallet, b.id) });
  } catch (e) {
    if (e instanceof ChatError) return Response.json({ error: e.message }, { status: e.status });
    throw e;
  }
}
