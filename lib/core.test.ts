import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { test } from "node:test";
import { Keypair } from "@solana/web3.js";
import { decryptContent, encryptContent } from "./content-crypto.ts";
import { unwrapKey, wrapKey } from "./keywrap.ts";
import { formatUsdc, parseUsdc, splitPrice } from "./money.ts";
import { buildPaymentInstructions, verifyPayment, type Order, type PaidTx } from "./payment.ts";

const addr = () => Keypair.generate().publicKey.toBase58();

test("parseUsdc accepts plain decimals only", () => {
  assert.equal(parseUsdc("12.5"), 12_500_000);
  assert.equal(parseUsdc("0.000001"), 1);
  assert.equal(parseUsdc(" 3 "), 3_000_000);
  for (const bad of ["0", "-1", "1e3", "1.0000001", "abc", "", "1,5", "99999999"]) {
    assert.equal(parseUsdc(bad), null, bad);
  }
  assert.equal(formatUsdc(12_500_000), "12.5");
});

test("splitPrice never loses or invents a micro-unit", () => {
  for (const price of [1, 19, 20, 999_999, 12_500_000, 1_000_000_000_000]) {
    const { fee, creatorAmount } = splitPrice(price);
    assert.equal(fee + creatorAmount, price);
    assert.ok(fee >= 0 && fee <= price * 0.05);
  }
  assert.deepEqual(splitPrice(10_000_000), { fee: 500_000, creatorAmount: 9_500_000 });
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
  return { mint: addr(), reference: addr(), creator: addr(), creatorAmount: 9_500_000, treasury: addr(), fee: 500_000 };
}

// Fake a parsed tx where `received[owner]` micro-units of `mint` arrived.
function makeTx(order: Order, received: Record<string, number>, opts: { err?: unknown; keys?: string[]; mint?: string } = {}): PaidTx {
  const mint = opts.mint ?? order.mint;
  const owners = Object.keys(received);
  return {
    meta: {
      err: opts.err ?? null,
      preTokenBalances: owners.map((owner) => ({ mint, owner, uiTokenAmount: { amount: "1000" } })),
      postTokenBalances: owners.map((owner) => ({ mint, owner, uiTokenAmount: { amount: String(1000 + received[owner]) } })),
    },
    transaction: { message: { accountKeys: (opts.keys ?? [order.reference]).map((k) => ({ pubkey: { toBase58: () => k } })) } },
  };
}

test("verifyPayment accepts an exact payment", () => {
  const o = makeOrder();
  assert.equal(verifyPayment(makeTx(o, { [o.creator]: o.creatorAmount, [o.treasury]: o.fee }), o), null);
});

test("verifyPayment accepts a recipient whose token account was just created (no pre balance)", () => {
  const o = makeOrder();
  const tx = makeTx(o, { [o.creator]: o.creatorAmount, [o.treasury]: o.fee });
  tx.meta!.preTokenBalances = [];
  tx.meta!.postTokenBalances = [
    { mint: o.mint, owner: o.creator, uiTokenAmount: { amount: String(o.creatorAmount) } },
    { mint: o.mint, owner: o.treasury, uiTokenAmount: { amount: String(o.fee) } },
  ];
  assert.equal(verifyPayment(tx, o), null);
});

test("verifyPayment rejects every way of cheating", () => {
  const o = makeOrder();
  const full = { [o.creator]: o.creatorAmount, [o.treasury]: o.fee };
  assert.match(verifyPayment(null, o)!, /not found/);
  assert.match(verifyPayment(makeTx(o, full, { err: { InstructionError: [] } }), o)!, /failed/);
  assert.match(verifyPayment(makeTx(o, full, { keys: [addr()] }), o)!, /reference/); // someone else's tx
  assert.match(verifyPayment(makeTx(o, full, { mint: addr() }), o)!, /underpaid/); // worthless token
  assert.match(verifyPayment(makeTx(o, { ...full, [o.creator]: o.creatorAmount - 1 }), o)!, /underpaid/);
  assert.match(verifyPayment(makeTx(o, { [o.creator]: o.creatorAmount + o.fee }), o)!, /underpaid/); // fee skipped
});

test("creator === treasury needs the full price in one wallet", () => {
  const o = makeOrder();
  o.treasury = o.creator;
  assert.equal(verifyPayment(makeTx(o, { [o.creator]: o.creatorAmount + o.fee }), o), null);
  assert.match(verifyPayment(makeTx(o, { [o.creator]: o.creatorAmount }), o)!, /underpaid/);
});

test("payment instructions carry the reference and both transfers", () => {
  const o = makeOrder();
  const ix = buildPaymentInstructions(Keypair.generate().publicKey, o);
  assert.equal(ix.length, 4);
  assert.ok(ix.some((i) => i.keys.some((k) => k.pubkey.toBase58() === o.reference && !k.isSigner && !k.isWritable)));
});
