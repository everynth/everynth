import Link from "next/link";
import { AgentBy, AgentMark } from "@/components/agent";
import { age } from "@/components/avatar";
import { agentFor } from "@/lib/agents";
import { CATEGORIES } from "@/lib/config";
import { COLUMNS, hooksOf, listLaunches, type LaunchCard } from "@/lib/launches";
import { FEE_CEILING, hookById, taken } from "@/lib/launchpad";
import { sessionWallet } from "@/lib/session";
import { curve } from "@/lib/token";

export const metadata = {
  title: "Launchpad · EVERYNTH",
  description: "Every token launched on EVERYNTH, with the utility behind it and the terms its launcher signed.",
};

const SORTS = ["new", "mechanics", "supply"] as const;
type Sort = (typeof SORTS)[number];
const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
const days = (d: Date) => (Date.now() - new Date(d).getTime()) / 864e5;

// Looping icons for the stat tiles: one or two strokes each, animated in CSS by data-anim.
const ICONS = {
  coin: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /></svg>,
  wave: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path className="ico-path" d="M2 12c2.5 0 2.5-6 5-6s2.5 12 5 12 2.5-12 5-12 2.5 6 5 6" /></svg>,
  bars: <svg viewBox="0 0 24 24" fill="currentColor"><rect className="ico-bar" x="4" y="10" width="4" height="10" rx="1" /><rect className="ico-bar" x="10" y="5" width="4" height="15" rx="1" /><rect className="ico-bar" x="16" y="13" width="4" height="7" rx="1" /></svg>,
  box: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" /><path d="M4 7.5l8 4.5 8-4.5M12 12v9" /></svg>,
  bolt: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" /></svg>,
  users: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle className="ico-dot" cx="9" cy="8" r="3.5" /><circle className="ico-dot" cx="17" cy="10" r="2.5" /><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6M15 20c0-2.5 1-4.5 2-4.5s4 1.5 4 4.5" /></svg>,
  ring: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><circle cx="12" cy="12" r="8" opacity=".25" /><path d="M12 4a8 8 0 0 1 8 8" /></svg>,
  lock: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="5" y="11" width="14" height="10" rx="2" /><path className="ico-shackle" d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>,
} as const;

