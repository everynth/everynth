import Link from "next/link";
import { CopyButton } from "@/components/copy-button";
import { usd } from "@/lib/sol-price";
import { copy, type SiteData } from "./index";
import { Swap } from "./swap";

// Template 2 — Glow. The trading-terminal shape: a slim sidebar, the token header and chart in the
// middle with the trades tab under it, buy/sell, bonding curve and holders on the right. Dark,
// with the project colour on the buy button and the chart's green and red. Every number that
// does not exist yet is shown as missing, never invented.
const css = `
.g{--a:var(--accent);--up:#7be0a8;--down:#f2a0a0;--vio:#b9a7f5;--amb:#e9c46a;background:#07080a;color:#c9ced6;font-family:var(--font-geist-sans),system-ui,sans-serif;min-height:100vh;line-height:1.45;font-size:13.5px}
.g a{color:inherit}
.g-top{position:sticky;top:0;z-index:3;display:flex;align-items:center;gap:12px;padding:10px 16px;background:rgba(7,8,10,.85);backdrop-filter:blur(16px) saturate(160%);border-bottom:1px solid rgba(255,255,255,.08)}
.g-logo{display:flex;align-items:center;gap:8px;font-weight:700;letter-spacing:.14em;font-size:13px;color:#fff;text-decoration:none;min-width:150px}
.g-logo i{width:22px;height:22px;border-radius:7px;background:linear-gradient(135deg,var(--a),var(--vio))}
.g-tick{display:flex;gap:10px;flex:1;min-width:0;overflow:hidden}
.g-tick span{display:inline-flex;align-items:center;gap:8px;padding:7px 12px;border-radius:9px;border:1px solid rgba(255,255,255,.1);background:linear-gradient(90deg,color-mix(in srgb,var(--vio) 22%,#15161b),#121318);font-size:12px;white-space:nowrap}
.g-tick span.b{background:linear-gradient(90deg,color-mix(in srgb,var(--up) 22%,#15161b),#121318)}
.g-tick b{color:#fff}
.g-social{display:flex;gap:8px}
.g-social a,.g-cta{display:inline-flex;align-items:center;gap:6px;padding:7px 12px;border-radius:9px;border:1px solid rgba(255,255,255,.14);background:#121318;color:#fff;text-decoration:none;font-size:12.5px;white-space:nowrap}
.g .g-cta{background:#fff;color:#000;font-weight:600}
.g-shell{display:grid;grid-template-columns:170px minmax(0,1fr) 300px;gap:16px;padding:16px;max-width:1260px;margin:0 auto;align-items:start}
.g-side{display:grid;gap:4px;position:sticky;top:64px}
.g-side small{font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:#6b7280;padding:6px 10px}
.g-side a{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:10px;text-decoration:none;color:#aab1bd;font-size:13.5px}
.g-side a i{width:16px;height:16px;border-radius:4px;background:rgba(255,255,255,.12)}
.g-side a.on{background:#15161b;color:#fff;border-left:2px solid var(--a)}
.g-side a.on i{background:var(--a)}
.g-mid{display:grid;gap:14px;min-width:0}
.g-card{border:1px solid rgba(255,255,255,.1);border-radius:14px;background:linear-gradient(180deg,#15161b,#0e0f13);box-shadow:0 14px 34px rgba(0,0,0,.4),inset 0 1px 0 rgba(255,255,255,.06);min-width:0}
.g-head{display:grid;grid-template-columns:96px minmax(0,1fr) auto;gap:16px;padding:16px;align-items:start}
.g-photo{width:96px;height:96px;border-radius:12px;overflow:hidden;background:linear-gradient(135deg,var(--a),color-mix(in srgb,var(--a) 25%,#0b0c10));display:grid;place-items:center;font-size:44px;font-weight:700;color:rgba(0,0,0,.6);border:1px solid rgba(255,255,255,.12)}
.g-photo img{width:100%;height:100%;object-fit:cover;display:block}
.g-head h1{font-size:19px;color:#fff;margin:4px 0 2px;letter-spacing:-.01em}
.g-head h1 span{color:var(--a);font-weight:500;margin-left:8px;font-size:14px}
.g-head p{margin:0;color:#aab1bd;font-size:12.5px;max-width:60ch}
.g-created{margin-top:10px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#6b7280}
.g-created b{color:#fff;letter-spacing:0;text-transform:none;font-size:12.5px;margin-left:6px}
.g-right{display:grid;gap:8px;justify-items:end}
.g .g-boost{display:inline-flex;align-items:center;gap:8px;padding:8px 14px;border-radius:8px;background:#fff;color:#000;font-weight:700;font-size:13px;text-decoration:none}
.g-boost i{background:#000;color:#fff;border-radius:4px;padding:1px 6px;font-size:11px;font-style:normal}
.g .g-icons a.g-share{width:auto;padding:0 10px;font-weight:600;background:color-mix(in srgb,var(--a) 18%,#1b1c22);border-color:color-mix(in srgb,var(--a) 45%,transparent)}
.g .g-site{background:#1b1c22;color:#fff;border:1px solid rgba(255,255,255,.16)}
.g-icons{display:flex;gap:6px}
.g-icons a{width:30px;height:30px;display:grid;place-items:center;border-radius:7px;background:#1b1c22;border:1px solid rgba(255,255,255,.12);text-decoration:none;font-size:12px;color:#fff}
.g-ca{display:inline-flex;gap:8px;align-items:center;padding:6px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.14);background:#0e0f13;font-family:var(--font-geist-mono),monospace;font-size:11.5px;color:#c9ced6;cursor:pointer;margin-top:8px}
/* chart */
.g-tools{display:flex;align-items:center;gap:10px;padding:8px 12px;border-bottom:1px solid rgba(255,255,255,.08);font-size:12px;color:#8b93a1}
.g-tools b{color:#fff;font-weight:500}.g-tools .r{margin-left:auto;display:flex;gap:8px}
.g-ohlc{display:flex;flex-wrap:wrap;gap:10px;padding:10px 14px 0;font-size:12px;font-family:var(--font-geist-mono),monospace;color:#8b93a1}
.g-ohlc b{color:#fff;font-weight:500}.g-ohlc .pair{font-family:var(--font-geist-sans),sans-serif;color:#fff;font-size:13px}
.g-ohlc i{display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--a);box-shadow:0 0 8px var(--a);vertical-align:0}
.g-chart{position:relative;display:grid;grid-template-columns:minmax(0,1fr) 76px;height:300px;margin:8px 0 0}
.g-plot{position:relative;border-top:1px solid rgba(255,255,255,.06);background:repeating-linear-gradient(0deg,rgba(255,255,255,.04) 0 1px,transparent 1px 37px),repeating-linear-gradient(90deg,rgba(255,255,255,.03) 0 1px,transparent 1px 72px)}
.g-plot svg{position:absolute;inset:0;width:100%;height:100%}
.g-plot .ref{stroke:var(--a);stroke-width:1.5;stroke-dasharray:5 5;opacity:.7}
.g-empty{position:absolute;inset:0;display:grid;place-items:center;text-align:center;color:#8b93a1;font-size:12.5px;padding:20px}
.g-now{position:absolute;transform:translateY(-50%);pointer-events:none;white-space:nowrap}
.g-now b{font-family:var(--font-geist-mono),monospace;font-size:12px;color:#fff;background:var(--up);padding:3px 8px;border-radius:6px}
.g-dot{position:absolute;width:8px;height:8px;margin:-4px 0 0 -4px;border-radius:50%;box-shadow:0 0 0 2px rgba(0,0,0,.5)}
.g-times{position:absolute;left:0;right:0;bottom:2px;display:flex;justify-content:space-between;padding:0 6px;font-family:var(--font-geist-mono),monospace;font-size:10px;color:#5b6472;pointer-events:none}
.g-empty b{display:block;color:#fff;font-size:14px;margin-bottom:4px}
.g-axis{display:grid;align-content:space-between;padding:6px 0 6px 10px;border-left:1px solid rgba(255,255,255,.08);font-family:var(--font-geist-mono),monospace;font-size:11px;color:#8b93a1}
.g-axis span.now{background:var(--a);color:#000;border-radius:3px;padding:1px 6px;font-weight:600;margin-left:-6px}
.g-time{display:flex;gap:8px;padding:8px 12px;border-top:1px solid rgba(255,255,255,.08);font-size:11.5px;color:#8b93a1;font-family:var(--font-geist-mono),monospace}
.g-time .r{margin-left:auto}.g-time b{color:var(--amb);font-weight:500}
/* tabs + trades */
.g-tabs{display:inline-flex;gap:4px;padding:4px;border-radius:10px;border:1px solid rgba(255,255,255,.1);background:#0e0f13;margin:14px 14px 0}
.g-tabs span{padding:8px 16px;border-radius:8px;font-size:13px;color:#8b93a1}.g-tabs .on{background:#1b1c22;color:#fff}
.g-table{width:100%;border-collapse:collapse;margin-top:12px;font-size:12.5px}
.g-table th{text-align:left;padding:10px 14px;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#8b93a1;border-top:1px solid rgba(255,255,255,.08);border-bottom:1px solid rgba(255,255,255,.08)}
.g-table td{padding:12px 14px;border-bottom:1px solid rgba(255,255,255,.06);color:#c9ced6}
.g-table .none td{text-align:center;color:#8b93a1;padding:28px 14px}
.g-table .none b{display:block;color:#fff;margin-bottom:3px}
/* right column */
.g-col{display:grid;gap:14px;min-width:0}
.g-pad{padding:14px}
.g-title{font-size:15px;color:#fff;text-align:center;margin:0 0 4px}
.g-big{font-size:28px;font-weight:700;color:#fff;text-align:center;margin:0}
.g-prog{position:relative;height:8px;border-radius:4px;background:rgba(255,255,255,.1);margin:12px 10px 18px}
.g-prog i{position:absolute;left:0;top:0;bottom:0;border-radius:4px;background:linear-gradient(90deg,var(--up),var(--a));width:0}
.g-prog em{position:absolute;top:-8px;width:0;height:0;border:6px solid transparent;border-top:9px solid var(--a);transform:translateX(-50%)}
.g-three{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:rgba(255,255,255,.08);border-top:1px solid rgba(255,255,255,.08);border-bottom:1px solid rgba(255,255,255,.08)}
.g-three div{background:#0e0f13;padding:10px 6px;text-align:center}
.g-three b{display:block;color:#fff;font-size:13.5px}.g-three span{font-size:10.5px;color:#8b93a1}
.g-text{padding:12px 14px;font-size:11.5px;line-height:1.55;color:#aab1bd;text-align:center}
.g-text b{color:var(--a);font-weight:500}
.g-hold{width:100%;border-collapse:collapse;font-size:12.5px}
.g-hold th{text-align:left;padding:10px 14px;font-size:11px;color:#8b93a1;border-bottom:1px solid rgba(255,255,255,.08)}
.g-hold th+th{text-align:right}
.g-hold td{padding:9px 14px;border-bottom:1px solid rgba(255,255,255,.06)}
.g-hold td+td{text-align:right;color:#fff}
.g-hold .who{display:inline-flex;align-items:center;gap:8px;color:var(--a);font-weight:600}
.g-hold .who i{width:18px;height:18px;border-radius:5px;background:linear-gradient(135deg,var(--vio),var(--a))}
.g-hold .tag{display:inline-block;margin-left:6px;padding:1px 6px;border-radius:4px;font-size:10px;background:color-mix(in srgb,var(--amb) 25%,transparent);color:var(--amb)}
.g-kv{display:grid;gap:6px;padding:12px 14px;font-size:12.5px}
.g-kv div{display:flex;justify-content:space-between;gap:10px}.g-kv dt{color:#8b93a1}.g-kv dd{margin:0;color:#fff;text-align:right}
/* buy panel */
.sw{display:grid;gap:10px;padding:0 0 12px}
.sw-tabs{display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid rgba(255,255,255,.1)}
.sw-tabs button{padding:12px;background:#0e0f13;border:0;color:#8b93a1;font:inherit;font-weight:700;letter-spacing:.06em;cursor:pointer}
.sw-tabs button:first-child{border-top-left-radius:14px}.sw-tabs button:last-child{border-top-right-radius:14px}
.sw-tabs button.on{background:#1b1c22;color:#fff;box-shadow:inset 0 -2px 0 var(--a)}
.sw-tabs button.on.sell{box-shadow:inset 0 -2px 0 var(--down)}
.sw-row{display:flex;justify-content:space-between;gap:8px;padding:0 12px}
.sw-chip{padding:5px 9px;border-radius:6px;background:#1b1c22;border:1px solid rgba(255,255,255,.1);font-size:11px;color:#c9ced6}
.sw-in{display:flex;align-items:center;gap:8px;margin:0 12px;padding:10px 12px;border-radius:10px;border:1px solid rgba(255,255,255,.12);background:#0e0f13;min-width:0}
.sw-in input{flex:1;width:100%;min-width:0;background:transparent;border:0;outline:none;color:#fff;font:inherit;font-size:14px}
.sw-in b{font-size:12px;color:#8b93a1}
.sw-quick{display:flex;flex-wrap:wrap;gap:6px;padding:0 12px}
.sw-quick button{padding:5px 9px;border-radius:6px;background:#1b1c22;border:1px solid rgba(255,255,255,.1);color:#c9ced6;font:inherit;font-size:11.5px;cursor:pointer}
.sw-btn{margin:4px 12px 0;padding:14px;border-radius:10px;border:0;background:var(--a);color:#000;font:inherit;font-weight:800;font-size:14px;letter-spacing:.06em;cursor:pointer;box-shadow:0 10px 26px -10px var(--a)}
.sw-btn.sell{background:var(--down)}
.sw-btn:disabled{background:#1b1c22;color:#6b7280;cursor:not-allowed;box-shadow:none;border:1px solid rgba(255,255,255,.1)}
.sw-note{margin:0 12px;font-size:11px;color:#6b7280;line-height:1.5}
.g-disc{margin:16px auto 32px;max-width:1260px;padding:0 16px}
.g-disc div{padding:14px 18px;border-radius:12px;border:1px solid rgba(255,255,255,.08);background:#0e0f13;font-size:11.5px;color:#8b93a1;text-align:center;line-height:1.6}
.g-disc nav{display:flex;flex-wrap:wrap;justify-content:center;gap:12px;margin-top:8px}
.g-disc nav a{color:#c9ced6}
.g-embed{min-height:0;background:transparent;border-radius:18px}
.g-embed .g-shell{grid-template-columns:minmax(0,1fr) 300px;padding:0;max-width:none}
@media(max-width:1080px){.g-shell{grid-template-columns:minmax(0,1fr) 300px}.g-side{display:none}.g-tick{display:none}.g-logo{min-width:0}}
@media(max-width:800px){.g-shell,.g-embed .g-shell{grid-template-columns:minmax(0,1fr)}.g-col{order:-1}.g-head{grid-template-columns:72px minmax(0,1fr)}.g-photo{width:72px;height:72px;font-size:32px}.g-right{grid-column:1/-1;justify-items:start}.g-chart{height:240px}.g-table th:nth-child(2),.g-table td:nth-child(2),.g-table th:nth-child(3),.g-table td:nth-child(3){display:none}.g-social a:not(.g-cta){display:none}}
`;

