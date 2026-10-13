import Link from "next/link";
import { AgentBy, AgentMark } from "@/components/agent";
import { AgentFigure } from "@/components/agent-figure";
import { age } from "@/components/avatar";
import { AGENTS, agentFor } from "@/lib/agents";
import { CATEGORIES } from "@/lib/config";
import { COLUMNS, hooksOf, listLaunches, type LaunchCard } from "@/lib/launches";
import { FEE_CEILING, hookById, taken } from "@/lib/launchpad";
import { sessionWallet } from "@/lib/session";

export const metadata = {
  title: "Launchpad · EVERYNTH",
  description: "Every token launched on EVERYNTH, with the utility behind it and the terms its launcher signed.",
};

const SORTS = ["new", "mechanics", "supply"] as const;
type Sort = (typeof SORTS)[number];
const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
const days = (d: Date) => (Date.now() - new Date(d).getTime()) / 864e5;

// Same card as the market, plus the terms a launch carries: supply, the gate, the mechanics by
// name and how much of the fee they have spoken for.
function Card({ l, mine, i }: { l: LaunchCard; mine: boolean; i: number }) {
  const desk = agentFor(l.creator, l.category);
  const stack = hooksOf(l.stack);
  const fee = taken(stack);
  return (
    <li>
      <Link href={`/launchpad/${l.id}`} className="pcardx rise" style={{ animationDelay: `${120 + Math.min(i, 10) * 50}ms` }}>
        <span className="pcardx-cover">
          {l.has_cover ? (
            // eslint-disable-next-line @next/next/no-img-element -- our own API route
            <img src={`/api/products/${l.product_id}/cover`} alt="" />
          ) : (
            <span className="cover-blank"><span className="chrome">{l.ticker}</span></span>
          )}
          <span className="pill pill-sm disc-badge">{stack.length}× ⚡</span>
        </span>
        <span className="pcardx-avatar"><AgentMark agent={desk} /></span>
        <span className="pcardx-title">{l.name} <small>({l.ticker})</small></span>
        <span className="pcardx-by"><AgentBy agent={desk} /> · {age(days(l.created_at))}</span>
        <span className="pcardx-desc">Backed by <b>{l.title}</b> — {l.description}</span>
        <dl className="disc-facts">
          <div><dt>Supply</dt><dd>{compact.format(Number(l.supply))}</dd></div>
          <div><dt>Unlocks at</dt><dd>{compact.format(l.gate_balance)} {l.ticker}</dd></div>
          <div><dt>Holders get</dt><dd>{l.gate_unlocks}</dd></div>
          <div><dt>Fee spoken for</dt><dd className="is-fee">{fee}%</dd></div>
        </dl>
        <span className="desk-bar" aria-hidden="true"><i style={{ width: `${(fee / FEE_CEILING) * 100}%` }} /></span>
        <span className="disc-hooks">
          {stack.map((id) => <span key={id} className="pill pill-sm">{hookById(id)?.name ?? id}</span>)}
        </span>
        <span className="pcardx-foot">
          <span className="pill" data-cat={l.category}>{l.category}</span>
          <span className={`pill${mine ? " pill-live" : ""}`}>{mine ? "● yours" : l.status}</span>
        </span>
      </Link>
    </li>
  );
}

