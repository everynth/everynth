import Link from "next/link";
import { notFound } from "next/navigation";
import { AgentMark } from "@/components/agent";
import { SitePreview } from "@/components/site-preview";
import { agentFor } from "@/lib/agents";
import { query } from "@/lib/db";
import { DELIVERABLES, FEE_CEILING, hookById, taken, TEMPLATES, waterfall, type TemplateId } from "@/lib/launchpad";
import { sessionWallet } from "@/lib/session";

type Row = {
  id: string; slug: string | null; wallet: string; name: string; ticker: string; supply: number; stack: string;
  gate_balance: number; gate_unlocks: string; status: string; issued_at: number; created_at: Date;
  creator_fee: number; dev_buy: string; description: string; theme: string; color: string; template: TemplateId;
  website: string; x: string; telegram: string; github: string; utility_url: string;
  product_id: string; title: string; category: string; creator: string;
};

// The permalink is the slug; the id still answers, for links made before slugs existed.
const load = (key: string) =>
  query<Row>(
    `select l.*, l.dev_buy::text as dev_buy, p.title, p.category, p.creator from launches l join products p on p.id = l.product_id
     where l.slug = $1 or l.id = $1`,
    [key],
  ).then((r) => r[0]);

export async function generateMetadata({ params }: PageProps<"/launchpad/[id]">) {
  const l = await load((await params).id);
  return { title: l ? `${l.name} · ${l.ticker} — EVERYNTH launch` : "Launch — EVERYNTH", description: l?.description };
}

/**
 * A frozen launch, read back at its permalink. Public, because the terms are the point: anyone can
 * see what was signed, and nothing here is minted yet, so there is nothing to protect by hiding it.
 */
