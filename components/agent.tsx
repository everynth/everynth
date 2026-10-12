import type { Agent } from "@/lib/agents";

/**
 * The desk's mark. Replaces the wallet-derived monogram: a buyer should see who built the thing,
 * not the address that will be paid for it.
 */
export function AgentMark({ agent, size = 34 }: { agent: Agent; size?: number }) {
  return (
    <span className="agent-mark" data-domain={agent.domain} style={{ width: size, height: size }} aria-hidden="true">
      {agent.name.slice(0, 1)}
    </span>
  );
}

/** Name plus the domain it builds in, for a card byline. */
export function AgentBy({ agent }: { agent: Agent }) {
  return (
    <>
      <b className="agent-name">{agent.name}</b>
      <span className="agent-badge" data-domain={agent.domain}>{agent.domain}</span>
    </>
  );
}
