import Link from "next/link";
import { copy, type SiteData } from "./index";

// Template 1 — Basic. Light, clean, the hireagents shape: photo, pitch, numbers, story, how to buy.
const css = `
.t1{--a:var(--accent);--ink:#111;--mute:#5b6069;--line:#e8e9ec;background:#fafafa;color:var(--ink);font-family:var(--font-geist-sans),system-ui,sans-serif;min-height:100vh;line-height:1.5}
.t1 a{color:inherit}
.t1 .w{max-width:1040px;margin:0 auto;padding:0 20px}
.t1-nav{position:sticky;top:0;z-index:2;background:rgba(250,250,250,.85);backdrop-filter:blur(14px);border-bottom:1px solid var(--line)}
.t1-nav .w{display:flex;align-items:center;gap:18px;height:60px}
.t1-nav b{font-size:17px;letter-spacing:-.01em}
.t1-nav nav{display:flex;gap:16px;margin-left:auto;font-size:13.5px;color:var(--mute)}
.t1-nav nav a{text-decoration:none}
.t1-btn{display:inline-block;padding:10px 18px;border-radius:999px;background:var(--a);color:#000;font-weight:600;font-size:14px;text-decoration:none;white-space:nowrap}
.t1-btn.ghost{background:transparent;border:1px solid #d6d8dd;color:var(--ink)}
.t1-hero{display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:40px;align-items:center;padding:56px 0 40px}
.t1-hero .k{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--mute);font-weight:600}
.t1-hero .k i{display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--a);margin-right:8px;vertical-align:1px}
.t1-hero h1{font-size:clamp(2.2rem,5vw,3.6rem);line-height:1.02;letter-spacing:-.03em;margin:12px 0 8px}
.t1-hero h1 small{display:block;font-size:.4em;letter-spacing:.1em;color:var(--mute);font-weight:500;margin-top:8px}
.t1-hero p{font-size:17px;color:#333;max-width:52ch}
.t1-cta{display:flex;flex-wrap:wrap;gap:10px;margin-top:22px;align-items:center}
.t1-ca{display:inline-flex;gap:8px;align-items:center;padding:9px 14px;border-radius:999px;border:1px solid #d6d8dd;background:#fff;font-family:var(--font-geist-mono),monospace;font-size:12px;color:var(--mute)}
.t1-photo{aspect-ratio:1;border-radius:28px;overflow:hidden;background:linear-gradient(135deg,var(--a),color-mix(in srgb,var(--a) 30%,#fff));display:grid;place-items:center;font-size:120px;font-weight:700;color:rgba(0,0,0,.55);box-shadow:0 30px 60px -30px color-mix(in srgb,var(--a) 60%,transparent)}
.t1-photo img{width:100%;height:100%;object-fit:cover;display:block}
.t1-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--line);border:1px solid var(--line);border-radius:18px;overflow:hidden;margin:8px 0 56px}
.t1-stats div{background:#fff;padding:18px 20px}
.t1-stats dt{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--mute)}
.t1-stats dd{font-size:24px;font-weight:600;letter-spacing:-.02em;margin-top:4px}
.t1-stats small{display:block;font-size:11.5px;color:var(--mute);margin-top:2px}
.t1 h2{font-size:1.5rem;letter-spacing:-.02em;margin:0 0 6px}
.t1 .sub{color:var(--mute);margin:0 0 20px;max-width:60ch}
.t1-sec{padding:12px 0 48px;border-top:1px solid var(--line)}
.t1-sec:first-of-type{border-top:0}
.t1-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.t1-card{background:#fff;border:1px solid var(--line);border-radius:18px;padding:20px}
.t1-card b{display:block;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--a);filter:brightness(.7);margin-bottom:8px}
.t1-card h3{font-size:17px;margin:0 0 6px;letter-spacing:-.01em}
.t1-card p{margin:0;color:#444;font-size:14.5px}
.t1-terms{display:grid;grid-template-columns:repeat(2,1fr);gap:1px;background:var(--line);border:1px solid var(--line);border-radius:18px;overflow:hidden}
.t1-terms div{background:#fff;padding:16px 20px;display:grid;gap:3px}
.t1-terms dt{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--mute)}
.t1-terms dd{margin:0;font-size:15px}
.t1-steps{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;counter-reset:s}
.t1-steps li{list-style:none;background:#fff;border:1px solid var(--line);border-radius:18px;padding:20px;counter-increment:s}
.t1-steps li::before{content:"0" counter(s);font-family:var(--font-geist-mono),monospace;font-size:12px;color:var(--a);filter:brightness(.7)}
.t1-steps b{display:block;margin:8px 0 4px;font-size:15px}
.t1-steps span{font-size:13.5px;color:#444}
.t1-foot{border-top:1px solid var(--line);background:#fff;padding:34px 0 40px;font-size:13.5px;color:var(--mute)}
.t1-foot .w{display:grid;gap:14px}
.t1-foot .row{display:flex;flex-wrap:wrap;gap:8px 20px;align-items:center}
.t1-foot .row b{color:var(--ink);font-size:16px}
.t1-foot nav{display:flex;flex-wrap:wrap;gap:14px}
.t1-foot nav a{text-decoration:none;padding:6px 12px;border:1px solid var(--line);border-radius:999px;color:var(--ink)}
.t1-foot p{margin:0;max-width:80ch;font-size:12.5px}
@media(max-width:860px){.t1-hero{grid-template-columns:1fr;gap:24px;padding-top:32px}.t1-photo{max-width:320px}.t1-stats,.t1-steps{grid-template-columns:repeat(2,1fr)}.t1-cards{grid-template-columns:1fr}.t1-nav nav{display:none}}
@media(max-width:520px){.t1-stats,.t1-steps,.t1-terms{grid-template-columns:1fr}}
`;

