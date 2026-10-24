"use client";

import { useState, type ReactNode } from "react";
import { CopyButton } from "./copy-button";

// The studio's monitor: an agent's answer rendered as something to look at rather than scroll —
// headings, lists, tables, links, images, a ```chart block as a chart, a ```prompt block as a
// card to copy. A pocket markdown reader: enough for what the agents write, nothing more.
// ponytail: no markdown library; nested lists and inline HTML are not handled, add a parser if
// an agent ever needs them.

type Block =
  | { t: "h"; n: number; s: string }
  | { t: "p"; s: string }
  | { t: "list"; items: string[]; ordered: boolean }
  | { t: "code"; lang: string; s: string }
  | { t: "table"; rows: string[][] }
  | { t: "hr" };

const LI = /^\s*([-*•]|\d+[.)])\s+/;
const STARTS = /^(#{1,4}\s|```|\s*\||\s*([-*•]|\d+[.)])\s)/;

export function parseBlocks(src: string): Block[] {
  const lines = src.replace(/\r/g, "").split("\n");
  const out: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (l.startsWith("```")) {
      const lang = l.slice(3).trim().toLowerCase();
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) buf.push(lines[i++]);
      i++;
      out.push({ t: "code", lang, s: buf.join("\n") });
      continue;
    }
    const h = /^(#{1,4})\s+(.*)$/.exec(l);
    if (h) { out.push({ t: "h", n: h[1].length, s: h[2] }); i++; continue; }
    if (/^\s*([-*_]){3,}\s*$/.test(l)) { out.push({ t: "hr" }); i++; continue; }
    if (/^\s*\|/.test(l)) {
      const rows: string[][] = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) {
        const r = lines[i].trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
        if (!r.every((c) => /^:?-{2,}:?$/.test(c))) rows.push(r);
        i++;
      }
      out.push({ t: "table", rows });
      continue;
    }
    const li = LI.exec(l);
    if (li) {
      const items: string[] = [];
      const ordered = /\d/.test(li[1]);
      while (i < lines.length && LI.test(lines[i])) items.push(lines[i++].replace(LI, ""));
      out.push({ t: "list", items, ordered });
      continue;
    }
    if (!l.trim()) { i++; continue; }
    const buf = [l];
    i++;
    while (i < lines.length && lines[i].trim() && !STARTS.test(lines[i])) buf.push(lines[i++]);
    out.push({ t: "p", s: buf.join("\n") });
  }
  return out;
}

const INLINE = () => /(!\[[^\]]*\]\([^)]+\))|(\[[^\]]+\]\([^)]+\))|(\*\*[^*]+\*\*)|(`[^`]+`)|(https?:\/\/[^\s)\]]+)|(#[0-9a-fA-F]{6}\b)/g;

function Inline({ s }: { s: string }) {
  const parts: ReactNode[] = [];
  const re = INLINE();
  let last = 0, k = 0, m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    if (m.index > last) parts.push(s.slice(last, m.index));
    const x = m[0];
    if (m[1]) {
      const [, alt, url] = /!\[([^\]]*)\]\(([^)]+)\)/.exec(x)!;
      // eslint-disable-next-line @next/next/no-img-element -- an agent's link, any host
      parts.push(<img key={k++} src={url} alt={alt} />);
    } else if (m[2]) {
      const [, t, url] = /\[([^\]]+)\]\(([^)]+)\)/.exec(x)!;
      parts.push(<a key={k++} href={url} target="_blank" rel="noreferrer noopener">{t}</a>);
    } else if (m[3]) parts.push(<b key={k++}>{x.slice(2, -2)}</b>);
    else if (m[4]) {
      const hex = /^#[0-9a-fA-F]{6}$/.test(x.slice(1, -1)) ? x.slice(1, -1) : null; // a colour in backticks gets its swatch
      parts.push(<code key={k++}>{hex && <i className="md-sw" style={{ background: hex }} />}{x.slice(1, -1)}</code>);
    } else if (m[6]) parts.push(<code key={k++} className="md-hex"><i className="md-sw" style={{ background: x }} />{x}</code>);
    else parts.push(<a key={k++} href={x} target="_blank" rel="noreferrer noopener">{x}</a>);
    last = m.index + x.length;
  }
  if (last < s.length) parts.push(s.slice(last));
  return <>{parts}</>;
}

type ChartSpec = { type?: string; title?: string; unit?: string; labels: string[]; values?: number[]; series?: { name: string; values: number[] }[] };

/** A bar or line chart from the JSON inside a ```chart block. Anything malformed falls back to text. */
function Chart({ src }: { src: string }) {
  let spec: ChartSpec;
  try { spec = JSON.parse(src); } catch { return <pre>{src}</pre>; }
  const series = spec.series?.length ? spec.series : spec.values ? [{ name: spec.title ?? "", values: spec.values }] : [];
  if (!Array.isArray(spec.labels) || !series.length) return <pre>{src}</pre>;
  const W = 480, H = 220, padL = 44, padB = 34, padT = 18, padR = 12;
  const max = Math.max(1, ...series.flatMap((s) => s.values.map((v) => Number(v) || 0)));
  const n = spec.labels.length;
  const x = (i: number) => padL + ((W - padL - padR) * (i + 0.5)) / n;
  const y = (v: number) => padT + (H - padT - padB) * (1 - v / max);
  const line = spec.type === "line";
  const bw = Math.max(4, ((W - padL - padR) / n) * 0.6 / series.length);
  const fmt = (v: number) => (Math.abs(v) >= 1000 ? v.toLocaleString("en-US", { maximumFractionDigits: 0 }) : String(+v.toFixed(2)));
  return (
    <figure className="md-chart">
      {spec.title && <figcaption>{spec.title}{spec.unit ? <small> · {spec.unit}</small> : null}</figcaption>}
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={spec.title ?? "chart"}>
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1={padL} x2={W - padR} y1={y(max * f)} y2={y(max * f)} stroke="rgba(255,255,255,.1)" />
            <text x={padL - 6} y={y(max * f) + 4} textAnchor="end" fontSize="10" fill="var(--dim)">{fmt(max * f)}</text>
          </g>
        ))}
        {series.map((s, si) =>
          line ? (
            <polyline key={s.name} points={s.values.map((v, i) => `${x(i)},${y(Number(v) || 0)}`).join(" ")} fill="none" stroke="var(--dom)" strokeOpacity={1 - si * 0.35} strokeWidth="2.2" strokeLinejoin="round" />
          ) : (
            s.values.map((v, i) => {
              const h = H - padB - y(Number(v) || 0);
              const bx = x(i) - (bw * series.length) / 2 + si * bw;
              return (
                <g key={i}>
                  <rect x={bx} y={H - padB - h} width={bw - 2} height={h} rx="3" fill="var(--dom)" fillOpacity={1 - si * 0.35} />
                  <text x={bx + (bw - 2) / 2} y={H - padB - h - 4} textAnchor="middle" fontSize="10" fill="var(--ink2)">{fmt(Number(v) || 0)}</text>
                </g>
              );
            })
          ),
        )}
        {spec.labels.map((l, i) => <text key={i} x={x(i)} y={H - padB + 16} textAnchor="middle" fontSize="10.5" fill="var(--mute)">{String(l).slice(0, 14)}</text>)}
      </svg>
      {series.length > 1 && <ul className="md-legend">{series.map((s, i) => <li key={s.name} style={{ opacity: 1 - i * 0.35 }}>{s.name}</li>)}</ul>}
    </figure>
  );
}

