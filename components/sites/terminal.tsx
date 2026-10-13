import Link from "next/link";
import { copy, type SiteData } from "./index";

// Template 2 — Terminal. One dark console in monospace. Every section is a command and its output.
const css = `
.t2{--a:var(--accent);background:#07080a;color:#c9ced6;font-family:var(--font-geist-mono),ui-monospace,monospace;min-height:100vh;line-height:1.6;font-size:14px}
.t2 a{color:var(--a)}
.t2 .w{max-width:920px;margin:0 auto;padding:0 20px}
.t2-bar{position:sticky;top:0;z-index:2;background:rgba(7,8,10,.9);backdrop-filter:blur(10px);border-bottom:1px solid #1d2027}
.t2-bar .w{display:flex;align-items:center;gap:12px;height:48px;font-size:12.5px}
.t2-bar i{width:10px;height:10px;border-radius:50%;background:#f2a0a0}.t2-bar i+i{background:#e9c46a}.t2-bar i+i+i{background:#7be0a8;margin-right:6px}
.t2-bar span{color:#6b7280}.t2-bar b{margin-left:auto;color:var(--a);font-weight:500}
.t2-box{border:1px solid #23262e;border-radius:10px;margin:18px 0;background:#0b0c10}
.t2-box header{padding:9px 14px;border-bottom:1px solid #23262e;color:#8b93a1;font-size:12px}
.t2-box header::before{content:"$ ";color:var(--a)}
.t2-box .b{padding:14px 16px}
.t2-hero{display:grid;grid-template-columns:minmax(0,1fr) 220px;gap:24px;align-items:start}
.t2-hero h1{font-size:clamp(1.8rem,4vw,2.8rem);margin:0 0 4px;color:#fff;letter-spacing:-.02em;font-weight:600}
.t2-hero h1 span{color:var(--a)}
.t2-hero p{margin:6px 0 14px;max-width:60ch}
.t2-photo{aspect-ratio:1;border:1px solid #23262e;border-radius:8px;overflow:hidden;background:repeating-linear-gradient(45deg,#0f1115 0 6px,#0b0c10 6px 12px);display:grid;place-items:center;color:var(--a);font-size:72px;font-weight:600}
.t2-photo img{width:100%;height:100%;object-fit:cover;display:block}
.t2-btn{display:inline-block;padding:8px 14px;border:1px solid var(--a);color:var(--a);border-radius:6px;text-decoration:none;font-size:13px}
.t2-btn.fill{background:var(--a);color:#000;font-weight:600}
.t2-kv{display:grid;grid-template-columns:auto 1fr;gap:4px 18px}
.t2-kv dt{color:#6b7280}.t2-kv dt::before{content:"> ";color:var(--a)}
.t2-kv dd{margin:0;color:#e5e7eb}
.t2-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:#23262e}
.t2-stats div{background:#0b0c10;padding:12px 14px}
.t2-stats dt{font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.1em}
.t2-stats dd{margin:2px 0 0;font-size:20px;color:#fff}
.t2-stats small{color:#4b5563;font-size:11px}
.t2-ol{margin:0;padding:0;list-style:none;counter-reset:s}
.t2-ol li{counter-increment:s;padding:6px 0;border-bottom:1px dashed #23262e}
.t2-ol li:last-child{border-bottom:0}
.t2-ol li::before{content:"[" counter(s,decimal-leading-zero) "] ";color:var(--a)}
.t2-ol b{color:#fff;font-weight:500}
.t2-ol span{color:#8b93a1}
.t2-cursor::after{content:"▌";color:var(--a);animation:t2blink 1s steps(1) infinite}
@keyframes t2blink{50%{opacity:0}}
.t2-foot{padding:24px 0 40px;color:#6b7280;font-size:12.5px}
.t2-foot nav{display:flex;flex-wrap:wrap;gap:14px;margin-bottom:12px}
.t2-foot p{margin:0;max-width:80ch}
@media(max-width:700px){.t2-hero{grid-template-columns:1fr}.t2-photo{max-width:200px}.t2-stats{grid-template-columns:repeat(2,1fr)}}
@media(prefers-reduced-motion:reduce){.t2-cursor::after{animation:none}}
`;

export function Terminal({ d }: { d: SiteData }) {
  const c = copy(d);
  const t = d.ticker.toLowerCase();
  return (
    <div className="t2" style={{ "--accent": d.color } as React.CSSProperties}>
      <style>{css}</style>
      <header className="t2-bar"><div className="w"><i /><i /><i /><span>~/{t}</span><b>${d.ticker} · frozen</b></div></header>

      <main className="w">
        <section className="t2-box">
          <header>{t} --about</header>
          <div className="b t2-hero">
            <div>
              <h1>{d.name} <span>${d.ticker}</span></h1>
              <p>{c.tagline}</p>
              <dl className="t2-kv">
                <dt>backs</dt><dd>{d.utility}</dd>
                <dt>contract</dt><dd>after launch</dd>
                <dt>theme</dt><dd>{d.theme || "—"}</dd>
              </dl>
              <p style={{ marginTop: 16 }}><a className="t2-btn fill" href="#buy">buy ${d.ticker}</a> <a className="t2-btn" href={c.terms_href}>signed terms</a></p>
            </div>
            <div className="t2-photo">
              {/* eslint-disable-next-line @next/next/no-img-element -- our own API route */}
              {d.photo ? <img src={d.photo} alt="" /> : d.ticker[0]}
            </div>
          </div>
        </section>

        <section className="t2-box">
          <header>{t} --market</header>
          <dl className="t2-stats">{c.stats.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd><small>live when the pool opens</small></div>)}</dl>
        </section>

        <section className="t2-box">
          <header>{t} --utility</header>
          <div className="b">
            <dl className="t2-kv">
              <dt>unlocks</dt><dd>{d.gateUnlocks}</dd>
              <dt>hold</dt><dd>{d.gateBalance.toLocaleString("en-US")} ${d.ticker}</dd>
              <dt>link</dt><dd>{d.utilityUrl ? <a href={d.utilityUrl} target="_blank" rel="noopener noreferrer">{d.utilityUrl}</a> : <a href={`/p/${d.productId}`}>/p/{d.productId.slice(0, 8)}… on the market</a>}</dd>
            </dl>
          </div>
        </section>

        <section className="t2-box">
          <header>{t} --terms</header>
          <div className="b"><dl className="t2-kv">{c.terms.map(([k, v]) => [<dt key={k + "k"}>{k.toLowerCase()}</dt>, <dd key={k + "v"}>{v}</dd>])}</dl></div>
        </section>

        <section className="t2-box" id="buy">
          <header>{t} --how-to-buy</header>
          <div className="b"><ol className="t2-ol">{c.steps.map(([h, s]) => <li key={h}><b>{h}</b> <span>— {s}</span></li>)}</ol></div>
        </section>

        <p className="t2-cursor" style={{ color: "#6b7280" }}>$ {t} --log · terms frozen {d.signedAt.toISOString().slice(0, 10)} · nothing minted yet </p>
      </main>

      <footer className="t2-foot w">
        <nav>
          {c.links.map(([k, href]) => <a key={k} href={href} target="_blank" rel="noopener noreferrer">[{k.toLowerCase()}]</a>)}
          <a href={c.terms_href}>[terms]</a><Link href="/launchpad">[everynth]</Link>
        </nav>
        <p># {c.disclaimer}</p>
      </footer>
    </div>
  );
}