export default async function LaunchpadPage({ searchParams }: PageProps<"/launchpad">) {
  const sp = await searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim().slice(0, 100).toLowerCase();
  const category = typeof sp.category === "string" && (CATEGORIES as readonly string[]).includes(sp.category) ? sp.category : "";
  const sort: Sort = SORTS.includes(sp.sort as Sort) ? (sp.sort as Sort) : "new";
  const href = (patch: Record<string, string>) => {
    const u = new URLSearchParams();
    for (const [k, v] of Object.entries({ q, category, sort, ...patch })) if (v && v !== "new") u.set(k, v);
    const s = u.toString();
    return s ? `/launchpad?${s}` : "/launchpad";
  };

  const wallet = await sessionWallet();
  // Everything frozen on this launchpad, newest first. Public: the terms are the point.
  const all = await listLaunches();
  const launches = all
    .filter((l) => (!category || l.category === category) && (!q || `${l.name} ${l.ticker} ${l.title}`.toLowerCase().includes(q)))
    .sort((a, b) => sort === "mechanics" ? hooksOf(b.stack).length - hooksOf(a.stack).length : sort === "supply" ? Number(b.supply) - Number(a.supply) : 0);

  // What each desk's utilities have backed so far, for the strip at the top.
  const desks = AGENTS.map((d) => {
    const mine = all.filter((l) => agentFor(l.creator, l.category).id === d.id);
    return {
      ...d,
      tokens: mine.length,
      utilities: new Set(mine.map((l) => l.product_id)).size,
      mechanics: mine.reduce((n, l) => n + hooksOf(l.stack).length, 0),
      share: all.length ? Math.round((mine.length / all.length) * 100) : 0,
    };
  });

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

      {/* The three desks, as on the market: which of their utilities have a token on them. */}
      <div className="desks rise rise-2">
        {desks.map((d) => (
          <article key={d.id} className="desk" data-domain={d.domain}>
            <div className="desk-art"><AgentFigure agent={d} size={132} /></div>
            <header className="desk-head">
              <AgentMark agent={d} size={30} />
              <span className="desk-id">
                <b>{d.name}</b>
                <span className="agent-badge" data-domain={d.domain}>{d.domain}</span>
              </span>
            </header>
            <p className="desk-line">{d.line}</p>
            <p className="desk-next"><span>Tokens on its utilities</span><b>{d.tokens} launched</b></p>
            <div className="desk-bar" aria-hidden="true"><i style={{ width: `${d.share}%` }} /></div>
            <p className="desk-stage"><span>share of all tokens</span><b>{d.share}%</b></p>
            <p className="desk-nums">
              <span><b>{d.tokens}</b> tokens</span>
              <span><b>{d.utilities}</b> utilities</span>
              <span><b>{d.mechanics}</b> mechanics</span>
            </p>
          </article>
        ))}
      </div>

      <form method="get" className="dash-filters rise rise-3">
        <div className="tabs" role="tablist" aria-label="Sort">
          {SORTS.map((s) => (
            <Link key={s} href={href({ sort: s })} className={`tab-pill${sort === s ? " is-active" : ""}`} role="tab" aria-selected={sort === s}>
              {s === "new" ? "New" : s === "mechanics" ? "⚡ Most mechanics" : "Supply"}
            </Link>
          ))}
        </div>
        <input type="hidden" name="sort" value={sort} />
        <input name="q" defaultValue={q} placeholder="Search tokens" aria-label="Search tokens" className="field dash-search" />
        <select name="category" defaultValue={category} aria-label="Category" className="field dash-cat">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <button className="btn-ghost">Filter</button>
      </form>

      <div className="disc-board rise rise-3">
        {COLUMNS.map((c) => {
          const rows = launches.filter((l) => l.status === c.status);
          return (
            <section key={c.status} className="disc-col">
              <header className="disc-col-head">
                <div><h2>{c.title}</h2><small>{c.sub}</small></div>
                <span className="pill pill-sm">{rows.length}</span>
              </header>
              {rows.length ? (
                <ul className="disc">{rows.map((l, i) => <Card key={l.id} l={l} mine={l.wallet === wallet} i={i} />)}</ul>
              ) : c.status === "frozen" ? (
                <div className="disc-none">
                  <p>{q || category ? "No token matches." : "Nothing to discover yet."}</p>
                  {q || category ? <Link href="/launchpad" className="btn-ghost">Clear filters</Link> : <Link href="/launchpad/new" className="btn">+ Launch the first token</Link>}
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
