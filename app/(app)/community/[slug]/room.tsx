"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Message } from "@/lib/community";

type Props = {
  id: string; ticker: string; launcher: string; open: boolean; initial: Message[]; pinned: Message | null;
  me: { wallet: string; role: "dev" | "holder" | null; held: number } | null; max: number; tradeHref: string;
};

const short = (w: string) => `${w.slice(0, 4)}…${w.slice(-4)}`;
const amount = (base: string) => {
  const v = Number(base) / 1e6;
  return v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(1)}K` : v.toFixed(0);
};
// Postgres prints "2026-10-23 10:00:00.1+00"; Date wants "T" and a "+00:00" offset.
const time = (iso: string) => new Date(iso.replace(" ", "T").replace(/([+-]\d\d)$/, "$1:00")).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC" }) + " UTC"; // same text on server and browser

/** The conversation, refreshed every few seconds, and the box to write in for those who may. */
export function Room(p: Props) {
  const [list, setList] = useState(p.initial);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [replyTo, setReplyTo] = useState<Message | null>(null); // the message the next one answers
  const canWrite = p.open && !!p.me?.role;
  const [pinned, setPinned] = useState(p.pinned);
  const isLauncher = p.me?.wallet === p.launcher;
  async function setPin(m: Message | null) {
    setError("");
    const r = await fetch(`/api/launches/${p.id}/chat/pin`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: m?.id ?? null }) });
    const j = (await r.json().catch(() => ({}))) as { pinned?: Message | null; error?: string };
    if (!r.ok) { setError(j.error ?? `error ${r.status}`); return; }
    setPinned(j.pinned ?? null);
  }
  const box = useRef<HTMLDivElement>(null);
  const area = useRef<HTMLTextAreaElement>(null);
  const author = (m: Message) => (m.wallet === p.me?.wallet ? "you" : m.role === "dev" ? "the launcher" : short(m.wallet));
  const snippet = (s: string) => (s.length > 90 ? `${s.slice(0, 90)}…` : s);
  const last = list.at(-1)?.id;

  // Poll for newer messages; cheap, and a room this size does not need a socket.
  useEffect(() => {
    if (!p.open) return;
    const t = setInterval(() => {
      fetch(`/api/launches/${p.id}/chat${last ? `?after=${last}` : ""}`)
        .then((r) => r.json())
        .then((j: { messages?: Message[] }) => { if (j.messages?.length) setList((l) => [...l, ...j.messages!.filter((m) => !l.some((x) => x.id === m.id))]); })
        .catch(() => { /* next tick */ });
    }, 5000);
    return () => clearInterval(t);
  }, [p.id, p.open, last]);

  useEffect(() => { box.current?.scrollTo({ top: box.current.scrollHeight }); }, [list.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setBusy(true);
    setError("");
    try {
      const r = await fetch(`/api/launches/${p.id}/chat`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ body, replyTo: replyTo?.id ?? null }) });
      const j = (await r.json()) as { message?: Message; error?: string };
      if (!r.ok || !j.message) throw new Error(j.error ?? `error ${r.status}`);
      setList((l) => [...l, j.message!]);
      setDraft("");
      setReplyTo(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="chat rise rise-2">
      {pinned && (
        <a className="chat-pinned" href={`#m${pinned.id}`}>
          <span className="chat-pin-k">📌 Pinned by the launcher</span>
          <span className="chat-pin-body">{pinned.body}</span>
          {isLauncher && <button type="button" onClick={(e) => { e.preventDefault(); void setPin(null); }}>Unpin</button>}
        </a>
      )}
      <div className="chat-log" ref={box}>
        {!p.open && <p className="chat-empty">The room opens the moment ${p.ticker} is on the curve.</p>}
        {p.open && list.length === 0 && <p className="chat-empty">Nobody has written yet. Holders of ${p.ticker} can start the conversation.</p>}
        {list.map((m) => {
          const mine = m.wallet === p.me?.wallet;
          const quoted = m.reply_to ? list.find((x) => x.id === m.reply_to) : null;
          return (
            <div key={m.id} id={`m${m.id}`} className={`chat-msg${mine ? " is-mine" : ""}`}>
              <header>
                <b>{mine ? "you" : short(m.wallet)}</b>
                {m.role === "dev" ? <span className="chat-tag is-dev">launcher</span> : <span className="chat-tag">holds {amount(m.held)} ${p.ticker}</span>}
                <time>{time(m.created_at)}</time>
              </header>
              {m.reply_to && (
                <a className="chat-quote" href={`#m${m.reply_to}`}>
                  {quoted ? <><b>↪ {author(quoted)}</b> {snippet(quoted.body)}</> : <b>↪ an earlier message</b>}
                </a>
              )}
              <p>{m.body}</p>
              {canWrite && <button type="button" className="chat-reply" onClick={() => { setReplyTo(m); area.current?.focus(); }}>Reply</button>}
              {isLauncher && pinned?.id !== m.id && <button type="button" className="chat-reply" style={{ marginLeft: 6 }} onClick={() => void setPin(m)}>📌 Pin</button>}
            </div>
          );
        })}
      </div>

      {canWrite ? (
        <form onSubmit={send} className="chat-form">
          {replyTo && (
            <div className="chat-replying">
              <span><b>Replying to {author(replyTo)}</b> · {snippet(replyTo.body)}</span>
              <button type="button" onClick={() => setReplyTo(null)} aria-label="Cancel the reply">×</button>
            </div>
          )}
          <textarea ref={area} className="field" rows={2} value={draft} maxLength={p.max} disabled={busy} placeholder={`Say something to the $${p.ticker} holders…`}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(e); } }} />
          <div className="chat-foot">
            <small>{p.me?.role === "dev" ? "You launched this coin" : `You hold ${p.me!.held.toLocaleString("en-US", { maximumFractionDigits: 0 })} $${p.ticker}`} · {draft.length}/{p.max} · ↵ to send</small>
            <button className="btn" disabled={busy || !draft.trim()}>{busy ? "Sending…" : "Send"}</button>
          </div>
          {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
        </form>
      ) : p.open ? (
        <div className="chat-lock">
          <b>{p.me ? `This wallet holds no $${p.ticker}.` : "Sign in to write."}</b>
          <span>{p.me ? "Reading is open to everyone; writing takes any amount of the coin, checked on the chain with every message." : "Connect a wallet at the top right. Holders of the coin can write; everyone can read."}</span>
          {p.me && <Link href={p.tradeHref} className="btn">Buy ${p.ticker}</Link>}
        </div>
      ) : null}
    </section>
  );
}
