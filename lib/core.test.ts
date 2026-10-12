import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { test } from "node:test";
import { Keypair } from "@solana/web3.js";
import { decryptContent, encryptContent } from "./content-crypto.ts";
import { unwrapKey, wrapKey } from "./keywrap.ts";
import { formatSol, parseSol, splitPrice } from "./money.ts";
import { buildPaymentInstructions, verifyPayment, type Order, type PaidTx } from "./payment.ts";

const addr = () => Keypair.generate().publicKey.toBase58();
const SOL = 1_000_000_000;

test("parseSol accepts plain decimals inside the allowed range", () => {
  assert.equal(parseSol("1.25"), 1.25 * SOL);
  assert.equal(parseSol("0.02"), 0.02 * SOL);
  assert.equal(parseSol(" 3 "), 3 * SOL);
  for (const bad of ["0", "0.01", "-1", "1e3", "1.0000000001", "abc", "", "1,5", "99999999"]) {
    assert.equal(parseSol(bad), null, bad);
  }
  assert.equal(formatSol(1.25 * SOL), "1.25");
});

test("splitPrice never loses or invents a lamport", () => {
  for (const price of [1, 19, 20, 999_999, 12_500_000, 1_000_000_000_000]) {
    const { fee, creatorAmount } = splitPrice(price);
    assert.equal(fee + creatorAmount, price);
    assert.ok(fee >= 0 && fee <= price * 0.05);
  }
  assert.deepEqual(splitPrice(1 * SOL), { fee: 0.05 * SOL, creatorAmount: 0.95 * SOL });
});

test("key wrap round-trips and rejects tampering / wrong master", () => {
  const master = randomBytes(32);
  const key = randomBytes(32);
  const wrapped = wrapKey(key, master);
  assert.deepEqual(unwrapKey(wrapped, master), key);
  assert.throws(() => unwrapKey(wrapped, randomBytes(32)));
  const raw = Buffer.from(wrapped, "base64");
  raw[raw.length - 1] ^= 1;
  assert.throws(() => unwrapKey(raw.toString("base64"), master));
});

test("content encryption round-trips and fails with the wrong key", async () => {
  const plain = new TextEncoder().encode("sk-live-secret-api-key");
  const { key, payload } = await encryptContent(plain);
  assert.deepEqual(await decryptContent(key, payload), plain);
  assert.ok(!Buffer.from(payload).includes(Buffer.from(plain)));
  await assert.rejects(decryptContent(new Uint8Array(32), payload));
});

function makeOrder(): Order {
  return { reference: addr(), creator: addr(), creatorAmount: 0.95 * SOL, treasury: addr(), fee: 0.05 * SOL };
}

// Fake a parsed tx: buyer first, then reference (or `keys`), then each recipient with its lamport gain.
function makeTx(order: Order, received: Record<string, number>, opts: { err?: unknown; keys?: string[] } = {}): PaidTx {
  const buyer = addr();
  const paid = Object.values(received).reduce((a, b) => a + b, 0);
  const keys = [buyer, ...(opts.keys ?? [order.reference]), ...Object.keys(received)];
  const pre = keys.map(() => 10 * SOL);
  const post = [10 * SOL - paid - 5000, ...(opts.keys ?? [order.reference]).map(() => 10 * SOL), ...Object.values(received).map((v) => 10 * SOL + v)];
  return {
    meta: { err: opts.err ?? null, preBalances: pre, postBalances: post },
    transaction: { message: { accountKeys: keys.map((k) => ({ pubkey: { toBase58: () => k } })) } },
  };
}

test("verifyPayment accepts an exact payment", () => {
  const o = makeOrder();
  assert.equal(verifyPayment(makeTx(o, { [o.creator]: o.creatorAmount, [o.treasury]: o.fee }), o), null);
});

test("verifyPayment rejects every way of cheating", () => {
  const o = makeOrder();
  const full = { [o.creator]: o.creatorAmount, [o.treasury]: o.fee };
  assert.match(verifyPayment(null, o)!, /not found/);
  assert.match(verifyPayment(makeTx(o, full, { err: { InstructionError: [] } }), o)!, /failed/);
  assert.match(verifyPayment(makeTx(o, full, { keys: [addr()] }), o)!, /reference/); // someone else's tx
  assert.match(verifyPayment(makeTx(o, { ...full, [o.creator]: o.creatorAmount - 1 }), o)!, /underpaid/);
  assert.match(verifyPayment(makeTx(o, { [o.creator]: o.creatorAmount + o.fee }), o)!, /underpaid/); // fee skipped
  assert.match(verifyPayment(makeTx(o, {}), o)!, /underpaid/); // reference present, nobody paid
});

test("creator === treasury needs the full price in one wallet", () => {
  const o = makeOrder();
  o.treasury = o.creator;
  assert.equal(verifyPayment(makeTx(o, { [o.creator]: o.creatorAmount + o.fee }), o), null);
  assert.match(verifyPayment(makeTx(o, { [o.creator]: o.creatorAmount }), o)!, /underpaid/);
});

test("payment instructions: two transfers, reference attached", () => {
  const o = makeOrder();
  const ix = buildPaymentInstructions(Keypair.generate().publicKey, o);
  assert.equal(ix.length, 2);
  assert.ok(ix[0].keys.some((k) => k.pubkey.toBase58() === o.reference && !k.isSigner && !k.isWritable));
  o.treasury = o.creator;
  assert.equal(buildPaymentInstructions(Keypair.generate().publicKey, o).length, 1);
});
