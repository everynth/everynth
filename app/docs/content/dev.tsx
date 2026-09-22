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
      <Code>{`GET https://everynth.vercel.app/api/verify?product=<productId>&wallet=<address>

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

const res = await fetch(\`https://everynth.vercel.app/api/verify?product=\${PRODUCT}&wallet=\${wallet}\`);
const { owned } = await res.json();
if (!owned) location.href = \`https://everynth.vercel.app/p/\${PRODUCT}\`;`}</Code>
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
        Base URL <code>https://everynth.vercel.app</code>. Requests and responses are JSON unless noted. Routes marked{" "}
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

kind=file    key (base64, 32 bytes)  fileName  fileType  payloadUrl (our blob host only)
kind=secret  key (base64, 32 bytes)  payload   (Blob: iv‖ciphertext, ≤ 64 KB + 28)
kind=github  repo ("owner/name")     token     (checked live: must have admin on the repo)

→ 200 { "id": "<uuid>" } · 400 validation · 403 wallet blocked · 413 too large`}</Code>
      </Route>
      <Route method="PATCH" path="/api/products/:id" auth="creator">
        <p>Edit listing details: <code>title description category price cover</code> (same rules). Content is immutable. <code>→ 200 {`{ ok }`}</code> · 404 not yours.</p>
      </Route>
      <Route method="POST" path="/api/products/:id/remove" auth="creator or admin">
        <p>Unlist. Body optional: <code>{`{ "block": true }`}</code> (admins) also blocks the creator and unlists all their products. <code>→ 200 {`{ ok }`}</code></p>
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
          <tr><td><code>NEXT_PUBLIC_PRIVY_APP_ID</code></td><td>Privy app id for login and embedded Solana wallets. Add your domains under Allowed origins in the Privy dashboard.</td></tr>
        </tbody>
      </table>
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
node --env-file=.env.local scripts/e2e.mjs   # terminal 2 — 21 checks`}</Code>

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
