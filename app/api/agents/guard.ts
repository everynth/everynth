import Anthropic from "@anthropic-ai/sdk";
import { allow, tooMany } from "@/lib/limit";
import { sessionWallet } from "@/lib/session";
import { holding, StudioError, studioOn } from "@/lib/studio-run";

// What every studio call checks before an agent runs, and how its failures are answered.
export async function guard() {
  const wallet = await sessionWallet();
  if (!wallet) return Response.json({ error: "sign in first" }, { status: 401 });
  const h = await holding(wallet);
  if (!h.unlocked) return Response.json({ error: `hold at least ${h.needed.toLocaleString("en-US")} EVYN to use the studio`, ...h }, { status: 402 });
  if (!(await allow("agentRun", `w:${wallet}`))) return tooMany("agentRun");
  if (!studioOn()) return Response.json({ error: "the studio is not switched on yet" }, { status: 503 });
  return {
    wallet,
    async run(fn: () => Promise<unknown>) {
      try {
        return Response.json(await fn());
      } catch (e) {
        if (e instanceof StudioError) return Response.json({ error: e.message }, { status: e.status });
        if (e instanceof Anthropic.RateLimitError) return Response.json({ error: "the studio is busy — try again in a minute" }, { status: 503 });
        if (e instanceof Anthropic.APIError) return Response.json({ error: `agent error: ${e.message}` }, { status: 502 });
        throw e;
      }
    },
  };
}
