import Link from "next/link";
import { Code, H2, H3, Note } from "../ui";

export function Overview() {
  return (
    <>
      <H2 id="what-it-is">What EVERYNTH is</H2>
      <p>
        EVERYNTH is a marketplace on Solana for digital products: datasets, research, source code, API keys, private
        community links, access to a GitHub repository, or access to an app you host yourself. Creators launch a
        product with a price in SOL; buyers pay wallet-to-wallet and receive the product on their own device.
      </p>
      <p>Two things make it different from a normal marketplace:</p>
      <ul>
        <li>
          <strong>The platform never holds the money.</strong> A purchase is one Solana transaction with two plain
          transfers: 95% to the creator, 5% to the treasury. There is no escrow, no smart contract of ours, nothing that
          can be paused or drained.
        </li>
        <li>
          <strong>The platform never sees the goods in the clear.</strong> Files and secrets are encrypted in the
          creator&apos;s browser before upload. Storage only ever holds ciphertext. Decryption happens on the buyer&apos;s
          device after the chain confirms payment.
        </li>
      </ul>

      <H2 id="one-purchase">One purchase, end to end</H2>
      <ol>
        <li>A creator launches a product. The content is encrypted locally and uploaded; the key is stored wrapped.</li>
        <li>A buyer connects their wallet (a free signature, no funds move) and presses Buy.</li>
        <li>The server freezes the payout terms for this order and mints a unique reference key.</li>
        <li>The buyer&apos;s wallet sends one transaction: two transfers plus the reference.</li>
        <li>The server fetches the confirmed transaction and checks the balances that changed.</li>
        <li>The buyer&apos;s browser receives the key and the ciphertext and decrypts. Done.</li>
      </ol>
      <p>
        The details of each step are in <Link href="/docs/payments">Payments</Link> and{" "}
        <Link href="/docs/encryption">Encryption</Link>.
      </p>

      <H2 id="who-sees-what">Who sees what</H2>
      <table>
        <thead>
          <tr>
            <th>Layer</th>
            <th>Can see</th>
            <th>Cannot see</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Your device</td>
            <td>Plaintext, the content key, your wallet&apos;s private key</td>
            <td>—</td>
          </tr>
          <tr>
            <td>EVERYNTH</td>
            <td>Ciphertext, the content key wrapped by a master key, orders and sessions</td>
            <td>Plaintext, your private key</td>
          </tr>
          <tr>
            <td>Solana</td>
            <td>Wallet addresses, amounts, the order&apos;s reference key</td>
            <td>Anything about the goods</td>
          </tr>
        </tbody>
      </table>
      <Note kind="warn">
        <p>
          <strong>Honest limit of v1.</strong> EVERYNTH can technically unwrap a content key. That is what lets a
          purchase be delivered while the creator is offline, and what lets a reported product be inspected. Fully
          end-to-end keys are on the roadmap; see <Link href="/docs/encryption#honest-limit">Encryption</Link>.
        </p>
      </Note>

      <H2 id="numbers">The numbers</H2>
      <Code>{`Network        Solana mainnet
Payment        native SOL · 2 transfers · 1 transaction
Fee            5% flat, taken from the creator's share
Minimum price  0.02 SOL (so the 5% fee clears rent-exemption)
Files          up to 200 MB, encrypted before upload
Secret text    up to 64 KB
Refunds        none — delivery is instant`}</Code>
    </>
  );
}

