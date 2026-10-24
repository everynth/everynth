import Link from "next/link";
import { Code, H2, Note, Route } from "../ui";

export function OwnershipCheck() {
  return (
    <>
      <H2 id="why">Why</H2>
      <p>
        If you host an app, API or agent yourself, you can sell access to it on EVERYNTH without handing out codes that
        get shared. Sell a product (a secret text such as your app&apos;s URL is enough), then have your app ask
        EVERYNTH whether the visitor&apos;s wallet bought it. Access follows the wallet, not a string.
      </p>

      <H2 id="endpoint">The endpoint</H2>
      <Code>{`GET https://everynth.org/api/verify?product=<productId>&wallet=<address>

200  { "owned": true,  "since": "2026-09-21T10:00:00.000Z" }
200  { "owned": false, "since": null }
400  { "error": "product and wallet are required" }`}</Code>
      <ul>
        <li>Public: no API key, no session.</li>
        <li>CORS-open (<code>Access-Control-Allow-Origin: *</code>), so a browser app can call it directly.</li>
        <li><code>since</code> is the time of the first paid purchase of that product by that wallet.</li>
        <li>Removed products still answer <code>owned: true</code> for their buyers.</li>
      </ul>

      <H2 id="prove-wallet">Prove the wallet first</H2>
      <p>
        Anyone can ask whether any wallet owns a product, so the answer only means something once your app knows the
        visitor controls that wallet. Do what EVERYNTH does at sign-in: ask the wallet to sign a message, verify the
        signature, then trust the address.
      </p>
      <Code lang="js">{`// browser: wallet adapter
const msg = new TextEncoder().encode(\`\${location.host} sign-in \${Date.now()}\`);
const sig = await wallet.signMessage(msg);          // Uint8Array(64)
// send { wallet, msg, sig } to your server and verify there:

// node
import { createPublicKey, verify } from "node:crypto";
import { PublicKey } from "@solana/web3.js";
const spki = Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), new PublicKey(wallet).toBytes()]);
const ok = verify(null, msg, createPublicKey({ key: spki, format: "der", type: "spki" }), sig);`}</Code>

      <H2 id="gate">Gate the app</H2>
      <Code lang="js">{`const PRODUCT = "d80f8bf3-9c1a-4e06-b4c1-b24d6866a838";   // from your product's URL, /p/<id>

const res = await fetch(\`https://everynth.org/api/verify?product=\${PRODUCT}&wallet=\${wallet}\`);
const { owned } = await res.json();
if (!owned) location.href = \`https://everynth.org/p/\${PRODUCT}\`;`}</Code>
      <p>
        Cache the answer for a few minutes per wallet if your app is busy; ownership never goes away once granted, so
        stale answers only ever err on the side of a buyer who bought seconds ago.
      </p>

      <H2 id="agents">For agents and servers</H2>
      <p>
        The same endpoint works from a server. An agent that needs to know whether its principal bought a dataset
        calls it with the principal&apos;s wallet. A pay-per-call gate (x402) that lets the agent itself pay is on the
        roadmap; today an agent buys through the same wallet flow a person does.
      </p>
    </>
  );
}

