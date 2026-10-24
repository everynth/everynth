import { guard } from "../guard";
import { startSession } from "@/lib/studio-run";

export const maxDuration = 300; // a long first turn on Fable can take a couple of minutes

// Open a session with an agent and take its first turn. Signed in, holding enough EVYN, inside
// the daily quota and the hourly budget.
export async function POST(request: Request) {
  const g = await guard();
  if (g instanceof Response) return g;
  const body = (await request.json().catch(() => ({}))) as { agent?: unknown; message?: unknown; image?: unknown };
  return g.run(() => startSession(g.wallet, String(body.agent ?? ""), body.message, body.image));
}