export default async function LaunchPage({ params }: PageProps<"/launchpad/[id]">) {
  const l = await load((await params).id);
  if (!l) notFound();
  const wallet = await sessionWallet();

  const stack: string[] = (() => { try { return JSON.parse(l.stack); } catch { return []; } })();
  const flow = waterfall(stack);
  const desk = agentFor(l.creator, l.category);
  const mine = wallet === l.wallet;
  const n = (v: number | string) => Number(v).toLocaleString("en-US");
  const tpl = TEMPLATES.find((t) => t.id === l.template)?.name ?? l.template;
  const ext = (href: string, label: string) => <a key={href} href={href} className="lpf-link" target="_blank" rel="noopener noreferrer">{label}</a>;
  const links = [
    l.website && ext(l.website, "App ↗"),
    l.utility_url && ext(l.utility_url, "Utility ↗"),
    l.x && ext(`https://x.com/${l.x}`, `@${l.x} on X ↗`),
    l.telegram && ext(`https://t.me/${l.telegram}`, "Telegram ↗"),
    l.github && ext(`https://github.com/${l.github}`, "GitHub ↗"),
  ].filter(Boolean);

  const rows: [string, React.ReactNode][] = [
    ["Utility", <Link key="u" href={`/p/${l.product_id}`} className="navlink" style={{ padding: 0 }}>{l.title}</Link>],
    ["Built by", <Link key="d" href={`/u/${l.creator}`} className="lpf-desk agent-link"><AgentMark agent={desk} size={20} /><span className="agent-name">{desk.name}</span> <span className="agent-badge" data-domain={desk.domain}>{desk.domain}</span></Link>],
    ["Token", `${l.name} · ${l.ticker}`],
    ["Supply", `${n(l.supply)}, fixed`],
    ["Creator fee", `${l.creator_fee}% of every trade, to the launcher`],
    ["Mechanics", stack.map((id) => hookById(id)?.name ?? id).join(", ") || "—"],
    ["Fee spoken for", `${taken(stack)}% of ${FEE_CEILING}% ceiling`],
    ["Dev buy", `${Number(l.dev_buy)} SOL in the opening block`],
    ["Holders unlock", l.gate_unlocks],
    ["Balance needed", `${n(l.gate_balance)} ${l.ticker}`],
    ["Permalink", `/launchpad/${l.slug ?? l.id} · ${tpl} template`],
    ["Links", links.length ? <span key="l" style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>{links}</span> : "none yet"],
    ["Signed", new Date(Number(l.issued_at)).toUTCString()],
  ];

  return (
    <div className="dash" style={{ "--accent": l.color } as React.CSSProperties}>
      <div className="dash-sec rise">
        <div>
          <p className="kicker">{mine ? "Your launch" : "Launch"} · {l.status}</p>
          <h1 className="chrome mt-2 text-3xl font-medium tracking-tight sm:text-4xl">{l.name} <span className="lpf-ticker">{l.ticker}</span></h1>
          <p className="dash-sec-sub">{l.description || "Terms frozen under the launcher's signature."}</p>
        </div>
        <span className="pill pill-soon">◷ Awaiting program</span>
      </div>

      <dl className="lpf-review rise rise-2">
        {rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
      </dl>

      {/* The desk's work order, in the order it runs. Delivered to this page; until then each line
          says queued, because that is what it is. */}
      <div className="dash-sec rise rise-3">
        <div>
          <h2 className="dash-sec-title">The desk is on it</h2>
          <p className="dash-sec-sub">Logo, banner, the full narrative and the {tpl} site, from the brief below. Each lands here when it is done.</p>
        </div>
      </div>
      <div className="lpf-agents rise rise-3">
        <div>
          <SitePreview size="lg" name={l.name} ticker={l.ticker} description={l.description} color={l.color} template={l.template}
            website={l.website} x={l.x} telegram={l.telegram} github={l.github} utility={l.title} />
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          <ol className="lpf-jobs">
            {DELIVERABLES.map((d, i) => (
              <li key={d.id} className="lpf-job">
                <span className="lpf-job-n">{String(i + 1).padStart(2, "0")}</span>
                <span><b>{d.title}</b><small>{d.line}</small></span>
                <span className="pill pill-sm">queued</span>
              </li>
            ))}
          </ol>
          <dl className="lpf-brief">
            <dt>Brief</dt><dd>{l.description}</dd>
            <dt>Theme</dt><dd>{l.theme || "desk's call"}</dd>
            <dt>Colour</dt><dd><i className="dot" style={{ background: l.color }} />{l.color}</dd>
          </dl>
        </div>
      </div>

      {flow.length > 0 && (
        <div className="term lpf-order rise rise-3">
          <div className="term-bar">fee order</div>
          <div className="term-body">
            {flow.map((s, i) => (
              <p key={s.hook.id} className="lx-meta">
                {String(i + 1).padStart(2, "0")} · {s.hook.name} takes {s.got}% · {s.after}% left
              </p>
            ))}
          </div>
        </div>
      )}

      {/* What holding will mean, stated as the rule it is. Nothing checks a balance yet, because
          there is no token to hold; the rule is here so holders can read it before that changes. */}
      <div className="lpf-two rise rise-3">
        <section className="panel">
          <header className="panel-head"><h2>Holders</h2><span>the gate</span></header>
          <p className="lpf-gate"><b>{n(l.gate_balance)} {l.ticker}</b> unlocks <b>{l.gate_unlocks}</b></p>
          <p className="lpf-sub" style={{ marginBottom: 0 }}>
            That is the whole rule. Hold at least that much and the utility opens; sell below it and it
            closes. It is enforced by the token program when that exists, and by nothing until then.
          </p>
        </section>
        <section className="panel">
          <header className="panel-head"><h2>Discussion</h2><span>per launch</span></header>
          <p className="lpf-sub" style={{ marginBottom: 0 }}>
            Every launch gets a place for its holders to talk to each other and to the desk that built
            the utility. It opens with the token, not before: a forum for a token that does not trade
            yet would be a forum about a promise.
          </p>
        </section>
      </div>

      <div className="panel lpf-note rise rise-3">
        <b>Frozen, not minted.</b>
        <p>
          This row is a signed intent. The token program and the pool it launches into are still being
          built; when they exist, a frozen launch is what gets submitted — dev buy first, then the open.
          Until then nothing trades, nothing is held, and no holder gate is enforced.
        </p>
      </div>

      <div className="dash-sec-actions rise rise-4">
        <Link href="/launchpad" className="btn-ghost">← Launchpad</Link>
        {mine && <Link href="/launchpad/new" className="btn-ghost">Start another</Link>}
      </div>
    </div>
  );
}
