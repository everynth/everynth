import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// Content keys are stored wrapped with the server master key (AES-256-GCM): base64(iv | tag | ciphertext).
// v1 trust model: the platform can unwrap keys, so it is NOT end-to-end. See docs/konsep-v1.md.

export function masterKey(): Buffer {
  const key = Buffer.from(process.env.MASTER_KEY ?? "", "base64url");
  if (key.length !== 32) throw new Error("MASTER_KEY must be 32 random bytes, base64url encoded");
  return key;
}

export function wrapKey(contentKey: Buffer, master: Buffer): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", master, iv);
  const ct = Buffer.concat([cipher.update(contentKey), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ct]).toString("base64");
}

export function unwrapKey(wrapped: string, master: Buffer): Buffer {
  const raw = Buffer.from(wrapped, "base64");
  const decipher = createDecipheriv("aes-256-gcm", master, raw.subarray(0, 12));
  decipher.setAuthTag(raw.subarray(12, 28));
  return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]);
}
