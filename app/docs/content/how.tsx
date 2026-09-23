import Link from "next/link";
import { Code, H2, Note } from "../ui";

export function Payments() {
  return (
    <>
      <H2 id="no-contract">No contract of ours</H2>
      <p>
        A purchase is a plain Solana transaction built in the buyer&apos;s browser from two{" "}
        <code>SystemProgram.transfer</code> instructions. Nothing of EVERYNTH&apos;s runs on-chain, so there is no
        program to audit, upgrade, pause or drain. What can go wrong is bounded to the one order in front of you.
      </p>

      <H2 id="split">The split</H2>
      <p>Prices are stored in lamports (1 SOL = 1,000,000,000 lamports). For a price <code>P</code>:</p>
      <Code>{`fee            = floor(P × 500 / 10 000)     // 5%, rounded down
creator share  = P − fee
fee + creator share == P                     // always, no residue`}</Code>
      <p>
        The buyer pays exactly <code>P</code> plus the Solana network fee. If the creator and the treasury are the
        same wallet the two legs are merged into one transfer.
      </p>
      <p>
        Minimum price is <strong>0.02 SOL</strong>: Solana rejects a transfer that would leave an account under its
        rent-exempt minimum (about 0.0009 SOL), and 5% of 0.02 clears that even for a brand-new wallet. Maximum is
        1,000,000 SOL, which keeps every amount inside JavaScript&apos;s safe integer range.
      </p>

      <H2 id="order">The order</H2>
      <p>
        Pressing Buy calls <code>POST /api/orders</code>. The server freezes the payout terms — creator address,
        creator amount, treasury address, fee — and generates a fresh keypair whose public key is the order&apos;s{" "}
        <strong>reference</strong>. The private half is thrown away; the reference only needs to be unique and
        unguessable.
      </p>
      <Code>{`{
  "purchaseId": "d80f8bf3-…",
  "reference":  "9kQd…3FaR",
  "creator":    "GfdY…9NsY",  "creatorAmount": 19000000,
  "treasury":   "n4Xb…H7Pt",  "fee": 1000000
}`}</Code>
      <p>
        Freezing matters: if the creator changes the price after you pressed Buy, your order still settles at the old
        terms.
      </p>

      <H2 id="transaction">The transaction</H2>
      <Code>{`instruction 1: SystemProgram.transfer(buyer → creator,  creatorAmount)
               + reference key appended as a read-only, non-signer account
instruction 2: SystemProgram.transfer(buyer → treasury, fee)`}</Code>
      <p>
        Attaching the reference as an extra account is the Solana Pay convention. It costs nothing, changes nothing,
        and makes the transaction findable by <code>getSignaturesForAddress(reference)</code>.
      </p>

      <H2 id="verification">Verification</H2>
      <p>
        After the wallet reports the transaction confirmed, the browser calls{" "}
        <code>POST /api/orders/:id/confirm</code> with the signature. The server never trusts that call; it fetches
        the transaction from its own RPC and checks:
      </p>
      <ol>
        <li>The transaction exists and did not fail (<code>meta.err</code> is null).</li>
        <li>The order&apos;s reference key is among the transaction&apos;s accounts.</li>
        <li>
          For every payee, <code>postBalance − preBalance ≥ amount owed</code>. Balances are checked per account, not
          by parsing instructions, so it holds however the transaction was assembled.
        </li>
        <li>
          The signature has not settled another purchase. The database enforces this with a unique constraint, so a
          single transaction that carries two references still pays for one.
        </li>
      </ol>
      <p>Only then is the purchase marked paid and the key released.</p>

      <H2 id="recovery">Recovery</H2>
      <p>
        If the confirm call never arrives (closed tab, crashed browser), the next <code>POST /api/orders</code> for the
        same product finds the open order and searches the chain for a transaction carrying its reference. A paid
        order is settled on the spot and the API answers <code>409 you already own this</code>; the page then shows
        Unlock. See <Link href="/docs/buying#recovery">Buying</Link>.
      </p>

      <H2 id="rpc">RPC and confirmation</H2>
      <p>
        The browser confirms at <em>confirmed</em> commitment using the RPC in{" "}
        <code>NEXT_PUBLIC_RPC_URL</code>; the server verifies with <code>RPC_URL</code> (falls back to the public one).
        If the server&apos;s RPC lags, confirm returns 402 with <em>payment not found yet</em> and the browser retries
        five times, two seconds apart.
      </p>
    </>
  );
}

