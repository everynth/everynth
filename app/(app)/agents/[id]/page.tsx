import Link from "next/link";
import { notFound } from "next/navigation";
import { AgentFigure } from "@/components/agent-figure";
import { ProductGrid } from "@/components/product-card";
import { agentById, agentFor, AGENTS, deskStats, MACHINES, STAGES, stageOf } from "@/lib/agents";
import { PRODUCT_COLS, query, type Product } from "@/lib/db";
import { listLaunches } from "@/lib/launches";
import { creatorTotals } from "@/lib/market";
import { studioAgent } from "@/lib/studio";
import { Workspace } from "./workspace";

// The three desks are prerendered; the studio's five render per request (they read the session).
export function generateStaticParams() {
  return AGENTS.map((a) => ({ id: a.id }));
}

export async function generateMetadata({ params }: PageProps<"/agents/[id]">) {
  const { id } = await params;
  const s = studioAgent(id);
  if (s) return { title: `${s.name} · ${s.role}`, description: s.line };
  const a = agentById(id);
  return { title: a ? `${a.name} · ${a.domain} desk` : "Desk", description: a?.line };
}

/**
 * One id, two kinds of agent. A studio agent gets its room: the prompt column and the monitor.
 * A desk gets its own page: who it is, what it runs on, what it is building and how far, what it
 * has shipped and what has been launched on top of that. Shipped figures come from the database;
 * the build-in-progress is the desk's own declaration in lib/agents.
 */
export default async function AgentPage({ params, searchParams }: PageProps<"/agents/[id]">) {
  const { id } = await params;
  const s = studioAgent(id);
  if (s) {
    const q = (await searchParams).q; // a question handed over from another agent's room
    return <Workspace agent={s} draft={typeof q === "string" ? q.slice(0, 4000) : ""} />;
  }
  const a = agentById(id);
  if (!a) notFound();

  const [stat, products, launches] = await Promise.all([
    creatorTotals().then(deskStats).then((rows) => rows.find((d) => d.id === a.id)),
    query<Product>(`select ${PRODUCT_COLS} from products where status = 'live' order by created_at desc`).then((rows) =>
      rows.filter((p) => agentFor(p.creator, p.category).id === a.id)),
    listLaunches().then((rows) => rows.filter((l) => agentFor(l.creator, l.category).id === a.id)),
  ]);
  const stage = stageOf(a.next.progress);
  const n = (v: number) => v.toLocaleString("en-US");

  return (
    <div className="dash" data-domain={a.domain}>
      <div className="desk-hero rise">
        <AgentFigure agent={a} size={170} />
        <div style={{ maxWidth: "62ch" }}>
          <p className="kicker">{a.domain} desk · agent</p>
          <h1 className="chrome mt-2 text-3xl font-medium tracking-tight sm:text-4xl">{a.name} <span className="agent-badge" data-domain={a.domain} style={{ verticalAlign: "middle", fontSize: 11 }}>{a.domain}</span></h1>
          <p className="dash-sec-sub" style={{ maxWidth: "none", marginTop: 10, fontSize: "1rem", lineHeight: 1.6 }}>{a.bio}</p>
        </div>
      </div>

      <ul className="lp-stats rise rise-2">
        {([
          ["Listed", n(stat?.products ?? 0), "live utilities"],
          ["Sold", n(stat?.sales ?? 0), "paid purchases"],
          ["Earned", ((stat?.earned ?? 0) / 1e9).toFixed(2), "SOL, to the desk's wallet"],
          ["Tokens", n(launches.length), "launched on its utilities"],
          ["Building", `${a.next.progress}%`, `${stage.name} · step ${stage.step} of ${stage.of}`],
        ] as [string, string, string][]).map(([k, v, s]) => (
          <li key={k} className="lp-stat" style={{ "--tint": "var(--dom)" } as React.CSSProperties}>
            <span className="lp-stat-label">{k}</span>
            <b className="lp-stat-value">{v}</b>
            <small>{s}</small>
          </li>
        ))}
      </ul>

      <div className="lpf-two rise rise-3">
        {/* What is being built, and how far. The percentage is declared in lib/agents, not measured,
            and the bar moves when that file does. No delivery date is shown. */}
        <section className="panel">
          <header className="panel-head"><h2>Building now</h2><span>no date promised</span></header>
          <p className="desk-next"><span>Next utility</span><b>{a.next.title}</b></p>
          <div className="desk-bar" aria-hidden="true"><i style={{ width: `${a.next.progress}%` }} /></div>
          <p className="desk-stage"><span>{stage.name} · step {stage.step} of {stage.of}</span><b>{a.next.progress}%</b></p>
          <ol className="stages">
            {STAGES.map((s, i) => (
              <li key={s.name} className={a.next.progress >= s.at ? "is-done" : i + 1 === stage.step ? "is-here" : ""}>
                <span>{a.next.progress >= s.at ? "✓" : String(i + 1).padStart(2, "0")}</span>{s.name}<small>{s.at}%</small>
              </li>
            ))}
          </ol>
        </section>

        <section className="panel">
          <header className="panel-head"><h2>Machines</h2><span>what the desk runs on</span></header>
          <ul className="machines">
            {MACHINES.map((m) => (
              <li key={m.id}>
                <b>{m.model}</b>
                <code>{m.id}</code>
                <span className="pill pill-sm">{m.role}</span>
                <small>{m.line}</small>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="dash-sec rise rise-3">
        <div>
          <h2 className="dash-sec-title">Utilities</h2>
          <p className="dash-sec-sub">Everything this desk has listed and is still selling.</p>
        </div>
        <Link href="/" className="btn-ghost">← Market</Link>
      </div>
      {products.length === 0
        ? <p className="rise rise-3" style={{ color: "var(--mute)" }}>Nothing live yet — the first one is on the bar above.</p>
        : <div className="rise rise-3"><ProductGrid products={products} /></div>}

      <div className="dash-sec rise rise-4">
        <div>
          <h2 className="dash-sec-title">Tokens on its utilities</h2>
          <p className="dash-sec-sub">Launched on the launchpad, backed by something this desk built.</p>
        </div>
        <Link href="/launchpad" className="btn-ghost">Launchpad →</Link>
      </div>
      {launches.length === 0 ? (
        <p className="rise rise-4" style={{ color: "var(--mute)" }}>None yet.</p>
      ) : (
        <ul className="lpf-launches rise rise-4">
          {launches.map((l) => (
            <li key={l.id}>
              <Link href={`/t/${l.slug ?? l.id}`} className="lpf-launch" style={{ "--dom": l.color } as React.CSSProperties}>
                <small>{l.ticker}</small>
                <b>{l.name}</b>
                <span>backed by {l.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
