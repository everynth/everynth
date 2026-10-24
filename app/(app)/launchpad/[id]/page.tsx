import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AgentMark } from "@/components/agent";
import { CopyButton } from "@/components/copy-button";
import { SitePreview } from "@/components/site-preview";
import { agentFor } from "@/lib/agents";
import { RPC_URL } from "@/lib/config";
import { query } from "@/lib/db";
import { getLaunch } from "@/lib/launches";
import { agentsOn, DELIVERABLES, FEE_CEILING, hookById, taken, TEMPLATES, waterfall, type PairId, type TemplateId } from "@/lib/launchpad";
import { baseUnits, DECIMALS, explorer, short } from "@/lib/mint";
import { sessionWallet } from "@/lib/session";
import { balanceOf, holders } from "@/lib/token";
import { LaunchButton } from "./launch-button";
import { DeskButton } from "./desk-button";
import { LogoPanel } from "./logo-panel";
import { GateCheck } from "./gate-check";
import { Markdown } from "@/components/monitor";
import { deliverables, JOBS } from "@/lib/desk";
import { studioAgent } from "@/lib/studio";
import { curve } from "@/lib/token";
import { pumpUrl } from "@/lib/pump";
import { vaultWallet } from "@/lib/solana";

// The permalink is the slug; the id still answers, for links made before slugs existed.
const load = getLaunch;

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
  // The metadata URI the mint will carry has to be absolute, on whichever host this page is served from.
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? (h.get("host")?.startsWith("localhost") || h.get("host")?.startsWith("127.") ? "http" : "https")}://${h.get("host")}`;
  const minted = !!l.mint;
  const pair = (l.pair === "evyn" ? "evyn" : "sol") as PairId;
  const desk_on = agentsOn(pair);
  const [holderCount, held, stats] = minted ? await Promise.all([holders(l.mint!), wallet ? balanceOf(l.mint!, wallet) : Promise.resolve(0n), curve(l.mint!, pair)]) : [null, 0n, null];
  const unlocked = minted && held >= baseUnits(l.gate_balance);
  const work = desk_on ? await deliverables(l.id) : []; // the identity can exist before launch
  const doneKinds = new Set(work.map((w) => w.kind));
  const jobDone = (id: string) => JOBS.some((j) => doneKinds.has(j.kind) && (j.covers as readonly string[]).includes(id));
  const rounds = minted
    ? await query<{ id: string; created_at: Date; swept: string; launcher: string; buyback: string; burned: string; holders: string; lottery: string; revshare: string; held: string; quote: string; burned_quote: string }>(
        `select id, created_at, swept::text, launcher::text, buyback::text, burned::text, holders::text, lottery::text, revshare::text, held::text, quote, burned_quote::text from fee_rounds where launch_id = $1 order by created_at desc limit 10`,
        [l.id],
      )
    : [];
  const template = (TEMPLATES.some((t) => t.id === l.template) ? l.template : "basic") as TemplateId;
  const tpl = TEMPLATES.find((t) => t.id === template)?.name ?? template;
  const site = `/t/${l.slug ?? l.id}`;
  const ext = (href: string, label: string) => <a key={href} href={href} className="lpf-link" target="_blank" rel="noopener noreferrer">{label}</a>;
  const links = [
    l.website && ext(l.website, "App ↗"),
    l.utility_url && ext(l.utility_url, "Utility ↗"),
    l.x && ext(`https://x.com/${l.x}`, `@${l.x} on X ↗`),
    l.telegram && ext(`https://t.me/${l.telegram}`, "Telegram ↗"),
    l.github && ext(`https://github.com/${l.github}`, "GitHub ↗"),
  ].filter(Boolean);

  const chainRows: [string, React.ReactNode][] = minted ? [
    ["Contract", <span key="ca" style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
      <CopyButton text={l.mint!} label={`${short(l.mint!)} · copy`} className="pill pill-sm pill-live" />
      <a href={explorer("token", l.mint!, RPC_URL)} className="lpf-link" target="_blank" rel="noopener noreferrer">Solscan ↗</a>
      <a href={explorer("tx", l.mint_signature!, RPC_URL)} className="lpf-link" target="_blank" rel="noopener noreferrer">mint tx ↗</a>
    </span>],
    ["Launched", `${new Date(l.minted_at!).toUTCString()} · pump.fun bonding curve · Token-2022 · ${DECIMALS} decimals`],
    ["Curve", stats ? `${stats.progress.toFixed(1)}% filled · ${stats.raisedSol.toFixed(3)} SOL raised${pair === "evyn" ? ` (${stats.raisedQuote.toFixed(0)} EVYN)` : ""} · market cap ${stats.marketCapSol.toFixed(2)} SOL${stats.complete ? " · graduated to PumpSwap" : ""}` : "reading the curve…"],
    ["Trade", <a key="p" href={pumpUrl(l.mint!)} className="lpf-link" target="_blank" rel="noopener noreferrer">pump.fun ↗</a>],
  ] : [];
  const rows: [string, React.ReactNode][] = [
    ["Utility", <Link key="u" href={`/p/${l.product_id}`} className="navlink" style={{ padding: 0 }}>{l.title}</Link>],
    ["Built by", <Link key="d" href={`/u/${l.creator}`} className="lpf-desk agent-link"><AgentMark agent={desk} size={20} /><span className="agent-name">{desk.name}</span> <span className="agent-badge" data-domain={desk.domain}>{desk.domain}</span></Link>],
    ["Token", `${l.name} · ${l.ticker}`],
    ...chainRows,
    ["Supply", `${n(l.supply)}, fixed`],
    ["Pair", pair === "evyn" ? "EVYN · bought through EVYN, fees in EVYN (half burned) · the desk works this launch" : "SOL · plain curve · no desk"],
    ["Creator fee", l.creator_fee > 0 ? `${l.creator_fee * 10}% to the launcher under these older terms; the rest to the EVERYNTH vault` : "100% to the EVERYNTH vault — nothing to the launcher"],
    ["Mechanics", stack.map((id) => hookById(id)?.name ?? id).join(", ") || "—"],
    ["Fee spoken for", `${taken(stack)}% of ${FEE_CEILING}% ceiling`],
    ["Dev buy", `${Number(l.dev_buy)} SOL in the opening block`],
    ["Holders unlock", l.gate_unlocks],
    ["Balance needed", `${n(l.gate_balance)} ${l.ticker}`],
    ["Site", <span key="s"><Link href={site} className="lpf-link">{site}</Link> terminal · <Link href={`${site}/site`} className="lpf-link">{site}/site</Link> website · {tpl} look</span>],
    ["Links", links.length ? <span key="l" style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>{links}</span> : "none yet"],
    ["Signed", new Date(Number(l.issued_at)).toUTCString()],
  ];

  return (
    <div className="dash" style={{ "--accent": l.color } as React.CSSProperties}>
      <div className="dash-sec rise">
        <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- our own API route */}
          <img src={`/api/launches/${l.id}/logo`} alt="" width={64} height={64} style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,.12)", flex: "none", marginTop: 4 }} />
          <div>
            <p className="kicker">{mine ? "Your launch" : "Launch"} · {l.status}</p>
            <h1 className="chrome mt-2 text-3xl font-medium tracking-tight sm:text-4xl">{l.name} <span className="lpf-ticker">{l.ticker}</span></h1>
            <p className="dash-sec-sub">{l.description || "Terms frozen under the launcher's signature."}</p>
          </div>
        </div>
        <div className="dash-sec-actions">
          {mine && l.status === "frozen" && (
            <LaunchButton id={l.id} name={l.name} ticker={l.ticker} uri={`${origin}/api/launches/${l.id}/metadata`} owner={l.wallet} vault={vaultWallet()} devBuySol={Number(l.dev_buy)} pair={pair} />
          )}
          <Link href={site} className={mine && l.status === "frozen" ? "btn-ghost" : "btn"}>Open the site →</Link>
          <span className={`pill ${minted ? "pill-live" : "pill-soon"}`}>{minted ? (stats?.complete ? "● Graduated" : "● Live on the curve") : "◷ Not launched yet"}</span>
        </div>
      </div>

      {mine && <div className="rise rise-2"><LogoPanel id={l.id} pair={pair} source={l.logo_source} hasBanner={l.has_banner} minted={minted} /></div>}

      <dl className="lpf-review rise rise-2">
        {rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
      </dl>

      {/* The desk's work order, in the order it runs. Delivered to this page; until then each line
          says queued, because that is what it is. */}
      <div className="dash-sec rise rise-3">
        <div>
          <h2 className="dash-sec-title">{desk_on ? (work.length ? "The desk has delivered" : "The desk is on it") : "No desk on a SOL pair"}</h2>
          <p className="dash-sec-sub">{desk_on ? (minted ? `Prism does the identity, Loom the narrative, Quill the ${tpl} site copy \u2014 from the brief below, in about a minute.` : `Logo, banner, the full narrative and the ${tpl} site, from the brief below. The desk starts once the coin is on the curve.`) : `This coin is paired with SOL, so it gets the ${tpl} template with the launcher\u2019s text and nothing from the desk. Coins paired with EVYN get the logo, banner, narrative and posts.`}</p>
        </div>
        {mine && desk_on && minted && <DeskButton id={l.id} again={work.length > 0} />}
      </div>
      <div className="lpf-agents rise rise-3">
        <div>
          <Link href={site} style={{ display: "block", textDecoration: "none" }}>
            <SitePreview size="lg" name={l.name} ticker={l.ticker} description={l.description} color={l.color} template={template}
              website={l.website} x={l.x} telegram={l.telegram} github={l.github} utility={l.title} />
          </Link>
          <p className="lx-meta" style={{ marginTop: 8 }}>The terminal is live at <Link href={site} className="lpf-link">{site}</Link> (chart, trades, swap, holders) and the website at <Link href={`${site}/site`} className="lpf-link">{site}/site</Link> in the {tpl} look — the desk&apos;s work lands on it as it is delivered.</p>
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          <ol className="lpf-jobs">
            {DELIVERABLES.map((d, i) => (
              <li key={d.id} className="lpf-job" style={desk_on ? undefined : { opacity: .45 }}>
                <span className="lpf-job-n">{String(i + 1).padStart(2, "0")}</span>
                <span><b>{d.title}</b><small>{d.line}</small></span>
                <span className={`pill pill-sm${jobDone(d.id) ? " pill-live" : ""}`}>{desk_on ? (jobDone(d.id) ? "✓ done" : minted ? "ready" : "queued") : "locked"}</span>
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

      {work.length > 0 && (
        <div className="rise rise-3" style={{ display: "grid", gap: 10 }}>
          {JOBS.filter((j) => doneKinds.has(j.kind)).map((j) => {
            const w = work.find((x) => x.kind === j.kind)!;
            const a = studioAgent(w.agent);
            return (
              <details key={j.kind} className="panel" open={j.kind === "identity"}>
                <summary style={{ cursor: "pointer", display: "flex", gap: 12, alignItems: "baseline" }}>
                  <b>{j.kind === "identity" ? "Logo & banner" : j.kind === "narrative" ? "Narrative" : "Site copy"}</b>
                  <span className="lx-meta">by {a?.name ?? w.agent} · {w.model} · {w.created_at.slice(0, 16).replace("T", " ")}</span>
                  <CopyButton text={w.output} label="Copy" className="btn-ghost" />
                </summary>
                {j.kind === "identity" && (
                  <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- our own API route */}
                    {l.has_banner && <img src={`/api/launches/${l.id}/banner`} alt="" style={{ width: "100%", borderRadius: 14, border: "1px solid rgba(255,255,255,.12)" }} />}
                    {/* eslint-disable-next-line @next/next/no-img-element -- our own API route */}
                    <img src={`/api/launches/${l.id}/logo`} alt="" width={128} height={128} style={{ borderRadius: 28, border: "1px solid rgba(255,255,255,.12)" }} />
                  </div>
                )}
                <div style={{ marginTop: 12 }}><Markdown text={w.output} /></div>
              </details>
            );
          })}
        </div>
      )}

      {rounds.length > 0 && (
        <div className="term lpf-order rise rise-3">
          <div className="term-bar">fee rounds<span className="lx-bar-right">what the vault collected, and where it went · <a href={`/api/launches/${l.slug ?? l.id}/rounds`} className="lpf-link">CSV ↓</a></span></div>
          <div className="term-body">
            {rounds.map((r) => (
              <p key={r.id} className="lx-meta">
                {new Date(r.created_at).toISOString().slice(0, 16).replace("T", " ")} · swept {(Number(r.swept) / (r.quote === "EVYN" ? 1e6 : 1e9)).toFixed(r.quote === "EVYN" ? 2 : 6)} {r.quote}
                {Number(r.burned_quote) > 0 && ` · burned ${(Number(r.burned_quote) / 1e6).toFixed(2)} EVYN`}
                {Number(r.launcher) > 0 && ` · launcher ${(Number(r.launcher) / 1e9).toFixed(6)}`}
                {Number(r.buyback) > 0 && ` · buyback ${(Number(r.buyback) / 1e9).toFixed(6)}`}
                {Number(r.burned) > 0 && ` · burned ${(Number(r.burned) / 1e6).toLocaleString("en-US")} ${l.ticker}`}
                {Number(r.holders) > 0 && ` · holders ${(Number(r.holders) / 1e9).toFixed(6)}`}
                {Number(r.lottery) > 0 && ` · lottery ${(Number(r.lottery) / 1e9).toFixed(6)}`}
                {Number(r.revshare) > 0 && ` · revshare ${(Number(r.revshare) / 1e9).toFixed(6)}`}
                {Number(r.held) > 0 && ` · held ${(Number(r.held) / 1e9).toFixed(6)}`}
              </p>
            ))}
          </div>
        </div>
      )}

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
          {minted ? (
            <>
              <p className="lpf-sub" style={{ marginBottom: 8 }}>
                Holders on chain: <b>{holderCount === null ? "—" : holderCount >= 20 ? "20+" : holderCount}</b>.
                {wallet ? <> You hold <b>{(Number(held) / 10 ** DECIMALS).toLocaleString("en-US")} {l.ticker}</b> — {unlocked ? "the utility is open to you." : "below the gate, so it is closed."}</> : " Sign in to check your own balance."}
              </p>
              <GateCheck id={l.slug ?? l.id} ticker={l.ticker} prefill={wallet ?? ""} />
              <p className="lx-meta" style={{ marginBottom: 0 }}>Any app can ask the same question: <code>GET /api/launches/{l.slug ?? l.id}/gate?wallet=…</code></p>
            </>
          ) : (
            <p className="lpf-sub" style={{ marginBottom: 0 }}>
              That is the whole rule. Hold at least that much and the utility opens; sell below it and it
              closes. It is read from the chain once the token is minted.
            </p>
          )}
        </section>
        <section className="panel">
          <header className="panel-head"><h2>Community</h2><span>holders only</span></header>
          <p className="lpf-sub" style={{ marginBottom: minted ? 12 : 0 }}>
            {minted
              ? `A room for $${l.ticker}: anyone reads, holders write, and every message shows what its author held when they wrote it.`
              : "The room opens with the token, not before: a chat for a token that does not trade yet would be a chat about a promise."}
          </p>
          {minted && <Link href={`/community/${l.slug ?? l.id}`} className="btn">Open the ${l.ticker} room →</Link>}
        </section>
      </div>

      <div className="panel lpf-note rise rise-3">
        {minted ? (
          <>
            <b>Live on the bonding curve.</b>
            <p>
              The coin trades on pump.fun&apos;s bonding curve: price rises with buys, falls with sells, and at 100% the curve
              migrates to a PumpSwap pool with its liquidity burned. Creator fees go to the EVERYNTH vault in full, and the
              vault runs the mechanics above with them. Nothing goes to the launcher: their stake is the dev buy.
            </p>
          </>
        ) : (
          <>
            <b>Frozen, not minted.</b>
            <p>
              This row is a signed intent. {mine ? "Press Launch and your wallet creates the coin on pump.fun from exactly these terms, dev buy included; the server reads the curve back before marking it launched." : "The launcher puts it on pump.fun from exactly these terms; nothing trades until then."}
            </p>
          </>
        )}
      </div>

      <div className="dash-sec-actions rise rise-4">
        <Link href="/launchpad" className="btn-ghost">← Launchpad</Link>
        {mine && <Link href="/launchpad/new" className="btn-ghost">Start another</Link>}
      </div>
    </div>
  );
}