export function Encryption() {
  return (
    <>
      <H2 id="key">One key per product</H2>
      <p>
        When a creator launches, their browser calls <code>crypto.subtle.generateKey</code> for a fresh 256-bit
        AES-GCM key. The key is not derived from a password or the wallet; it is random, and it exists for this
        product only.
      </p>

      <H2 id="ciphertext">Ciphertext format</H2>
      <Code>{`payload = iv (12 bytes) ‖ AES-256-GCM(key, iv, plaintext)   // GCM tag included`}</Code>
      <ul>
        <li><strong>Files</strong>: the payload is uploaded straight from the browser to blob storage using a short-lived token from <code>POST /api/upload</code>. It never passes through the API. Limit 200 MB.</li>
        <li><strong>Secret text</strong>: the payload (≤ 64 KB) is sent with the launch form and stored inline in the database.</li>
      </ul>
      <p>Storage and database therefore only ever hold ciphertext. A leaked blob URL is useless without the key.</p>

      <H2 id="wrapping">Key wrapping</H2>
      <p>
        The raw key is sent to the server over TLS with the listing details. The server wraps it with a master key
        (AES-256-GCM again) and stores the result:
      </p>
      <Code>{`wrapped = base64( iv(12) ‖ tag(16) ‖ AES-256-GCM(MASTER_KEY, iv, contentKey) )`}</Code>
      <p>
        <code>MASTER_KEY</code> lives only in the server environment. For GitHub products the same slot holds the
        creator&apos;s wrapped GitHub token.
      </p>
      <Note kind="warn">
        <p>
          Losing the master key makes every stored product undecryptable, permanently. It is backed up like money and
          never rotated without re-wrapping every key.
        </p>
      </Note>

      <H2 id="unlock">Unlock</H2>
      <p>
        After the chain confirms payment, <code>GET /api/purchases/:id/content</code> returns the unwrapped key
        (base64) together with either the inline ciphertext or the blob URL. The buyer&apos;s browser fetches the
        ciphertext, calls <code>crypto.subtle.decrypt</code>, and hands the result to a download or shows it as text.
        The plaintext is never assembled on a server.
      </p>

      <H2 id="honest-limit">The honest limit</H2>
      <p>
        Because EVERYNTH holds the master key, it can unwrap any content key. This is a deliberate v1 trade-off, made
        for two reasons:
      </p>
      <ul>
        <li>A purchase at 3 a.m. must be deliverable while the creator is asleep. Someone has to hand the buyer the key, and in v1 that is the server.</li>
        <li>A reported product must be inspectable, or moderation is impossible.</li>
      </ul>
      <p>
        What this means for you: EVERYNTH&apos;s operators are in the trust boundary; storage providers, RPC nodes,
        the chain and network observers are not. Fully end-to-end delivery — keys derived per wallet so the server holds
        nothing it can open — is the goal state and arrives together with private buyer–creator chat.
      </p>

      <H2 id="login">Wallet signatures</H2>
      <p>
        Login is an ed25519 signature over a fixed message that includes the site host, the wallet and a timestamp.
        The server verifies the signature, rejects anything older than five minutes, and issues an HMAC-signed session
        cookie valid for seven days. No nonce store is needed: the host binding stops cross-site replay and the window
        limits any replay to five minutes.
      </p>
      <p>
        Launching asks for a second signature, over the listing terms themselves — title, price in lamports, delivery
        kind, creator, timestamp. The server rebuilds that message from what was actually submitted and verifies it
        against the session wallet, so a session cookie on its own cannot list anything, and nothing can be altered
        between the wallet dialog and the database row. Buying needs no extra message: the payment transaction is
        itself the signed instruction.
      </p>
    </>
  );
}

export function Architecture() {
  return (
    <>
      <H2 id="layers">Three layers</H2>
      <table>
        <thead>
          <tr>
            <th>Layer</th>
            <th>Does</th>
            <th>Sees</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Your device</td>
            <td>Encrypts and decrypts, signs the login and the payment</td>
            <td>Plaintext, the content key, your private key</td>
          </tr>
          <tr>
            <td>EVERYNTH</td>
            <td>Stores ciphertext and wrapped keys, freezes orders, verifies transactions, releases keys, invites on GitHub</td>
            <td>Ciphertext, wrapped keys, orders, sessions</td>
          </tr>
          <tr>
            <td>Solana</td>
            <td>Moves SOL between wallets, confirms in seconds</td>
            <td>Addresses, amounts, reference keys</td>
          </tr>
        </tbody>
      </table>

      <H2 id="stack">The stack</H2>
      <ul>
        <li><strong>Next.js 16</strong> (App Router) for pages and route handlers, deployed on Vercel.</li>
        <li><strong>Web Crypto</strong> in the browser for AES-GCM; Node <code>crypto</code> on the server for key wrapping, HMAC sessions and ed25519 verification.</li>
        <li><strong>@solana/web3.js</strong> and the wallet adapter for signing and sending; no custom program.</li>
        <li><strong>Neon Postgres</strong> for products, purchases, reports and blocks (embedded PGlite locally, same SQL).</li>
        <li><strong>Vercel Blob</strong> for file ciphertext, uploaded directly from the browser.</li>
        <li><strong>GitHub REST</strong> for repository invitations.</li>
      </ul>
      <p>It is short on purpose. Every component that is not there is one that cannot be compromised.</p>

      <H2 id="data-model">Data model</H2>
      <Code>{`products   id, creator, title, description, category, price (lamports), kind,
           file_name, file_type, payload (secret ciphertext) | payload_url (blob),
           github_repo, wrapped_key, cover, cover_type, status live|removed
purchases  id, product_id, buyer, reference (unique), creator, creator_amount,
           treasury, fee, signature (unique), status pending|paid, github_user
reports    product_id, reporter, reason            (unique per product+reporter)
blocked_wallets  wallet, reason`}</Code>
      <p>
        Payout terms are copied onto the purchase at order time, so later edits to the product cannot change what an
        open order settles at.
      </p>

      <H2 id="trust">Trust summary</H2>
      <ul>
        <li>Money: never held by EVERYNTH. Trust the chain.</li>
        <li>Goods: encrypted before upload; EVERYNTH can unwrap keys in v1 (<Link href="/docs/encryption#honest-limit">why</Link>). Trust the operators for that, nobody else.</li>
        <li>Identity: your wallet. No accounts, no passwords, nothing to leak.</li>
      </ul>
    </>
  );
}