/** The board: chart, trades, swap, curve and holders. Embedded in the landing page (no chrome of its own) or standalone. */
export function Glow({ d, embed = false }: { d: SiteData; embed?: boolean }) {
  const c = copy(d);
  const live = !!d.mint; // launched on pump.fun: the curve exists, the panel trades against it
  const cv = d.curve;
  const n = (v: number) => v.toLocaleString("en-US");
  const sol = (v: number, p = 3) => `${v.toFixed(p)} SOL`;
  const money = (v: number) => (d.solUsd ? usd(v * d.solUsd) : sol(v, 2)); // a SOL amount, in dollars when the feed answered
  const ago = (iso: string | null) => (iso ? `${iso.slice(5, 10)} ${iso.slice(11, 16)} UTC` : "—");
  // The chart is the coin's own history: market cap after every trade, as a step line over time
  // (the price holds between trades), with a dot per trade. Dollar axis on the right, time along
  // the bottom. The last level is the live market cap.
  const plot = cv && d.history && d.history.length ? (() => {
    const pts = d.history.map((h) => ({ t: Date.parse(h.at), v: h.mcapSol, side: h.side }));
    const t0 = pts[0].t, t1 = Math.max(pts[pts.length - 1].t, t0 + 60_000);
    const span = (t1 - t0) * 1.08; // hold the last level a little past the last trade
    const vals = [...pts.map((p) => p.v), cv.marketCapSol];
    let lo = Math.min(...vals), hi = Math.max(...vals);
    if (hi - lo < hi * 0.02) { lo *= 0.98; hi *= 1.02; } else { const pad = (hi - lo) * 0.12; lo -= pad; hi += pad; }
    const x = (t: number) => ((t - t0) / span) * 600;
    const y = (v: number) => 292 - (276 * (v - lo)) / (hi - lo);
    let path = `M 0 ${y(pts[0].v).toFixed(1)}`;
    pts.forEach((p, i) => { const px = x(p.t).toFixed(1); if (i > 0) path += ` L ${px} ${y(pts[i - 1].v).toFixed(1)}`; path += ` L ${px} ${y(p.v).toFixed(1)}`; });
    path += ` L 600 ${y(cv.marketCapSol).toFixed(1)}`;
    const dots = pts.map((p) => ({ cx: x(p.t), cy: y(p.v), side: p.side }));
    const stamp = (t: number) => new Date(t).toISOString().slice(5, 16).replace("T", " ");
    return { path, dots, yNow: y(cv.marketCapSol), axis: [1, 0.75, 0.5, 0.25, 0].map((f) => money(lo + (hi - lo) * f)), times: [stamp(t0), stamp((t0 + t1) / 2), stamp(t1)], n: pts.length };
  })() : null;
  const tx = (s: string) => `https://solscan.io/tx/${s}${/devnet/i.test(d.rpc) ? "?cluster=devnet" : ""}`;
  return (
    <div className={`g${embed ? " g-embed" : ""}`} style={{ "--accent": d.color } as React.CSSProperties}>
      <style>{css}</style>

      {!embed && <header className="g-top">
        <Link href="/launchpad" className="g-logo"><i />EVERYNTH</Link>
        <div className="g-tick">
          <span>🏷️ <b>{d.utility}</b> backs ${d.ticker}</span>
          <span className="b">{d.mint ? <>🟢 <b>{cv?.complete ? "graduated" : "live"}</b> on pump.fun{cv ? ` · ${cv.progress.toFixed(0)}% of the curve` : ""}</> : <>🧊 <b>terms frozen</b> · not launched</>}</span>
        </div>
        <div className="g-social">
          {d.x && <a href={`https://x.com/${d.x}`} target="_blank" rel="noopener noreferrer">𝕏 @{d.x}</a>}
          {d.telegram && <a href={`https://t.me/${d.telegram}`} target="_blank" rel="noopener noreferrer">✈ Telegram</a>}
          <a className="g-cta" href={c.terms_href}>Signed terms →</a>
        </div>
      </header>}

      <div className="g-shell">
        {!embed && <aside className="g-side">
          <small>Main menu</small>
          <a className="on" href="#top"><i />Board</a>
          <Link href="/launchpad/new"><i />Create token</Link>
          <Link href="/launchpad"><i />Discover</Link>
          <Link href="/"><i />Market</Link>
          <Link href="/docs/launchpad/overview"><i />Docs</Link>
        </aside>}

        <main className="g-mid" id="top">
          {!embed && <section className="g-card g-head">
            <div className="g-photo">
              {/* eslint-disable-next-line @next/next/no-img-element -- our own API route */}
              <img src={d.logo} alt="" />{/* the coin's own logo: upload, Prism, cover or default mark */}
            </div>
            <div>
              <h1>{d.name}<span>${d.ticker}</span></h1>
              <p>{c.tagline}</p>
              <p style={{ marginTop: 6 }}>Hold <b style={{ color: "#fff" }}>{n(d.gateBalance)} ${d.ticker}</b> and <b style={{ color: "#fff" }}>{d.gateUnlocks}</b> opens.{" "}
                {d.utilityUrl ? <a href={d.utilityUrl} target="_blank" rel="noopener noreferrer">Open the utility ↗</a> : <Link href={`/p/${d.productId}`}>See it on the market ↗</Link>}
              </p>
              <div className="g-created">Created:<b>the desk · EVERYNTH</b></div>
              {c.ca ? <CopyButton text={c.ca.full} label={`CA · ${c.ca.short} · copy`} className="g-ca" /> : <span className="g-ca">CA · after launch</span>}
            </div>
            <div className="g-right">
              <div style={{ display: "flex", gap: 8 }}>
                <a className="g-boost g-site" href={c.website_href}>🌐 Visit website</a>
                <a className="g-boost" href="#buy"><i>★</i> Buy ⚡</a>
              </div>
              <div className="g-icons">
                <a href={c.share_href} target="_blank" rel="noopener noreferrer" title="Share on X" className="g-share">Share 𝕏</a>
                {d.x &&<a href={`https://x.com/${d.x}`} target="_blank" rel="noopener noreferrer" title="X">𝕏</a>}
                {d.telegram && <a href={`https://t.me/${d.telegram}`} target="_blank" rel="noopener noreferrer" title="Telegram">✈</a>}
                {d.website && <a href={d.website} target="_blank" rel="noopener noreferrer" title="Website">🌐</a>}
                {d.github && <a href={`https://github.com/${d.github}`} target="_blank" rel="noopener noreferrer" title="GitHub">⌥</a>}
                {c.ca?.explorer && <a href={c.ca.explorer} target="_blank" rel="noopener noreferrer" title="Solscan">◎</a>}
                {d.mint && <a href={`https://pump.fun/coin/${d.mint}`} target="_blank" rel="noopener noreferrer" title="pump.fun">💊</a>}
              </div>
            </div>
          </section>}

          <section className="g-card">
            <div className="g-tools"><b>trades ▾</b><span>line</span><span>market cap</span><span className="r"><span>⤢</span><span>📷</span><span>⚙</span></span></div>
            <div className="g-ohlc"><span className="pair">{d.name} / {d.pair === "evyn" ? "EVYN" : "SOL"} · pump.fun <i /></span><span>price <b>{cv ? (d.solUsd ? `$${(cv.priceSol * d.solUsd).toExponential(2)}` : cv.priceSol.toExponential(3)) : "—"}</b></span><span>mcap <b>{cv ? money(cv.marketCapSol) : "—"}</b>{cv && d.solUsd ? <> ({sol(cv.marketCapSol, 2)})</> : null}</span><span>raised <b>{cv ? money(cv.raisedSol) : "—"}</b></span><span style={{ color: "var(--up)" }}>{cv ? `${cv.progress.toFixed(1)}% of the curve` : "—"}</span></div>
            <div className="g-chart">
              <div className="g-plot">
                <svg viewBox="0 0 600 300" preserveAspectRatio="none" aria-hidden="true">
                  {cv && plot ? <>
                    {/* market cap after every trade, held between trades; a dot per trade */}
                    {[0.25, 0.5, 0.75].map((f) => <line key={f} x1="0" y1={292 - 276 * f} x2="600" y2={292 - 276 * f} stroke="#fff" strokeOpacity=".06" />)}
                    <path d={`${plot.path} L 600 300 L 0 300 Z`} fill="var(--a)" opacity=".08" />
                    <path d={plot.path} fill="none" stroke="var(--a)" strokeWidth="2" opacity=".9" vectorEffect="non-scaling-stroke" />
                    <line x1="0" y1={plot.yNow} x2="600" y2={plot.yNow} stroke="var(--up)" strokeWidth="1" strokeDasharray="2 5" opacity=".6" vectorEffect="non-scaling-stroke" />
                  </> : <line className="ref" x1="0" y1="200" x2="600" y2="200" />}
                </svg>
                {cv && plot && plot.dots.map((p, i) => (
                  <i key={i} className="g-dot" style={{ left: `${(p.cx / 600) * 100}%`, top: `${(p.cy / 300) * 100}%`, background: p.side === "buy" ? "var(--up)" : "var(--down)" }} title={p.side} />
                ))}
                {cv && plot && (
                  <div className="g-now" style={{ right: 8, top: `${(plot.yNow / 300) * 100}%` }}>
                    <b>{money(cv.marketCapSol)}</b>
                  </div>
                )}
                {!live ? <div className="g-empty"><div><b>Opens at launch</b>No chart yet. The line starts with the first buy.</div></div>
                  : cv && !plot ? <div className="g-empty"><div><b>No trades yet</b>The line starts with the first buy.</div></div>
                  : cv && plot && <div className="g-empty" style={{ placeItems: "start start", pointerEvents: "none", padding: 12 }}><div style={{ textAlign: "left" }}><b>market cap · last {plot.n} trades</b>green dots are buys, red are sells</div></div>}
                {plot && <div className="g-times">{plot.times.map((s, i) => <span key={i}>{s}</span>)}</div>}
              </div>
              <div className="g-axis">{(plot ? plot.axis : ["—", "—", "—", "—", "—"]).map((v, i) => <span key={i}>{v}</span>)}</div>
            </div>
            <div className="g-time"><span>1day</span><span>7day</span><span>📅</span><span className="r">{new Date().toISOString().slice(11, 16)} (UTC) · <b>auto</b></span></div>
          </section>

          <section className="g-card">
            <div className="g-tabs"><Link href={`/community/${d.slug}`} style={{ textDecoration: "none" }}><span>💬 Holder chat ↗</span></Link><span className="on">⇄ Trades</span></div>
            <table className="g-table">
              <thead><tr><th>Account</th><th>Type</th><th>USD</th><th>SOL</th><th>${d.ticker}</th><th>Date</th><th>Txn</th></tr></thead>
              <tbody>
                {d.trades && d.trades.length > 0 ? d.trades.map((t) => (
                  <tr key={t.signature}>
                    <td className="mono">{t.account.slice(0, 6)}</td>
                    <td style={{ color: t.side === "buy" ? "var(--up)" : "var(--down)", fontWeight: 600 }}>{t.side}</td>
                    <td>{d.solUsd ? usd(t.sol * d.solUsd) : "—"}</td>
                    <td>{t.sol.toFixed(4)}</td>
                    <td>{t.tokens >= 1e6 ? `${(t.tokens / 1e6).toFixed(2)}M` : t.tokens >= 1e3 ? `${(t.tokens / 1e3).toFixed(1)}K` : t.tokens.toFixed(0)}</td>
                    <td>{ago(t.at)}</td>
                    <td><a href={tx(t.signature)} target="_blank" rel="noopener noreferrer">↗</a></td>
                  </tr>
                )) : (
                  <tr className="none"><td colSpan={7}><b>No trades yet</b>{live ? "The first swap shows up here." : `$${d.ticker} is not on the curve yet. Nothing has been bought or sold, and nothing is for sale before launch.`}</td></tr>
                )}
              </tbody>
            </table>
          </section>
        </main>

        <aside className="g-col">
          <section className="g-card" id="buy"><Swap ticker={d.ticker} creatorFee={d.creatorFee} mint={d.mint} rpc={d.rpc} live={live} pair={d.pair} fees={cv?.fees ?? null} /></section>

          <section className="g-card">
            <div className="g-pad">
              <p className="g-title">Bonding Curve Progress:</p>
              <p className="g-big">{cv ? `${cv.progress.toFixed(1)}%` : "—"}</p>
              <div className="g-prog"><i style={{ width: `${cv?.progress ?? 0}%` }} /><em style={{ left: `${cv?.progress ?? 0}%` }} /></div>
            </div>
            <div className="g-three">
              <div><b>{cv ? money(cv.marketCapSol) : "—"}</b><span>Market cap{cv && d.solUsd ? ` · ${sol(cv.marketCapSol, 1)}` : ""}</span></div>
              <div><b>{cv ? sol(cv.raisedSol) : "—"}</b><span>In the curve{cv && d.solUsd ? ` · ${usd(cv.raisedSol * d.solUsd)}` : ""}</span></div>
              <div><b>{cv ? (cv.complete ? "done" : `${(100 - cv.progress).toFixed(1)}%`) : "—"}</b><span>{cv?.complete ? "Graduated" : "To graduation"}</span></div>
            </div>
            <p className="g-text">
              {cv ? (cv.complete
                ? <>The curve is complete: <b>$${d.ticker}</b> has graduated and trades in its own PumpSwap pool against SOL. The curve&apos;s SOL and remaining coins became that pool&apos;s liquidity, and the LP was burned.</>
                : <>Of the <b>793.1M ${d.ticker}</b> the curve sells, <b>{cv.progress.toFixed(1)}%</b> are bought and <b>{sol(cv.raisedSol)}</b> sit in the curve. When it reaches 100% the coin graduates: the curve&apos;s SOL and the remaining coins move into a PumpSwap pool and the LP is burned. Progress moves with the price.</>)
                : <>There are <b>{n(d.supply)} ${d.ticker}</b> in total: 793.1M sell on the bonding curve, the rest becomes pool liquidity at graduation. The curve starts the moment the coin is launched on pump.fun.</>}
            </p>
          </section>

          <section className="g-card">
            <table className="g-hold">
              <thead><tr><th>Holder</th><th>Percentage</th></tr></thead>
              <tbody>
                {d.top && d.top.length > 0 ? d.top.map((h) => (
                  <tr key={h.account}><td><span className="who"><i />{h.account.slice(0, 6)}</span>{h.tag && <span className="tag">{h.tag}</span>}</td><td>{h.pct}%</td></tr>
                )) : (
                  <tr><td colSpan={2} style={{ color: "#8b93a1", textAlign: "center", padding: 18 }}>{d.mint ? "Holders are read from the chain; the RPC has not answered yet." : "Holders appear once the token is minted."}</td></tr>
                )}
              </tbody>
            </table>
          </section>

          <section className="g-card">
            <dl className="g-kv">
              {c.terms.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
              <div><dt>Signed</dt><dd><a href={c.terms_href}>read the signature ↗</a></dd></div>
            </dl>
          </section>
        </aside>
      </div>

      {!embed && <footer className="g-disc">
        <div>
          <b>Disclaimer:</b> EVERYNTH does not endorse or recommend any token launched on it. {c.disclaimer} Do your own research.
          <nav>
            {c.links.map(([k, href]) => <a key={k} href={href} target="_blank" rel="noopener noreferrer">{k} ↗</a>)}
            {c.ca?.explorer && <a href={c.ca.explorer} target="_blank" rel="noopener noreferrer">Solscan ↗</a>}
            <a href={c.website_href}>Website</a>
            <a href={c.terms_href}>Signed terms</a>
            <Link href="/launchpad">EVERYNTH launchpad</Link>
          </nav>
        </div>
      </footer>}
    </div>
  );
}
