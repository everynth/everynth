import Link from "next/link";
import { Code, H2, H3, Note } from "../ui";

// The launchpad is designed, not built. Every page in this group says so at the top, in the same
// words the live /launchpad page uses, so nobody reads a plan as a promise.
function NotBuilt() {
  return (
    <Note kind="warn">
      <p>
        <strong>This is a design, not a shipped feature.</strong> Nothing on this page exists on
        chain today. There is no token, no presale and no date. What is live is the marketplace:
        encrypted products, paid in SOL, wallet to wallet. These pages exist so the design can be
        argued with before it is built — see <Link href="/docs/launchpad/architecture">Architecture</Link>{" "}
        for what Solana actually gives us and what still has to be invented.
      </p>
    </Note>
  );
}

export function LaunchpadOverview() {
  return (
    <>
      <NotBuilt />

      <H2 id="two-halves">Two halves of one market</H2>
      <p>
        EVERYNTH is a marketplace for digital utilities: datasets, agents, API keys, tools, source
        code, access to a private repository. A creator lists one, a buyer pays their wallet
        directly, and the thing is delivered encrypted. That half runs on Solana mainnet today.
      </p>
      <p>
        The launchpad is the second half, and it answers a different question. A utility that
        works and sells has a user base, revenue and a reason to exist. What it does not have is a
        way to share its upside with the people who use it. Giving it a token is the obvious move,
        and the obvious move is where most of crypto goes wrong: the token arrives first, the
        product never does.
      </p>
      <p>EVERYNTH inverts the order on purpose.</p>
      <Code>{`a normal launchpad          EVERYNTH

token                       utility that already works
  ↓                           ↓
promise of a product        token attached to it
  ↓                           ↓
maybe a product             holders get what the utility produces`}</Code>
      <p>
        So the two halves feed each other. The marketplace is where a utility proves it is worth
        something. The launchpad is where that proof becomes a token economy. A developer can buy a
        utility on the market in the morning and launch a token backed by it in the afternoon,
        without writing a line of contract code.
      </p>

      <H2 id="who-it-is-for">Who it is for</H2>
      <table>
        <thead>
          <tr>
            <th>Person</th>
            <th>What they do</th>
            <th>What they get</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Creator</strong></td>
            <td>Launches a token for a utility they built or bought, and picks what the token does.</td>
            <td>A token economy without writing or auditing a program.</td>
          </tr>
          <tr>
            <td><strong>Hook developer</strong></td>
            <td>Writes one behaviour — a reward rule, a trading rule, an access rule — and publishes it.</td>
            <td>A royalty every time a token uses it.</td>
          </tr>
          <tr>
            <td><strong>Holder</strong></td>
            <td>Buys the token because of what it does, not what it promises.</td>
            <td>Whatever the hooks pay out: buybacks, burns, external assets, access.</td>
          </tr>
          <tr>
            <td><strong>Trader</strong></td>
            <td>Provides the volume the hooks feed on.</td>
            <td>A market whose rules are published and enforced on chain.</td>
          </tr>
        </tbody>
      </table>

      <H2 id="no-coding">No coding, by design</H2>
      <p>
        The creation screen is a form, not an IDE. A creator names the token and then chooses its
        behaviour from a list of modules:
      </p>
      <Code>{`CREATE TOKEN

  Name        GIGA
  Ticker      $GIGA
  Supply      1,000,000,000

  ────────────────────────────────────────

  CHOOSE YOUR MECHANICS

  □ Holder rewards        □ Stock rewards
  □ Buyback               □ Lottery
  □ Auto burn             □ Referral rewards
  □ Anti-snipe            □ Loyalty rewards
  □ Revenue share         □ Privacy rules

                                  [ LAUNCH ]`}</Code>
      <p>
        Each checkbox is a <Link href="/docs/launchpad/hooks">hook</Link>: a small on-chain module
        that runs under defined conditions and does one thing. The creator configures the numbers;
        the module supplies the logic. Nothing is bespoke, so nothing needs a bespoke audit.
      </p>

      <H2 id="simplest-example">The simplest example</H2>
      <p>
        A creator picks one hook — <em>Stock rewards</em> — and points it at a tokenized equity.
        From then on, the token&apos;s own trading activity buys an outside asset for the people
        holding it:
      </p>
      <Code>{`Trading revenue
      ↓
  Reward engine
      ↓
  ┌───────────────┬────────────────────────┐
  ↓               ↓
50% buyback     50% buy tokenized NVDA
  $GIGA              ↓
                 distributed to holders`}</Code>
      <p>
        The reason to hold stops being &quot;the meme is good&quot; and becomes something a
        spreadsheet can describe: <strong>trading activity generates external assets for
        holders</strong>. That claim is either true on chain or it is not, and anyone can check.
      </p>

      <H2 id="where-next">Where to read next</H2>
      <table>
        <thead>
          <tr>
            <th>Page</th>
            <th>What it covers</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><Link href="/docs/launchpad/hooks">Hooks</Link></td>
            <td>What a hook is, the catalogue, and how several stack on one token.</td>
          </tr>
          <tr>
            <td><Link href="/docs/launchpad/hook-marketplace">Hook marketplace</Link></td>
            <td>Third-party modules, royalties, and how a hook gets trusted.</td>
          </tr>
          <tr>
            <td><Link href="/docs/launchpad/economics">Economics</Link></td>
            <td>Protocol revenue, the native token, fee discounts and hook mining.</td>
          </tr>
          <tr>
            <td><Link href="/docs/launchpad/architecture">Architecture</Link></td>
            <td>Token-2022 transfer hooks, what they cannot do, and the honest gap.</td>
          </tr>
        </tbody>
      </table>
    </>
  );
}

