import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import { test } from "node:test";
import { PublicKey } from "@solana/web3.js";
import { createSession, readSession, verifyLogin } from "./auth.ts";
import { loginMessage } from "./login-message.ts";

const HOST = "everynth.test";
const SECRET = "x".repeat(32);

function makeWallet() {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const raw = Buffer.from(publicKey.export({ format: "jwk" }).x!, "base64url");
  const address = new PublicKey(raw).toBase58();
  const signLogin = (host: string, issuedAt: number) =>
    sign(null, Buffer.from(loginMessage(host, address, issuedAt)), privateKey).toString("base64");
  return { address, signLogin };
}

test("valid signature logs in", () => {
  const w = makeWallet();
  const now = Date.now();
  assert.equal(verifyLogin(HOST, w.address, now, w.signLogin(HOST, now), now), true);
});

test("rejects another wallet's signature, other host, stale and garbage input", () => {
  const w = makeWallet();
  const other = makeWallet();
  const now = Date.now();
  assert.equal(verifyLogin(HOST, w.address, now, other.signLogin(HOST, now), now), false);
  assert.equal(verifyLogin(HOST, w.address, now, w.signLogin("evil.test", now), now), false);
  const old = now - 6 * 60 * 1000;
  assert.equal(verifyLogin(HOST, w.address, old, w.signLogin(HOST, old), now), false);
  assert.equal(verifyLogin(HOST, "not-a-wallet", now, "AAAA", now), false);
  assert.equal(verifyLogin(HOST, w.address, NaN, w.signLogin(HOST, now), now), false);
});

test("session round-trips, rejects tampering and expiry", () => {
  const now = Date.now();
  const token = createSession("WalletA", SECRET, now);
  assert.equal(readSession(token, SECRET, now), "WalletA");
  assert.equal(readSession(token.replace("WalletA", "WalletB"), SECRET, now), null);
  assert.equal(readSession(token, "y".repeat(32), now), null);
  assert.equal(readSession(token, SECRET, now + 8 * 24 * 3600 * 1000), null);
  assert.equal(readSession(undefined, SECRET, now), null);
  assert.equal(readSession("a.b", SECRET, now), null);
});
