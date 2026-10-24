import Anthropic from "@anthropic-ai/sdk";
import { runIdentity } from "@/lib/desk";
import { getLaunch } from "@/lib/launches";
import { agentsOn } from "@/lib/launchpad";
import { allow, tooMany } from "@/lib/limit";
import { sessionWallet } from "@/lib/session";
import { StudioError, studioOn } from "@/lib/studio-run";

export const maxDuration = 300;

// Prism draws the logo (unless the launcher uploaded one) and the banner. Open before the coin is
// created, so pump.fun's first look at the metadata already finds the logo.
export async function POST(_request: Request, { params }: RouteContext<"/api/launches/[id]/identity">) {
  const wallet = await sessionWallet();
  if (!wallet) return Response.json({ error: "sign in first" }, { status: 401 });
  const l = await getLaunch((await params).id);
  if (!l || l.wallet !== wallet) return Response.json({ error: "not found" }, { status: 404 });
  if (!agentsOn(l.pair)) return Response.json({ error: "Prism draws for coins paired with EVYN — upload a logo instead" }, { status: 409 });
  if (!(await allow("agentRun", `w:${wallet}`))) return tooMany("agentRun");
  if (!studioOn()) return Response.json({ error: "the desk is not switched on yet" }, { status: 503 });
  try {
    return Response.json(await runIdentity(l));
  } catch (e) {
    if (e instanceof StudioError) return Response.json({ error: e.message }, { status: e.status });
    if (e instanceof Anthropic.APIError) return Response.json({ error: `desk error: ${e.message}` }, { status: 502 });
    throw e;
  }
}