export function LaunchpadHooks() {
  return (
    <>
      <NotBuilt />

      <H2 id="what-is-a-hook">What a hook is</H2>
      <p>
        A hook is one on-chain module with one job. It declares when it runs, what it reads, and
        what it is allowed to move. A creator picks it from a list and fills in numbers; they never
        see its code, and they never have to.
      </p>
      <Code>{`hook = { when it runs, what it reads, what it may move, its parameters }

example — Stock rewards
  when      a swap settles on the token's pool
  reads     the fee collected by that swap
  may move  only the fees this hook collected
  params    split 50/50, target asset, payout cadence`}</Code>
      <p>
        That last line matters more than it looks. A hook can only ever move value that the hook
        itself collected. It cannot reach into a holder&apos;s wallet, cannot mint, and cannot
        touch another hook&apos;s balance. The creator&apos;s configuration chooses between
        behaviours the module already permits — it cannot invent new ones.
      </p>

      <H2 id="catalogue">The catalogue</H2>
      <p>Modules fall into three families, and a token may take from all three.</p>

      <H3 id="rewards">Rewards</H3>
      <table>
        <thead>
          <tr><th>Hook</th><th>What it does</th></tr>
        </thead>
        <tbody>
          <tr><td><strong>Holder rewards</strong></td><td>Pays collected fees to holders in the token itself or in SOL, pro rata, on a cadence.</td></tr>
          <tr><td><strong>Stock rewards</strong></td><td>Converts a share of fees into a tokenized equity and distributes that instead. Holders accumulate an asset the token does not control.</td></tr>
          <tr><td><strong>Lottery</strong></td><td>Pools a share of fees and pays one holder per round, weighted by holding, drawn from an on-chain source of randomness.</td></tr>
          <tr><td><strong>Referral rewards</strong></td><td>Credits the wallet that referred a buyer with a slice of that buyer&apos;s fees.</td></tr>
          <tr><td><strong>Loyalty rewards</strong></td><td>Scales a holder&apos;s share by how long they have held without selling.</td></tr>
          <tr><td><strong>Revenue share</strong></td><td>Routes a fixed share of fees to named wallets: the team, a treasury, a charity, the utility&apos;s own running costs.</td></tr>
        </tbody>
      </table>

      <H3 id="trading">Trading</H3>
      <table>
        <thead>
          <tr><th>Hook</th><th>What it does</th></tr>
        </thead>
        <tbody>
          <tr><td><strong>Buyback</strong></td><td>Spends collected fees buying the token back off the market.</td></tr>
          <tr><td><strong>Auto burn</strong></td><td>Burns what the buyback bought, or burns a share of each transfer. Supply only goes down.</td></tr>
          <tr><td><strong>Anti-snipe</strong></td><td>Caps the size and rate of buys in the opening window, so the first block cannot take the float.</td></tr>
          <tr><td><strong>Dynamic fee</strong></td><td>Moves the fee with conditions — higher on sells into weakness, lower on quiet markets — within bounds the creator sets at launch.</td></tr>
          <tr><td><strong>LP rewards</strong></td><td>Pays a share of fees to the wallets providing liquidity rather than to all holders.</td></tr>
        </tbody>
      </table>

      <H3 id="privacy">Access and privacy</H3>
      <table>
        <thead>
          <tr><th>Hook</th><th>What it does</th></tr>
        </thead>
        <tbody>
          <tr><td><strong>Access rules</strong></td><td>Gates the utility behind a balance: hold <em>n</em> tokens, the content unlocks. This is the existing <Link href="/docs/ownership-check">ownership check</Link> with a balance test instead of a purchase test.</td></tr>
          <tr><td><strong>Transfer rules</strong></td><td>Allow and deny lists, lockups, per-wallet caps, cooldowns between transfers.</td></tr>
          <tr><td><strong>Compliance</strong></td><td>Jurisdiction or attestation requirements for tokens that need them. Opt-in, never a default.</td></tr>
        </tbody>
      </table>

      <H2 id="hook-stack">The hook stack</H2>
      <p>
        One token may run several hooks at once. The creator drags them into order, configures
        each, and launches. The stack is what gives a token its character:
      </p>
      <Code>{`$MONSTER

  ┌──────────────────────────────────────┐
  │ 1  ANTI-SNIPE     first 10 min, 0.5% cap │
  ├──────────────────────────────────────┤
  │ 2  DYNAMIC FEE    2–6%, by volatility    │
  ├──────────────────────────────────────┤
  │ 3  STOCK REWARD   40% of fees → NVDA     │
  ├──────────────────────────────────────┤
  │ 4  BUYBACK        40% of fees            │
  ├──────────────────────────────────────┤
  │ 5  BURN           everything bought back │
  └──────────────────────────────────────┘

  drag → drop → configure → launch`}</Code>
      <p>
        The closest familiar thing is an app store for a shop: Shopify apps, but for token
        economics. The creator assembles behaviour from parts other people wrote and tested.
      </p>

      <H2 id="order">Order is part of the design</H2>
      <p>
        Hooks run in the order they are stacked, and each one sees what the previous one left. That
        makes ordering a real decision, not a cosmetic one:
      </p>
      <Code>{`fee collected on a swap:  100 units

  stacked as 3 → 4 → 5          stacked as 4 → 5 → 3
  stock reward takes 40          buyback takes 40
  buyback takes 40 of the rest   burn consumes it
  burn consumes the buyback      stock reward takes 40 of the rest
  → holders get NVDA from 40     → holders get NVDA from 24`}</Code>
      <p>
        The launch screen shows this arithmetic with the creator&apos;s own numbers before anything
        is signed, the same way the <Link href="/docs/tutorial/launch-product">launch console</Link>{" "}
        shows the 95/5 split while a price is being typed. A creator should never discover their own
        token&apos;s behaviour after the fact.
      </p>

      <H2 id="limits">What a stack may not do</H2>
      <ul>
        <li>No hook may mint. Supply is fixed at launch, and only burns move it.</li>
        <li>No hook may move tokens a holder did not send. Rewards come from collected fees, never from balances.</li>
        <li>No hook may be added, removed or reconfigured after launch unless the creator declared it mutable at launch, and that declaration is visible on the token&apos;s page forever.</li>
        <li>A stack has a ceiling on total fees. A creator cannot assemble a 90% tax by stacking five modules that each look reasonable alone.</li>
      </ul>
    </>
  );
}

