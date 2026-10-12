import { createHmac, createPublicKey, timingSafeEqual, verify } from "node:crypto";
import { PublicKey } from "@solana/web3.js";
import { actionMessage, launchMessage, type LaunchTerms } from "./launch-message.ts";
import { loginMessage } from "./login-message.ts";

export const SESSION_COOKIE = "everynth_session";
export const SESSION_TTL_S = 7 * 24 * 3600;
const SIGN_WINDOW_MS = 5 * 60 * 1000;
// DER prefix that turns a raw 32-byte ed25519 key into an SPKI public key
const ED25519_SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

// ponytail: stateless replay guard (host-bound message + 5 min window), no nonce store.
// A captured signature is replayable inside the window; add one-time nonces if that matters.
const fresh = (issuedAt: number, now: number) => Number.isFinite(issuedAt) && Math.abs(now - issuedAt) <= SIGN_WINDOW_MS;

// Was this exact text signed by the private key behind this wallet address?
function signedBy(message: string, wallet: string, signatureB64: string): boolean {
  try {
    const key = createPublicKey({
      key: Buffer.concat([ED25519_SPKI_PREFIX, new PublicKey(wallet).toBytes()]),
      format: "der",
      type: "spki",
    });
    return verify(null, Buffer.from(message), key, Buffer.from(signatureB64, "base64"));
  } catch {
    return false; // malformed wallet or signature
  }
}

export function verifyLogin(
  host: string,
  wallet: string,
  issuedAt: number,
  signatureB64: string,
  now = Date.now(),
): boolean {
  return fresh(issuedAt, now) && signedBy(loginMessage(host, wallet, issuedAt), wallet, signatureB64);
}

// Second signature, asked for at launch: the creator confirms the terms that will be stored.
// Change the title, the price or the delivery kind after signing and this no longer matches.
export function verifyLaunch(
  host: string,
  wallet: string,
  terms: LaunchTerms,
  issuedAt: number,
  signatureB64: string,
  now = Date.now(),
): boolean {
  return fresh(issuedAt, now) && signedBy(launchMessage(host, wallet, terms, issuedAt), wallet, signatureB64);
}

// Editing a listing and taking one down are signed too: a session cookie alone changes nothing a buyer sees.
export function verifyAction(
  host: string,
  wallet: string,
  action: string,
  fields: string[],
  issuedAt: number,
  signatureB64: string,
  now = Date.now(),
): boolean {
  return fresh(issuedAt, now) && signedBy(actionMessage(host, wallet, action, fields, issuedAt), wallet, signatureB64);
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createSession(wallet: string, secret: string, now = Date.now()): string {
  const payload = `${wallet}.${Math.floor(now / 1000) + SESSION_TTL_S}`;
  return `${payload}.${sign(payload, secret)}`;
}

// Returns the wallet address, or null if the token is forged or expired.
export function readSession(token: string | undefined, secret: string, now = Date.now()): string | null {
  const [wallet, exp, mac] = token?.split(".") ?? [];
  if (!wallet || !exp || !mac) return null;
  const expected = Buffer.from(sign(`${wallet}.${exp}`, secret));
  const given = Buffer.from(mac);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  return Number(exp) * 1000 > now ? wallet : null;
}

export function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET must be set (32+ chars)");
  return secret;
}
