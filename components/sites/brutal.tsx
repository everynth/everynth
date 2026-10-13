import Link from "next/link";
import { copy, type SiteData } from "./index";

// Template 3 — Brutal. Thick black lines, flat colour, hard shadows, oversized type. Loud on purpose.
const css = `
.t3{--a:var(--accent);background:#fff8e7;color:#000;font-family:var(--font-geist-sans),system-ui,sans-serif;min-height:100vh;line-height:1.35}
.t3 a{color:inherit}
.t3 .w{max-width:1080px;margin:0 auto;padding:0 20px}
.t3-nav{position:sticky;top:0;z-index:2;background:var(--a);border-bottom:4px solid #000}
.t3-nav .w{display:flex;align-items:center;gap:16px;height:64px}
.t3-nav b{font-size:22px;font-weight:900;letter-spacing:-.03em;text-transform:uppercase}
.t3-nav nav{display:flex;gap:14px;margin-left:auto;font-weight:700;text-transform:uppercase;font-size:13px}
.t3-nav nav a{text-decoration:none}
.t3 .t3-btn{display:inline-block;padding:12px 20px;background:#000;color:#fff;font-weight:900;text-transform:uppercase;text-decoration:none;border:3px solid #000;box-shadow:5px 5px 0 #000;font-size:14px;transition:transform .1s,box-shadow .1s}
.t3 .t3-btn.alt{background:#fff;color:#000}
.t3 .t3-btn:active{transform:translate(3px,3px);box-shadow:2px 2px 0 #000}
.t3-nav .t3-btn{background:#fff;color:#000;box-shadow:4px 4px 0 #000}
.t3-hero{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr);gap:30px;align-items:center;padding:48px 0 32px}
.t3-hero h1{font-size:clamp(3rem,9vw,6.5rem);line-height:.9;font-weight:900;letter-spacing:-.05em;text-transform:uppercase;margin:0}
.t3-hero h1 span{display:block;color:var(--a);-webkit-text-stroke:3px #000;paint-order:stroke fill}
.t3-hero p{font-size:19px;font-weight:600;margin:18px 0 0;max-width:46ch}
.t3-cta{display:flex;flex-wrap:wrap;gap:14px;margin-top:26px;align-items:center}
.t3-ca{padding:10px 14px;border:3px solid #000;background:#fff;font-family:var(--font-geist-mono),monospace;font-weight:700;font-size:13px}
.t3-photo-wrap{position:relative}
.t3-photo{aspect-ratio:1;border:4px solid #000;box-shadow:12px 12px 0 #000;background:var(--a);display:grid;place-items:center;font-size:160px;font-weight:900;overflow:hidden;transform:rotate(2deg)}
.t3-photo img{width:100%;height:100%;object-fit:cover;display:block}
.t3-sticker{position:absolute;right:-14px;top:-14px;transform:rotate(-12deg);background:#fff;border:3px solid #000;padding:8px 12px;font-weight:900;text-transform:uppercase;font-size:13px;box-shadow:4px 4px 0 #000}
.t3-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:24px 0 48px}
.t3-stats div{border:3px solid #000;background:#fff;padding:16px;box-shadow:6px 6px 0 #000}
.t3-stats dt{font-weight:800;text-transform:uppercase;font-size:12px}
.t3-stats dd{margin:4px 0 0;font-size:30px;font-weight:900;letter-spacing:-.03em}
.t3-stats small{display:block;font-size:11px;font-weight:600;color:#555}
.t3 h2{font-size:clamp(1.8rem,4vw,2.6rem);font-weight:900;text-transform:uppercase;letter-spacing:-.03em;margin:0 0 14px;display:inline-block;background:var(--a);padding:2px 10px;border:3px solid #000;box-shadow:5px 5px 0 #000}
.t3-sec{padding:16px 0 44px}
.t3-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.t3-card{border:3px solid #000;background:#fff;padding:18px;box-shadow:7px 7px 0 #000}
.t3-card b{display:inline-block;background:#000;color:#fff;padding:2px 8px;font-size:12px;font-weight:900;margin-bottom:10px}
.t3-card h3{margin:0 0 6px;font-size:20px;font-weight:900;letter-spacing:-.02em;text-transform:uppercase}
.t3-card p{margin:0;font-size:15px;font-weight:500}
.t3-card.wide{background:var(--a)}
.t3-terms{display:grid;grid-template-columns:repeat(2,1fr);gap:0;border:3px solid #000;background:#fff;box-shadow:7px 7px 0 #000}
.t3-terms div{padding:14px 18px;border-bottom:3px solid #000}
.t3-terms div:nth-child(odd){border-right:3px solid #000}
.t3-terms div:nth-last-child(-n+2){border-bottom:0}
.t3-terms dt{font-weight:900;text-transform:uppercase;font-size:12px}
.t3-terms dd{margin:2px 0 0;font-size:16px;font-weight:600}
.t3-steps{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;padding:0;margin:0;list-style:none;counter-reset:s}
.t3-steps li{counter-increment:s;border:3px solid #000;background:#fff;padding:18px;box-shadow:6px 6px 0 #000;position:relative}
.t3-steps li::before{content:counter(s);position:absolute;top:-16px;left:-10px;width:34px;height:34px;display:grid;place-items:center;background:var(--a);border:3px solid #000;font-weight:900;border-radius:50%}
.t3-steps b{display:block;font-size:17px;font-weight:900;text-transform:uppercase;margin:4px 0 4px}
.t3-steps span{font-size:14px;font-weight:500}
.t3-foot{background:#000;color:#fff;padding:36px 0 44px;border-top:4px solid #000}
.t3-foot .w{display:grid;gap:16px}
.t3-foot .row b{font-size:26px;font-weight:900;text-transform:uppercase;letter-spacing:-.03em}
.t3-foot nav{display:flex;flex-wrap:wrap;gap:10px}
.t3-foot nav a{text-decoration:none;background:#fff;color:#000;padding:8px 12px;font-weight:900;text-transform:uppercase;font-size:12px;border:3px solid #fff}
.t3-foot nav a.a{background:var(--a);border-color:var(--a)}
.t3-foot p{margin:0;font-size:12.5px;color:#bbb;max-width:80ch}
@media(max-width:860px){.t3-hero{grid-template-columns:1fr;padding-top:28px}.t3-photo-wrap{width:min(100%,340px);margin:12px auto 0}.t3-stats,.t3-steps{grid-template-columns:repeat(2,1fr)}.t3-cards{grid-template-columns:1fr}.t3-nav nav{display:none}}
@media(max-width:520px){.t3-stats,.t3-steps,.t3-terms{grid-template-columns:1fr}.t3-terms div:nth-child(odd){border-right:0}.t3-terms div:nth-last-child(-n+2){border-bottom:3px solid #000}.t3-terms div:last-child{border-bottom:0}}
`;

