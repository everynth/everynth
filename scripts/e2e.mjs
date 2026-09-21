// End-to-end over real HTTP against `next start`. The Solana RPC is a stub served from this script,
// so we control exactly what "the chain" says. Everything else (auth, DB, crypto, routes) is real.
//
// Run (PowerShell), against a fresh throwaway database:
//   npm run build
//   $env:RPC_URL="http://127.0.0.1:3199"; $env:PGLITE_DIR="$env:TEMP\everynth-e2e"
//   $env:ADMIN_WALLETS=(node scripts/e2e.mjs --admin-wallet); npx next start -p 3100
//   node scripts/e2e.mjs        (in a second terminal)
import assert from "node:assert/strict";
import { createHash, createPrivateKey, createPublicKey, generateKeyPairSync, randomBytes, sign } from "node:crypto";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const project = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(project);
const { PublicKey, Keypair } = require("@solana/web3.js");
const bs58 = require("bs58").default ?? require("bs58");
const { loginMessage } = await import(pathToFileURL(project + "lib/login-message.ts").href);
const { encryptContent, decryptContent } = await import(pathToFileURL(project + "lib/content-crypto.ts").href);

const BASE = "http://localhost:3100";
const SOL = 1_000_000_000;

// ---- stub RPC ----
const chain = { byAddress: new Map(), bySignature: new Map() };
// A tx where `received[owner]` lamports arrived at each owner: keys = [payer, reference, ...owners].
function putTx(signature, reference, received, { err = null } = {}) {
  const owners = Object.keys(received);
  const paid = Object.values(received).reduce((a, b) => a + b, 0);
  const keys = [Keypair.generate().publicKey.toBase58(), reference, ...owners];
  const tx = {
    slot: 1, blockTime: 1, version: "legacy",
    transaction: {
      signatures: [signature],
      message: {
        accountKeys: keys.map((pubkey, i) => ({ pubkey, signer: i === 0, writable: i !== 1, source: "transaction" })),
        instructions: [], recentBlockhash: Keypair.generate().publicKey.toBase58(),
      },
    },
    meta: {
      err, fee: 5000, innerInstructions: [], logMessages: [], preTokenBalances: [], postTokenBalances: [],
      preBalances: keys.map(() => 10 * SOL),
      postBalances: [10 * SOL - paid - 5000, 10 * SOL, ...owners.map((o) => 10 * SOL + received[o])],
    },
  };
  chain.bySignature.set(signature, tx);
  chain.byAddress.set(reference, signature);
}
const rpc = createServer(async (req, res) => {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  const { id, method, params } = JSON.parse(raw);
  let result = null;
  if (method === "getSignaturesForAddress") {
    const s = chain.byAddress.get(params[0]);
    result = s ? [{ signature: s, slot: 1, err: null, memo: null, blockTime: 1, confirmationStatus: "confirmed" }] : [];
  } else if (method === "getTransaction") {
    result = chain.bySignature.get(params[0]) ?? null;
  }
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify({ jsonrpc: "2.0", id, result }));
}).listen(3199);
const newSig = () => bs58.encode(randomBytes(64));

// ---- helpers ----
// Fixed-seed admin so the server can be started with ADMIN_WALLETS=<its address> (printed below).
const ADMIN_SEED = createHash("sha256").update("everynth-e2e-admin").digest();
const adminKeys = () => {
  const privateKey = createPrivateKey({ key: Buffer.concat([Buffer.from("302e020100300506032b657004220420", "hex"), ADMIN_SEED]), format: "der", type: "pkcs8" });
  return { privateKey, publicKey: createPublicKey(privateKey) };
};
export const ADMIN_WALLET = new PublicKey(Buffer.from(adminKeys().publicKey.export({ format: "jwk" }).x, "base64url")).toBase58();
if (process.argv.includes("--admin-wallet")) { console.log(ADMIN_WALLET); process.exit(0); }