export function Api() {
  return (
    <>
      <p>
        Base URL <code>https://everynth.org</code>. Requests and responses are JSON unless noted. Routes marked{" "}
        <em>session</em> need the cookie set by <code>POST /api/session</code>; the browser sends it automatically.
        Errors are <code>{`{ "error": "message" }`}</code> with a 4xx status.
      </p>

      <H2 id="auth">Session</H2>
      <Route method="POST" path="/api/session" auth="public">
        <p>Sign in with a wallet signature.</p>
        <Code>{`{ "wallet": "<base58>", "issuedAt": 1758445200000, "signature": "<base64 ed25519 over the login message>" }
→ 200 { "wallet": "<base58>" } + Set-Cookie everynth_session (httpOnly, 7 days)
→ 400 missing fields · 401 invalid or expired signature (5-minute window, host-bound)`}</Code>
        <p>The message to sign, byte for byte:</p>
        <Code>{`\${host} wants you to sign in to EVERYNTH.\\nThis is free and does not move any funds.\\n\\nWallet: \${wallet}\\nIssued at: \${issuedAt}`}</Code>
      </Route>
      <Route method="DELETE" path="/api/session" auth="session">
        <p>Sign out. Clears the cookie. <code>→ 200 {`{ "ok": true }`}</code></p>
      </Route>

      <H2 id="limits">Rate limits</H2>
      <p>
        Counted per wallet (per IP when there is no session), in fixed windows, in the database — so every serverless
        instance counts into the same bucket. Over budget returns <code>429</code> with a <code>retry-after</code>
        header. Nothing here is near what normal use looks like.
      </p>
      <Code>{`POST /api/session              30 / 10 min
POST /api/products             25 / hour
POST /api/upload               20 / hour
POST /api/orders               40 / hour
POST /api/purchases/:id/review 20 / hour
POST /api/reports              10 / hour
GET  /api/verify              300 / minute   (per IP)
GET  /api/launches/:id/gate   300 / minute   (per IP)
POST /api/launches             10 / hour     (frozen launches per wallet)
POST /api/launches/:id/launch  30 / hour     (verifications; retrying while the RPC catches up is normal)
POST /api/agents/sessions*     40 / hour     (studio messages, on top of the daily session quota)
POST /api/launches/:id/desk    40 / hour     (shares the studio bucket)
POST /api/launches/:id/identity 40 / hour    (shares the studio bucket)`}</Code>

      <H2 id="products">Products</H2>
      <Route method="POST" path="/api/upload" auth="session">
        <p>
          Token exchange for a direct browser upload to blob storage (Vercel Blob client protocol). Use{" "}
          <code>upload()</code> from <code>@vercel/blob/client</code> with <code>handleUploadUrl: &quot;/api/upload&quot;</code>.
          Only <code>application/octet-stream</code> up to 200 MB + 28 bytes is accepted.
        </p>
      </Route>
      <Route method="POST" path="/api/products" auth="session">
        <p>Launch a product. <code>multipart/form-data</code>:</p>
        <Code>{`title        3–80 chars           description  10–4000 chars
category     AI Agent | API | Dataset | Tool | Research | Service | Community
price        "0.02" … "1000000", ≤ 9 decimals (SOL)
kind         file | secret | github
cover        image/png|jpeg|webp|gif ≤ 1 MB           (optional)

issuedAt     ms timestamp, ≤ 5 min old
signature    base64 ed25519 over the launch message, by the session wallet

kind=file    key (base64, 32 bytes)  fileName  fileType  payloadUrl (our blob host only)
kind=secret  key (base64, 32 bytes)  payload   (Blob: iv‖ciphertext, ≤ 64 KB + 28)
kind=github  repo ("owner/name")     token     (checked live: must have admin on the repo)

→ 200 { "id": "<uuid>" } · 400 validation · 401 bad confirmation · 403 wallet blocked · 413 too large`}</Code>
        <p>The launch message, rebuilt server-side from the submitted title, price (in lamports) and kind:</p>
        <Code>{`\${host} wants you to confirm this launch on EVERYNTH.\\nThis is free and does not move any funds.\\n\\nTitle: \${title}\\nPrice: \${lamports} lamports\\nDelivery: \${kind}\\nCreator: \${wallet}\\nIssued at: \${issuedAt}`}</Code>
      </Route>
      <Route method="PATCH" path="/api/products/:id" auth="creator + signature">
        <p>
          Edit listing details: <code>title description category price cover</code> (same rules), plus{" "}
          <code>issuedAt</code> and <code>signature</code>. Content is immutable. <code>→ 200 {`{ ok }`}</code> · 401
          bad confirmation · 404 not yours.
        </p>
        <Code>{`\${host} wants you to confirm: edit listing.\\nThis is free and does not move any funds.\\n\\nItem: \${id}\\nTitle: \${title}\\nPrice: \${lamports} lamports\\nWallet: \${wallet}\\nIssued at: \${issuedAt}`}</Code>
      </Route>
      <Route method="POST" path="/api/products/:id/remove" auth="creator or admin + signature">
        <p>
          Unlist. Body: <code>{`{ "block": true }`}</code> (admins) also blocks the creator and unlists all their
          products, plus <code>issuedAt</code> and <code>signature</code>. <code>→ 200 {`{ ok }`}</code> · 401 bad
          confirmation
        </p>
        <Code>{`\${host} wants you to confirm: remove from market.\\nThis is free and does not move any funds.\\n\\nItem: \${id}\\nScope: product | product and creator\\nWallet: \${wallet}\\nIssued at: \${issuedAt}`}</Code>
      </Route>
      <Route method="POST" path="/api/purchases/:id/review" auth="buyer">
        <p>
          Review a product you paid for. One review per purchase; posting again rewrites it.{" "}
          <code>{`{ "rating": 1-5, "body": "≤ 500 chars" }`}</code> <code>→ 200 {`{ ok }`}</code> · 400 bad rating or
          too long · 404 no paid purchase of yours.
        </p>
      </Route>
      <Route method="GET" path="/api/products/:id/cover" auth="public">
        <p>The cover image bytes, or 404. Cached 5 minutes.</p>
      </Route>

      <H2 id="orders">Orders and purchases</H2>
      <Route method="POST" path="/api/orders" auth="session">
        <Code>{`{ "productId": "<uuid>" }
→ 200 { "purchaseId", "reference", "creator", "creatorAmount", "treasury", "fee" }   // lamports
→ 400 own product · 404 not live · 409 already owned (also after chain recovery)`}</Code>
        <p>Reuses the caller&apos;s open order for the product if one exists, after checking the chain for a payment.</p>
      </Route>
      <Route method="POST" path="/api/orders/:id/confirm" auth="buyer">
        <Code>{`{ "signature": "<base58>" }      // optional: without it the server searches by reference
→ 200 { "ok": true } · 402 { "error": "payment not found yet" | "underpaid: …" | "transaction failed on-chain" | … }`}</Code>
      </Route>
      <Route method="GET" path="/api/purchases/:id/content" auth="buyer, paid">
        <Code>{`file    { "kind": "file",   "fileName", "fileType", "key": "<base64>", "payloadUrl": "https://…blob…", "payload": null }
secret  { "kind": "secret", "key": "<base64>", "payload": "<base64 iv‖ciphertext>", "payloadUrl": null }
github  { "kind": "github", "repo": "owner/name", "githubUser": "octocat" | null }
→ 404 no paid purchase`}</Code>
      </Route>
      <Route method="POST" path="/api/purchases/:id/github" auth="buyer, paid">
        <Code>{`{ "username": "octocat" }
→ 200 { "ok": true, "repo": "owner/name" } · 400 bad username · 409 tied to another account · 502 GitHub refused`}</Code>
      </Route>

      <H2 id="verify">Ownership</H2>
      <Route method="GET" path="/api/verify?product=&wallet=" auth="public · CORS *">
        <p><code>→ 200 {`{ "owned": boolean, "since": ISO date | null }`}</code>. See <Link href="/docs/ownership-check">Ownership check</Link>.</p>
      </Route>

      <H2 id="launchpad">Launchpad</H2>
      <Route method="POST" path="/api/launches" auth="session + signature">
        <p>Freeze a token launch. The caller must own the utility (built or bought). Body:</p>
        <Code>{`{
  "productId": "<uuid>", "name": "3–40 chars", "ticker": "2–10 A–Z0–9", "supply": "1000000000",
  "project": { "pair": "evyn" | "sol", "fee": 0, "slug": "a-z0-9-", "description": "10–4000", "theme": "", "color": "#rrggbb",
               "template": "basic" | "glow" | "brutal",   // the landing page's look
               "website": "", "x": "", "telegram": "", "github": "", "utilityUrl": "" },
  "stack": ["antisnipe", "buyback", "burn"],     // mechanic ids, in run order, ≤ 80% of a round in total
  "devBuy": "0.05",                                // SOL, 0–50
  "gateBalance": "10000", "gateUnlocks": "what opens",
  "issuedAt": <ms>, "signature": "<base64 ed25519 over the 'launch token' action message>"
}
→ 200 { "id", "slug" } · 400 a step's rule · 401 bad confirmation · 403 blocked · 409 permalink taken`}</Code>
        <p>The signed lines are listed on <Link href="/docs/launchpad/launching#signature">Launching a token</Link>.</p>
      </Route>
      <Route method="GET" path="/api/launches/:id/chat?after=" auth="public">
        <p>The coin&apos;s community room, oldest first: the latest 80 messages, or only those newer than <code>after</code> (a message id). <code>→ 200 {`{ "messages": [ { id, wallet, role: "dev" | "holder", held, body, created_at } ] }`}</code> — <code>held</code> is the coin in base units at the moment of writing.</p>
      </Route>
      <Route method="POST" path="/api/launches/:id/chat" auth="session · holds the coin, or launched it">
        <Code>{`{ "body": "1–500 chars", "replyTo": "<message id in this room>" (optional) }
→ 200 { "message" } · 401 sign in · 403 holds none of the coin · 409 not on the curve yet · 429 more than 20 per 10 minutes`}</Code>
      </Route>
      <Route method="GET" path="/api/launches/:id/rounds" auth="public · CORS *">
        <p>Every fee round the vault ran for the coin, oldest first, as CSV (<code>text/csv</code>): time, quote, swept, EVYN burned, launcher, buyback, the coin burned, to holders, lottery, revshare, held — in whole SOL or EVYN.</p>
      </Route>
      <Route method="GET" path="/api/launchpad/devbuy?pair=&sol=" auth="public">
        <p>What a dev buy of <code>sol</code> gets on a fresh curve of that pair, priced with the Pump SDK. <code>→ 200 {`{ "pair", "sol", "quoteIn", "tokens", "pct" }`}</code> · 400 out of range · 502 the RPC did not answer.</p>
      </Route>
      <Route method="GET" path="/api/launches/slug?slug=" auth="public">
        <p>Is a permalink free? <code>→ 200 {`{ "slug", "taken": boolean }`}</code> · 400 not a valid slug. The launch flow asks as you type; the freeze checks again.</p>
      </Route>
      <Route method="GET" path="/api/launches" auth="session">
        <p>The caller&apos;s own launches. <code>→ 200 {`{ "launches": [ { id, slug, name, ticker, status, mint, pair, … } ] }`}</code></p>
      </Route>
      <Route method="POST" path="/api/launches/:id/launch" auth="owner">
        <Code>{`{ "signature": "<base58 of the create transaction>", "mint": "<base58>" }
→ 200 { "ok": true, "mint", "status": "launched" }
→ 400 junk · 402 not on chain yet / not paid by you / creator is not the vault / wrong supply or quote · 404 not yours · 409 not frozen`}</Code>
        <p>Reads the curve from the chain and marks the launch <code>launched</code>. Safe to retry while the transaction confirms.</p>
      </Route>
      <Route method="GET" path="/api/launches/:id/metadata" auth="public">
        <p>The coin&apos;s metadata JSON (name, symbol, description, image) that the mint&apos;s URI points at.</p>
      </Route>
      <Route method="GET" path="/api/launches/:id/logo" auth="public">
        <p>The coin&apos;s image, always PNG 512×512 (pump.fun shows no SVG): the launcher&apos;s upload or Prism&apos;s drawing, else the utility&apos;s cover, else the initial on the project colour.</p>
      </Route>
      <Route method="PUT" path="/api/launches/:id/logo" auth="owner">
        <p>Multipart <code>file</code> (PNG, JPEG, WebP or GIF, under 2 MB), cropped to 512×512. <code>→ 200 {`{ "ok": true, "source": "upload" }`}</code> · 413 · 415. Set it before the create: pump.fun keeps the first image it sees.</p>
      </Route>
      <Route method="POST" path="/api/launches/:id/identity" auth="owner">
        <Code>{`→ 200 { "logo": boolean, "banner": boolean }   // what Prism drew this time
→ 401 · 404 not yours · 409 SOL pair · 429 · 503 the desk is not switched on`}</Code>
        <p>Prism draws the logo (skipped when you uploaded one) and the 3:1 banner as SVG, rendered to PNG. Allowed before launch; about a minute.</p>
      </Route>
      <Route method="GET" path="/api/launches/:id/banner" auth="public">
        <p>The banner PNG 1500×500, or 404 until Prism has drawn one.</p>
      </Route>
      <Route method="GET" path="/api/launches/:id/gate?wallet=" auth="public · CORS *">
        <Code>{`→ 200 { "mint", "wallet", "balance": "<base units>", "needed": "<base units>", "unlocked": boolean, "unlocks": "…" }
→ 400 wallet is required · 404 · 409 not launched yet`}</Code>
        <p>The holder gate, answered from the chain. Prove the wallet first, as with the <Link href="/docs/ownership-check">ownership check</Link>.</p>
      </Route>
      <Route method="POST" path="/api/launches/:id/desk" auth="owner">
        <Code>{`→ 200 { "deliverables": [ { "kind": "identity" | "narrative" | "site", "agent", "model", "output", "created_at" } ] }
→ 401 · 404 not yours · 409 SOL pair, or not launched yet · 429 · 503 the desk is not switched on`}</Code>
        <p>Puts the desk to work on an EVYN-paired, launched coin; about a minute. Running again overwrites.</p>
      </Route>

      <H2 id="studio">Studio</H2>
      <Route method="POST" path="/api/agents/sessions" auth="session + EVYN gate">
        <Code>{`{ "agent": "creative" | "copywriter" | "narrator" | "social" | "analyst", "message": "1–4000 chars",
  "image": "data:image/png;base64,…" }   // optional: PNG, JPEG, WebP or GIF under 4 MB, shown to the agent for this turn only
→ 200 { "session": { "id", "agent", "turns", "messages": [ { "role", "content" } ], "created_at" }, "redirect": "<agent id>" | null }
→ 401 sign in · 402 { error, held, needed } below the gate · 400 unknown agent / bad message
→ 429 three sessions already open in the last 24 hours, or the hourly brake · 503 not switched on`}</Code>
        <p><code>redirect</code> is set when the agent declined because the question belongs to another agent; the reply names it.</p>
      </Route>
      <Route method="POST" path="/api/agents/sessions/:id" auth="session + EVYN gate, own session">
        <Code>{`{ "message": "1–4000 chars", "image": "data:image/…;base64,…" (optional) }
→ 200 same shape · 404 no such session · 409 the session's 12 turns are used`}</Code>
      </Route>

      <H2 id="cron">Fee rounds</H2>
      <Route method="GET" path="/api/cron/fees" auth="CRON_SECRET">
        <Code>{`Authorization: Bearer <CRON_SECRET>      (or ?key=<CRON_SECRET>)
→ 200 { "ok": true, "rounds": [ { launch, ticker, mint, pair, quote, swept, burnedQuote, launcher, buyback, burned, holders, revshare, lottery, held, txs, graduated, note? } ] }
→ 401 · 503 VAULT_SECRET is not set`}</Code>
        <p>Runs one <Link href="/docs/launchpad/fee-rounds">fee round</Link> over every launched coin. Vercel&apos;s cron calls it daily; the repository&apos;s <code>fee rounds</code> workflow every 15 minutes.</p>
      </Route>

      <H2 id="moderation">Moderation</H2>
      <Route method="POST" path="/api/reports" auth="session">
        <p><code>{`{ "productId", "reason" }`}</code> (5–1000 chars). One per wallet per product. <code>→ 200 {`{ ok }`}</code></p>
      </Route>
      <Route method="POST" path="/api/admin/unblock" auth="admin">
        <p><code>{`{ "wallet" }`}</code> <code>→ 200 {`{ ok }`}</code>. Admins are the wallets listed in <code>ADMIN_WALLETS</code>.</p>
      </Route>

      <H2 id="limits">Limits at a glance</H2>
      <Code>{`price        0.02 – 1,000,000 SOL         fee   5%, floor(lamports × 500 / 10000)
file         ≤ 200 MB                      secret ≤ 64 KB          cover ≤ 1 MB
login        signature valid 5 min         session 7 days
blocked ext  exe msi bat cmd com scr pif vbs vbe ps1 dll dmg pkg app apk deb rpm jar lnk`}</Code>
    </>
  );
}

