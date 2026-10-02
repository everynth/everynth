import Link from "next/link";
import { query } from "@/lib/db";
import { sessionWallet } from "@/lib/session";

export const metadata = {
  title: "Launchpad · EVERYNTH",
  description: "Coming soon: give a token to a utility that already works — one you sell here, one you bought here, or one you bring yourself.",
};

type Counts = { launched: number; bought: number };

// Two ways a token will get its utility: a product already on this market, or one uploaded straight here.
const PATHS = [
  {
    flag: "--from-market",
    title: "From the market",
    body: "Pick something you already own on EVERYNTH: a product you launched, or one you bought. Ownership is proven the way it is today — the wallet that paid, checked against the chain.",
    points: ["Works for files, secrets and GitHub access", "Nothing to re-upload or re-encrypt", "Buyers of the product keep what they bought"],
  },
  {
    flag: "--bring-your-own",
    title: "Bring your own utility",
    body: "Your utility does not have to be sold here first. Upload it straight to the launchpad — an agent, a tool, a dataset, an API key, a private repo — and attach it to the token in the same step.",
    points: ["Same browser-side encryption as a launch", "Stays private until a holder unlocks it", "Listing it on the market stays optional"],
  },
];

const STEPS = [
  { n: "01", h: "Attach the utility", s: "From the market or uploaded here. This is what the token is for; a token with nothing behind it is not a launch." },
  { n: "02", h: "Set the terms", s: "Supply, what a holder unlocks, how much of the sale goes to the pool. Written in plain numbers before anything is signed." },
  { n: "03", h: "Confirm in your wallet", s: "One signature over those exact terms, the same way a launch is confirmed today. No custody, nothing held by the platform." },
  { n: "04", h: "Live", s: "The token trades, holders unlock the utility, platform fees flow back through buyback and burn." },
];

const READY = [
  "Encrypted delivery, browser to browser",
  "SOL payments straight to your wallet",
  "Ownership check any app can call (/api/verify)",
  "Wallet-signed launches",
];
const BUILDING = [
  "Token program and the pool it launches into",
  "Holder gating: balance in, content out",
  "Fee → buyback → holder rewards + burn",
  "Audit before a single line touches mainnet",
];

export default async function LaunchpadPage() {
  const wallet = await sessionWallet();
  const [counts] = wallet
    ? await query<Counts>(
        `select (select count(*) from products where creator = $1 and status = 'live')::int as launched,
                (select count(*) from purchases where buyer = $1 and status = 'paid')::int as bought`,
        [wallet],
      )
    : [{ launched: 0, bought: 0 } as Counts];
  const eligible = counts.launched + counts.bought;

  return (
    <div className="dash">
      <div className="dash-sec rise">
        <div>
          <p className="kicker">Creator · Launch token</p>
          <h1 className="chrome mt-2 text-3xl font-medium tracking-tight sm:text-4xl">Launchpad</h1>
          <p className="dash-sec-sub">
            Give a token to a utility that already works. Not a token first and a product later — the other way round.
            To put something on sale instead, that is <Link href="/launch/product" className="navlink" style={{ padding: 0 }}>Launch product</Link>.
          </p>
        </div>
        <span className="pill pill-soon">◷ Coming soon</span>
      </div>

      <div className="term rise rise-2">
        <div className="term-bar">
          <span className="term-dots"><i /><i /><i /></span>
          ~/everynth/launchpad
          <span className="lx-bar-right is-run">not shipped yet</span>
        </div>
        <div className="term-body">
          <p className="lx-cmd"><span>$</span> everynth launchpad --status</p>
          <dl className="lp-status">
            <div><dt>state</dt><dd className="v-fee">in design</dd></div>
            <div><dt>token</dt><dd>does not exist</dd></div>
            <div><dt>presale</dt><dd>none, ever</dd></div>
            <div><dt>date</dt><dd>not promised</dd></div>
            <div><dt>your eligible products</dt><dd className={eligible ? "v-good" : ""}>{wallet ? eligible : "sign in to check"}</dd></div>
          </dl>
          <p className="lx-hint">
            Nothing here can be bought today and there is no waitlist to pay for. When it opens it will open to
            whatever is already on this market. The honest reason for the order: a token before real usage is a
            promise, and this project decided not to sell promises.
          </p>
        </div>
      </div>

      <div className="dash-sec rise rise-3">
        <div>
          <h2 className="dash-sec-title">Two ways in</h2>
          <p className="dash-sec-sub">Your utility can already live on this market, or arrive with the token.</p>
        </div>
      </div>
      <div className="lp-paths rise rise-3">
        {PATHS.map((p) => (
          <section key={p.flag} className="panel lp-path">
            <header className="panel-head"><h3>{p.title}</h3><span className="mono">{p.flag}</span></header>
            <p className="lp-body">{p.body}</p>
            <ul className="checks">{p.points.map((x) => <li key={x}>{x}</li>)}</ul>
          </section>
        ))}
      </div>

      <div className="dash-sec rise rise-4">
        <div>
          <h2 className="dash-sec-title">How a launch will run</h2>
          <p className="dash-sec-sub">Same shape as launching a product today: terms first, signature second, custody never.</p>
        </div>
      </div>
      <ol className="lp-steps rise rise-4">
        {STEPS.map((s) => (
          <li key={s.n} className="panel">
            <b>{s.n}</b>
            <span>{s.h}</span>
            <small>{s.s}</small>
          </li>
        ))}
      </ol>

      <div className="lp-split rise rise-4">
        <section className="panel">
          <header className="panel-head"><h3>Already live</h3><span>in production today</span></header>
          <ul className="checks">{READY.map((x) => <li key={x}>{x}</li>)}</ul>
        </section>
        <section className="panel">
          <header className="panel-head"><h3>Still being built</h3><span>before the launchpad opens</span></header>
          <ul className="checks checks-todo">{BUILDING.map((x) => <li key={x}>{x}</li>)}</ul>
        </section>
      </div>

      <section className="panel lp-cta rise rise-4">
        <div>
          <h3>The useful thing to do now</h3>
          <p className="dash-sec-sub">
            Launch the utility, sell it, let it earn. Every product on this market is a candidate the day the
            launchpad opens — and so is anything you upload to it then.
          </p>
        </div>
        <div className="dash-sec-actions">
          <Link href="/launch/product" className="btn">Launch a product</Link>
          <Link href="/docs/overview" className="btn-ghost">How the market works →</Link>
        </div>
      </section>
    </div>
  );
}
