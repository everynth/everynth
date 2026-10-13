import Link from "next/link";
import { AgentMark } from "@/components/agent";
import { agentFor } from "@/lib/agents";
import { COLUMNS, hooksOf, listLaunches, type LaunchCard } from "@/lib/launches";
import { FEE_CEILING, taken } from "@/lib/launchpad";
import { sessionWallet } from "@/lib/session";

export const metadata = {
  title: "Launchpad · EVERYNTH",
  description: "Every token launched on EVERYNTH, with the utility behind it and the terms its launcher signed.",
};

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

function Card({ l, mine }: { l: LaunchCard; mine: boolean }) {
  const desk = agentFor(l.creator, l.category);
  const stack = hooksOf(l.stack);
  const fee = taken(stack);
  return (
    <li>
      <Link href={`/launchpad/${l.id}`} className="disc-card">
        <span className="disc-cover">
          {l.has_cover ? (
            // eslint-disable-next-line @next/next/no-img-element -- our own API route
            <img src={`/api/products/${l.product_id}/cover`} alt="" />
          ) : (
            <span className="cover-blank"><span className="chrome">{l.ticker}</span></span>
          )}
          <span className="pill pill-sm disc-badge">{stack.length}× ⚡</span>
          <span className="pill pill-sm disc-cat" data-cat={l.category}>{l.category}</span>
        </span>
        <small className="disc-created">
          <span>created: <AgentMark agent={desk} size={14} /> {desk.name}</span>
          {mine && <span className="pill pill-sm pill-live">yours</span>}
        </small>
        <span className="disc-name">{l.name} <small>({l.ticker})</small></span>
        <span className="disc-desc">{l.description}</span>
        <span className="disc-row">
          <span>Supply: <b>{compact.format(Number(l.supply))}</b></span>
          <span>Unlocks at <b>{compact.format(l.gate_balance)}</b></span>
        </span>
        <span className="disc-cap">
          <span>fee spoken for <b>{fee}%</b></span>
          <i className="desk-bar"><i style={{ width: `${(fee / FEE_CEILING) * 100}%` }} /></i>
        </span>
      </Link>
    </li>
  );
}

export default async function LaunchpadPage() {
  const wallet = await sessionWallet();
  // Everything frozen on this launchpad, newest first. Public: the terms are the point.
  const launches = await listLaunches();
  const stats: [string, string][] = [
    ["Tokens", String(launches.length)],
    ["Utilities backed", String(new Set(launches.map((l) => l.product_id)).size)],
    ["Mechanics stacked", String(launches.reduce((n, l) => n + hooksOf(l.stack).length, 0))],
    ["Launchers", String(new Set(launches.map((l) => l.wallet)).size)],
  ];

  return (
    <div className="dash">
      <div className="dash-sec rise">
        <div>
          <p className="kicker">Launchpad · Discover</p>
          <h1 className="chrome mt-2 text-3xl font-medium tracking-tight sm:text-4xl">Launchpad</h1>
          <p className="dash-sec-sub">Tokens with a utility behind them. Terms frozen under the launcher&apos;s signature; nothing minted until the program is live.</p>
        </div>
        <div className="dash-sec-actions">
          <Link href="/launchpad/new" className="btn">+ Launch token</Link>
          <span className="pill pill-soon">◷ Program not live</span>
        </div>
      </div>

      <dl className="disc-stats rise rise-2">
        {stats.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
      </dl>

      <div className="disc-board rise rise-2">
        {COLUMNS.map((c) => {
          const rows = launches.filter((l) => l.status === c.status);
          return (
            <section key={c.status} className="disc-col">
              <header className="disc-col-head">
                <div><h2>{c.title}</h2><small>{c.sub}</small></div>
                <span className="pill pill-sm">{rows.length}</span>
              </header>
              {rows.length ? (
                <ul className="disc">{rows.map((l) => <Card key={l.id} l={l} mine={l.wallet === wallet} />)}</ul>
              ) : c.status === "frozen" ? (
                <div className="disc-none">
                  <p>Nothing to discover yet.</p>
                  <Link href="/launchpad/new" className="btn">+ Launch the first token</Link>
                </div>
              ) : (
                <div className="disc-none"><p>Fills once the token program is live.</p></div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
