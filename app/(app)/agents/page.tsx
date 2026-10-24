import Link from "next/link";
import { AgentFigure } from "@/components/agent-figure";
import { AGENTS } from "@/lib/agents";
import { sessionWallet } from "@/lib/session";
import { HOLD_PCT, MIN_HOLD, MONITORS, publicAgents, SESSIONS_PER_DAY } from "@/lib/studio";
import { holding, sessionsToday } from "@/lib/studio-run";

export const metadata = { title: "Agents · studio for holders", description: "Creative, copy, narrative, social and mechanics agents, open to EVYN holders." };

/**
 * The studio's front door: the five agents as characters, and where the signed-in wallet stands
 * against the gate and the daily quota. Picking one opens its own workspace at /agents/[id].
 */
export default async function AgentsPage() {
  const wallet = await sessionWallet();
  const [gate, opened] = wallet ? await Promise.all([holding(wallet), sessionsToday(wallet)]) : [null, 0];
  const n = (v: number) => v.toLocaleString("en-US", { maximumFractionDigits: 0 });
  const status = !wallet ? "Sign in" : gate?.unlocked ? "Unlocked" : "Locked";

  return (
    <div className="dash">
      <div className="rise" style={{ maxWidth: "64ch" }}>
        <p className="kicker">Studio · for EVYN holders</p>
        <h1 className="chrome mt-2 text-3xl font-medium tracking-tight sm:text-4xl">Agents</h1>
        <p className="dash-sec-sub" style={{ maxWidth: "none", marginTop: 10, fontSize: "1rem", lineHeight: 1.6 }}>
          Five agents, each with one skill, each in its own room. Ask one something outside its skill and it points you to the right
          one. Hold {HOLD_PCT}% of EVYN and open up to {SESSIONS_PER_DAY} sessions a day.
        </p>
      </div>

      <ul className="lp-stats rise rise-2">
        {([
          ["Minimum hold", n(MIN_HOLD), `EVYN · ${HOLD_PCT}% of supply`],
          ["Your balance", wallet ? n(gate?.held ?? 0) : "—", wallet ? "EVYN, read from the chain just now" : "connect a wallet to check"],
          ["Sessions", wallet ? `${Math.max(0, SESSIONS_PER_DAY - opened)} of ${SESSIONS_PER_DAY}` : `${SESSIONS_PER_DAY} a day`, wallet ? "left in the next 24 hours" : "per holder, rolling 24 hours"],
          ["Status", status, gate?.unlocked ? "every agent is open" : wallet ? "top up to unlock" : "top right"],
        ] as [string, string, string][]).map(([k, v, s]) => (
          <li key={k} className="lp-stat" style={{ "--tint": k === "Status" && gate?.unlocked ? "var(--c-green)" : "var(--c-cyan)" } as React.CSSProperties}>
            <span className="lp-stat-label">{k}</span>
            <b className="lp-stat-value">{v}</b>
            <small>{s}</small>
          </li>
        ))}
      </ul>

      {/* The studio floor: one room per agent, each with the monitor it works on — not the market's card grid. */}
      <div className="sfloor rise rise-3">
        {publicAgents().map((a, i) => {
          const mon = MONITORS[a.id];
          return (
            <Link key={a.id} href={`/agents/${a.id}`} className="srow" data-domain={a.domain} aria-label={`${a.name}, ${a.role}`}>
              <div className="srow-art"><AgentFigure agent={a} size={150} label={`${a.name}, ${a.role.toLowerCase()}`} /></div>
              <div className="srow-body">
                <p className="kicker srow-kicker">Room {String(i + 1).padStart(2, "0")} · {a.role} · {a.machine}</p>
                <h2 className="srow-name">{a.name} <span className="agent-badge" data-domain={a.domain}>{a.domain}</span></h2>
                <p className="srow-line">{a.line}</p>
                <ul className="srow-skills">{a.skills.map((s) => <li key={s}>{s}</li>)}</ul>
              </div>
              <div className="srow-side">
                <div className="mon-mini" data-mon={a.id} aria-hidden="true">
                  <small>monitor · {mon?.look}</small>
                  <i /><i />
                  <em>{mon?.sample}</em>
                  <b />
                </div>
                <span className="btn-ghost srow-enter">Enter the room →</span>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="dash-sec rise rise-4">
        <div>
          <h2 className="dash-sec-title">The builder desks</h2>
          <p className="dash-sec-sub">The three desks that build and list utilities run on the same machines. Their pages show what each is building and how far it has got.</p>
        </div>
        <div className="dash-sec-actions">
          {AGENTS.map((a) => <Link key={a.id} href={`/agents/${a.id}`} className="btn-ghost">{a.name} →</Link>)}
        </div>
      </div>
    </div>
  );
}
