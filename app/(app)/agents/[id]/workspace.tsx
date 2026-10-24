import { PAIR_MINT, pumpUrl } from "@/lib/pump";
import { sessionWallet } from "@/lib/session";
import { MIN_HOLD, publicAgents, SESSIONS_PER_DAY, TURNS_PER_SESSION, type StudioAgent } from "@/lib/studio";
import { holding, listSessions, sessionsToday } from "@/lib/studio-run";
import { Studio } from "./studio";

/**
 * One agent's room: the prompt column on the left, the monitor on the right. The gate and the
 * quota are read for the signed-in wallet; the sessions shown are this agent's only.
 */
export async function Workspace({ agent, draft }: { agent: StudioAgent; draft: string }) {
  const wallet = await sessionWallet();
  const [gate, opened, sessions] = wallet ? await Promise.all([holding(wallet), sessionsToday(wallet), listSessions(wallet)]) : [null, 0, []];
  const pub = publicAgents();
  return (
    <Studio
      agent={pub.find((a) => a.id === agent.id)!}
      agents={pub}
      signedIn={!!wallet}
      gate={gate}
      needed={MIN_HOLD}
      opened={opened}
      perDay={SESSIONS_PER_DAY}
      turnsMax={TURNS_PER_SESSION}
      sessions={sessions.filter((s) => s.agent === agent.id)}
      buyUrl={PAIR_MINT ? pumpUrl(PAIR_MINT.toBase58()) : null}
      draft={draft}
    />
  );
}
