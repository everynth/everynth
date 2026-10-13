"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SitePreview } from "@/components/site-preview";
import { useWalletCtx } from "@/components/wallet";
import { actionMessage, tokenFields } from "@/lib/launch-message";
import {
  blockedBy, DELIVERABLES, DEV_BUY_MAX, EMPTY, FAMILIES, FEE_CEILING, FEE_MAX, FEE_MIN, HOOKS, hookById, MAX_SUPPLY, MIN_SUPPLY,
  problemWith, ready, slugify, STEPS, taken, TEMPLATES, waterfall,
  type Draft, type StepId, type TemplateId,
} from "@/lib/launchpad";

export type Owned = { id: string; title: string; kind: string; source: "launched" | "bought" };

/** Lets a visitor see what the later steps ask for before they own anything. Labelled everywhere
 *  it appears, so it can never be mistaken for a real holding. */
const SAMPLE: Owned = { id: "sample", title: "Sample utility", kind: "file", source: "bought" };

const SWATCHES = ["#79d2f2", "#b9a7f5", "#7be0a8", "#e9c46a", "#f2a0b5", "#f0a878", "#8fb8f0", "#ffffff"];

const pretty = (s: string) => {
  const v = Number(s.replace(/\D/g, ""));
  return Number.isFinite(v) && v > 0 ? v.toLocaleString("en-US") : "—";
};

/** Where an unfinished draft waits out a refresh. Per tab, gone when the tab closes. */
const KEY = "everynth.launch.draft";

type Patch = (p: Partial<Draft>) => void;

/**
 * The launch flow. One Draft walks through five steps; lib/launchpad decides what counts as
 * finished, so the rail, the Next button and the launch screen can never disagree.
 *
 * The last step freezes the terms under a signature and stops there. The token program does not
 * exist yet, so nothing is minted; the page says so rather than pretending.
 */
