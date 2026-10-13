import Link from "next/link";
import { notFound } from "next/navigation";
import { AgentMark } from "@/components/agent";
import { agentFor } from "@/lib/agents";
import { query } from "@/lib/db";
import { FEE_CEILING, hookById, taken, waterfall } from "@/lib/launchpad";
import { sessionWallet } from "@/lib/session";

type Row = {
  id: string; wallet: string; name: string; ticker: string; supply: number; stack: string;
  gate_balance: number; gate_unlocks: string; status: string; issued_at: number; created_at: Date;
  product_id: string; title: string; category: string; creator: string;
};

export async function generateMetadata({ params }: PageProps<"/launchpad/[id]">) {
  const { id } = await params;
  const [l] = await query<{ name: string; ticker: string }>(`select name, ticker from launches where id = $1`, [id]);
  return { title: l ? `${l.name} · ${l.ticker} — EVERYNTH launch` : "Launch — EVERYNTH" };
}

/**
 * A frozen launch, read back. Public, because the terms are the point: anyone can see what was
 * signed, and nothing here is minted yet, so there is nothing to protect by hiding it.
 */
export default async function LaunchPage({ params }: PageProps<"/launchpad/[id]">) {
  const { id } = await params;
  const wallet = await sessionWallet();
  const [l] = await query<Row>(
    `select l.*, p.title, p.category, p.creator from launches l join products p on p.id = l.product_id where l.id = $1`,
    [id],
  );
  if (!l) notFound();

  const stack: string[] = (() => { try { return JSON.parse(l.stack); } catch { return []; } })();
  const flow = waterfall(stack);
  const desk = agentFor(l.creator, l.category);
  const mine = wallet === l.wallet;
  const n = (v: number | string) => Number(v).toLocaleString("en-US");

  const rows: [string, React.ReactNode][] = [
    ["Utility", <Link key="u" href={`/p/${l.product_id}`} className="navlink" style={{ padding: 0 }}>{l.title}</Link>],
    ["Built by", <span key="d" className="lpf-desk"><AgentMark agent={desk} size={20} />{desk.name} <span className="agent-badge" data-domain={desk.domain}>{desk.domain}</span></span>],
    ["Token", `${l.name} · ${l.ticker}`],
    ["Supply", `${n(l.supply)}, fixed`],
    ["Mechanics", stack.map((id) => hookById(id)?.name ?? id).join(", ") || "—"],
    ["Fee spoken for", `${taken(stack)}% of ${FEE_CEILING}% ceiling`],
    ["Holders unlock", l.gate_unlocks],
    ["Balance needed", `${n(l.gate_balance)} ${l.ticker}`],
    ["Signed", new Date(Number(l.issued_at)).toUTCString()],
  ];

  return (
    <div className="dash">
      <div className="dash-sec rise">
        <div>
          <p className="kicker">{mine ? "Your launch" : "Launch"} · {l.status}</p>
          <h1 className="chrome mt-2 text-3xl font-medium tracking-tight sm:text-4xl">{l.name} <span className="lpf-ticker">{l.ticker}</span></h1>
          <p className="dash-sec-sub">
            Terms frozen under the launcher&apos;s signature. Change any line and the signature stops matching.
          </p>
        </div>
        <span className="pill pill-soon">◷ Awaiting program</span>
      </div>

      <dl className="lpf-review rise rise-2">
        {rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
      </dl>

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

      <div className="panel lpf-note rise rise-3">
        <b>Frozen, not minted.</b>
        <p>
          This row is a signed intent. The token program and the pool it launches into are still being
          built; when they exist, a frozen launch is what gets submitted. Until then nothing trades,
          nothing is held, and no holder gate is enforced.
        </p>
      </div>

      <div className="dash-sec-actions rise rise-4">
        <Link href="/launchpad" className="btn-ghost">← Launchpad</Link>
        {mine && <Link href="/launchpad/new" className="btn-ghost">Start another</Link>}
      </div>
    </div>
  );
}
