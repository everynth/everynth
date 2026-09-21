// End-to-end over real HTTP against `next start`. The Solana RPC is a stub served from this script,
// so we control exactly what "the chain" says. Everything else (auth, DB, crypto, routes) is real.
//
// Run (PowerShell), against a fresh throwaway database:
//   npm run build
//   $env:RPC_URL="http://127.0.0.1:3199"; $env:PGLITE_DIR="$env:TEMP\everynth-e2e"; npx next start -p 3100
//   node scripts/e2e.mjs        (in a second terminal)
import assert from "node:assert/strict";
import { generateKeyPairSync, randomBytes, sign } from "node:crypto";
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
async function makeUser() {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
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

rpc.close();
console.log("\nALL E2E CHECKS PASSED");