export function HookMarketplace() {
  return (
    <>
      <NotBuilt />

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
      <p>
        So the incentive points the right way. A hook that is used by many tokens and generates
        real volume earns continuously. A hook nobody uses earns nothing, however clever it is.
      </p>

      <H2 id="trust">How a hook earns trust</H2>
      <p>
        A module that runs on every transfer of someone else&apos;s token is as dangerous as it is
        useful. A hook that can fail a transfer can freeze a market; a hook with a bug can lock
        holders out of their own balances. The catalogue therefore has to be a gate, not a shelf.
      </p>
      <table>
        <thead>
          <tr><th>Stage</th><th>What it means</th></tr>
        </thead>
        <tbody>
          <tr><td><strong>Source published</strong></td><td>The program&apos;s source is public and the deployed bytecode matches it. No closed-source hook is listed, ever.</td></tr>
          <tr><td><strong>Bounded by review</strong></td><td>A hook declares the accounts it touches and the maximum share of fees it can take. A hook that asks for more than its category allows is refused.</td></tr>
          <tr><td><strong>Immutable or declared</strong></td><td>Either the program is non-upgradeable, or its upgrade authority is shown on every token that uses it. Creators choose with that in front of them.</td></tr>
          <tr><td><strong>Audited for the risky tier</strong></td><td>Hooks that can block transfers or move value need an audit before listing. Hooks that only read and emit do not.</td></tr>
          <tr><td><strong>Record in public</strong></td><td>Usage, volume, revenue and failure rate per hook are published, so a hook with a history of failing transfers is visible before it is chosen.</td></tr>
        </tbody>
      </table>
      <Note kind="warn">
        <p>
          The uncomfortable truth to design around: a marketplace of third-party modules that can
          halt transfers is a supply-chain risk with extra steps. The answer is not optimism. It is
          a narrow interface, declared account lists, hard caps enforced by the protocol rather than
          by the hook, and a review gate that says no.
        </p>
      </Note>
    </>
  );
}