export function Flow({ owned }: { owned: Owned[] }) {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [at, setAt] = useState<StepId>("utility");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const restored = useRef(false);
  const router = useRouter();
  const { address, signMessage } = useWalletCtx();

  // A refresh should not throw five steps away. sessionStorage is not there during server render,
  // so the restore runs after mount, deferred a frame; nothing is saved until it has run, or the
  // first render's empty draft would overwrite the one being restored.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const raw = sessionStorage.getItem(KEY);
        if (raw) {
          const old = JSON.parse(raw) as Partial<Draft>;
          setDraft({ ...EMPTY, ...old, project: { ...EMPTY.project, ...(old.project ?? {}) } });
        }
      } catch {
        // private mode, or junk in storage: start clean
      }
      restored.current = true;
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    if (!restored.current) return;
    try { sessionStorage.setItem(KEY, JSON.stringify(draft)); } catch { /* storage may be refused */ }
  }, [draft]);

  const patch: Patch = (p) => setDraft((d) => ({ ...d, ...p }));
  const i = STEPS.findIndex((s) => s.id === at);
  const problem = problemWith(at, draft);
  const sample = draft.utility?.id === "sample";
  const canSign = ready(draft) && !sample && !!address && !busy;

  const go = (id: StepId) => {
    const gap = blockedBy(id, draft);
    setAt(gap ?? id);
  };

  // The one signature. The wallet shows exactly the lines in tokenFields; the server rebuilds the
  // same lines from the submitted terms and refuses anything that does not match.
  const submit = async () => {
    if (!draft.utility || !address) return;
    setBusy(true);
    setErr(null);
    try {
      const terms = {
        productId: draft.utility.id, name: draft.name.trim(), ticker: draft.ticker, supply: draft.supply,
        project: { ...draft.project, description: draft.project.description.trim(), theme: draft.project.theme.trim() },
        stack: draft.stack, devBuy: draft.devBuy, gateBalance: draft.gate.balance, gateUnlocks: draft.gate.unlocks.trim(),
      };
      const issuedAt = Date.now();
      const lines = tokenFields({
        productId: terms.productId, name: terms.name, ticker: terms.ticker, supply: Number(terms.supply), creatorFee: terms.project.fee,
        stack: terms.stack, devBuy: terms.devBuy, gateBalance: Number(terms.gateBalance), gateUnlocks: terms.gateUnlocks,
        slug: terms.project.slug, template: terms.project.template,
      });
      const sig = await signMessage(new TextEncoder().encode(actionMessage(location.host, address, "launch token", lines, issuedAt)));
      const res = await fetch("/api/launches", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...terms, issuedAt, signature: btoa(String.fromCharCode(...sig)) }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "could not freeze the terms");
      try { sessionStorage.removeItem(KEY); } catch { /* fine */ }
      router.push(`/launchpad/${body.slug ?? body.id}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "could not freeze the terms");
      setBusy(false);
    }
  };

  const whyNot = err ?? problem ?? (at !== "launch" ? "Ready."
    : sample ? "A sample cannot be signed — buy a utility and it will appear in step one."
    : !address ? "Connect your wallet to sign."
    : "Ready to sign.");

  return (
    <div className="lpf">
      <ol className="lpf-rail" aria-label="Launch steps">
        {STEPS.map((s, n) => {
          const done = problemWith(s.id, draft) === null;
          const here = s.id === at;
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => go(s.id)}
                className={`lpf-step${here ? " is-here" : ""}${done && !here ? " is-done" : ""}`}
                aria-current={here ? "step" : undefined}
              >
                <span className="lpf-n">{done && !here ? "✓" : String(n + 1).padStart(2, "0")}</span>
                <span className="lpf-t">{s.title}<small>{s.blurb}</small></span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="lpf-body">
        {at === "utility" && <StepUtility draft={draft} patch={patch} owned={owned} />}
        {at === "project" && <StepProject draft={draft} patch={patch} />}
        {at === "mechanics" && <StepMechanics draft={draft} patch={patch} />}
        {at === "agents" && <StepAgents draft={draft} />}
        {at === "launch" && <StepLaunch draft={draft} />}

        <footer className="lpf-foot">
          <button type="button" className="btn-ghost" onClick={() => setAt(STEPS[Math.max(0, i - 1)].id)} disabled={i === 0}>
            ← Back
          </button>
          <span className={`lpf-why${err ? " is-err" : ""}`}>{whyNot}</span>
          {at === "launch" ? (
            <button type="button" className="btn" onClick={submit} disabled={!canSign}>
              {busy ? "Check your wallet…" : "Freeze and launch"}
            </button>
          ) : (
            <button type="button" className="btn" onClick={() => setAt(STEPS[i + 1].id)} disabled={problem !== null}>
              Next →
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- 1 utility

function StepUtility({ draft, patch, owned }: { draft: Draft; patch: Patch; owned: Owned[] }) {
  // Picking a utility also seeds what holders unlock, since that is almost always the same thing.
  // Both the real list and the sample go through here so they cannot drift apart.
  const choose = (o: Owned) => patch({ utility: o, gate: { ...draft.gate, unlocks: draft.gate.unlocks || o.title } });

  return (
    <section className="lpf-pane">
      <h2 className="lpf-h">What is this token for?</h2>
      <p className="lpf-sub">
        A token with nothing behind it is a promise. Buy a utility from one of the desks, or pick one
        you already own. Ownership is proved the way everything here is — the wallet that paid,
        checked against the chain.
      </p>

      {owned.length === 0 ? (
        <div className="panel lpf-empty">
          <p>Nothing of yours is on this market yet.</p>
          <p className="lpf-sub">
            Buy a utility and it appears here. You can also walk the rest of the flow with a sample,
            to see what it asks for before you own anything.
          </p>
          <div className="dash-sec-actions">
            <Link href="/" className="btn">Browse the market</Link>
            <button type="button" className="btn-ghost" onClick={() => choose(SAMPLE)}>
              Walk it with a sample
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="lpf-picks">
            {owned.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => choose(o)}
                aria-pressed={draft.utility?.id === o.id}
                className={`lpf-pick${draft.utility?.id === o.id ? " is-on" : ""}`}
              >
                <span className="lpf-pick-k">{o.kind}</span>
                <span className="lpf-pick-t">{o.title}</span>
                <small>{o.source === "launched" ? "you listed this" : "you bought this"}</small>
              </button>
            ))}
          </div>
          <p className="lx-meta" style={{ marginTop: 12 }}>
            Want a different one? <Link href="/" className="lpf-link">Browse the market</Link> — anything you buy shows up here.
          </p>
        </>
      )}
    </section>
  );
}

// ---------------------------------------------------------------- 2 project

function StepProject({ draft, patch }: { draft: Draft; patch: Patch }) {
  const p = draft.project;
  const pp = (x: Partial<Draft["project"]>) => patch({ project: { ...p, ...x } });
  // The permalink follows the ticker until the launcher edits it by hand.
  const setTicker = (v: string) => {
    const ticker = v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
    const follows = p.slug === "" || p.slug === slugify(draft.ticker);
    patch({ ticker, project: follows ? { ...p, slug: slugify(ticker) } : p });
  };
  const site = { name: draft.name, ticker: draft.ticker, description: p.description, color: p.color, website: p.website, x: p.x, telegram: p.telegram, github: p.github, utility: draft.utility?.title };

  return (
    <section className="lpf-pane">
      <h2 className="lpf-h">The project</h2>
      <p className="lpf-sub">
        The token, the fee, and the brief the desk works from. Short is fine: the desk writes the long
        version, draws the logo and banner, and fills the site.
      </p>

      <div className="term">
        <div className="term-bar"><span className="term-dots"><i /><i /><i /></span> create token</div>
        <div className="term-body">
          <p className="lx-cmd"><span>$</span> everynth launchpad --new</p>
          <div className="lpf-two-col">
            <Field label="--name" value={draft.name} onChange={(v) => patch({ name: v.slice(0, 24) })} aria="Project name" />
            <Field label="--ticker" value={draft.ticker} onChange={setTicker} aria="Ticker" />
          </div>
          <Field
            label="--supply"
            value={draft.supply}
            onChange={(v) => patch({ supply: v.replace(/\D/g, "").slice(0, 15) })}
            aria="Supply"
            meta={`${pretty(draft.supply)} tokens · between ${MIN_SUPPLY.toLocaleString("en-US")} and ${MAX_SUPPLY.toLocaleString("en-US")} · fixed at launch`}
          />
          <div className="lx-row lx-row-plain">
            <span className="lx-caret">›</span>
            <div>
              <div className="lx-label">--creator-fee <em>of every trade, to your wallet</em></div>
              <div className="lpf-fee" role="radiogroup" aria-label="Creator fee">
                {Array.from({ length: FEE_MAX - FEE_MIN + 1 }, (_, k) => FEE_MIN + k).map((f) => (
                  <button key={f} type="button" role="radio" aria-checked={p.fee === f} onClick={() => pp({ fee: f })}>{f}%</button>
                ))}
              </div>
            </div>
          </div>
          <Field
            label="--permalink"
            value={p.slug}
            onChange={(v) => pp({ slug: slugify(v) })}
            aria="Permalink"
            meta={`everynth.org/launchpad/${p.slug || "…"} — the site lives here`}
          />

          <p className="lpf-sec">the brief</p>
          <Field
            label="--description"
            value={p.description}
            onChange={(v) => pp({ description: v.slice(0, 280) })}
            aria="Description and narrative"
            multiline
            meta={`${p.description.length}/280 · what it is, who it is for, why hold. The desk expands this into the story.`}
          />
          <div className="lpf-two-col">
            <Field label="--theme" value={p.theme} onChange={(v) => pp({ theme: v.slice(0, 60) })} aria="Theme" placeholder="e.g. night market, pixel art, calm office cat" meta="tone and imagery for the logo and banner" />
            <div className="lx-row lx-row-plain">
              <span className="lx-caret">›</span>
              <div>
                <div className="lx-label">--color <em>{p.color}</em></div>
                <div className="lpf-color">
                  <input type="color" value={p.color} onChange={(e) => pp({ color: e.target.value })} aria-label="Project colour" />
                  {SWATCHES.map((c) => <button key={c} type="button" className="swatch" style={{ background: c }} onClick={() => pp({ color: c })} aria-label={`Use ${c}`} />)}
                </div>
              </div>
            </div>
          </div>

          <p className="lpf-sec">site template</p>
          <div className="lpf-tpl">
            {TEMPLATES.map((t) => (
              <button key={t.id} type="button" aria-pressed={p.template === t.id} onClick={() => pp({ template: t.id as TemplateId })}>
                <SitePreview {...site} template={t.id} />
                <b>{t.name}</b>
                <small>{t.line}</small>
              </button>
            ))}
          </div>

          <p className="lpf-sec">links · all optional</p>
          <div className="lpf-two-col">
            <Field label="--app" value={p.website} onChange={(v) => pp({ website: v.trim().slice(0, 200) })} aria="App website" placeholder="https://" />
            <Field label="--utility-link" value={p.utilityUrl} onChange={(v) => pp({ utilityUrl: v.trim().slice(0, 200) })} aria="Utility link" placeholder="https:// — if it is already reachable" />
            <Field label="--x" value={p.x} onChange={(v) => pp({ x: v.replace(/^@/, "").trim().slice(0, 40) })} aria="X handle" placeholder="handle" />
            <Field label="--telegram" value={p.telegram} onChange={(v) => pp({ telegram: v.replace(/^@/, "").trim().slice(0, 40) })} aria="Telegram" placeholder="handle or group" />
            <Field label="--github" value={p.github} onChange={(v) => pp({ github: v.trim().slice(0, 40) })} aria="GitHub" placeholder="user or org" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({ label, value, onChange, aria, meta, placeholder, multiline }: {
  label: string; value: string; onChange: (v: string) => void; aria: string; meta?: string; placeholder?: string; multiline?: boolean;
}) {
  return (
    <div className={`lx-row${meta ? " lx-row-plain" : ""}`}>
      <span className="lx-caret">›</span>
      <div>
        <div className="lx-label">{label}</div>
        {multiline
          ? <textarea value={value} onChange={(e) => onChange(e.target.value)} className="lx-in" aria-label={aria} placeholder={placeholder} rows={3} />
          : <input value={value} onChange={(e) => onChange(e.target.value)} className="lx-in" aria-label={aria} placeholder={placeholder} />}
        {meta && <p className="lx-meta">{meta}</p>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- 3 mechanics

function StepMechanics({ draft, patch }: { draft: Draft; patch: Patch }) {
  const on = (id: string) => draft.stack.includes(id);
  const toggle = (id: string) => patch({ stack: on(id) ? draft.stack.filter((x) => x !== id) : [...draft.stack, id] });
  const move = (n: number, by: number) => {
    const j = n + by;
    if (j < 0 || j >= draft.stack.length) return;
    const copy = [...draft.stack];
    [copy[n], copy[j]] = [copy[j], copy[n]];
    patch({ stack: copy });
  };
  const flow = waterfall(draft.stack);
  const used = taken(draft.stack);

  return (
    <section className="lpf-pane">
      <h2 className="lpf-h">What the token does</h2>
      <p className="lpf-sub">
        Each mechanic takes its share of whatever fee is still unspent when it runs, so the order
        changes who gets what. The arithmetic below is real.
      </p>

      <div className="lpf-mech">
        <div>
          {FAMILIES.map((f) => (
            <div key={f} className="hk-family">
              <p className="hk-family-label">{f}</p>
              <div className="hk-grid">
                {HOOKS.filter((h) => h.family === f).map((h) => (
                  <button key={h.id} type="button" onClick={() => toggle(h.id)} aria-pressed={on(h.id)} className={`hk-chip${on(h.id) ? " is-on" : ""}`}>
                    <b>{on(h.id) ? "☑" : "☐"}</b>
                    <span>{h.name}</span>
                    <small>{h.take > 0 ? `${h.take}% of fees` : "no fee"}</small>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* The dev's own first buy, declared up front and signed with the rest, so it is a term
              everyone can read rather than a surprise in the first block. */}
          <div className="term" style={{ marginTop: 16 }}>
            <div className="term-bar"><span className="term-dots"><i /><i /><i /></span> dev buy</div>
            <div className="term-body">
              <Field
                label="--dev-buy"
                value={draft.devBuy}
                onChange={(v) => patch({ devBuy: v.replace(/[^\d.]/g, "").slice(0, 7) })}
                aria="Dev buy in SOL"
                meta={`SOL you buy with in the opening block, before anyone else · 0 to ${DEV_BUY_MAX} · shown on the launch page and signed with the terms`}
              />
            </div>
          </div>
        </div>

        <aside className="term lpf-stack">
          <div className="term-bar">the stack<span className="lx-bar-right">{draft.stack.length} hooks</span></div>
          <div className="term-body">
            {flow.length === 0 && <p className="lx-meta">Nothing selected. The token would just sit there.</p>}
            {flow.map((s, n) => (
              <div key={s.hook.id} className="lpf-wf">
                <span className="lpf-wf-n">{n + 1}</span>
                <span className="lpf-wf-main">
                  <b>{s.hook.name}</b>
                  <small>{s.hook.config}</small>
                </span>
                <span className="lpf-wf-got">{s.got > 0 ? `${s.got}%` : "—"}</span>
                <span className="lpf-wf-move">
                  <button type="button" onClick={() => move(n, -1)} aria-label={`Move ${s.hook.name} up`} disabled={n === 0}>↑</button>
                  <button type="button" onClick={() => move(n, 1)} aria-label={`Move ${s.hook.name} down`} disabled={n === flow.length - 1}>↓</button>
                </span>
              </div>
            ))}
            <p className={`lpf-ceiling${used > FEE_CEILING ? " is-over" : ""}`}>
              {used}% of the fee is spoken for · ceiling {FEE_CEILING}%
            </p>
            <p className="lx-meta">Creator fee {draft.project.fee}% on top, straight to your wallet. Dev buy {Number(draft.devBuy) || 0} SOL.</p>
          </div>
        </aside>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- 4 agents

function StepAgents({ draft }: { draft: Draft }) {
  const p = draft.project;
  const tpl = TEMPLATES.find((t) => t.id === p.template) ?? TEMPLATES[0];
  return (
    <section className="lpf-pane">
      <h2 className="lpf-h">The desk takes it from here</h2>
      <p className="lpf-sub">
        From your brief the desk draws the logo and banner, writes the full narrative, and fills the
        <b> {tpl.name}</b> template at your permalink. Nothing for you to do on this step but read the
        brief back; the work starts the moment you freeze.
      </p>

      <div className="lpf-agents">
        <div>
          <SitePreview
            size="lg" name={draft.name} ticker={draft.ticker} description={p.description} color={p.color} template={p.template}
            website={p.website} x={p.x} telegram={p.telegram} github={p.github} utility={draft.utility?.title}
          />
          <p className="lx-meta" style={{ marginTop: 8 }}>
            A sketch of the {tpl.name} shape in your colour. Every word and picture the desk makes replaces a placeholder here; what you typed stays.
          </p>
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          <ol className="lpf-jobs">
            {DELIVERABLES.map((d, n) => (
              <li key={d.id} className="lpf-job">
                <span className="lpf-job-n">{String(n + 1).padStart(2, "0")}</span>
                <span><b>{d.title}</b><small>{d.line}</small></span>
                <span className="pill pill-sm">queued</span>
              </li>
            ))}
          </ol>
          <dl className="lpf-brief">
            <dt>Brief</dt><dd>{p.description.trim() || "—"}</dd>
            <dt>Theme</dt><dd>{p.theme.trim() || "desk's call"}</dd>
            <dt>Colour</dt><dd><i className="dot" style={{ background: p.color }} />{p.color}</dd>
            <dt>Permalink</dt><dd>/launchpad/{p.slug || "…"}</dd>
          </dl>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- 5 launch

function StepLaunch({ draft }: { draft: Draft }) {
  const p = draft.project;
  const flow = waterfall(draft.stack);
  const links = [p.website && `app ${p.website}`, p.utilityUrl && `utility ${p.utilityUrl}`, p.x && `x @${p.x}`, p.telegram && `tg @${p.telegram}`, p.github && `gh ${p.github}`].filter(Boolean).join(" · ");
  const rows: [string, string][] = [
    ["Utility", draft.utility ? (draft.utility.id === "sample" ? "Sample utility (not a real holding)" : draft.utility.title) : "—"],
    ["Token", `${draft.name} · ${draft.ticker}`],
    ["Supply", `${pretty(draft.supply)}, fixed`],
    ["Creator fee", `${p.fee}% of every trade`],
    ["Mechanics", draft.stack.map((id) => hookById(id)?.name ?? id).join(", ") || "—"],
    ["Fee spoken for", `${taken(draft.stack)}% of ${FEE_CEILING}% ceiling`],
    ["Dev buy", `${Number(draft.devBuy) || 0} SOL in the opening block`],
    ["Holders unlock", draft.gate.unlocks || "—"],
    ["Balance needed", `${pretty(draft.gate.balance)} ${draft.ticker || "tokens"}`],
    ["Site", `/launchpad/${p.slug || "…"} · ${TEMPLATES.find((t) => t.id === p.template)?.name ?? ""} template · ${p.color}`],
    ["Links", links || "none yet"],
  ];

  return (
    <section className="lpf-pane">
      <h2 className="lpf-h">Launch</h2>
      <p className="lpf-sub">
        One signature covers exactly what is below. Change any of it afterwards and the signature
        stops matching, the same way a product launch works today.
      </p>

      <dl className="lpf-review">
        {rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
      </dl>

      {flow.length > 0 && (
        <div className="term lpf-order">
          <div className="term-bar">fee order</div>
          <div className="term-body">
            {flow.map((s, n) => (
              <p key={s.hook.id} className="lx-meta">
                {String(n + 1).padStart(2, "0")} · {s.hook.name} takes {s.got}% · {s.after}% left
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="panel lpf-note">
        <b>What signing does, and does not do.</b>
        <p>
          {draft.utility?.id === "sample"
            ? "This is the sample. It shows the shape of the terms; it cannot be signed, because there is no real holding behind it."
            : ready(draft)
              ? "Your signature freezes these terms under your wallet, publishes the launch page at the permalink, and hands the brief to the desk. Nothing is minted: the token program and the pool it launches into are still being built, and a frozen launch waits for them."
              : "Finish the earlier steps and the full terms will appear here."}
        </p>
      </div>
    </section>
  );
}
