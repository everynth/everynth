import Link from "next/link";
import { FEE_CEILING, HOOKS, TEMPLATES } from "@/lib/launchpad";
import { Code, H2, H3, Note } from "../ui";

// The launchpad as it runs: coins on pump.fun's curve, the vault collecting creator fees, fee
// rounds running the mechanics, the desk writing for EVYN-paired launches. The three roadmap pages
// at the bottom (hook marketplace, economics, on-chain architecture) keep their design banner.

export function LaunchpadOverview() {
  return (
    <>
      <H2 id="what-it-is">What it is</H2>
      <p>
        The launchpad attaches a token to a utility that already exists on the market. You pick a
        utility you built or bought, write the project around it, choose what the token does, sign
        the terms, and the coin is created on <strong>pump.fun&apos;s bonding curve</strong> from
        your wallet. EVERYNTH writes no token program of its own: the curve, the graduation to a
        PumpSwap pool and the trading all run on pump.fun, the same venue hireagents.fun uses.
      </p>
      <Code>{`utility on the market  →  terms frozen under your signature  →  create_v2 on pump.fun
                                                                    ↓
   holders unlock the utility  ←  mechanics run in fee rounds  ←  creator fees → EVERYNTH vault`}</Code>
      <p>What EVERYNTH adds on top of the curve:</p>
      <ul>
        <li><strong>Signed terms.</strong> Supply, pair, mechanics, dev buy, holder gate and the site are frozen under the launcher&apos;s signature before anything is minted, and read back on a public permalink forever.</li>
        <li><strong>The vault as creator.</strong> Every coin&apos;s creator on pump.fun is the EVERYNTH vault, so the creator fee lands somewhere that runs the mechanics instead of a private wallet. See <Link href="/docs/launchpad/fee-rounds">Fee rounds</Link>.</li>
        <li><strong>Mechanics.</strong> Buyback, burn, holder rewards, lottery and revenue share, executed from the fees every round in the order the launcher stacked them. See <Link href="/docs/launchpad/hooks">Mechanics</Link>.</li>
        <li><strong>A holder gate.</strong> Hold <em>n</em> coins and the utility opens, checked on chain by the same <Link href="/docs/ownership-check">ownership check</Link> any app can call.</li>
        <li><strong>A token site</strong> on one of three templates, at a permalink, with the live curve, trades, holders and a swap. See <Link href="/docs/launchpad/token-sites">Token sites</Link>.</li>
        <li><strong>The desk</strong>, for coins paired with EVYN: identity, narrative and site copy written by the studio&apos;s agents from the launch brief. See <Link href="/docs/launchpad/desk">The desk</Link>.</li>
      </ul>

      <H2 id="lifecycle">The three lanes</H2>
      <table>
        <thead><tr><th>Lane</th><th>State</th><th>What is true</th></tr></thead>
        <tbody>
          <tr><td><strong>Newly created</strong></td><td><code>frozen</code></td><td>Terms signed and stored. No coin yet. The launch page and the site exist with placeholders.</td></tr>
          <tr><td><strong>About to graduate</strong></td><td><code>launched</code></td><td>The coin trades on pump.fun&apos;s curve. Fee rounds run. Holders can unlock.</td></tr>
          <tr><td><strong>Graduated</strong></td><td><code>graduated</code></td><td>The curve filled; the coin trades in its PumpSwap pool, LP burned. Fee rounds sweep the pool&apos;s creator fees instead.</td></tr>
        </tbody>
      </table>

      <H2 id="numbers">The numbers that never change</H2>
      <Code>{`supply            1,000,000,000   every pump.fun coin, fixed, 6 decimals (Token-2022)
on the curve      793,100,000     for sale; the rest becomes pool liquidity at graduation
virtual reserves  1.073B tokens   the constant-product curve pump.fun runs
launcher share    0%              HIRE's rule: creator fees go to the vault in full; the dev buy is the launcher's stake
dev buy           ≤ 50 SOL        the launcher's first buy, a second transaction right after create
stack ceiling     ${FEE_CEILING}%             the most a stack of mechanics may claim of a round`}</Code>

      <H2 id="where-next">Where to read next</H2>
      <table>
        <thead><tr><th>Page</th><th>What it covers</th></tr></thead>
        <tbody>
          <tr><td><Link href="/docs/launchpad/launching">Launching a token</Link></td><td>The five steps, what you sign, what it costs, what happens after.</td></tr>
          <tr><td><Link href="/docs/launchpad/pairs">EVYN or SOL</Link></td><td>What the pair changes: fees, burns, the desk, the buy path.</td></tr>
          <tr><td><Link href="/docs/launchpad/hooks">Mechanics</Link></td><td>The catalogue, the waterfall, what runs today and what waits.</td></tr>
          <tr><td><Link href="/docs/launchpad/fee-rounds">Fee rounds</Link></td><td>The vault, sweep, collect, split, carry, cadence.</td></tr>
          <tr><td><Link href="/docs/launchpad/token-sites">Token sites</Link></td><td>Templates, the chart, trades, holders, the swap panel.</td></tr>
          <tr><td><Link href="/docs/launchpad/desk">The desk</Link></td><td>What the agents deliver for an EVYN-paired launch.</td></tr>
        </tbody>
      </table>
    </>
  );
}

