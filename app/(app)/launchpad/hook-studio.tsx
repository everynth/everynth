"use client";

import { useState } from "react";

// A working preview of the launchpad that is deliberately wired to nothing. It exists to make one
// idea tangible before any of it is built: a token's behaviour is a stack of modules, and the
// order of that stack changes who gets what. The waterfall below is real arithmetic.

type Family = "Rewards" | "Trading" | "Access";
type Hook = {
  id: string;
  name: string;
  family: Family;
  /** Share of whatever fee is still unspent when this hook runs. 0 = takes nothing. */
  take: number;
  config: string;
  line: string;
};

const CATALOGUE: Hook[] = [
  { id: "holder", name: "Holder rewards", family: "Rewards", take: 30, config: "paid in SOL, daily", line: "Pays collected fees to holders, pro rata." },
  { id: "stock", name: "Stock rewards", family: "Rewards", take: 40, config: "→ tokenized NVDA", line: "Converts fees into an outside asset and hands it to holders." },
  { id: "lottery", name: "Lottery", family: "Rewards", take: 10, config: "one winner per day", line: "Pools fees and pays one holder per round, weighted by holding." },
  { id: "referral", name: "Referral rewards", family: "Rewards", take: 5, config: "5% to the referrer", line: "Credits the wallet that brought a buyer in." },
  { id: "loyalty", name: "Loyalty rewards", family: "Rewards", take: 10, config: "scales to 2× at 90 days", line: "Scales a holder's share by how long they have held." },
  { id: "revshare", name: "Revenue share", family: "Rewards", take: 15, config: "to the project wallet", line: "Routes a fixed share to named wallets." },

  { id: "buyback", name: "Buyback", family: "Trading", take: 40, config: "market buys, hourly", line: "Spends fees buying the token back off the market." },
  { id: "burn", name: "Auto burn", family: "Trading", take: 0, config: "burns what buyback bought", line: "Supply only ever goes down." },
  { id: "antisnipe", name: "Anti-snipe", family: "Trading", take: 0, config: "first 10 min, 0.5% cap", line: "Caps size and rate of buys in the opening window." },
  { id: "dynfee", name: "Dynamic fee", family: "Trading", take: 0, config: "2–6% by volatility", line: "Moves the fee with conditions, inside bounds set at launch." },
  { id: "lp", name: "LP rewards", family: "Trading", take: 20, config: "to liquidity providers", line: "Pays a share to the wallets providing liquidity." },

  { id: "access", name: "Access rules", family: "Access", take: 0, config: "hold 10,000 to unlock", line: "Gates the utility behind a balance." },
  { id: "transfer", name: "Transfer rules", family: "Access", take: 0, config: "deny list, 24h lockup", line: "Allow and deny lists, lockups, per-wallet caps." },
  { id: "privacy", name: "Privacy rules", family: "Access", take: 0, config: "opt-in attestation", line: "Jurisdiction or attestation requirements, never a default." },
];

const FAMILIES: Family[] = ["Rewards", "Trading", "Access"];
const FEE_CEILING = 80; // the protocol's cap on what a whole stack may take