async function makeUser(admin = false) {
  const { publicKey, privateKey } = admin ? adminKeys() : generateKeyPairSync("ed25519");
  const wallet = new PublicKey(Buffer.from(publicKey.export({ format: "jwk" }).x, "base64url")).toBase58();
  const issuedAt = Date.now();
  const signature = sign(null, Buffer.from(loginMessage("localhost:3100", wallet, issuedAt)), privateKey).toString("base64");
  const res = await fetch(BASE + "/api/session", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ wallet, issuedAt, signature }) });
  assert.equal(res.status, 200);
  const cookie = res.headers.get("set-cookie").split(";")[0];
  const json = (path, body) => fetch(BASE + path, { method: "POST", headers: { cookie, "content-type": "application/json" }, body: JSON.stringify(body ?? {}) });
  const get = (path) => fetch(BASE + path, { headers: { cookie } });
  return { wallet, cookie, json, get };
}
const step = (name) => console.log("ok  ", name);

// ---- flow ----
const creator = await makeUser();
const buyer = await makeUser();
const stranger = await makeUser();

// launch (encrypt client-side like the browser does)
const SECRET = "sk-live-" + randomBytes(8).toString("hex");
const { key, payload } = await encryptContent(new TextEncoder().encode(SECRET));
const form = new FormData();
for (const [k, v] of Object.entries({ title: "Alpha Signals API", description: "Private trading signals API key, 30 days.", category: "API", price: "1", kind: "secret", key: Buffer.from(key).toString("base64") })) form.set(k, v);
form.set("payload", new Blob([payload]));
let res = await fetch(BASE + "/api/products", { method: "POST", headers: { cookie: creator.cookie }, body: form });
assert.equal(res.status, 200, await res.clone().text());
const { id: productId } = await res.json();
step("creator launches an encrypted product");

const anonForm = new FormData(); anonForm.set("title", "x");
assert.equal((await fetch(BASE + "/api/products", { method: "POST", body: anonForm })).status, 401);
form.set("price", "-5");
assert.equal((await fetch(BASE + "/api/products", { method: "POST", headers: { cookie: creator.cookie }, body: form })).status, 400);
step("launch rejects anonymous users and bad prices");

const market = await (await fetch(BASE + "/?q=signals")).text();
assert.ok(market.includes("Alpha Signals API") && !market.includes(SECRET));
assert.ok(!(await (await fetch(BASE + "/?q=zzzznothing")).text()).includes("Alpha Signals API"));
step("market lists and searches it, secret not leaked");

assert.equal((await creator.json("/api/orders", { productId })).status, 400);
step("creator cannot buy own product");

res = await buyer.json("/api/orders", { productId });
assert.equal(res.status, 200, await res.clone().text());
const order = await res.json();
assert.equal(order.creatorAmount + order.fee, 1 * SOL);
assert.equal(order.fee, 0.05 * SOL);
assert.equal(order.creator, creator.wallet);
step("order: 0.95 SOL to creator + 0.05 fee");

assert.equal((await buyer.json(`/api/orders/${order.purchaseId}/confirm`)).status, 402);
assert.equal((await buyer.get(`/api/purchases/${order.purchaseId}/content`)).status, 404);
step("unpaid order: confirm refused, content locked");

const again = await (await buyer.json("/api/orders", { productId })).json();
assert.equal(again.reference, order.reference);
step("pressing Buy again reuses the same order");

// underpaid tx (fee skipped)
let sig = newSig();
putTx(sig, order.reference, { [order.creator]: 1 * SOL });
assert.equal((await buyer.json(`/api/orders/${order.purchaseId}/confirm`, { signature: sig })).status, 402);
// failed tx
sig = newSig();
putTx(sig, order.reference, { [order.creator]: order.creatorAmount, [order.treasury]: order.fee }, { err: { InstructionError: [0, "Custom"] } });
assert.equal((await buyer.json(`/api/orders/${order.purchaseId}/confirm`, { signature: sig })).status, 402);
// someone else's tx (different reference)
sig = newSig();
putTx(sig, Keypair.generate().publicKey.toBase58(), { [order.creator]: order.creatorAmount, [order.treasury]: order.fee });
assert.equal((await buyer.json(`/api/orders/${order.purchaseId}/confirm`, { signature: sig })).status, 402);
assert.equal((await buyer.json(`/api/orders/${order.purchaseId}/confirm`, { signature: "garbage" })).status, 402);
assert.equal((await buyer.get(`/api/purchases/${order.purchaseId}/content`)).status, 404);
step("underpaid / failed / foreign / garbage transactions all refused");

