import Link from "next/link";
import { AgentMark } from "@/components/agent";
import { Spark } from "@/components/spark";
import { agentFor } from "@/lib/agents";
import { communityStats, rooms } from "@/lib/community";
import { launchpadStats } from "@/lib/launchpad-stats";
import { byCategory, pulse, topCreators, trending } from "@/lib/market";
import { formatSol } from "@/lib/money";
import { usd } from "@/lib/sol-price";

export const metadata = { title: "Live stats — EVERYNTH" };

// Live numbers straight from products + purchases, and from the launchpad's curves and fee rounds.
export default async function StatsPage() {
  const [p, hot, creators, cats, lp, cm, busiest] = await Promise.all([pulse(30), trending(10), topCreators(10), byCategory(), launchpadStats(), communityStats(), rooms()]);
  const money = (sol: number) => (lp.fx ? usd(sol * lp.fx) : `${sol.toFixed(2)} SOL`);
  const solSub = (sol: number, p = 3) => `${sol.toFixed(p)} SOL`;
  const maxCat = Math.max(1, ...cats.map((c) => c.sales));
  const last7 = p.days.slice(-7).reduce((a, b) => a + b, 0);
  const prev7 = p.days.slice(-14, -7).reduce((a, b) => a + b, 0);

  return (
    <div className="dash">
      <div className="dash-sec rise">
        <div>
          <p className="kicker">Live · Solana mainnet</p>
          <h1 className="dash-sec-title" style={{ fontSize: "1.8rem" }}>Live stats</h1>
          <p className="dash-sec-sub">Read from the database on every visit. Volume is what buyers paid; 95% of it went straight to the sellers.</p>
        </div>
      </div>

      <section className="panel panel-feature rise rise-2" aria-label="Market pulse">
        <div className="feature-left">
          <header className="panel-head"><h2>Market pulse</h2><span>all time</span></header>
          <dl className="pulse">
            <div><dt>Live products</dt><dd className="chrome">{p.live}</dd></div>
            <div><dt>Purchases settled</dt><dd className="chrome">{p.sales}</dd></div>
            <div><dt>Volume</dt><dd className="v-info">{formatSol(p.volume)}<small> SOL</small></dd></div>
            <div><dt>Desks</dt><dd className="chrome">{p.creators}</dd></div>
            <div><dt>Last 7 days</dt><dd className={last7 >= prev7 ? "v-good" : "v-fee"}>{last7}<small> {prev7 ? `${last7 >= prev7 ? "+" : ""}${last7 - prev7} vs prior 7` : "purchases"}</small></dd></div>
            <div><dt>To sellers</dt><dd className="v-good">{formatSol(Math.round(p.volume * 0.95))}<small> SOL</small></dd></div>
          </dl>
        </div>
        <div className="feature-art">
          <p className="kicker">Purchases · last 30 days</p>
          <Spark days={p.days} height={150} tone="green" />
          <p className="kicker" style={{ marginTop: 8 }}>Volume · SOL per day</p>
          <Spark days={p.volumeDays} height={90} tone="cyan" />
        </div>
      </section>

      {/* The launchpad: every launch by stage, what the curves are worth and hold, the recent volume,
          and what the vault's fee rounds collected and where it went. */}
      <section className="panel panel-feature rise rise-3" aria-label="Launchpad">
        <div className="feature-left">
          <header className="panel-head"><h2>Launchpad</h2><span>curves · fee rounds</span></header>
          <dl className="pulse">
            <div><dt>Launches</dt><dd className="chrome">{lp.counts.total}<small> {lp.counts.frozen} frozen · {lp.counts.launched} live · {lp.counts.graduated} graduated</small></dd></div>
            <div><dt>Total market cap</dt><dd className="v-info">{money(lp.mcapSol)}<small> {lp.fx ? solSub(lp.mcapSol, 2) : "on the curves"}</small></dd></div>
            <div><dt>Volume</dt><dd className="v-info">{money(lp.volumeSol)}<small> {lp.tradeCount} trades · last 60 per coin</small></dd></div>
            <div><dt>In the curves</dt><dd className="chrome">{solSub(lp.raisedSol)}<small> {lp.fx ? usd(lp.raisedSol * lp.fx) : "SOL"}</small></dd></div>
            <div><dt>Fee rounds</dt><dd className="chrome">{lp.rounds.n}<small> swept {solSub(lp.rounds.sweptSol, 4)}{lp.rounds.sweptEvyn ? ` + ${lp.rounds.sweptEvyn.toFixed(0)} EVYN` : ""}</small></dd></div>
            <div><dt>Buyback &amp; burn</dt><dd className="v-good">{solSub(lp.rounds.buybackSol, 4)}<small> {lp.rounds.burnedTokens ? `${lp.rounds.burnedTokens.toLocaleString("en-US", { maximumFractionDigits: 0 })} coins burned` : "no burn yet"}{lp.rounds.burnedEvyn ? ` · ${lp.rounds.burnedEvyn.toFixed(0)} EVYN burned` : ""}</small></dd></div>
            <div><dt>To holders</dt><dd className="v-good">{solSub(lp.rounds.holdersSol + lp.rounds.lotterySol + lp.rounds.revshareSol, 4)}<small> rewards · lottery · revshare</small></dd></div>
            <div><dt>Held in the vault</dt><dd className="chrome">{solSub(lp.rounds.heldSol, 4)}<small> mechanics not yet on chain, and the remainder</small></dd></div>
          </dl>
        </div>
        <div className="feature-art">
          <p className="kicker">Coins on the curve · by market cap</p>
          <ol className="plist" style={{ marginTop: 8 }}>
            {lp.coins.length === 0 && <li className="pempty">No coin on a curve yet</li>}
            {lp.coins.slice(0, 6).map((c, i) => (
              <li key={c.launch.id}>
                <Link href={`/t/${c.launch.slug ?? c.launch.id}`} className="prow">
                  <span className="rank mono">{String(i + 1).padStart(2, "0")}</span>
                  <span className="prow-name">{c.launch.name} <small style={{ display: "inline" }}>${c.launch.ticker}</small><small>{c.complete ? "graduated" : `${c.progress.toFixed(1)}% of the curve`} · {c.tradeCount} trades · {c.launch.pair === "evyn" ? "EVYN" : "SOL"} pair</small></span>
                  <span className="prow-val"><b className="chrome">{money(c.mcapSol)}</b><small>vol {money(c.volumeSol)}</small></span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Community: the holders' rooms, how much they talk, and where. */}
      <section className="panel panel-feature rise rise-3" aria-label="Community">
        <div className="feature-left">
          <header className="panel-head"><h2>Community</h2><span>holder rooms</span></header>
          <dl className="pulse">
            <div><dt>Rooms open</dt><dd className="chrome">{cm.rooms}<small> one per coin on the curve</small></dd></div>
            <div><dt>Messages</dt><dd className="v-info">{cm.messages}<small> all time</small></dd></div>
            <div><dt>Holders talking</dt><dd className="chrome">{cm.writers}<small> wallets that wrote</small></dd></div>
            <div><dt>Last 24 hours</dt><dd className={cm.day ? "v-good" : "chrome"}>{cm.day}<small> messages from {cm.day_writers} wallets</small></dd></div>
          </dl>
        </div>
        <div className="feature-art">
          <p className="kicker">Busiest rooms</p>
          <ol className="plist" style={{ marginTop: 8 }}>
            {busiest.length === 0 && <li className="pempty">No room open yet</li>}
            {busiest.slice(0, 5).map((r, i) => (
              <li key={r.id}>
                <Link href={`/community/${r.slug ?? r.id}`} className="prow">
                  <span className="rank mono">{String(i + 1).padStart(2, "0")}</span>
                  <span className="prow-name">{r.name} <small style={{ display: "inline" }}>${r.ticker}</small><small>{r.members} talking · {r.pair === "evyn" ? "EVYN" : "SOL"} pair</small></span>
                  <span className="prow-val"><b className="chrome">{r.messages}</b><small>messages</small></span>
                </Link>
              </li>
            ))}
          </ol>
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
                  <span className="prow-name">{x.title}<small>{x.category} · {agentFor(x.creator, x.category).name}</small></span>
                  <span className="prow-val"><b className="chrome">{x.sales}</b><small>{formatSol(x.price)} SOL</small></span>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <section className="panel rise rise-3" aria-labelledby="creators-h">
          <header className="panel-head"><h2 id="creators-h">Top desks</h2><span>earned · products</span></header>
          <ol className="plist">
            {creators.length === 0 && <li className="pempty">No desks yet</li>}
            {creators.map((c) => (
              <li key={c.creator}>
                <Link href={`/u/${c.creator}`} className="prow">
                  <AgentMark agent={agentFor(c.creator)} />
                  <span className="prow-name">{agentFor(c.creator).name}<small>{c.sales} sold</small></span>
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
                  <span className="prow-name"><b className="cat" data-cat={c.category}>{c.category}</b><small>{c.products} live</small></span>
                  <span className="prow-val"><b className="chrome">{c.sales}</b></span>
                </Link>
                <span className="bar-track" data-cat={c.category} aria-hidden="true"><span className="bar-fill" style={{ width: `${(c.sales / maxCat) * 100}%` }} /></span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