export function Launching() {
  return (
    <>
      <H2 id="before">Before you start</H2>
      <ul>
        <li>A Solana wallet with SOL on mainnet: a few thousandths of a SOL for the create, plus whatever you choose as the dev buy.</li>
        <li>A utility on the market that you <strong>built or bought</strong>. The token is attached to it; that is the whole point. If you have neither, buy one on the <Link href="/">market</Link> first.</li>
        <li>For an EVYN pair: nothing extra. Buyers pay in SOL and the swap routes through EVYN for them.</li>
      </ul>

      <H2 id="steps">The five steps</H2>
      <table>
        <thead><tr><th>Step</th><th>You decide</th></tr></thead>
        <tbody>
          <tr><td><strong>1 · Utility</strong></td><td>Which of your utilities the token is for. The holder gate is set from it: hold <em>n</em> coins, it opens.</td></tr>
          <tr><td><strong>2 · Project</strong></td><td>Name, ticker, <Link href="/docs/launchpad/pairs">pair</Link>, description, theme and colour for the desk, the logo (Prism draws it, you upload one, or the default mark), one of three looks for the landing page, the permalink, socials, the utility&apos;s URL if it is live.</td></tr>
          <tr><td><strong>3 · Mechanics</strong></td><td>Which <Link href="/docs/launchpad/hooks">mechanics</Link> run on the fees, in which order, and the dev buy (0–50 SOL).</td></tr>
          <tr><td><strong>4 · Agents</strong></td><td>Nothing to decide: it shows what the desk will deliver for an EVYN pair, and that a SOL pair gets none of it.</td></tr>
          <tr><td><strong>5 · Launch</strong></td><td>Read the terms back, sign them in your wallet (free, no funds move), and they are frozen.</td></tr>
        </tbody>
      </table>

      <H2 id="signature">What you sign</H2>
      <p>The wallet shows these exact lines; the server rebuilds them from what it received and refuses anything that differs:</p>
      <Code>{`\${host} wants you to confirm: launch token.
This is free and does not move any funds.

Utility: <product id>
Token: <name> (<TICKER>)
Supply: 1000000000
Pair: EVYN | SOL
Creator fee: 100% to the EVERYNTH vault
Mechanics: antisnipe,buyback,burn
Dev buy: 0.05 SOL
Gate: 10000 unlocks <what the utility is>
Site: /t/<slug> on glow
Wallet: <your wallet>
Issued at: <ms timestamp>`}</Code>

      <H2 id="create">Creating the coin</H2>
      <p>
        On the launch page, the owner of frozen terms gets one button. It sends two transactions from your wallet:
      </p>
      <ol>
        <li><strong>Create.</strong> pump.fun&apos;s <code>create_v2</code> with a fresh mint, your name and ticker, the metadata URL EVERYNTH serves, and the EVERYNTH vault as creator. In EVYN it is quoted in EVYN, in SOL in SOL.</li>
        <li><strong>Dev buy</strong>, if you set one: a buy on the brand-new curve for the SOL you chose. It is a second transaction because create and buy together do not fit in one.</li>
      </ol>
      <p>
        Then the page sends the create signature to the server, which reads the curve off the chain and checks it: the transaction confirmed and was paid by your wallet, the mint is in it, the creator is the vault, the supply is one billion, the quote matches the pair you signed. Only then does the launch become <code>launched</code>.
      </p>
      <Note kind="warn">
        <p>
          <strong>Snipers watch pump.fun.</strong> Bots buy new coins within seconds of creation, before a separate dev-buy transaction can land. If being first matters, keep the dev buy small enough that a bot in front of you does not change the picture, and do not retry a create that is still confirming.
        </p>
      </Note>

      <H2 id="after">After launch</H2>
      <ul>
        <li>The site at <code>/t/&lt;slug&gt;</code> shows the live curve: market cap, trades, holders, the swap panel.</li>
        <li>The launch page at <code>/launchpad/&lt;slug&gt;</code> shows the terms, the fee rounds as they run, and — on an EVYN pair — the desk&apos;s deliverables.</li>
        <li>The holder gate answers at <code>GET /api/launches/&lt;id&gt;/gate?wallet=</code>, CORS-open, so your utility can check a visitor itself.</li>
        <li>Creator fees accrue on pump.fun to the vault and are split in <Link href="/docs/launchpad/fee-rounds">fee rounds</Link>.</li>
      </ul>
    </>
  );
}