// stranger tries to confirm the buyer's order
assert.equal((await stranger.json(`/api/orders/${order.purchaseId}/confirm`)).status, 404);

// real payment, browser "dies" before confirm -> recovered via reference on next Buy click
const goodSig = newSig();
putTx(goodSig, order.reference, { [order.creator]: order.creatorAmount, [order.treasury]: order.fee });
assert.equal((await buyer.json("/api/orders", { productId })).status, 409);
step("paid-but-unconfirmed order is recovered from the chain (no double charge)");

res = await buyer.get(`/api/purchases/${order.purchaseId}/content`);
assert.equal(res.status, 200);
const content = await res.json();
const plain = await decryptContent(Buffer.from(content.key, "base64"), Buffer.from(content.payload, "base64"));
assert.equal(new TextDecoder().decode(plain), SECRET);
step("buyer unlocks and decrypts the exact secret");

assert.equal((await stranger.get(`/api/purchases/${order.purchaseId}/content`)).status, 404);
assert.equal((await fetch(BASE + `/api/purchases/${order.purchaseId}/content`)).status, 401);
step("nobody else can fetch the content");

// one tx cannot settle two purchases: stranger crafts a tx carrying their reference but reuses goodSig
const o2 = await (await stranger.json("/api/orders", { productId })).json();
const forged = chain.bySignature.get(goodSig);
forged.transaction.message.accountKeys.push({ pubkey: o2.reference, signer: false, writable: false, source: "transaction" });
forged.meta.preBalances.push(0);
forged.meta.postBalances.push(0);
assert.equal((await stranger.json(`/api/orders/${o2.purchaseId}/confirm`, { signature: goodSig })).status, 402);
assert.equal((await stranger.get(`/api/purchases/${o2.purchaseId}/content`)).status, 404);
step("one transaction cannot pay for two purchases");

assert.ok((await (await buyer.get("/purchases")).text()).includes("Alpha Signals API"));
const dash = await (await creator.get("/dashboard")).text();
assert.ok(dash.includes("Alpha Signals API") && dash.includes("0.95"));
step("purchases page and creator dashboard (1 sold, 0.95 SOL)");

// cover image + edit listing + creator page
const png = Buffer.from("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c6360000002000154a24f7d0000000049454e44ae426082", "hex");
const edit = new FormData();
for (const [k, v] of Object.entries({ title: "Alpha Signals API v2", description: "Private trading signals API key, 60 days.", category: "API", price: "2" })) edit.set(k, v);
edit.set("cover", new Blob([png], { type: "image/png" }), "c.png");
assert.equal((await fetch(BASE + `/api/products/${productId}`, { method: "PATCH", headers: { cookie: stranger.cookie }, body: edit })).status, 404);
assert.equal((await fetch(BASE + `/api/products/${productId}`, { method: "PATCH", headers: { cookie: creator.cookie }, body: edit })).status, 200);
const coverRes = await fetch(BASE + `/api/products/${productId}/cover`);
assert.equal(coverRes.status, 200);
assert.equal(coverRes.headers.get("content-type"), "image/png");
assert.deepEqual(Buffer.from(await coverRes.arrayBuffer()), png);
const page = await (await fetch(BASE + `/p/${productId}`)).text();
assert.ok(page.includes("Alpha Signals API v2") && page.includes(`/api/products/${productId}/cover`) && /2(<!-- -->)? SOL/.test(page)); // React puts a text marker between {price} and " SOL"
assert.ok((await (await fetch(BASE + `/u/${creator.wallet}`)).text()).includes("Alpha Signals API v2"));
assert.equal((await fetch(BASE + "/u/not-a-wallet")).status, 404);
edit.set("cover", new Blob([png], { type: "text/html" }), "x.html");
assert.equal((await fetch(BASE + `/api/products/${productId}`, { method: "PATCH", headers: { cookie: creator.cookie }, body: edit })).status, 400);
step("edit listing + cover image + creator page; strangers and non-images refused");