export function Basic({ d }: { d: SiteData }) {
  const c = copy(d);
  return (
    <div className="t1" style={{ "--accent": d.color } as React.CSSProperties}>
      <style>{css}</style>
      <header className="t1-nav">
        <div className="w">
          <b>${d.ticker}</b>
          <nav><a href="#story">Story</a><a href="#utility">Utility</a><a href="#terms">Terms</a><a href="#buy">How to buy</a></nav>
          <a className="t1-btn" href="#buy">Buy ${d.ticker}</a>
        </div>
      </header>

      <main className="w">
        <section className="t1-hero">
          <div>
            <p className="k"><i />Launching on EVERYNTH · paired with SOL</p>
            <h1>{d.name}<small>${d.ticker}</small></h1>
            <p>{c.tagline}</p>
            <div className="t1-cta">
              <a className="t1-btn" href="#buy">Buy ${d.ticker}</a>
              <span className="t1-ca">CA · after launch</span>
            </div>
          </div>
          <div className="t1-photo">
            {/* eslint-disable-next-line @next/next/no-img-element -- our own API route */}
            {d.photo ? <img src={d.photo} alt="" /> : d.name[0]}
          </div>
        </section>

        <dl className="t1-stats">
          {c.stats.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd><small>live when the pool opens</small></div>)}
        </dl>

        <section className="t1-sec" id="story">
          <h2>The story</h2>
          <p className="sub">{d.theme ? `Theme: ${d.theme}. ` : ""}Written out in full by the desk; the pitch for now.</p>
          <div className="t1-cards">
            <article className="t1-card"><b>01</b><h3>What it is</h3><p>{d.description}</p></article>
            <article className="t1-card"><b>02</b><h3>What it is backed by</h3><p>{d.utility}, a utility that already works on EVERYNTH. Encrypted, paid wallet to wallet.</p></article>
            <article className="t1-card"><b>03</b><h3>Why hold</h3><p>Hold {d.gateBalance.toLocaleString("en-US")} ${d.ticker} and {d.gateUnlocks} opens. Sell below it and it closes.</p></article>
          </div>
        </section>

        <section className="t1-sec" id="utility">
          <h2>Utility</h2>
          <p className="sub">The token is for something. This is it.</p>
          <div className="t1-card">
            <h3>{d.utility}</h3>
            <p>Hold {d.gateBalance.toLocaleString("en-US")} ${d.ticker} to unlock <b style={{ display: "inline", textTransform: "none", letterSpacing: 0, color: "inherit", filter: "none", fontSize: "inherit" }}>{d.gateUnlocks}</b>.{" "}
              {d.utilityUrl ? <a href={d.utilityUrl} target="_blank" rel="noopener noreferrer">Open the utility ↗</a> : <a href={`/p/${d.productId}`}>See it on the market ↗</a>}
            </p>
          </div>
        </section>

        <section className="t1-sec" id="terms">
          <h2>Terms</h2>
          <p className="sub">Frozen under the launcher&apos;s signature. <a href={c.terms_href}>Read the signed terms ↗</a></p>
          <dl className="t1-terms">{c.terms.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}<div><dt>Signed</dt><dd><a href={c.terms_href}>read the signature ↗</a></dd></div></dl>
        </section>

        <section className="t1-sec" id="buy">
          <h2>How to buy</h2>
          <p className="sub">Four steps, once the pool is open.</p>
          <ol className="t1-steps">{c.steps.map(([h, s]) => <li key={h}><b>{h}</b><span>{s}</span></li>)}</ol>
        </section>
      </main>

      <footer className="t1-foot">
        <div className="w">
          <div className="row"><b>{d.name} · ${d.ticker}</b><span>built by the desk on EVERYNTH</span></div>
          <nav>
            {c.links.map(([k, href]) => <a key={k} href={href} target="_blank" rel="noopener noreferrer">{k} ↗</a>)}
            <a href={c.terms_href}>Signed terms</a>
            <Link href="/launchpad">EVERYNTH launchpad</Link>
          </nav>
          <p>{c.disclaimer}</p>
        </div>
      </footer>
    </div>
  );
}