export function Brutal({ d }: { d: SiteData }) {
  const c = copy(d);
  return (
    <div className="t3" style={{ "--accent": d.color } as React.CSSProperties}>
      <style>{css}</style>
      <header className="t3-nav">
        <div className="w">
          <b>${d.ticker}</b>
          <nav><a href="#story">Story</a><a href="#utility">Utility</a><a href="#terms">Terms</a><a href="#buy">Buy</a></nav>
          <a className="t3-btn" href="#buy">Buy ${d.ticker}</a>
        </div>
      </header>

      <main className="w">
        <section className="t3-hero">
          <div>
            <h1>{d.name}<span>${d.ticker}</span></h1>
            <p>{c.tagline}</p>
            <div className="t3-cta">
              <a className="t3-btn" href="#buy">Buy ${d.ticker}</a>
              <span className="t3-ca">CA: AFTER LAUNCH</span>
            </div>
          </div>
          <div className="t3-photo-wrap">
            <div className="t3-photo">
              {/* eslint-disable-next-line @next/next/no-img-element -- our own API route */}
              {d.photo ? <img src={d.photo} alt="" /> : d.ticker[0]}
            </div>
            <span className="t3-sticker">frozen · not minted</span>
          </div>
        </section>

        <dl className="t3-stats">{c.stats.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd><small>live when the pool opens</small></div>)}</dl>

        <section className="t3-sec" id="story">
          <h2>The story</h2>
          <div className="t3-cards">
            <article className="t3-card wide"><b>01</b><h3>What it is</h3><p>{d.description}</p></article>
            <article className="t3-card"><b>02</b><h3>Backed by</h3><p>{d.utility} — a utility that already works on EVERYNTH.{d.theme ? ` Theme: ${d.theme}.` : ""}</p></article>
            <article className="t3-card"><b>03</b><h3>Why hold</h3><p>Hold {d.gateBalance.toLocaleString("en-US")} ${d.ticker} and {d.gateUnlocks} opens. Sell below it and it closes.</p></article>
          </div>
        </section>

        <section className="t3-sec" id="utility">
          <h2>Utility</h2>
          <div className="t3-card">
            <h3>{d.utility}</h3>
            <p>{d.gateBalance.toLocaleString("en-US")} ${d.ticker} unlocks {d.gateUnlocks}.{" "}
              {d.utilityUrl ? <a href={d.utilityUrl} target="_blank" rel="noopener noreferrer">Open it ↗</a> : <a href={`/p/${d.productId}`}>On the market ↗</a>}
            </p>
          </div>
        </section>

        <section className="t3-sec" id="terms">
          <h2>Terms</h2>
          <dl className="t3-terms">{c.terms.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}<div><dt>Signed</dt><dd><a href={c.terms_href}>read the signature ↗</a></dd></div></dl>
        </section>

        <section className="t3-sec" id="buy">
          <h2>How to buy</h2>
          <ol className="t3-steps">{c.steps.map(([h, s]) => <li key={h}><b>{h}</b><span>{s}</span></li>)}</ol>
        </section>
      </main>

      <footer className="t3-foot">
        <div className="w">
          <div className="row"><b>{d.name} · ${d.ticker}</b></div>
          <nav>
            {c.links.map(([k, href]) => <a key={k} className="a" href={href} target="_blank" rel="noopener noreferrer">{k}</a>)}
            <a href={c.terms_href}>Signed terms</a>
            <Link href="/launchpad">EVERYNTH</Link>
          </nav>
          <p>Built by the desk on EVERYNTH. {c.disclaimer}</p>
        </div>
      </footer>
    </div>
  );
}