export function Pairs() {
  return (
    <>
      <H2 id="two-pairs">Two pairs</H2>
      <p>
        A coin is quoted on its curve either in <strong>SOL</strong> or in <strong>EVYN</strong>, the platform&apos;s own pump.fun coin. The pair is part of the signed terms and cannot change.
      </p>
      <table>
        <thead><tr><th></th><th>EVYN pair</th><th>SOL pair</th></tr></thead>
        <tbody>
          <tr><td>Buying</td><td>SOL → EVYN → coin in one transaction (pump.fun&apos;s multi-hop swap). Sellers go the other way.</td><td>SOL → coin on the curve.</td></tr>
          <tr><td>Creator fees arrive in</td><td>EVYN</td><td>SOL</td></tr>
          <tr><td>Before the split</td><td><strong>Half of every round&apos;s EVYN is burned.</strong></td><td>Nothing burned at this step.</td></tr>
          <tr><td>The desk</td><td>On: identity, narrative, site copy from the agents.</td><td>Off: the template, your text, nothing else.</td></tr>
          <tr><td>Graduation target</td><td>The curve&apos;s quote target in EVYN.</td><td>85 SOL raised.</td></tr>
        </tbody>
      </table>
      <p>
        The design is hireagents.fun&apos;s: coins paired with the platform coin feed demand for it and burn it, and in exchange they get the team. A SOL pair is the plain option for a launcher who wants the curve and nothing else.
      </p>

      <H2 id="graduation-window">The graduation window</H2>
      <p>
        EVYN itself trades on a curve. While EVYN graduates from its curve to its PumpSwap pool, pump.fun briefly has no venue to quote a new EVYN-paired coin against, and a create can fail. The launch button says so when it happens; wait a few minutes and try again, or launch the coin paired with SOL.
      </p>

      <H2 id="which">Which to choose</H2>
      <ul>
        <li>You want the agents to write the identity, narrative and site: <strong>EVYN</strong>.</li>
        <li>You want the simplest possible buy path and your own copy: <strong>SOL</strong>.</li>
      </ul>
    </>
  );
}

