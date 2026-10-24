import Link from "next/link";
import { CopyButton } from "@/components/copy-button";
import { Markdown } from "@/components/monitor";
import { usd } from "@/lib/sol-price";
import { studioAgent } from "@/lib/studio";
import { Glow } from "./glow";
import { copy, type SiteData } from "./index";

// The token's landing page, the shape hireagents.fun gives every coin: a header with the ticker and
// a buy button, the banner with the avatar over it, the headline and the buy card, the live numbers,
// then story, why hold, utility, the board (chart, trades, swap), the desk's updates, the terms, a
// closing call and the footer. Three looks — basic (light), glow (dark), brutal (loud) — are the
// same page with different tokens. Every number that does not exist yet is shown as missing.
const css = `
.l{--a:var(--accent);--bg:#07080a;--fg:#f2f5fa;--mut:#8b93a1;--card:#101115;--line:rgba(255,255,255,.1);--rad:18px;--shadow:0 20px 50px rgba(0,0,0,.45);--up:#7be0a8;--down:#f2a0a0;--disp:var(--font-geist-sans),system-ui,sans-serif;
  background:var(--bg);color:var(--fg);font-family:var(--font-geist-sans),system-ui,sans-serif;min-height:100vh;line-height:1.5;font-size:15px}
.l-basic{--bg:#fafafa;--fg:#111;--mut:#5b6472;--card:#fff;--line:rgba(0,0,0,.1);--shadow:0 20px 50px rgba(0,0,0,.08)}
.l-brutal{--bg:#fff8e7;--fg:#000;--mut:#333;--card:#fff;--line:#000;--rad:0;--shadow:8px 8px 0 #000}
.l a{color:inherit}
.l-wrap{max-width:1180px;margin:0 auto;padding:0 20px}
/* header */
.l-top{position:sticky;top:0;z-index:5;background:color-mix(in srgb,var(--bg) 82%,transparent);backdrop-filter:blur(16px) saturate(160%);border-bottom:1px solid var(--line)}
.l-top .l-wrap{display:flex;align-items:center;gap:18px;height:64px}
.l-brand{display:flex;align-items:center;gap:10px;text-decoration:none;font-weight:800;letter-spacing:.06em;font-size:15px}
.l-brand img{width:30px;height:30px;border-radius:50%;object-fit:cover;border:1px solid var(--line)}
.l-nav{display:flex;gap:4px;margin:0 auto}
.l-nav a{padding:8px 12px;border-radius:999px;font-size:13.5px;color:var(--mut);text-decoration:none}
.l-nav a:hover{color:var(--fg);background:color-mix(in srgb,var(--fg) 7%,transparent)}
.l .l-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:12px 22px;border-radius:999px;background:var(--a);color:#000;font-weight:700;text-decoration:none;border:0;font:inherit;font-weight:700;cursor:pointer;white-space:nowrap}
.l .l-btn.sm{padding:9px 16px;font-size:13.5px}
.l .l-ghost{display:inline-flex;align-items:center;padding:9px 14px;border-radius:999px;border:1px solid var(--line);font-size:13px;text-decoration:none;color:var(--fg);background:var(--card)}
.l-brutal .l-btn,.l-brutal .l-ghost{border-radius:0;border:2px solid #000;box-shadow:4px 4px 0 #000}
/* hero */
.l-hero{position:relative}
.l-banner{height:min(46vw,440px);background:var(--card) center/cover no-repeat;position:relative;overflow:hidden;display:grid;place-items:center}
.l-banner::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 35%,var(--bg) 100%)}
.l-banner .l-wm{font-size:clamp(70px,16vw,220px);font-weight:900;letter-spacing:-.05em;color:var(--a);opacity:.18;line-height:1}
.l-banner.l-gen{background:radial-gradient(70% 120% at 80% 0%,color-mix(in srgb,var(--a) 55%,transparent),transparent 70%),linear-gradient(180deg,color-mix(in srgb,var(--a) 30%,var(--bg)),var(--bg))}
.l-hero-body{position:relative;display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:32px;align-items:end;margin-top:-90px;padding-bottom:28px}
.l-avatar{width:120px;height:120px;border-radius:50%;object-fit:cover;border:4px solid var(--bg);box-shadow:var(--shadow);background:var(--card);display:block}
.l-brutal .l-avatar{border-radius:0;border:3px solid #000}
.l-pills{display:flex;flex-wrap:wrap;gap:8px;margin:18px 0 14px}
.l-pill{display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:999px;border:1px solid var(--line);font-size:12.5px;color:var(--mut);background:var(--card)}
.l-pill.on{background:var(--a);color:#000;border-color:transparent;font-weight:700}
.l-pill i{width:7px;height:7px;border-radius:50%;background:var(--up);display:inline-block}
.l-hero h1{font-family:var(--disp);font-size:clamp(56px,9vw,112px);font-weight:900;letter-spacing:-.05em;line-height:.92;margin:0;text-transform:uppercase}
.l-hero h2{font-size:clamp(22px,3vw,34px);font-weight:700;letter-spacing:-.02em;margin:14px 0 8px;line-height:1.15}
.l-hero p{color:var(--mut);max-width:58ch;margin:0;font-size:16px}
.l-buy{background:var(--card);border:1px solid var(--line);border-radius:var(--rad);box-shadow:var(--shadow);padding:16px;display:grid;gap:12px}
.l-buy .l-btn{width:100%;font-size:16px;padding:14px 20px}
.l-ca{display:grid;gap:6px;padding:12px;border-radius:calc(var(--rad) - 6px);border:1px solid var(--line);background:color-mix(in srgb,var(--fg) 4%,transparent)}
.l-ca small{font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--mut)}
.l-ca code{font-family:var(--font-geist-mono),monospace;font-size:11px;word-break:break-all;color:var(--fg)}
.l-ca .cp{justify-self:start;padding:5px 10px;border-radius:999px;border:1px solid var(--line);background:var(--card);font-size:12px;cursor:pointer;color:var(--fg);font:inherit}
.l-buy p{margin:0;font-size:12px;color:var(--mut);line-height:1.5}
/* stats */
.l-stats{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin:8px 0 56px}
.l-stat{background:var(--card);border:1px solid var(--line);border-radius:var(--rad);padding:16px 18px;box-shadow:var(--shadow)}
.l-stat small{display:block;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--mut);margin-bottom:8px}
.l-stat b{display:block;font-family:var(--disp);font-size:28px;font-weight:800;letter-spacing:-.03em;line-height:1;color:var(--a)}
.l-stat b.up{color:var(--up)}.l-stat b.down{color:var(--down)}.l-stat b.plain{color:var(--fg)}
.l-stat span{display:block;margin-top:6px;font-size:11.5px;color:var(--mut)}
.l-bar{height:5px;border-radius:3px;background:color-mix(in srgb,var(--fg) 10%,transparent);margin-top:10px;overflow:hidden}
.l-bar i{display:block;height:100%;background:linear-gradient(90deg,var(--a),var(--up))}
.l-live{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--mut);margin:0 0 12px}
.l-live i{width:7px;height:7px;border-radius:50%;background:var(--up);box-shadow:0 0 8px var(--up)}
/* sections */
.l-sec{padding:0 0 64px;scroll-margin-top:80px}
.l-k{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--a);font-weight:700;margin:0 0 10px}
.l-sec h2{font-family:var(--disp);font-size:clamp(34px,5vw,56px);font-weight:900;letter-spacing:-.04em;line-height:.95;margin:0 0 22px;text-transform:uppercase}
.l-two{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.4fr);gap:36px;align-items:start}
.l-prose{font-size:16px;color:var(--fg);max-width:72ch}
.l-prose p{color:color-mix(in srgb,var(--fg) 85%,var(--mut))}
.l-card{background:var(--card);border:1px solid var(--line);border-radius:var(--rad);padding:22px;box-shadow:var(--shadow)}
.l-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.l-grid .l-card b{display:block;font-size:17px;margin-bottom:8px;letter-spacing:-.01em}
.l-grid .l-card p{margin:0;color:var(--mut);font-size:14px}
.l-story{grid-template-columns:repeat(2,1fr)}
.l-story .l-card b{font-family:var(--disp);font-size:22px;font-weight:900;letter-spacing:-.03em;text-transform:uppercase;margin-bottom:12px}
.l-story .l-card.wide{grid-column:1/-1}
.l-story .l-prose h1,.l-story .l-prose h2,.l-story .l-prose h3{font-size:15px;margin:14px 0 6px}
.l-grid .l-card i{display:block;width:36px;height:36px;border-radius:12px;background:linear-gradient(135deg,var(--a),color-mix(in srgb,var(--a) 30%,var(--bg)));margin-bottom:14px}
.l-brutal .l-grid .l-card i{border-radius:0;border:2px solid #000}
.l-gate{display:flex;flex-wrap:wrap;gap:18px;align-items:center;justify-content:space-between}
.l-gate b{font-size:22px;letter-spacing:-.02em}
.l-posts{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.l-post small{display:flex;gap:8px;align-items:center;font-size:12px;color:var(--mut);margin-bottom:10px}
.l-post small b{color:var(--fg);font-weight:600}
.l-post p{margin:0;font-size:14px;color:color-mix(in srgb,var(--fg) 80%,var(--mut));display:-webkit-box;-webkit-line-clamp:6;-webkit-box-orient:vertical;overflow:hidden}
.l-post a{display:inline-block;margin-top:12px;font-size:13px;color:var(--a);text-decoration:none}
.l-rounds{width:100%;border-collapse:collapse;font-size:13px;font-variant-numeric:tabular-nums;white-space:nowrap}
.l-rounds th{text-align:left;padding:12px 16px;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--mut);border-bottom:1px solid var(--line)}
.l-rounds td{padding:11px 16px;border-bottom:1px solid var(--line)}
.l-rounds tr:last-child td{border-bottom:0}
.l-rounds th:not(:first-child),.l-rounds td:not(:first-child){text-align:right}
.l-terms{display:grid;grid-template-columns:repeat(2,1fr);gap:1px;background:var(--line);border:1px solid var(--line);border-radius:var(--rad);overflow:hidden}
.l-terms div{background:var(--card);padding:14px 18px;display:grid;gap:3px}
.l-terms dt{font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--mut)}
.l-terms dd{margin:0;font-size:14px}
/* close + footer */
.l-cta{display:grid;grid-template-columns:minmax(0,1fr) 180px;gap:28px;align-items:center;background:var(--a);color:#000;border-radius:calc(var(--rad) + 8px);padding:40px 44px;margin:0 0 56px;box-shadow:var(--shadow)}
.l-cta h3{font-family:var(--disp);font-size:clamp(40px,6vw,72px);font-weight:900;letter-spacing:-.05em;line-height:.9;margin:0 0 10px;text-transform:uppercase}
.l-cta p{margin:0 0 18px;font-size:16px;color:rgba(0,0,0,.75)}
.l-cta .l-btn{background:#000;color:#fff}
.l-cta .l-ghost{background:transparent;border-color:rgba(0,0,0,.35);color:#000;margin-left:8px}
.l-cta img{width:180px;height:180px;border-radius:50%;object-fit:cover;border:6px solid rgba(255,255,255,.85);justify-self:end}
.l-brutal .l-cta{border:3px solid #000}
.l-foot{border-top:1px solid var(--line);padding:28px 0 40px;color:var(--mut);font-size:13px}
.l-foot .l-wrap{display:grid;gap:14px}
.l-foot .row{display:flex;flex-wrap:wrap;gap:16px;align-items:center;justify-content:space-between}
.l-foot nav{display:flex;flex-wrap:wrap;gap:14px}
.l-foot nav a{text-decoration:none;color:var(--fg)}
.l-foot .disc{font-size:12px;line-height:1.6;max-width:90ch}
@media(max-width:960px){.l-hero-body{grid-template-columns:minmax(0,1fr);margin-top:-70px}.l-stats{grid-template-columns:repeat(2,1fr)}.l-two,.l-grid,.l-posts,.l-story{grid-template-columns:minmax(0,1fr)}.l-nav{display:none}.l-cta{grid-template-columns:minmax(0,1fr)}.l-cta img{display:none}}
`;