export function SelfHosting() {
  return (
    <>
      <H2 id="local">Run locally</H2>
      <Code lang="sh">{`git clone <repo> everynth && cd everynth
copy .env.example .env.local        # fill in the values below
npm install
npm run dev                          # http://localhost:3000`}</Code>
      <p>
        Without <code>DATABASE_URL</code> the app uses an embedded Postgres (PGlite) in <code>./data/pg</code>. Same
        SQL as production; nothing else changes.
      </p>

      <H2 id="env">Environment variables</H2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Purpose</th>
          </tr>
        </thead>
        <tbody>
          <tr><td><code>SESSION_SECRET</code></td><td>32+ random chars. Signs session cookies.</td></tr>
          <tr><td><code>MASTER_KEY</code></td><td>32 random bytes, base64url. Wraps every content key. <strong>Back it up; losing it loses every product.</strong></td></tr>
          <tr><td><code>TREASURY_WALLET</code></td><td>Receives the 5% fee.</td></tr>
          <tr><td><code>ADMIN_WALLETS</code></td><td>Comma-separated wallets allowed on <code>/admin</code>.</td></tr>
          <tr><td><code>NEXT_PUBLIC_RPC_URL</code></td><td>RPC used by browsers. Defaults to devnet.</td></tr>
          <tr><td><code>RPC_URL</code></td><td>Optional private RPC for server-side verification (e.g. Helius).</td></tr>
          <tr><td><code>DATABASE_URL</code></td><td>Neon Postgres. Blank = local PGlite.</td></tr>
          <tr><td><code>BLOB_READ_WRITE_TOKEN</code></td><td>Vercel Blob store for file ciphertext.</td></tr>
          <tr><td><code>GITHUB_API</code></td><td>Optional override of <code>https://api.github.com</code> (used by tests).</td></tr>
          <tr><td colSpan={2}><strong>Launchpad</strong></td></tr>
          <tr><td><code>VAULT_WALLET</code></td><td>The vault: creator of every coin, signer of every fee round. Falls back to <code>TREASURY_WALLET</code>.</td></tr>
          <tr><td><code>VAULT_SECRET</code></td><td>The vault&apos;s secret key (base58 or a JSON byte array). Must match <code>VAULT_WALLET</code>. <strong>Back it up; keep SOL on it for gas.</strong></td></tr>
          <tr><td><code>CRON_SECRET</code></td><td>Bearer token for <code>/api/cron/fees</code>. Vercel sends it on its cron; the GitHub workflow needs it as a repository secret.</td></tr>
          <tr><td><code>NEXT_PUBLIC_PAIR_MINT</code></td><td>EVYN&apos;s mint. Unset = SOL pairs only, no desk, studio locked.</td></tr>
          <tr><td><code>FEE_ROUND_MIN_LAMPORTS</code></td><td>Below this a launch&apos;s pot carries over. Default 5,000,000 (0.005 SOL).</td></tr>
          <tr><td colSpan={2}><strong>Studio</strong></td></tr>
          <tr><td><code>ANTHROPIC_API_KEY</code></td><td>Claude API key for the five agents and the desk. Unset = both answer 503.</td></tr>
          <tr><td><code>NEXT_PUBLIC_AGENT_MIN_EVYN</code></td><td>Whole EVYN a wallet must hold. Default 0.5% of supply (5,000,000).</td></tr>
        </tbody>
      </table>
      <Code lang="sh">{`node -e "const {Keypair}=require('@solana/web3.js');const bs58=require('bs58');const k=Keypair.generate();console.log(k.publicKey.toBase58(), bs58.encode(k.secretKey))"   # VAULT_WALLET VAULT_SECRET`}</Code>
      <p>
        Fee rounds every 15 minutes: add <code>FEES_URL</code> (<code>https://&lt;your host&gt;/api/cron/fees</code>) and <code>CRON_SECRET</code> as repository secrets; <code>.github/workflows/fees.yml</code> does the rest. Vercel&apos;s Hobby plan only allows a daily cron, which <code>vercel.json</code> keeps as a backstop.
      </p>
      <Code lang="sh">{`node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"   # SESSION_SECRET / MASTER_KEY`}</Code>
      <Note kind="warn">
        <p>
          On Windows, do not pipe values into <code>vercel env add</code> from PowerShell: it prepends a byte-order
          mark and the value silently breaks. Set them from Node or in the Vercel dashboard.
        </p>
      </Note>

      <H2 id="tests">Tests</H2>
      <Code lang="sh">{`npm test                                   # unit: auth, money, key wrap, encryption, payment verification

# full flow over HTTP with a stub RPC and a stub GitHub (nothing touches mainnet)
$env:RPC_URL="http://127.0.0.1:3199"; $env:GITHUB_API="http://127.0.0.1:3198"
$env:PGLITE_DIR="$env:TEMP\\everynth-e2e"; $env:DATABASE_URL=" "
$env:ADMIN_WALLETS=(node scripts/e2e.mjs --admin-wallet)
npm run build; npx next start -p 3100     # terminal 1
node --env-file=.env.local scripts/e2e.mjs   # terminal 2 — every check, launchpad and studio included`}</Code>
      <p>
        The studio and the desk need <code>ANTHROPIC_API_KEY</code> to answer; the end-to-end suite only checks their gates, so it never spends tokens. The launchpad&apos;s chain path was run against devnet and then mainnet by hand; the scripts are in the repository&apos;s history.
      </p>

      <H2 id="deploy">Deploy to Vercel</H2>
      <ol>
        <li><code>npx vercel link</code>, then add the Neon and Blob integrations from the Vercel Marketplace (they set <code>DATABASE_URL</code> and <code>BLOB_READ_WRITE_TOKEN</code>).</li>
        <li>Set the remaining variables for Production. Generate a fresh <code>MASTER_KEY</code> for production and store a copy somewhere safe.</li>
        <li><code>npx vercel deploy --prod</code>.</li>
        <li>Point <code>NEXT_PUBLIC_RPC_URL</code> at mainnet, and ideally <code>RPC_URL</code> at a private provider; public RPCs rate-limit.</li>
      </ol>
      <p>
        The Hobby plan forbids commercial use; a marketplace taking a fee belongs on Pro.
      </p>
    </>
  );
}