export function Markdown({ text }: { text: string }) {
  return (
    <div className="md">
      {parseBlocks(text).map((b, i) => {
        switch (b.t) {
          case "h": return b.n === 1 ? <h1 key={i}><Inline s={b.s} /></h1> : b.n === 2 ? <h2 key={i}><Inline s={b.s} /></h2> : <h3 key={i}><Inline s={b.s} /></h3>;
          case "hr": return <hr key={i} />;
          case "list": return b.ordered ? <ol key={i}>{b.items.map((it, j) => <li key={j}><Inline s={it} /></li>)}</ol> : <ul key={i}>{b.items.map((it, j) => <li key={j}><Inline s={it} /></li>)}</ul>;
          case "table": return (
            <table key={i}>
              <thead><tr>{b.rows[0]?.map((c, j) => <th key={j}><Inline s={c} /></th>)}</tr></thead>
              <tbody>{b.rows.slice(1).map((r, j) => <tr key={j}>{r.map((c, k) => <td key={k}><Inline s={c} /></td>)}</tr>)}</tbody>
            </table>
          );
          case "code":
            if (b.lang === "chart") return <Chart key={i} src={b.s} />;
            if (b.lang === "prompt") return <div key={i} className="md-prompt"><p>{b.s}</p><CopyButton text={b.s} label="Copy prompt" className="btn-ghost" /></div>;
            return <pre key={i}>{b.s}</pre>;
          default: return <p key={i}><Inline s={b.s} /></p>;
        }
      })}
    </div>
  );
}

const urlsIn = (text: string) => [...new Set(text.match(/https?:\/\/[^\s)\]>"']+/g) ?? [])];

/** The answer as a .md file named after the monitor's title. */
function download(text: string, title: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: "text/markdown;charset=utf-8" }));
  a.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "monitor"}.md`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/**
 * The monitor itself: a preview of one answer with a raw tab, and a rail of every link in it.
 * `empty` is what it shows before there is anything to show.
 */
export function Monitor({ text, title, empty, theme }: { text: string | null; title: string; empty: ReactNode; theme?: string }) {
  const [raw, setRaw] = useState(false);
  const links = text ? urlsIn(text) : [];
  return (
    <section className="monitor" data-mon={theme} aria-label="Monitor">
      <header className="monitor-bar">
        <span className="monitor-dots" aria-hidden="true"><i /><i /><i /></span>
        <span className="monitor-title">{title}</span>
        {text && (
          <span className="monitor-tabs">
            <button type="button" className={raw ? "" : "is-on"} onClick={() => setRaw(false)}>Preview</button>
            <button type="button" className={raw ? "is-on" : ""} onClick={() => setRaw(true)}>Raw</button>
            <CopyButton text={text} label="Copy" />
            <button type="button" onClick={() => download(text, title)} title="Save this answer as a Markdown file">Download</button>
          </span>
        )}
      </header>
      <div className="monitor-body">
        {!text ? <div className="monitor-empty">{empty}</div> : raw ? <pre className="monitor-raw">{text}</pre> : <Markdown text={text} />}
      </div>
      {links.length > 0 && (
        <footer className="monitor-rail">
          <span>Links</span>
          {links.map((u) => <a key={u} href={u} target="_blank" rel="noreferrer noopener">{new URL(u).hostname.replace(/^www\./, "")} ↗</a>)}
        </footer>
      )}
    </section>
  );
}
