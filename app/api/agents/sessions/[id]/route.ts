import { guard } from "../../guard";
import { continueSession } from "@/lib/studio-run";

export const maxDuration = 300;

// One more turn in one of the holder's own sessions.
export async function POST(request: Request, { params }: RouteContext<"/api/agents/sessions/[id]">) {
  const g = await guard();
  if (g instanceof Response) return g;
  const body = (await request.json().catch(() => ({}))) as { message?: unknown; image?: unknown };
  const { id } = await params;
  return g.run(() => continueSession(g.wallet, id, body.message, body.image));
}
