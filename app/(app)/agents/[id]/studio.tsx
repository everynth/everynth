"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AgentFigure } from "@/components/agent-figure";
import { Monitor } from "@/components/monitor";
import { MONITORS, MSG_MAX, type PublicAgent } from "@/lib/studio";
import type { Holding, Session } from "@/lib/studio-run";

type Props = {
  agent: PublicAgent; agents: PublicAgent[]; signedIn: boolean; gate: Holding | null; needed: number;
  opened: number; perDay: number; turnsMax: number; sessions: Session[]; buyUrl: string | null; draft: string;
};

/** The room: pick or open a session on the left, talk, and watch the answer land on the monitor. */
export function Studio(p: Props) {
  const { agent, agents } = p;
  const [sessions, setSessions] = useState(p.sessions);
  const [activeId, setActiveId] = useState<string | null>(p.sessions[0]?.id ?? null);
  const [opened, setOpened] = useState(p.opened);
  const [draft, setDraft] = useState(p.draft);
  const [image, setImage] = useState<{ name: string; dataUrl: string } | null>(null); // a picture for the next turn only
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [redirect, setRedirect] = useState<{ to: string; asked: string } | null>(null);
  const [shown, setShown] = useState<number | null>(null); // index into the active session's messages
  const thread = useRef<HTMLDivElement>(null);

  const active = sessions.find((s) => s.id === activeId) ?? null;
  const unlocked = !!p.gate?.unlocked;
  const left = Math.max(0, p.perDay - opened);
  const full = !!active && active.turns >= p.turnsMax;
  const n = (v: number) => v.toLocaleString("en-US", { maximumFractionDigits: 0 });

  // The monitor follows the latest answer unless an earlier one was clicked.
  const lastAgent = active ? active.messages.map((m, i) => (m.role === "assistant" ? i : -1)).filter((i) => i >= 0).pop() ?? null : null;
  const shownIdx = shown !== null && active?.messages[shown] ? shown : lastAgent;
  const shownText = shownIdx !== null && active ? active.messages[shownIdx].content : null;

  useEffect(() => { thread.current?.scrollTo({ top: thread.current.scrollHeight }); }, [active?.messages.length, activeId]);

  async function send() {
    const message = draft.trim();
    if (!message) return;
    setBusy(true);
    setError("");
    setRedirect(null);
    try {
      const res = await fetch(active ? `/api/agents/sessions/${active.id}` : "/api/agents/sessions", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...(active ? {} : { agent: agent.id }), message, ...(image ? { image: image.dataUrl } : {}) }),
      });
      const data = (await res.json()) as { session?: Session; redirect?: string | null; error?: string };
      if (!res.ok || !data.session) throw new Error(data.error ?? `error ${res.status}`);
      const s = data.session;
      setSessions((list) => (list.some((x) => x.id === s.id) ? list.map((x) => (x.id === s.id ? s : x)) : [s, ...list]));
      if (!active) setOpened((o) => o + 1);
      setActiveId(s.id);
      setShown(null);
      setDraft("");
      setImage(null);
      if (data.redirect) setRedirect({ to: data.redirect, asked: message });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  // The picture goes along as a data URL; the server checks type and size again.
  function attach(file: File | undefined) {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { setError("Keep the image under 4 MB."); return; }
    const r = new FileReader();
    r.onload = () => { setImage({ name: file.name, dataUrl: String(r.result) }); setError(""); };
    r.readAsDataURL(file);
  }

  const to = redirect ? agents.find((a) => a.id === redirect.to) : null;
  const title = (s: Session) => (s.messages[0]?.content ?? "").slice(0, 32) + ((s.messages[0]?.content.length ?? 0) > 32 ? "…" : "");

  return (
    <div className="ws" data-domain={agent.domain}>
      <section className="ws-prompt">
        <header className="ws-head">
          <AgentFigure agent={agent} size={64} label={`${agent.name}, ${agent.role.toLowerCase()}`} />
          <div>
            <p className="kicker">{agent.role} · {agent.machine}</p>
            <h1 className="chrome ws-name">{agent.name} <span className="agent-badge" data-domain={agent.domain} style={{ verticalAlign: "middle" }}>{agent.domain}</span></h1>
            <p className="ws-line">{agent.line}</p>
          </div>
        </header>

        {unlocked ? (
          <>
            <div className="ws-sessions" role="tablist" aria-label="Sessions">
              <button type="button" role="tab" aria-selected={!active} className={`ws-chip${!active ? " is-on" : ""}`} onClick={() => { setActiveId(null); setShown(null); setRedirect(null); }} disabled={left === 0 && !active}>
                + New session <small>{left} of {p.perDay} left today</small>
              </button>
              {sessions.map((s, i) => (
                <button key={s.id} type="button" role="tab" aria-selected={s.id === activeId} className={`ws-chip${s.id === activeId ? " is-on" : ""}`} onClick={() => { setActiveId(s.id); setShown(null); setRedirect(null); }}>
                  #{sessions.length - i} {title(s)} <small>{s.turns}/{p.turnsMax}</small>
                </button>
              ))}
            </div>

            <div className="ws-thread" ref={thread}>
              {!active && (
                <p className="ws-hint">
                  New session with {agent.name}. It works on: {agent.skills.join(" · ")}. {left === 0 ? `You have opened ${p.perDay} sessions in the last 24 hours; the next frees up as the oldest expires.` : `${p.turnsMax} turns per session.`}
                </p>
              )}
              {active?.messages.map((m, i) => (
                <div
                  key={i}
                  className={`ws-msg ${m.role === "user" ? "is-user" : "is-agent"}${i === shownIdx ? " is-shown" : ""}`}
                  onClick={m.role === "assistant" ? () => setShown(i) : undefined}
                  role={m.role === "assistant" ? "button" : undefined}
                  title={m.role === "assistant" ? "Show on the monitor" : undefined}
                >
                  {m.image && <span title="A picture went with this message">📎 </span>}
                  {m.role === "user" ? m.content : m.content.slice(0, 220) + (m.content.length > 220 ? " …" : "")}
                </div>
              ))}
              {busy && <div className="ws-msg is-agent is-busy">{agent.name} is working…</div>}
            </div>

            {to && redirect && (
              <div className="ws-redirect">
                <span><b>{agent.name}</b> says this one is <b>{to.name}</b>&apos;s job.</span>
                <Link href={`/agents/${to.id}?q=${encodeURIComponent(redirect.asked)}`} className="btn">Open {to.name} →</Link>
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); void send(); }} className="ws-form">
              <textarea
                className="field" rows={4} value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={MSG_MAX}
                placeholder={active ? `Follow up with ${agent.name}…` : agent.placeholder}
                disabled={busy || full || (!active && left === 0)} required
                onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); void send(); } }}
              />
              {image && (
                <div className="ws-attach">
                  {/* eslint-disable-next-line @next/next/no-img-element -- a local file preview */}
                  <img src={image.dataUrl} alt="" />
                  <span>{image.name}</span>
                  <button type="button" onClick={() => setImage(null)} aria-label="Remove the image">×</button>
                </div>
              )}
              <div className="ws-form-foot">
                <small>{full ? `session full — ${p.turnsMax} turns used` : `${draft.length} / ${MSG_MAX} · ⌘↵ to send`}</small>
                <span style={{ display: "flex", gap: 8 }}>
                  <label className="btn-ghost" style={{ cursor: busy || full ? "not-allowed" : "pointer" }} title="Attach a picture for this turn (PNG, JPEG, WebP or GIF, under 4 MB)">
                    📎 Image
                    <input type="file" hidden accept="image/png,image/jpeg,image/webp,image/gif" disabled={busy || full} onChange={(e) => { attach(e.target.files?.[0]); e.target.value = ""; }} />
                  </label>
                  <button type="submit" className="btn" disabled={busy || full || !draft.trim() || (!active && left === 0)}>{busy ? "Working…" : active ? "Send" : `Start with ${agent.name}`}</button>
                </span>
              </div>
              {busy && <p className="ws-wait">A long answer can take a minute or two. Keep this tab open.</p>}
              {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
            </form>
          </>
        ) : (
          <div className="studio-lock">
            <b>{p.signedIn ? `Hold at least ${n(p.needed)} EVYN to talk to ${agent.name}.` : "Sign in with a wallet that holds EVYN."}</b>
            <p>
              {!p.signedIn
                ? `Connect at the top right. The studio opens for wallets holding ${n(p.needed)} EVYN or more.`
                : p.gate?.configured
                  ? `This wallet holds ${n(p.gate.held)} EVYN. Top up, then reload — the balance is read from the chain each time.`
                  : "EVYN pairing is not configured on this deployment yet."}
            </p>
            {p.buyUrl && <a href={p.buyUrl} target="_blank" rel="noreferrer noopener" className="btn">Get EVYN on pump.fun ↗</a>}
          </div>
        )}
        <Link href="/agents" className="btn-ghost ws-back">← All agents</Link>
      </section>

      <Monitor
        theme={agent.id}
        text={shownText}
        title={active ? `${agent.name} · session ${sessions.length - sessions.findIndex((s) => s.id === active.id)}` : `${agent.name} · ${MONITORS[agent.id]?.look ?? "monitor"}`}
        empty={
          <>
            <AgentFigure agent={agent} size={110} label="" />
            <p><b>{agent.name}</b>&apos;s {MONITORS[agent.id]?.look ?? "monitor"}.</p>
            <ul>{agent.skills.map((s) => <li key={s}>{s}</li>)}</ul>
            <small>{MONITORS[agent.id]?.blurb ?? "Tables, charts, links, image prompts — rendered, with a raw tab and a copy button."}</small>
          </>
        }
      />
    </div>
  );
}
