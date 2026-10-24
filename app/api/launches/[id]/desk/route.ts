import Anthropic from "@anthropic-ai/sdk";
import { runDesk } from "@/lib/desk";
import { getLaunch } from "@/lib/launches";
import { agentsOn } from "@/lib/launchpad";
import { allow, tooMany } from "@/lib/limit";
import { sessionWallet } from "@/lib/session";
import { StudioError, studioOn } from "@/lib/studio-run";

export const maxDuration = 300; // three agents in parallel; the narrative on Fable is the long one

// The launcher puts the desk to work on their launched, EVYN-paired coin. Runs again on request.
export async function POST(_request: Request, { params }: RouteContext<"/api/launches/[id]/desk">) {
  const wallet = await sessionWallet();
  if (!wallet) return Response.json({ error: "sign in first" }, { status: 401 });
  const l = await getLaunch((await params).id);
  if (!l || l.wallet !== wallet) return Response.json({ error: "not found" }, { status: 404 });
  if (!agentsOn(l.pair)) return Response.json({ error: "the desk works on coins paired with EVYN" }, { status: 409 });
  if (!l.mint) return Response.json({ error: "launch the coin first — the desk starts once it is on the curve" }, { status: 409 });
  if (!(await allow("agentRun", `w:${wallet}`))) return tooMany("agentRun");
  if (!studioOn()) return Response.json({ error: "the desk is not switched on yet" }, { status: 503 });
  try {
    return Response.json({ deliverables: await runDesk(l) });
  } catch (e) {
    if (e instanceof StudioError) return Response.json({ error: e.message }, { status: e.status });
    if (e instanceof Anthropic.APIError) return Response.json({ error: `desk error: ${e.message}` }, { status: 502 });
    throw e;
  }
}