assert.equal((await buyer.json("/api/reports", { productId, reason: "looks like a scam" })).status, 200);
assert.equal((await buyer.json("/api/reports", { productId, reason: "x" })).status, 400);
assert.equal((await creator.get("/admin")).status, 404);
assert.equal((await stranger.json(`/api/products/${productId}/remove`)).status, 404);
assert.equal((await creator.json(`/api/products/${productId}/remove`)).status, 200);
assert.ok(!(await (await fetch(BASE + "/")).text()).includes("Alpha Signals API"));
assert.equal((await fetch(BASE + `/p/${productId}`)).status, 404);
assert.equal((await buyer.get(`/p/${productId}`)).status, 200);
assert.equal((await buyer.get(`/api/purchases/${order.purchaseId}/content`)).status, 200);
step("report + takedown: gone from market, buyer keeps access, strangers cannot remove");

// ownership check for creator-hosted apps
const verify = async (w) => fetch(BASE + `/api/verify?product=${productId}&wallet=${w}`);
let v = await verify(buyer.wallet);
assert.equal(v.headers.get("access-control-allow-origin"), "*");
assert.deepEqual((await v.json()).owned, true);
assert.equal((await (await verify(stranger.wallet)).json()).owned, false);
assert.equal((await fetch(BASE + "/api/verify")).status, 400);
step("ownership check: owned only by the buyer, CORS open");

// executables refused by name
const exeForm = new FormData();
for (const [k, val] of Object.entries({ title: "Bad tool", description: "Definitely not malware, trust me.", category: "Tool", price: "1", kind: "file", fileName: "setup.exe", key: Buffer.from(key).toString("base64") })) exeForm.set(k, val);
exeForm.set("payload", new Blob([payload]));
res = await fetch(BASE + "/api/products", { method: "POST", headers: { cookie: creator.cookie }, body: exeForm });
assert.equal(res.status, 400);
assert.match((await res.json()).error, /executables/i);
step("executables and installers refused");

// admin: block a creator, everything they sell disappears, they cannot launch again, unblock restores launching
if (process.env.SKIP_ADMIN !== "1") {
  const admin = await makeUser(true);
  const adminPage = await admin.get("/admin");
  assert.equal(adminPage.status, 200, "start the server with ADMIN_WALLETS=" + ADMIN_WALLET);
  form.set("price", "1");
  res = await fetch(BASE + "/api/products", { method: "POST", headers: { cookie: creator.cookie }, body: form });
  const { id: p2 } = await res.json();
  assert.equal((await stranger.json(`/api/products/${p2}/remove`, { block: true })).status, 404);
  assert.equal((await admin.json(`/api/products/${p2}/remove`, { block: true })).status, 200);
  assert.equal((await fetch(BASE + `/p/${p2}`)).status, 404);
  res = await fetch(BASE + "/api/products", { method: "POST", headers: { cookie: creator.cookie }, body: form });
  assert.equal(res.status, 403);
  assert.ok((await (await admin.get("/admin")).text()).includes(creator.wallet));
  assert.equal((await stranger.json("/api/admin/unblock", { wallet: creator.wallet })).status, 404);
  assert.equal((await admin.json("/api/admin/unblock", { wallet: creator.wallet })).status, 200);
  res = await fetch(BASE + "/api/products", { method: "POST", headers: { cookie: creator.cookie }, body: form });
  assert.equal(res.status, 200);
  step("admin block: creator unlisted + cannot launch; unblock restores");
}

rpc.close();
console.log("\nALL E2E CHECKS PASSED");