export function LaunchpadEconomics() {
  return (
    <>
      <NotBuilt />

      <H2 id="where-revenue-comes-from">Where protocol revenue comes from</H2>
      <p>
        Four activities pay the protocol, and all four are things that only happen when the system
        is being used for its purpose:
      </p>
      <Code>{`every launch
every paid hook
every marketplace module
every protocol transaction
              ↓
        PROTOCOL REVENUE
              ↓
     ┌────────┴────────┐
     ↓                 ↓
 BUYBACK $XXXX      TREASURY
     ↓
   BURN`}</Code>
      <p>
        There is no revenue from issuing the native token and no revenue from listing. Revenue is a
        consequence of volume, which is a consequence of tokens people actually trade.
      </p>

      <H2 id="native-token">What the native token is for</H2>
      <p>
        A governance token with nothing to govern is a liability. The native token of this design
        earns demand structurally, from the way fees are charged:
      </p>
      <table>
        <thead>
          <tr><th>Launch paired with</th><th>Protocol fee</th></tr>
        </thead>
        <tbody>
          <tr><td>SOL</td><td>Standard protocol fee, routed to buyback-and-burn and treasury.</td></tr>
          <tr><td>The native token</td><td>Reduced, down to zero for some categories.</td></tr>
        </tbody>
      </table>
      <p>
        This is borrowed openly from Hookr on Ethereum, whose documentation describes ETH pairs
        paying a 0.3% protocol fee that funds a bounded buyback-and-burn, while pairs quoted in its
        own token do not pay that fee. The mechanism is sound and the reasoning transfers: the
        native token is cheaper to build on, so people who build a lot hold it.
      </p>

      <H2 id="hook-mining">Hook mining</H2>
      <p>
        This is the part that does not exist elsewhere, and the part most worth getting right.
        Every hook has its own volume, because every hook knows which tokens use it:
      </p>
      <Code>{`STOCK REWARD HOOK — this week

  tokens using it      37
  volume               $4.7M
  revenue              $31K`}</Code>
      <p>
        A share of that module&apos;s revenue goes to the hook&apos;s developer, and a share to
        people staking the native token. Usage becomes the thing being mined, instead of hashes or
        idle capital.
      </p>
      <Code>{`four ways in, one economy

  BUILD A HOOK  →  people use it        →  earn
  STAKE         →  the ecosystem is used →  earn
  LAUNCH        →  use hooks             →  a token that does something
  TRADE         →  generate activity     →  a market with published rules`}</Code>
      <p>
        Each participant needs the others. Hook developers need creators to adopt their modules.
        Creators need traders for the fees that make the hooks pay. Stakers need all three. Nobody
        earns from a system that is merely sitting there.
      </p>

      <Note kind="warn">
        <p>
          <strong>What is deliberately not decided here.</strong> Supply, emission, the split
          between developer and staker, and the exact fee numbers are not in this document. Writing
          them down before the mechanism is built would turn a design into a promise, and this
          project has been explicit from the start that it does not sell promises. The{" "}
          <Link href="/launchpad">launchpad page</Link> says the same thing in one line: no token,
          no presale, no date.
        </p>
      </Note>
    </>
  );
}

