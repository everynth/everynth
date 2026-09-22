import Link from "next/link";
import { Avatar, short } from "@/components/avatar";
import { Spark } from "@/components/spark";
import { byCategory, pulse, topCreators, trending } from "@/lib/market";
import { formatSol } from "@/lib/money";

export const metadata = { title: "Live stats — EVERYNTH" };

// Live numbers straight from products + purchases. Nothing cached, nothing estimated.
export default async function StatsPage() {
  const [p, hot, creators, cats] = await Promise.all([pulse(30), trending(10), topCreators(10), byCategory()]);
  const maxCat = Math.max(1, ...cats.map((c) => c.sales));
  const last7 = p.days.slice(-7).reduce((a, b) => a + b, 0);
  const prev7 = p.days.slice(-14, -7).reduce((a, b) => a + b, 0);

  return (
    <div className="dash">
      <div className="dash-sec rise">
        <div>
          <p className="kicker">Live · Solana mainnet</p>
          <h1 className="dash-sec-title" style={{ fontSize: "1.8rem" }}>Live stats</h1>
          <p className="dash-sec-sub">Read from the database on every visit. Volume is what buyers paid; 95% of it went straight to creators.</p>
        </div>
      </div>

      <section className="panel panel-feature rise rise-2" aria-label="Market pulse">
        <div className="feature-left">
          <header className="panel-head"><h2>Market pulse</h2><span>all time</span></header>
          <dl className="pulse">
            <div><dt>Live products</dt><dd className="chrome">{p.live}</dd></div>
            <div><dt>Purchases settled</dt><dd className="chrome">{p.sales}</dd></div>
            <div><dt>Volume</dt><dd className="chrome">{formatSol(p.volume)}<small> SOL</small></dd></div>
            <div><dt>Creators</dt><dd className="chrome">{p.creators}</dd></div>
            <div><dt>Last 7 days</dt><dd className="chrome">{last7}<small> {prev7 ? `${last7 >= prev7 ? "+" : ""}${last7 - prev7} vs prior 7` : "purchases"}</small></dd></div>
            <div><dt>To creators</dt><dd className="chrome">{formatSol(Math.round(p.volume * 0.95))}<small> SOL</small></dd></div>
          </dl>
        </div>
        <div className="feature-art">
          <p className="kicker">Purchases · last 30 days</p>
          <Spark days={p.days} height={150} />
          <p className="kicker" style={{ marginTop: 8 }}>Volume · SOL per day</p>
          <Spark days={p.volumeDays} height={90} />
        </div>
      </section>

      <div className="dash-row3 stats-row">
        <section className="panel rise rise-3" aria-labelledby="trending-h">
          <header className="panel-head"><h2 id="trending-h">🔥 Trending</h2><span>sold · price</span></header>
          <ol className="plist">
            {hot.length === 0 && <li className="pempty">No products yet</li>}
            {hot.map((x, i) => (
              <li key={x.id}>
                <Link href={`/p/${x.id}`} className="prow">
                  <span className="rank mono">{String(i + 1).padStart(2, "0")}</span>
                  <span className="prow-name">{x.title}<small>{x.category} · {short(x.creator)}</small></span>
                  <span className="prow-val"><b className="chrome">{x.sales}</b><small>{formatSol(x.price)} SOL</small></span>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <section className="panel rise rise-3" aria-labelledby="creators-h">
          <header className="panel-head"><h2 id="creators-h">Top creators</h2><span>earned · products</span></header>
          <ol className="plist">
            {creators.length === 0 && <li className="pempty">No creators yet</li>}
            {creators.map((c) => (
              <li key={c.creator}>
                <Link href={`/u/${c.creator}`} className="prow">
                  <Avatar seed={c.creator} />
                  <span className="prow-name mono">{short(c.creator)}<small>{c.sales} sold</small></span>
                  <span className="prow-val"><b className="chrome">{formatSol(c.earned)}</b><small>{c.products} live</small></span>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <section className="panel rise rise-4" aria-labelledby="cats-h">
          <header className="panel-head"><h2 id="cats-h">By category</h2><span>sold · live</span></header>
          <ol className="plist">
            {cats.length === 0 && <li className="pempty">No products yet</li>}
            {cats.map((c) => (
              <li key={c.category} className="catrow">
                <Link href={`/?category=${encodeURIComponent(c.category)}`} className="prow">
                  <span className="prow-name">{c.category}<small>{c.products} live</small></span>
                  <span className="prow-val"><b className="chrome">{c.sales}</b></span>
                </Link>
                <span className="bar-track" aria-hidden="true"><span className="bar-fill" style={{ width: `${(c.sales / maxCat) * 100}%` }} /></span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