export function GettingStarted() {
  return (
    <>
      <H2 id="wallet">1. A Solana wallet</H2>
      <p>
        Phantom, Solflare, Backpack or any wallet that supports the Wallet Standard. Set it to <strong>mainnet</strong>.
        To buy you need SOL for the price plus a little for network fees (a fraction of a cent). To sell you need
        nothing: listing is free.
      </p>

      <H2 id="sign-in">2. Connect and sign</H2>
      <p>
        Press <em>Connect wallet</em>, pick your wallet, approve the connection. Your wallet then asks you to sign one
        short message. This proves you control the address; it costs nothing and moves no funds. The message looks like:
      </p>
      <Code>{`everynth.org wants you to sign in to EVERYNTH.
This is free and does not move any funds.

Wallet: 7uNq…UV8h
Issued at: 1758445200000`}</Code>
      <p>
        The signature is valid for five minutes and only for this domain, so it cannot be replayed elsewhere. You stay
        signed in for seven days.
      </p>
      <Note>
        <p>
          There is no email, no password and no account to create. Your wallet address is your identity. Your wallet
          asks for a signature twice more only: once to confirm each launch, and once per purchase (that one is the
          payment itself).
        </p>
      </Note>

      <H2 id="first-product">3. Launch your first product</H2>
      <ol>
        <li>Open <Link href="/launch/product">Launch product</Link> — that is the one that lists something for sale; <Link href="/launchpad">Launch token</Link> is a different, unbuilt thing.</li>
        <li>Fill in title, description, category and a price in SOL (minimum 0.02).</li>
        <li>Choose what buyers receive: a file, secret text, or access to a GitHub repository.</li>
        <li>
          Press <em>Confirm, encrypt &amp; launch</em> and sign the confirmation your wallet shows (free, no funds
          move). The product is live immediately.
        </li>
      </ol>
      <p>Full details in <Link href="/docs/selling">Selling</Link>.</p>

      <H2 id="first-purchase">4. Buy something</H2>
      <p>
        Open a product, press <em>Buy with SOL</em>, approve the transaction in your wallet. When the chain confirms,
        the button becomes <em>Unlock &amp; open</em>. Everything you own is listed under{" "}
        <Link href="/purchases">Purchases</Link>.
      </p>

      <H2 id="fees">Fees</H2>
      <table>
        <thead>
          <tr>
            <th>Who</th>
            <th>Pays</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Buyer</td>
            <td>The listed price + Solana network fee (~0.000005 SOL)</td>
          </tr>
          <tr>
            <td>Creator</td>
            <td>5% of each sale, deducted in the same transaction. Receives 95%.</td>
          </tr>
          <tr>
            <td>Listing</td>
            <td>Free</td>
          </tr>
        </tbody>
      </table>
    </>
  );
}

export function Faq() {
  return (
    <>
      <H3 id="refunds">Can I get a refund?</H3>
      <p>
        No. Payment goes directly from your wallet to the creator&apos;s and delivery is instant, so there is nothing
        for the platform to reverse. Read the description carefully. If a product does not match it, use{" "}
        <em>Report this product</em> on its page; a human reviews reports and can take the listing down.
      </p>

      <H3 id="reviews">Can I trust the reviews?</H3>
      <p>
        A review can only come from a wallet that paid for that exact product, and one purchase can only ever hold one
        review. Creators cannot review their own products, cannot delete what buyers wrote, and cannot buy more
        reviews — each one would need a real purchase at the real price, paid to themselves minus the 5% fee. See{" "}
        <Link href="/docs/selling#reviews">Reviews</Link>.
      </p>

      <H3 id="browser-closed">My browser closed after I paid. Did I lose the money?</H3>
      <p>
        No. Open the product again and press Buy. Before creating a new order the server looks up your existing one on
        the chain, sees it was paid, and unlocks it. You are never charged twice for the same product. Details in{" "}
        <Link href="/docs/buying#recovery">Buying</Link>.
      </p>

      <H3 id="platform-read">Can EVERYNTH read what I sell or buy?</H3>
      <p>
        Technically yes, in v1: the content key is stored wrapped with a server-side master key and can be unwrapped.
        In practice this happens only to deliver a purchase or to inspect a reported product. Storage providers,
        network observers and anyone with a leaked URL see only ciphertext. See{" "}
        <Link href="/docs/encryption#honest-limit">the honest limit</Link>.
      </p>

      <H3 id="chain-visible">Is my purchase visible on the blockchain?</H3>
      <p>
        The payment is: anyone can see that wallet A sent SOL to wallet B and to the treasury, and that a reference key
        was attached. What was bought is not on the chain; product ids are not written to it.
      </p>

      <H3 id="lost-wallet">I lost access to my wallet.</H3>
      <p>
        Purchases are tied to the wallet address that paid. If you lose the wallet, you lose the ability to unlock what
        it bought. EVERYNTH cannot move a purchase to another address, because there is no way to prove the two belong
        to the same person.
      </p>

      <H3 id="creator-payout">When does a creator get paid?</H3>
      <p>In the same transaction the buyer signs. There is no payout schedule and nothing to withdraw.</p>

      <H3 id="edit-content">Can I change a product&apos;s content after launch?</H3>
      <p>
        No. Title, description, category, price and cover can be edited; the encrypted content cannot. Launch a new
        product for new content. Buyers of the old one keep access to what they bought.
      </p>

      <H3 id="min-price">Why is the minimum price 0.02 SOL?</H3>
      <p>
        Solana rejects a transfer that would leave an account below its rent-exempt minimum (about 0.0009 SOL). The 5%
        fee on a 0.02 SOL sale is 0.001 SOL, which clears that even for a treasury or creator wallet that has never held
        SOL.
      </p>

      <H3 id="usdc">Can I pay with USDC or another token?</H3>
      <p>Not in v1. Prices and payments are in native SOL. Stablecoin support is planned for machine-to-machine buyers.</p>
    </>
  );
}