// Same card as the market, plus the terms a launch carries: supply, the gate, the mechanics by
// name and how much of the fee they have spoken for.
function Card({ l, mine, i, live }: { l: LaunchCard; mine: boolean; i: number; live?: { progress: number; complete: boolean } | null }) {
  const desk = agentFor(l.creator, l.category);
  const stack = hooksOf(l.stack);
  const fee = taken(stack);
  return (
    <li>
      <Link href={`/t/${l.slug ?? l.id}`} className="pcardx rise" data-domain={desk.domain} style={{ "--dom": l.color, animationDelay: `${120 + Math.min(i, 10) * 50}ms` } as React.CSSProperties}>
        <span className="pcardx-cover">
          {/* The coin's own logo — uploaded, drawn by Prism, the utility's cover, or the default mark — never a blank. */}
          {/* eslint-disable-next-line @next/next/no-img-element -- our own API route */}
          <img src={`/api/launches/${l.id}/logo`} alt="" />
          <span className="pill pill-sm disc-badge">{stack.length}× ⚡</span>
        </span>
        <span className="pcardx-avatar"><AgentMark agent={desk} /></span>
        <span className="pcardx-title">{l.name} <small>({l.ticker})</small></span>
        <span className="pcardx-by"><AgentBy agent={desk} /> · {age(days(l.created_at))}</span>
        <span className="pcardx-desc">{l.description || <>Backed by <b>{l.title}</b></>}</span>
        <dl className="disc-facts">
          <div><dt>Supply</dt><dd>{compact.format(Number(l.supply))}</dd></div>
          <div><dt>Pair</dt><dd>{l.pair === "evyn" ? "EVYN" : "SOL"}</dd></div>
          <div><dt>Holders get</dt><dd>{l.gate_unlocks}</dd></div>
          <div><dt>Fee spoken for</dt><dd className="is-fee">{fee}%</dd></div>
        </dl>
        <span className="desk-bar" aria-hidden="true"><i style={{ width: `${(fee / FEE_CEILING) * 100}%` }} /></span>
        {live && (
          // Where the coin is on pump.fun's curve, read from the chain: 100% is graduation to a pool.
          <span className="disc-curve">
            <span><b>{live.complete ? "Graduated" : `${live.progress.toFixed(1)}%`}</b> of the bonding curve</span>
            <span className="disc-curve-bar" aria-hidden="true"><i style={{ width: `${live.complete ? 100 : Math.max(1.5, live.progress)}%` }} /></span>
          </span>
        )}
        <span className="disc-hooks">
          {stack.map((id) => <span key={id} className="pill pill-sm">{hookById(id)?.name ?? id}</span>)}
        </span>
        <span className="pcardx-foot">
          <span className="pill" data-cat={l.category}>{l.category}</span>
          <span className={`pill${mine || l.mint ? " pill-live" : ""}`}>{mine ? "● yours" : l.mint ? "● on the curve" : l.status}</span>
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
  const pair = sp.pair === "evyn" || sp.pair === "sol" ? sp.pair : "";
  const href = (patch: Record<string, string>) => {
    const u = new URLSearchParams();
    for (const [k, v] of Object.entries({ q, category, sort, pair, ...patch })) if (v && v !== "new") u.set(k, v);
    const s = u.toString();
    return s ? `/launchpad?${s}` : "/launchpad";
  };

  const wallet = await sessionWallet();
  // Everything frozen on this launchpad, newest first. Public: the terms are the point.
  const all = await listLaunches();
  const launches = all
    .filter((l) => (!category || l.category === category) && (!pair || l.pair === pair) && (!q || `${l.name} ${l.ticker} ${l.title}`.toLowerCase().includes(q)))
    .sort((a, b) => sort === "mechanics" ? hooksOf(b.stack).length - hooksOf(a.stack).length : sort === "supply" ? Number(b.supply) - Number(a.supply) : 0);

  // Curve progress for every coin on a curve (cached briefly per mint, so a busy page costs little).
  const curves = new Map(await Promise.all(launches.filter((l) => l.mint).map(async (l) => {
    const c = await curve(l.mint!, l.pair === "evyn" ? "evyn" : "sol");
    return [l.id, c ? { progress: c.progress, complete: c.complete } : null] as const;
  })));

  // The numbers across the top, from the rows: how many were frozen, how many are trading, and the pair split.
  const newest = all[0];
  const fees = all.map((l) => taken(hooksOf(l.stack)));
  const live = all.filter((l) => l.mint).length;
  const evyn = all.filter((l) => l.pair === "evyn").length;
  const stats: { label: string; value: string; sub: string; icon: keyof typeof ICONS; anim: string; tint: string }[] = [
    { label: "Tokens", value: String(all.length), sub: "terms frozen here", icon: "coin", anim: "flip", tint: "var(--c-amber)" },
    { label: "On the curve", value: String(live), sub: `live on pump.fun · ${evyn} paired with EVYN`, icon: "wave", anim: "dash", tint: "var(--c-green)" },
    { label: "Supply", value: compact.format(all.reduce((n, l) => n + Number(l.supply), 0)), sub: "committed in total", icon: "bars", anim: "rise", tint: "var(--c-cyan)" },
    { label: "Utilities", value: String(new Set(all.map((l) => l.product_id)).size), sub: "with a token", icon: "box", anim: "bob", tint: "var(--c-violet)" },
    { label: "Mechanics", value: String(all.reduce((n, l) => n + hooksOf(l.stack).length, 0)), sub: "hooks stacked", icon: "bolt", anim: "pulse", tint: "var(--c-amber)" },
    { label: "Launchers", value: String(new Set(all.map((l) => l.wallet)).size), sub: "wallets that signed", icon: "users", anim: "blink", tint: "var(--c-blue)" },
    { label: "Avg fee", value: fees.length ? `${Math.round(fees.reduce((a, b) => a + b, 0) / fees.length)}%` : "—", sub: `spoken for, of ${FEE_CEILING}%`, icon: "ring", anim: "spin", tint: "var(--c-green)" },
    { label: "Newest", value: newest ? newest.ticker : "—", sub: newest ? `${newest.name} · ${age(days(newest.created_at))}` : "nothing frozen yet", icon: "lock", anim: "shackle", tint: "var(--c-rose)" },
  ];

  return (
    <div className="dash">
      <div className="dash-sec rise">
        <div>
          <p className="kicker">Launchpad · Discover</p>
          <h1 className="chrome mt-2 text-3xl font-medium tracking-tight sm:text-4xl">Launchpad</h1>
          <p className="dash-sec-sub">Tokens with a utility behind them. Terms frozen under the launcher&apos;s signature, then created on pump.fun&apos;s bonding curve, paired with EVYN or SOL.</p>
        </div>
        <div className="dash-sec-actions">
          <Link href="/launchpad/new" className="btn">+ Launch token</Link>
          <span className="pill pill-live">● Live on pump.fun</span>
        </div>
      </div>

      <ul className="lp-stats rise rise-2">
        {stats.map((s) => (
          <li key={s.label} className="lp-stat" style={{ "--tint": s.tint } as React.CSSProperties}>
            <span className="lp-ico" data-anim={s.anim} aria-hidden="true">{ICONS[s.icon]}</span>
            <span className="lp-stat-label">{s.label}</span>
            <b className="lp-stat-value">{s.value}</b>
            <small>{s.sub}</small>
          </li>
        ))}
      </ul>

      <form method="get" className="dash-filters rise rise-3">
        <div className="tabs" role="tablist" aria-label="Sort">
          {SORTS.map((s) => (
            <Link key={s} href={href({ sort: s })} className={`tab-pill${sort === s ? " is-active" : ""}`} role="tab" aria-selected={sort === s}>
              {s === "new" ? "New" : s === "mechanics" ? "⚡ Most mechanics" : "Supply"}
            </Link>
          ))}
        </div>
        <div className="tabs" role="tablist" aria-label="Pair">
          {([["", "All pairs"], ["evyn", "EVYN"], ["sol", "SOL"]] as const).map(([v, label]) => (
            <Link key={label} href={href({ pair: v })} className={`tab-pill${pair === v ? " is-active" : ""}`} role="tab" aria-selected={pair === v}>{label}</Link>
          ))}
        </div>
        <input type="hidden" name="sort" value={sort} />
        <input type="hidden" name="pair" value={pair} />
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
                <ul className="disc">{rows.map((l, i) => <Card key={l.id} l={l} mine={l.wallet === wallet} i={i} live={curves.get(l.id)} />)}</ul>
              ) : c.status === "frozen" ? (
                <div className="disc-none">
                  <p>{q || category || pair ? "No token matches." : "Nothing to discover yet."}</p>
                  {q || category || pair ? <Link href="/launchpad" className="btn-ghost">Clear filters</Link> : <Link href="/launchpad/new" className="btn">+ Launch the first token</Link>}
                </div>
              ) : (
                <div className="disc-none"><p>{c.status === "launched" ? "Nothing on the curve right now. A frozen launch lands here the moment its coin is created." : "Fills when a curve reaches 100% and its coin moves into a PumpSwap pool."}</p></div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