export function LaunchpadArchitecture() {
  return (
    <>
      <NotBuilt />

      <H2 id="foundation">The foundation already exists</H2>
      <p>
        This is not a proposal for technology that has to be invented. Solana&apos;s Token-2022
        program has a <strong>transfer hook</strong> extension: a mint can name a program that must
        run on every transfer of that token. Solana&apos;s own documentation lists the use cases it
        was built for — custom fees, allow and deny lists, custom transfer events, and tracking.
      </p>
      <Code>{`token transfer
      ↓
  Token-2022
      ↓
  transfer hook extension
      ↓
  custom program
      ↓
  execute the rule

  if the hook fails, the transfer fails`}</Code>
      <p>
        That last line is the whole security model in one sentence, and it cuts both ways. A rule
        cannot be skipped — but a broken rule stops the token moving at all.
      </p>

      <H2 id="the-gap">The gap nobody should paper over</H2>
      <p>
        A Token-2022 transfer hook fires on <em>transfers</em>. Uniswap v4 hooks — the model Hookr
        builds on — fire on the <em>lifecycle of a pool</em>: before and after a swap, on liquidity
        added, on liquidity removed. Those are not the same thing, and the difference is exactly
        where a naive port would break.
      </p>
      <table>
        <thead>
          <tr><th>Needed for</th><th>Uniswap v4 hook</th><th>Token-2022 transfer hook</th></tr>
        </thead>
        <tbody>
          <tr><td>Knowing a transfer is a buy</td><td>Given by the callback</td><td>Not given — a transfer is a transfer</td></tr>
          <tr><td>Knowing a transfer is a sell</td><td>Given</td><td>Not given</td></tr>
          <tr><td>Reacting to liquidity changes</td><td>Given</td><td>Not visible at all</td></tr>
          <tr><td>Reading the price of the swap</td><td>Given</td><td>Not available in the hook</td></tr>
          <tr><td>Charging a fee on any movement</td><td>Possible</td><td>Possible</td></tr>
          <tr><td>Allow and deny lists, caps, cooldowns</td><td>Possible</td><td>Possible, and natural</td></tr>
        </tbody>
      </table>
      <p>
        So the honest statement is: <strong>we cannot translate a Solidity hook into Rust and
        call it done.</strong> Half the catalogue — transfer rules, access rules, caps, cooldowns,
        burns on transfer — maps directly onto Token-2022 and could be built on it today. The other
        half — anything that needs to know a buy from a sell, or to react to a pool — needs more
        than the extension gives.
      </p>

      <H2 id="shape">The shape that closes the gap</H2>
      <p>
        Three pieces, in increasing order of how much has to be designed:
      </p>
      <table>
        <thead>
          <tr><th>Piece</th><th>Job</th><th>Where the difficulty is</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Token-2022 extensions</strong></td>
            <td>Everything that is genuinely about a transfer: rules, caps, lists, per-transfer fees.</td>
            <td>Low. This is what the extension is for.</td>
          </tr>
          <tr>
            <td><strong>A router the pools trade through</strong></td>
            <td>Gives swap semantics back: it knows direction, size and price, and can call hooks before and after with that context.</td>
            <td>Routing is only honoured if trades actually go through it. A trade routed around it must still be safe, never silently fee-free.</td>
          </tr>
          <tr>
            <td><strong>Hook runtime and registry</strong></td>
            <td>Resolves a token&apos;s stack, enforces the fee ceiling, meters usage per hook for <Link href="/docs/launchpad/economics#hook-mining">hook mining</Link>, and isolates one hook&apos;s failure from the rest.</td>
            <td>Compute budget, account limits, and making sure a bad hook degrades instead of bricking a token.</td>
          </tr>
        </tbody>
      </table>

      <H2 id="failure">Designing for failure</H2>
      <p>
        Because a failed hook fails the transfer, failure handling is not a detail to add later:
      </p>
      <ul>
        <li>
          <strong>Hooks are metered.</strong> A hook that exceeds its compute or account budget is
          cut off at the stack level rather than being allowed to fail the transfer.
        </li>
        <li>
          <strong>Reward hooks never run inline.</strong> Distribution is queued and settled
          separately. A payout failing must not stop someone moving their own tokens.
        </li>
        <li>
          <strong>Blocking hooks are a separate, audited tier.</strong> Only rules whose whole
          purpose is to refuse — deny lists, lockups — may fail a transfer at all.
        </li>
        <li>
          <strong>Every token publishes its stack.</strong> Which hooks, which versions, which
          parameters, and whether any of it can change. A buyer can read what the token will do to
          them before buying it.
        </li>
      </ul>

      <H2 id="what-carries-over">What carries over from what already works</H2>
      <p>
        The launchpad is new, but it does not start from nothing. Four decisions that the live
        marketplace already proves are carried over without change:
      </p>
      <table>
        <thead>
          <tr><th>From the marketplace</th><th>Into the launchpad</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><Link href="/docs/payments">No custody</Link></td>
            <td>Fees and rewards move between wallets and programs. The platform is never the holder of anyone&apos;s money.</td>
          </tr>
          <tr>
            <td><Link href="/docs/selling#confirm">Signed terms</Link></td>
            <td>A launch is signed over its exact configuration — supply, hooks, parameters — so what the wallet showed is what deploys.</td>
          </tr>
          <tr>
            <td><Link href="/docs/ownership-check">Ownership check</Link></td>
            <td>Becomes the balance check that access hooks use to gate a utility.</td>
          </tr>
          <tr>
            <td><Link href="/docs/moderation">Moderation</Link></td>
            <td>Reports and takedowns apply to hooks as well as products. A hook that harms its users is delisted.</td>
          </tr>
        </tbody>
      </table>

      <Note>
        <p>
          If you think a piece of this is wrong, that is the point of publishing it before building
          it. The design is argued with in the open, in{" "}
          <a href="https://github.com/everynth/everynth">the repository</a>.
        </p>
      </Note>
    </>
  );
}