/** A markdown narrative cut at its headings, one card each; what comes before the first heading is the introduction. */
function chapters(md: string): { title: string; body: string }[] {
  const out: { title: string; body: string[] }[] = [];
  let cur = { title: "Introduction", body: [] as string[] };
  for (const line of md.replace(/\r/g, "").split("\n")) {
    const h = /^#{1,3}\s+(.+)$/.exec(line);
    if (h) { if (cur.body.join("").trim()) out.push(cur); cur = { title: h[1].replace(/[*_#]/g, "").trim(), body: [] }; }
    else cur.body.push(line);
  }
  if (cur.body.join("").trim()) out.push(cur);
  return out.map((c) => ({ title: c.title, body: c.body.join("\n").trim() }));
}

export function Landing({ d }: { d: SiteData }) {
  const c = copy(d);
  const cv = d.curve;
  const look = ["basic", "glow", "brutal"].includes(d.template) ? d.template : "glow";
  const money = (v: number) => (d.solUsd ? usd(v * d.solUsd) : `${v.toFixed(2)} SOL`);
  const n = (v: number) => v.toLocaleString("en-US");
  const narrative = d.work.find((w) => w.kind === "narrative")?.output ?? null;
  const tagline = d.site?.tagline || d.description;
  const intro = d.site?.intro || (d.site ? "" : `Hold ${n(d.gateBalance)} $${d.ticker} and ${d.gateUnlocks} opens.`);
  const cta = d.site?.cta || `Buy $${d.ticker}`;
  const props = d.site?.props?.length ? d.site.props : [
    { title: "A utility behind it", text: `$${d.ticker} is launched on ${d.utility}: hold ${n(d.gateBalance)} and it opens.` },
    { title: d.pair === "evyn" ? "Paired with EVYN" : "Paired with SOL", text: d.pair === "evyn" ? "Bought through EVYN; creator fees arrive in EVYN and half of every round is burned." : "A plain pump.fun curve, quoted in SOL." },
    { title: "Mechanics on the fee", text: d.mechanics.length ? `${d.mechanics.join(", ")} — run by the EVERYNTH vault on what the coin earns.` : "Creator fees go to the EVERYNTH vault in full." },
  ];
  const kindName: Record<string, string> = { identity: "Logo & banner", narrative: "Narrative", site: "Site copy" };
  const excerpt = (s: string) => s.replace(/```[\s\S]*?```/g, "").replace(/[#*_>|`]/g, "").replace(/\s+/g, " ").trim().slice(0, 320);
  const when = (iso: string) => iso.slice(0, 10);
  const change = d.change24;
  const live = !!d.mint;

  return (
    <div className={`l l-${look}`} style={{ "--accent": d.color } as React.CSSProperties}>
      <style>{css}</style>

      <header className="l-top">
        <div className="l-wrap">
          <a className="l-brand" href="#top">
            {/* eslint-disable-next-line @next/next/no-img-element -- our own API route */}
            <img src={d.logo} alt="" />${d.ticker}
          </a>
          <nav className="l-nav">
            <a href="#chart">Chart</a><a href="#story">Story</a><a href="#utility">Utility</a><a href="#updates">Updates</a><a href={c.terms_href}>Terms</a>
          </nav>
          <a className="l-btn sm" href="#chart">{cta}</a>
          <a className="l-ghost" href={c.terminal_href}>Terminal ↗</a>
        </div>
      </header>

      <section className="l-hero" id="top">
        <div className={`l-banner${d.banner ? "" : " l-gen"}`} style={d.banner ? { backgroundImage: `url(${d.banner})` } : undefined}>
          {!d.banner && <span className="l-wm">${d.ticker}</span>}
        </div>
        <div className="l-wrap l-hero-body">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element -- our own API route */}
            <img className="l-avatar" src={d.logo} alt={`${d.name} logo`} />
            <div className="l-pills">
              <span className="l-pill on">${d.ticker}</span>
              <span className="l-pill"><i style={live ? undefined : { background: "var(--mut)", boxShadow: "none" }} />{cv?.complete ? "Graduated · PumpSwap" : live ? "Live on pump.fun" : "Not launched yet"}</span>
              <span className="l-pill">Paired with {d.pair === "evyn" ? "$EVYN" : "SOL"}</span>
              <span className="l-pill">{d.utility}</span>
            </div>
            <h1>{d.name}</h1>
            <h2>{tagline}</h2>
            {intro && <p>{intro}</p>}
          </div>
          <aside className="l-buy">
            <a className="l-btn" href="#chart">{cta}</a>
            <div className="l-ca">
              <small>Contract address</small>
              {c.ca ? <><code>{c.ca.full}</code><CopyButton text={c.ca.full} label="Copy" className="cp" /></> : <code>after launch</code>}
            </div>
            <a className="l-ghost" href={c.share_href} target="_blank" rel="noopener noreferrer" style={{ justifyContent: "center" }}>Share on 𝕏</a>
            <p>Trades on pump.fun&apos;s bonding curve, from this page. Pay with SOL{d.pair === "evyn" ? ", routed through $EVYN" : ""}. Prices include pump.fun&apos;s fees; the creator fee goes to the EVERYNTH vault, which runs the mechanics.</p>
          </aside>
        </div>
      </section>

      <div className="l-wrap">
        <p className="l-live"><i />{live ? "Live market data · read from the chain on every view" : "Numbers appear once the coin is on the curve"}</p>
        <div className="l-stats">
          <div className="l-stat"><small>Market cap</small><b>{cv ? money(cv.marketCapSol) : "—"}</b><span>{cv && d.solUsd ? `${cv.marketCapSol.toFixed(2)} SOL` : live ? "reading the curve…" : "after launch"}</span></div>
          <div className="l-stat"><small>Holders</small><b className="plain">{d.holders === null ? "—" : d.holders >= 20 ? "20+" : d.holders}</b><span>{live ? "top accounts on chain" : "after launch"}</span></div>
          <div className="l-stat"><small>24h volume</small><b className="plain">{d.vol24Sol === null ? "—" : money(d.vol24Sol)}</b><span>{d.vol24Sol === null ? (live ? "no trades read" : "after launch") : "over the trades read"}</span></div>
          <div className="l-stat"><small>24h change</small><b className={change === null ? "plain" : change >= 0 ? "up" : "down"}>{change === null ? "—" : `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`}</b><span>{change === null ? (live ? "needs a day of trades" : "after launch") : "market cap, since a day ago"}</span></div>
          <div className="l-stat"><small>Bonding curve</small><b className="plain">{cv ? `${cv.progress.toFixed(1)}%` : "—"}</b><div className="l-bar"><i style={{ width: `${cv?.progress ?? 0}%` }} /></div></div>
        </div>
      </div>

      <section className="l-wrap l-sec" id="story">
        <p className="l-k">$${d.ticker}</p>
        <h2>Story</h2>
        <p style={{ color: "var(--mut)", maxWidth: "60ch", margin: "-8px 0 22px" }}>{narrative ? "Written by the desk from the signed terms. First person plural: the team speaking." : d.desk ? "The desk writes the full story once the coin is on the curve. Until then, the launcher's pitch." : "The launcher's pitch, as signed."}</p>
        <div className="l-grid l-story">
          {(narrative ? chapters(narrative) : [{ title: "Introduction", body: d.description }]).map((ch) => (
            <div key={ch.title} className={`l-card${/faq|question/i.test(ch.title) ? " wide" : ""}`}>
              <b>{ch.title}</b>
              <div className="l-prose" style={{ fontSize: 14.5 }}><Markdown text={ch.body} /></div>
            </div>
          ))}
        </div>
      </section>

      <section className="l-wrap l-sec" id="why">
        <p className="l-k">Why hold</p>
        <h2>What the coin does</h2>
        <div className="l-grid">
          {props.map((p) => <div key={p.title} className="l-card"><i /><b>{p.title}</b><p>{p.text}</p></div>)}
        </div>
      </section>

      <section className="l-wrap l-sec" id="utility">
        <p className="l-k">The utility</p>
        <h2>{d.utility}</h2>
        <div className="l-card l-gate">
          <div>
            <b>Hold {n(d.gateBalance)} ${d.ticker} → {d.gateUnlocks}</b>
            <p style={{ margin: "6px 0 0", color: "var(--mut)" }}>That is the whole rule, read from the chain: hold at least that much and it opens; sell below it and it closes.</p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {d.utilityUrl && <a className="l-btn sm" href={d.utilityUrl} target="_blank" rel="noopener noreferrer">Open the utility ↗</a>}
            <Link className="l-ghost" href={`/p/${d.productId}`}>See it on the market ↗</Link>
          </div>
        </div>
      </section>

      <section className="l-wrap l-sec" id="chart">
        <p className="l-k">Trade</p>
        <h2>Chart &amp; swap <a href={c.terminal_href} className="l-ghost" style={{ verticalAlign: "middle", marginLeft: 12, textTransform: "none", letterSpacing: 0, fontWeight: 500 }}>Open the terminal ↗</a></h2>
        <Glow d={d} embed />
      </section>

      {d.site?.sections?.length ? (
        <section className="l-wrap l-sec" id="more">
          <div className="l-grid" style={{ gridTemplateColumns: "repeat(2,1fr)" }}>
            {d.site.sections.map((s) => <div key={s.title} className="l-card"><b>{s.title}</b><div className="l-prose" style={{ fontSize: 14 }}><Markdown text={s.body} /></div></div>)}
          </div>
        </section>
      ) : null}

      <section className="l-wrap l-sec" id="updates">
        <p className="l-k">Updates</p>
        <h2>From the desk</h2>
        {d.work.length ? (
          <div className="l-posts">
            {d.work.map((w) => (
              <div key={w.kind} className="l-card l-post">
                <small><b>{studioAgent(w.agent)?.name ?? w.agent}</b> · {kindName[w.kind] ?? w.kind} · {when(w.created_at)}</small>
                {w.kind === "identity" && d.banner ? (
                  // eslint-disable-next-line @next/next/no-img-element -- our own API route
                  <img src={d.banner} alt="" style={{ width: "100%", borderRadius: 10, marginBottom: 10, border: "1px solid var(--line)" }} />
                ) : null}
                <p>{excerpt(w.output)}</p>
                <a href={c.terms_href}>Read the whole delivery →</a>
              </div>
            ))}
          </div>
        ) : (
          <div className="l-card" style={{ color: "var(--mut)" }}>{d.desk ? "Nothing from the desk yet. The launcher puts it to work once the coin is on the curve; its logo, banner, narrative and site copy land here." : "A coin paired with SOL gets no desk. Everything on this page was written by the launcher and read from the chain."}</div>
        )}
      </section>

      <section className="l-wrap l-sec" id="vault">
        <p className="l-k">The mechanics, running</p>
        <h2>From the vault {live && <a href={`/api/launches/${d.slug}/rounds`} className="l-ghost" style={{ verticalAlign: "middle", marginLeft: 12, textTransform: "none", letterSpacing: 0, fontWeight: 500 }}>Every round, CSV ↓</a>}</h2>
        {d.rounds.length ? (
          <div className="l-card" style={{ padding: 0, overflow: "auto" }}>
            <table className="l-rounds">
              <thead><tr><th>Round</th><th>Swept</th><th>Burned EVYN</th><th>Buyback</th><th>Burned ${d.ticker}</th><th>To holders</th><th>Held</th></tr></thead>
              <tbody>
                {d.rounds.map((r) => {
                  const q = (v: string) => (r.quote === "EVYN" ? `${(Number(v) / 1e6).toLocaleString("en-US", { maximumFractionDigits: 2 })} EVYN` : `${(Number(v) / 1e9).toFixed(4)} SOL`);
                  const dash = (v: string, f: (v: string) => string) => (Number(v) > 0 ? f(v) : "—");
                  return (
                    <tr key={r.id}>
                      <td>{r.created_at.slice(0, 16).replace("T", " ")}</td>
                      <td>{q(r.swept)}</td>
                      <td>{dash(r.burned_quote, (v) => `${(Number(v) / 1e6).toLocaleString("en-US", { maximumFractionDigits: 2 })}`)}</td>
                      <td>{dash(r.buyback, q)}</td>
                      <td>{dash(r.burned, (v) => (Number(v) / 1e6).toLocaleString("en-US", { maximumFractionDigits: 0 }))}</td>
                      <td>{dash(r.holders, q)}</td>
                      <td>{dash(r.held, q)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="l-card" style={{ color: "var(--mut)" }}>{live ? "No fee round yet. The vault sweeps what the coin earned every fifteen minutes and runs the mechanics with it; each round lands here." : "Fee rounds start once the coin is on the curve."}</div>
        )}
      </section>

      <section className="l-wrap l-sec" id="terms">
        <p className="l-k">Signed terms</p>
        <h2>The rules</h2>
        <dl className="l-terms">
          {c.terms.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
          <div><dt>Signed</dt><dd><a href={c.terms_href}>read the signature ↗</a> · {d.signedAt.toUTCString().slice(5, 16)}</dd></div>
        </dl>
      </section>

      <div className="l-wrap">
        <div className="l-cta">
          <div>
            <h3>${d.ticker}</h3>
            <p>Trade {d.name} on EVERYNTH. Pay with SOL{d.pair === "evyn" ? " or $EVYN" : ""}.</p>
            <a className="l-btn" href="#chart">{cta}</a>
            {c.ca && <CopyButton text={c.ca.full} label="Copy contract address" className="l-ghost" />}
            <a className="l-ghost" href={c.share_href} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 8 }}>Share on 𝕏</a>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element -- our own API route */}
          <img src={d.logo} alt="" />
        </div>
      </div>

      <footer className="l-foot">
        <div className="l-wrap">
          <div className="row">
            <a className="l-brand" href="#top">
              {/* eslint-disable-next-line @next/next/no-img-element -- our own API route */}
              <img src={d.logo} alt="" />${d.ticker} <span style={{ fontWeight: 400, color: "var(--mut)", letterSpacing: 0 }}>{d.name}</span>
            </a>
            <span>Paired with {d.pair === "evyn" ? "$EVYN" : "SOL"} · {d.desk ? "built by the EVERYNTH desk" : "on EVERYNTH"}</span>
            <nav>
              {c.links.map(([k, href]) => <a key={k} href={href} target="_blank" rel="noopener noreferrer">{k} ↗</a>)}
              {c.ca?.explorer && <a href={c.ca.explorer} target="_blank" rel="noopener noreferrer">Solscan ↗</a>}
              {d.mint && <a href={`https://pump.fun/coin/${d.mint}`} target="_blank" rel="noopener noreferrer">pump.fun ↗</a>}
              <a href={c.terms_href}>Signed terms</a>
              <Link href="/launchpad">EVERYNTH launchpad</Link>
            </nav>
          </div>
          <p className="disc">EVERYNTH does not endorse or recommend any token launched on it. {c.disclaimer} This page is written and kept up to date by the desk from the signed terms and on-chain data; always check the contract address before you buy.</p>
        </div>
      </footer>
    </div>
  );
}