export function HookStudio() {
  const [name, setName] = useState("GIGA");
  const [ticker, setTicker] = useState("GIGA");
  const [supply, setSupply] = useState("1000000000");
  const [stack, setStack] = useState<string[]>(["antisnipe", "stock", "buyback", "burn"]);

  const byId = (id: string) => CATALOGUE.find((h) => h.id === id)!;
  const inStack = (id: string) => stack.includes(id);

  const toggle = (id: string) => setStack((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const move = (i: number, by: number) =>
    setStack((s) => {
      const j = i + by;
      if (j < 0 || j >= s.length) return s;
      const copy = [...s];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  // 100 units of fee enter the stack. Each hook takes its share of what is still unspent, so
  // moving a hook up the list really does change what it receives. Folded rather than accumulated
  // in a loop variable: nothing outside this expression is touched while rendering.
  const round1 = (n: number) => Math.round(n * 10) / 10;
  const waterfall = stack.reduce<{ hook: Hook; got: number; after: number }[]>((steps, id) => {
    const hook = byId(id);
    const remaining = steps.at(-1)?.after ?? 100;
    const got = round1((remaining * hook.take) / 100);
    return [...steps, { hook, got, after: round1(remaining - got) }];
  }, []);
  const left = waterfall.at(-1)?.after ?? 100;
  const taken = round1(100 - left);
  const overCeiling = taken > FEE_CEILING;

  const pretty = (n: string) => {
    const v = Number(n.replace(/\D/g, ""));
    return Number.isFinite(v) && v > 0 ? v.toLocaleString("en-US") : "—";
  };

  return (
    <div className="hk">
      {/* ── the token ── */}
      <section className="term hk-form">
        <div className="term-bar"><span className="term-dots"><i /><i /><i /></span> create token</div>
        <div className="term-body">
          <p className="lx-cmd"><span>$</span> everynth launchpad --new</p>

          <div className="lx-row">
            <span className="lx-caret">›</span>
            <div>
              <div className="lx-label">--name</div>
              <input value={name} onChange={(e) => setName(e.target.value.slice(0, 24))} className="lx-in" aria-label="Token name" />
            </div>
          </div>
          <div className="lx-row">
            <span className="lx-caret">›</span>
            <div>
              <div className="lx-label">--ticker</div>
              <input value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase().slice(0, 10))} className="lx-in" aria-label="Ticker" />
            </div>
          </div>
          <div className="lx-row lx-row-plain">
            <span className="lx-caret">›</span>
            <div>
              <div className="lx-label">--supply</div>
              <input value={supply} onChange={(e) => setSupply(e.target.value.slice(0, 18))} inputMode="numeric" className="lx-in" aria-label="Supply" />
              <p className="lx-meta">{pretty(supply)} tokens, fixed at launch. No hook can mint.</p>
            </div>
          </div>

          <p className="lx-cmd lx-cmd-2"><span>$</span> everynth launchpad --mechanics</p>
          {FAMILIES.map((f) => (
            <div key={f} className="hk-family">
              <p className="hk-family-label">{f}</p>
              <div className="hk-grid">
                {CATALOGUE.filter((h) => h.family === f).map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => toggle(h.id)}
                    aria-pressed={inStack(h.id)}
                    className={`hk-chip${inStack(h.id) ? " is-on" : ""}`}
                  >
                    <b>{inStack(h.id) ? "☑" : "☐"}</b>
                    <span>{h.name}</span>
                    <small>{h.take > 0 ? `${h.take}% of fees` : "no fee"}</small>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── the stack and what it does ── */}
      <aside className="hk-side">
        <section className="term">
          <div className="term-bar">the stack<span className="lx-bar-right">{stack.length} hooks</span></div>
          {stack.length === 0 ? (
            <p className="hk-empty">Nothing picked. A token with no hooks is just a token.</p>
          ) : (
            <ol className="hk-stack">
              {stack.map((id, i) => {
                const h = byId(id);
                return (
                  <li key={id} className="hk-item">
                    <span className="hk-item-n">{String(i + 1).padStart(2, "0")}</span>
                    <span className="hk-item-main">
                      <b>{h.name}</b>
                      <small>{h.config}</small>
                    </span>
                    <span className="hk-item-tools">
                      <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${h.name} up`}>↑</button>
                      <button type="button" onClick={() => move(i, 1)} disabled={i === stack.length - 1} aria-label={`Move ${h.name} down`}>↓</button>
                      <button type="button" onClick={() => toggle(id)} aria-label={`Remove ${h.name}`}>✕</button>
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        <section className="term">
          <div className="term-bar">
            where 100 units of fee go
            <span className={`lx-bar-right ${overCeiling ? "is-run" : "is-ready"}`}>{taken}% taken</span>
          </div>
          <div className="hk-flow">
            {waterfall.filter((w) => w.got > 0).length === 0 && <p className="hk-empty">No hook in this stack takes a fee.</p>}
            {waterfall.map(
              (w) =>
                w.got > 0 && (
                  <p key={w.hook.id} className="hk-flow-row">
                    <span>{w.hook.name}</span>
                    <b>{w.got}</b>
                    <small>{w.after} left</small>
                  </p>
                ),
            )}
            <p className="hk-flow-row is-rest">
              <span>stays in the pool</span>
              <b>{left}</b>
              <small />
            </p>
          </div>
          <p className="hk-note">
            Each hook takes its share of what the one before it left, so moving a hook up the list
            changes what it receives. {overCeiling && <strong>Over the {FEE_CEILING}% ceiling — the protocol would refuse this stack.</strong>}
          </p>
        </section>

        <section className="term">
          <div className="term-bar">what a buyer would read</div>
          <div className="hk-summary">
            <p className="hk-summary-h">${ticker || "TOKEN"} · {pretty(supply)} supply</p>
            {stack.length === 0 ? (
              <p className="hk-empty">Nothing yet.</p>
            ) : (
              <ul className="checks">
                {stack.map((id) => (
                  <li key={id}>{byId(id).line}</li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <div className="hk-launch">
          <button type="button" className="btn" disabled>Launch — not shipped</button>
          <span className="lx-hint">
            This screen is a preview. Nothing here deploys, and no token exists.
          </span>
        </div>
      </aside>
    </div>
  );
}