export function LaunchpadHooks() {
  const fam = (f: string) => HOOKS.filter((h) => h.family === f);
  return (
    <>
      <H2 id="how-they-run">How mechanics run</H2>
      <p>
        A mechanic is not a program on the token. It is a rule the vault follows when it splits a launch&apos;s creator fees in a <Link href="/docs/launchpad/fee-rounds">fee round</Link>. The launcher stacks mechanics in order and signs the order; each round, the vault walks the stack top to bottom, each mechanic claiming its share of what is left. Nothing goes to the launcher — HIRE&apos;s rule — so the whole creator fee works for the coin.
      </p>
      <Code>{`a round's pot (after the EVYN burn on an EVYN pair)
  ↓
mechanic 1  takes its share
mechanic 2  takes its share of the rest
mechanic 3  …
  ↓
whatever is left stays in the vault (recorded as held)`}</Code>
      <p>
        The stack as a whole may claim at most <strong>{FEE_CEILING}%</strong> of a round; the launch flow refuses a stack above it. The arithmetic is shown with your own numbers before you sign.
      </p>

      <H2 id="catalogue">The catalogue</H2>
      <p>
        Each mechanic has a fixed share and a fixed configuration in this version. Four of them act on chain today; the rest reserve their share in the vault until their action ships, so a launcher who picks them is holding a place, not getting a payout yet.
      </p>
      {(["Rewards", "Trading", "Access"] as const).map((f) => (
        <div key={f}>
          <H3 id={f.toLowerCase()}>{f}</H3>
          <table>
            <thead><tr><th>Mechanic</th><th>Share</th><th>Today</th><th>What it does</th></tr></thead>
            <tbody>
              {fam(f).map((h) => (
                <tr key={h.id}>
                  <td><strong>{h.name}</strong> <code>{h.id}</code></td>
                  <td>{h.take ? `${h.take}%` : "—"}</td>
                  <td>{["buyback", "burn", "holder", "lottery", "revshare"].includes(h.id) ? "runs" : h.family === "Access" && h.id === "access" ? "the holder gate" : h.take ? "held" : "—"}</td>
                  <td>{h.line} <em>{h.config}</em></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <H2 id="what-runs">What each running mechanic does in a round</H2>
      <table>
        <thead><tr><th>Mechanic</th><th>On chain</th></tr></thead>
        <tbody>
          <tr><td><strong>Buyback</strong></td><td>Spends its share buying the coin back on its own curve (or pool), from the vault wallet.</td></tr>
          <tr><td><strong>Auto burn</strong></td><td>Burns every coin the buyback just bought. Supply only goes down.</td></tr>
          <tr><td><strong>Holder rewards</strong></td><td>Pays its share to the largest holders pro rata to their balance, in the quote (SOL or EVYN). Payouts under 10,000 base units are skipped — they would cost more in rent than they pay.</td></tr>
          <tr><td><strong>Lottery</strong></td><td>Pays its whole share to one holder, drawn weighted by balance.</td></tr>
          <tr><td><strong>Revenue share</strong></td><td>Pays its share to the launcher&apos;s wallet.</td></tr>
          <tr><td><strong>Anti-snipe</strong>, <strong>Dynamic fee</strong>, <strong>Transfer rules</strong>, <strong>Privacy rules</strong></td><td>Take no share. pump.fun&apos;s curve sets the trading rules, so these are declarations on the terms today, not enforcement.</td></tr>
          <tr><td><strong>Access rules</strong></td><td>Is the holder gate: <code>/api/launches/:id/gate</code> answers from the chain.</td></tr>
        </tbody>
      </table>

      <H2 id="holders-list">Who counts as a holder</H2>
      <p>
        The round reads the coin&apos;s twenty largest token accounts from the RPC, leaves out the bonding curve itself, and splits by balance. A coin with more than twenty holders pays its twenty largest. A fuller index is on the roadmap; the figures in every round are published on the launch page either way.
      </p>
    </>
  );
}

export function FeeRounds() {
  return (
    <>
      <H2 id="vault">The vault</H2>
      <p>
        The vault is one wallet EVERYNTH operates. It is the <em>creator</em> of every coin launched here, so pump.fun pays every creator fee to it, and it signs every fee round. It is not the treasury that takes the market&apos;s 5%: that stays cold. The vault is hot by necessity and holds only what the rounds move through it plus gas.
      </p>

      <H2 id="round">A round, per launch</H2>
      <Code>{`1  sweep     move the creator-fee bucket off the curve (and the pool, after graduation)
             into the vault's creator-vault PDA, measuring the amount so it stays
             attributed to this launch
2  collect   move the PDA balance into the vault wallet, one instruction per quote
3  split     EVYN pair: burn half first
             then the mechanics in their signed order — nothing to the launcher
             anything a mechanic cannot act on yet stays, recorded as held
4  record    one row per launch per round: swept, burned, launcher, buyback,
             holders, lottery, revshare, held, every transaction signature`}</Code>
      <p>
        A pot under <strong>0.005 SOL</strong> (or the equivalent in EVYN) is not split: a round costs a few transactions, and splitting dust would burn more in gas than it pays. The amount carries over and the row says so.
      </p>

      <H2 id="cadence">Cadence</H2>
      <p>
        Rounds run every <strong>15 minutes</strong> from a scheduled job, with a daily run on Vercel&apos;s own cron as a backstop. Both call the same endpoint with the same secret; see the <Link href="/docs/api#cron">API</Link>.
      </p>

      <H2 id="read-it">Reading it back</H2>
      <ul>
        <li>The launch page lists every round for that coin: time, swept, burned, launcher, buyback, burned coins, holders, revshare, with transaction signatures.</li>
        <li><Link href="/stats">Live stats</Link> sums every round across the launchpad: swept, bought back and burned, paid to holders, paid to launchers.</li>
      </ul>

      <H2 id="fees-on-pumpfun">Where the fee comes from</H2>
      <p>
        pump.fun charges every trade on a curve a protocol fee plus a creator fee, by a schedule that steps with market cap (for a new coin: 0.95% + 0.30%). The token site reads the live schedule from the chain and prints it, so it always matches what pump.fun shows. The creator fee is the vault&apos;s income; the protocol fee is pump.fun&apos;s. None of it goes to the launcher: as at HIRE, the launcher&apos;s stake is the dev buy. (HIRE charges 1% because $HIRE is a whitelisted quote on pump.fun; a coin quoted in EVYN or SOL pays pump.fun&apos;s own creator-fee tier.)
      </p>
    </>
  );
}

export function TokenSites() {
  return (
    <>
      <H2 id="permalink">Two pages per coin</H2>
      <p>
        Every launch has a <strong>terminal</strong> at <code>everynth.org/t/&lt;slug&gt;</code> — chart, trades, swap, curve, holders, the terms — and a <strong>website</strong> at <code>everynth.org/t/&lt;slug&gt;/site</code>: a landing page with the banner and logo, the headline, the live numbers, the story and FAQ as cards, the utility, the desk&apos;s updates and the terms, in the look chosen in step 2. The terminal links the website from its <em>Visit website</em> button; the website links the terminal. Both are live from the moment the terms are frozen: before the coin exists they show the terms with placeholders; after, the curve.
      </p>
      <table>
        <thead><tr><th>Look</th><th>Website</th></tr></thead>
        <tbody>
          {TEMPLATES.map((t) => <tr key={t.id}><td><strong>{t.name}</strong> <code>{t.id}</code></td><td>{t.line}</td></tr>)}
        </tbody>
      </table>

      <H2 id="what-it-shows">What the site shows</H2>
      <ul>
        <li><strong>Market cap</strong> in dollars, with SOL alongside: the curve&apos;s price times one billion, SOL/USD from Jupiter&apos;s price feed (CoinGecko as backup), refreshed every two minutes.</li>
        <li><strong>The chart</strong> (Glow): market cap after every trade, as a step line over time with a dot per buy and sell, recovered from the tokens the curve held after each transaction. It is the coin&apos;s own history, not a projection.</li>
        <li><strong>Trades</strong>: trader, buy or sell, the SOL that moved through the curve (fees excluded), tokens, time, transaction. The create and the vault&apos;s sweeps are left out.</li>
        <li><strong>Holders</strong>: the largest accounts as a share of supply, with the bonding curve and the dev tagged, the way pump.fun tags them.</li>
        <li><strong>Bonding curve progress</strong>, SOL in the curve, and what graduation means.</li>
        <li><strong>The swap panel</strong>: buy and sell against the curve from the site, with the live fee schedule printed under it. On an EVYN pair the buy routes SOL → EVYN → coin in one transaction.</li>
        <li><strong>The terms</strong>, the contract address with a copy button, the holder gate, the signed-terms link and the disclaimer.</li>
      </ul>

      <H2 id="metadata">Metadata and logo</H2>
      <p>
        The coin&apos;s on-chain metadata URI points at <code>/api/launches/&lt;id&gt;/metadata</code>, which serves name, symbol, description and an image URL; the image is <code>/api/launches/&lt;id&gt;/logo</code>, the utility&apos;s cover when it has one, an SVG initial otherwise. Both are public so pump.fun and explorers can read them.
      </p>
    </>
  );
}

export function Desk() {
  return (
    <>
      <H2 id="what-it-delivers">What the desk delivers</H2>
      <p>
        For a coin paired with EVYN, once it is on the curve, the launcher can put the desk to work from the launch page. Three of the studio&apos;s agents run in parallel on one brief built from the launch&apos;s own fields, and the results land on the launch page in about a minute:
      </p>
      <table>
        <thead><tr><th>Job</th><th>Agent</th><th>Delivers</th></tr></thead>
        <tbody>
          <tr><td><strong>Identity</strong> (logo + banner)</td><td>Prism · Claude Opus 5</td><td>The logo (unless you uploaded your own) and the 3:1 banner, drawn as vector art and rendered to PNG, plus the palette. The logo is what pump.fun and wallets show; the banner is the site&apos;s hero. Drawn the moment you sign, so the coin is created with it.</td></tr>
          <tr><td><strong>Narrative</strong></td><td>Loom · Claude Fable 5.1</td><td>The full story with the token section built from the pair, the fee and the mechanics, and a six-question FAQ.</td></tr>
          <tr><td><strong>Site copy</strong></td><td>Quill · Claude Fable 5.1</td><td>Taglines, the hero, value props, CTAs and the four site sections, in the theme.</td></tr>
        </tbody>
      </table>
      <p>
        The brief the agents read is exactly what you entered: name, ticker, utility, pitch, theme, colour, template, pair, mechanics, dev buy, gate, links. Nothing is invented; anything an agent had to assume is marked <em>(assumed)</em>. Running the desk again overwrites the previous delivery.
      </p>

      <H2 id="limits">What it does not do yet</H2>
      <ul>
        <li>It draws flat vector art, not photographs or illustrations. Upload your own logo in step 2 (or from the launch page) when you want those; Prism then draws only the banner.</li>
        <li>The narrative and the site copy do not run by themselves at launch; the launcher presses the button once the coin is on the curve.</li>
      </ul>
      <p>The same five agents are open to any EVYN holder in the <Link href="/docs/studio">studio</Link>.</p>
    </>
  );
}

// ── Roadmap ────────────────────────────────────────────────────────────────────────────────────
// Design pages for what comes after pump.fun's curve: on-chain hooks, a hook marketplace, an
// economy around them. The banner says what is live and what is not.
function Roadmap() {
  return (
    <Note kind="warn">
      <p>
        <strong>This page is a design, not a shipped feature.</strong> What is live today: coins on
        pump.fun&apos;s curve, the vault collecting creator fees, mechanics executed in{" "}
        <Link href="/docs/launchpad/fee-rounds">fee rounds</Link>, token sites, the desk and the
        studio. The on-chain hooks and the hook marketplace described here are the next step, and
        they are published so they can be argued with before they are built.
      </p>
    </Note>
  );
}

export function HookMarketplace() {
  return (
    <>
      <Roadmap />

      <H2 id="open-catalogue">An open catalogue</H2>
      <p>
        EVERYNTH does not need to invent every behaviour a token might want, and should not try.
        The catalogue is open: any developer can write a hook, publish it, and be paid when other
        people&apos;s tokens use it.
      </p>
      <Code>{`                   HOOK MARKETPLACE
                          │
        ┌─────────────────┼─────────────────┐
        ↓                 ↓                 ↓
     REWARDS           TRADING           PRIVACY
        │                 │                 │
        ↓                 ↓                 ↓
  Stock rewards        Buyback         Access rules
  SOL rewards          Burn            Transfer rules
  Lottery              LP rewards      Compliance
  Referral             Dynamic fee     Attestations`}</Code>
      <p>
        This is the same shape as the product marketplace that already runs: someone builds
        something useful, someone else pays to use it, and the platform takes a small cut without
        standing in the middle of the value.
      </p>

      <H2 id="royalties">How a hook developer is paid</H2>
      <p>
        A hook carries a royalty, set by its developer within bounds the protocol enforces. Every
        token that uses the hook pays it out of the revenue the hook itself generates — never out
        of the creator&apos;s pocket and never out of holders&apos; balances.
      </p>
      <Code>{`a token using a paid hook

  protocol revenue
        ↓
  ┌─────┴──────────────┬──────────────────┐
  ↓                    ↓                  ↓
creator's token    hook developer     protocol treasury
economics          royalty`}</Code>

      <H2 id="trust">How a hook earns trust</H2>
      <table>
        <thead><tr><th>Stage</th><th>What it means</th></tr></thead>
        <tbody>
          <tr><td><strong>Source published</strong></td><td>The program&apos;s source is public and the deployed bytecode matches it. No closed-source hook is listed, ever.</td></tr>
          <tr><td><strong>Bounded by review</strong></td><td>A hook declares the accounts it touches and the maximum share of fees it can take. A hook that asks for more than its category allows is refused.</td></tr>
          <tr><td><strong>Immutable or declared</strong></td><td>Either the program is non-upgradeable, or its upgrade authority is shown on every token that uses it.</td></tr>
          <tr><td><strong>Audited for the risky tier</strong></td><td>Hooks that can block transfers or move value need an audit before listing. Hooks that only read and emit do not.</td></tr>
          <tr><td><strong>Record in public</strong></td><td>Usage, volume, revenue and failure rate per hook are published.</td></tr>
        </tbody>
      </table>
    </>
  );
}

export function LaunchpadEconomics() {
  return (
    <>
      <Roadmap />

      <H2 id="what-runs-today">What already runs</H2>
      <p>
        The part of this economy that is live is the one around EVYN: a coin paired with EVYN is bought through EVYN, pays its creator fees in EVYN, and the vault burns half of every round before splitting the rest. Demand for EVYN comes from launches that want the desk, and supply goes down with their volume. The rest of this page is the design beyond that.
      </p>

      <H2 id="where-revenue-comes-from">Where protocol revenue would come from</H2>
      <Code>{`every launch
every paid hook
every marketplace module
every protocol transaction
              ↓
        PROTOCOL REVENUE
              ↓
     ┌────────┴────────┐
     ↓                 ↓
 BUYBACK EVYN       TREASURY
     ↓
   BURN`}</Code>

      <H2 id="hook-mining">Hook mining</H2>
      <p>
        Every hook has its own volume, because every hook knows which tokens use it. A share of a
        module&apos;s revenue goes to its developer, and a share to people staking EVYN. Usage becomes
        the thing being mined.
      </p>
      <Code>{`four ways in, one economy

  BUILD A HOOK  →  people use it        →  earn
  STAKE         →  the ecosystem is used →  earn
  LAUNCH        →  use hooks             →  a token that does something
  TRADE         →  generate activity     →  a market with published rules`}</Code>
      <Note kind="warn">
        <p>
          <strong>Deliberately not decided here:</strong> emission, the split between developer and
          staker, and the exact fee numbers for on-chain hooks. Writing them down before the
          mechanism is built would turn a design into a promise.
        </p>
      </Note>
    </>
  );
}

export function LaunchpadArchitecture() {
  return (
    <>
      <Roadmap />

      <H2 id="today">What runs today, and where</H2>
      <table>
        <thead><tr><th>Piece</th><th>Runs on</th></tr></thead>
        <tbody>
          <tr><td>The curve, graduation, the pool, trading fees</td><td>pump.fun&apos;s programs on Solana</td></tr>
          <tr><td>Creator fees</td><td>pump.fun pays them to the vault</td></tr>
          <tr><td>Mechanics</td><td>The vault&apos;s fee rounds: a scheduled job that signs ordinary transactions</td></tr>
          <tr><td>Terms, sites, the holder gate, the desk</td><td>EVERYNTH&apos;s own server and database</td></tr>
        </tbody>
      </table>
      <p>
        That is an honest division: nothing on chain enforces the mechanics; the vault&apos;s published rounds do, and anyone can check them against the chain. Moving enforcement on chain is the next step, and it is harder than it looks.
      </p>

      <H2 id="foundation">The foundation for on-chain hooks</H2>
      <p>
        Solana&apos;s Token-2022 program has a <strong>transfer hook</strong> extension: a mint can name a program that must run on every transfer. If the hook fails, the transfer fails. That is the whole security model in one sentence, and it cuts both ways.
      </p>

      <H2 id="the-gap">The gap</H2>
      <table>
        <thead><tr><th>Needed for</th><th>Uniswap v4 hook</th><th>Token-2022 transfer hook</th></tr></thead>
        <tbody>
          <tr><td>Knowing a transfer is a buy or a sell</td><td>Given by the callback</td><td>Not given — a transfer is a transfer</td></tr>
          <tr><td>Reacting to liquidity changes</td><td>Given</td><td>Not visible</td></tr>
          <tr><td>Reading the price of the swap</td><td>Given</td><td>Not available in the hook</td></tr>
          <tr><td>Allow and deny lists, caps, cooldowns</td><td>Possible</td><td>Possible, and natural</td></tr>
        </tbody>
      </table>
      <p>
        Half the catalogue — transfer rules, access rules, caps, cooldowns, burns on transfer — maps onto Token-2022 directly. The other half needs a router that knows a swap from a transfer, and a runtime that meters hooks and isolates failures. Reward hooks must never run inline: a payout failing must not stop someone moving their own coins.
      </p>

      <Note>
        <p>
          If you think a piece of this is wrong, that is the point of publishing it before building
          it. The design is argued with in the open, in <a href="https://github.com/everynth/everynth">the repository</a>.
        </p>
      </Note>
    </>
  );
}

