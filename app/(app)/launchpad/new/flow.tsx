"use client";

import { useState } from "react";
import Link from "next/link";
import {
  blockedBy, EMPTY, FAMILIES, FEE_CEILING, HOOKS, hookById, MAX_SUPPLY, MIN_SUPPLY,
  problemWith, ready, STEPS, taken, waterfall,
  type Draft, type StepId,
} from "@/lib/launchpad";

export type Owned = { id: string; title: string; kind: string; source: "launched" | "bought" };

/** Lets a visitor see what the later steps ask for before they own anything. Labelled everywhere
 *  it appears, so it can never be mistaken for a real holding. */
const SAMPLE: Owned = { id: "sample", title: "Sample utility", kind: "file", source: "bought" };

const pretty = (s: string) => {
  const v = Number(s.replace(/\D/g, ""));
  return Number.isFinite(v) && v > 0 ? v.toLocaleString("en-US") : "—";
};

/**
 * The launch flow. One Draft walks through five steps; lib/launchpad decides what counts as
 * finished, so the rail, the Next button and the review screen can never disagree.
 *
 * Nothing here writes anywhere. The token program does not exist yet, so the last step shows the
 * exact terms that would be frozen and stops there, rather than pretending to mint.
 */
export function Flow({ owned }: { owned: Owned[] }) {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [at, setAt] = useState<StepId>("utility");

  const patch = (p: Partial<Draft>) => setDraft((d) => ({ ...d, ...p }));
  const i = STEPS.findIndex((s) => s.id === at);
  const problem = problemWith(at, draft);

  const go = (id: StepId) => {
    const gap = blockedBy(id, draft);
    setAt(gap ?? id);
  };

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
        {at === "token" && <StepToken draft={draft} patch={patch} />}
        {at === "mechanics" && <StepMechanics draft={draft} patch={patch} />}
        {at === "access" && <StepAccess draft={draft} patch={patch} />}
        {at === "review" && <StepReview draft={draft} />}

        <footer className="lpf-foot">
          <button type="button" className="btn-ghost" onClick={() => setAt(STEPS[Math.max(0, i - 1)].id)} disabled={i === 0}>
            ← Back
          </button>
          <span className="lpf-why">{problem ?? (at === "review" ? "" : "Ready.")}</span>
          {at === "review" ? (
            <button type="button" className="btn" disabled title="The token program is not built yet">
              Freeze and sign
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

function StepUtility({ draft, patch, owned }: { draft: Draft; patch: (p: Partial<Draft>) => void; owned: Owned[] }) {
  // Picking a utility also seeds what holders unlock, since that is almost always the same thing.
  // Both the real list and the sample go through here so they cannot drift apart.
  const choose = (o: Owned) => patch({ utility: o, gate: { ...draft.gate, unlocks: draft.gate.unlocks || o.title } });

  return (
    <section className="lpf-pane">
      <h2 className="lpf-h">What is this token for?</h2>
      <p className="lpf-sub">
        A token with nothing behind it is a promise. Pick something that already works: a product you
        listed here, or one you bought from a desk. Ownership is proved the way everything here is —
        the wallet that paid, checked against the chain.
      </p>

      {owned.length === 0 ? (
        <div className="panel lpf-empty">
          <p>Nothing of yours is on this market yet.</p>
          <p className="lpf-sub">
            Buy a utility from one of the desks and it appears here. You can also walk the rest of
            the flow with a sample, to see what it asks for before you own anything.
          </p>
          <div className="dash-sec-actions">
            <Link href="/" className="btn">Browse the market</Link>
            <button type="button" className="btn-ghost" onClick={() => choose(SAMPLE)}>
              Walk it with a sample
            </button>
          </div>
        </div>
      ) : (
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
      )}
    </section>
  );
}

// ---------------------------------------------------------------- 2 token

function StepToken({ draft, patch }: { draft: Draft; patch: (p: Partial<Draft>) => void }) {
  return (
    <section className="lpf-pane">
      <h2 className="lpf-h">The token</h2>
      <p className="lpf-sub">Supply is fixed at launch. No hook in the catalogue can mint more of it.</p>

      <div className="term">
        <div className="term-bar"><span className="term-dots"><i /><i /><i /></span> create token</div>
        <div className="term-body">
          <p className="lx-cmd"><span>$</span> everynth launchpad --new</p>
          <Field label="--name" value={draft.name} onChange={(v) => patch({ name: v.slice(0, 24) })} aria="Token name" />
          <Field label="--ticker" value={draft.ticker} onChange={(v) => patch({ ticker: v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10) })} aria="Ticker" />
          <Field
            label="--supply"
            value={draft.supply}
            onChange={(v) => patch({ supply: v.replace(/\D/g, "").slice(0, 15) })}
            aria="Supply"
            meta={`${pretty(draft.supply)} tokens · between ${MIN_SUPPLY.toLocaleString("en-US")} and ${MAX_SUPPLY.toLocaleString("en-US")}`}
          />
        </div>
      </div>
    </section>
  );
}

function Field({ label, value, onChange, aria, meta }: { label: string; value: string; onChange: (v: string) => void; aria: string; meta?: string }) {
  return (
    <div className={`lx-row${meta ? " lx-row-plain" : ""}`}>
      <span className="lx-caret">›</span>
      <div>
        <div className="lx-label">{label}</div>
        <input value={value} onChange={(e) => onChange(e.target.value)} className="lx-in" aria-label={aria} />
        {meta && <p className="lx-meta">{meta}</p>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- 3 mechanics

function StepMechanics({ draft, patch }: { draft: Draft; patch: (p: Partial<Draft>) => void }) {
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
          </div>
        </aside>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- 4 access

function StepAccess({ draft, patch }: { draft: Draft; patch: (p: Partial<Draft>) => void }) {
  const held = Number(draft.gate.balance.replace(/\D/g, "")) || 0;
  const supply = Number(draft.supply.replace(/\D/g, "")) || 0;
  const share = supply > 0 ? (held / supply) * 100 : 0;

  return (
    <section className="lpf-pane">
      <h2 className="lpf-h">What holders unlock</h2>
      <p className="lpf-sub">
        A balance, and what it opens. This is the reason to hold rather than to flip, so it should be
        worth more than the fee a seller would pay to leave.
      </p>

      <div className="term">
        <div className="term-bar"><span className="term-dots"><i /><i /><i /></span> access</div>
        <div className="term-body">
          <Field
            label="--hold"
            value={draft.gate.balance}
            onChange={(v) => patch({ gate: { ...draft.gate, balance: v.replace(/\D/g, "").slice(0, 15) } })}
            aria="Balance required"
            meta={`${pretty(draft.gate.balance)} ${draft.ticker || "tokens"} · ${share.toFixed(share < 1 ? 3 : 1)}% of supply`}
          />
          <Field
            label="--unlocks"
            value={draft.gate.unlocks}
            onChange={(v) => patch({ gate: { ...draft.gate, unlocks: v.slice(0, 80) } })}
            aria="What it unlocks"
            meta={draft.utility ? `Backed by "${draft.utility.title}"` : "Pick a utility in step 1 first."}
          />
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- 5 review

function StepReview({ draft }: { draft: Draft }) {
  const flow = waterfall(draft.stack);
  const rows: [string, string][] = [
    ["Utility", draft.utility ? (draft.utility.id === "sample" ? "Sample utility (not a real holding)" : draft.utility.title) : "—"],
    ["Token", `${draft.name} · ${draft.ticker}`],
    ["Supply", `${pretty(draft.supply)}, fixed`],
    ["Mechanics", draft.stack.map((id) => hookById(id)?.name ?? id).join(", ") || "—"],
    ["Fee spoken for", `${taken(draft.stack)}% of ${FEE_CEILING}% ceiling`],
    ["Holders unlock", draft.gate.unlocks || "—"],
    ["Balance needed", `${pretty(draft.gate.balance)} ${draft.ticker || "tokens"}`],
  ];

  return (
    <section className="lpf-pane">
      <h2 className="lpf-h">Freeze these terms</h2>
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
        <b>Not live yet.</b>
        <p>
          {ready(draft)
            ? "These terms are complete. Nothing is minted: the token program and the pool it launches into are still being built, and this screen will sign and submit once they exist."
            : "Finish the earlier steps and the full terms will appear here."}
        </p>
      </div>
    </section>
  );
}
