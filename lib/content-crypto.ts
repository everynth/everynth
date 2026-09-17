// Runs in the browser (WebCrypto). Payload is encrypted before it leaves the creator's device
// and decrypted only on the buyer's device. Wire format: iv (12 bytes) | AES-256-GCM ciphertext.

export async function encryptContent(plain: Uint8Array): Promise<{ key: Uint8Array; payload: Uint8Array }> {
  const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plain as BufferSource));
  const payload = new Uint8Array(iv.length + ct.length);
  payload.set(iv);
  payload.set(ct, iv.length);
  return { key: new Uint8Array(await crypto.subtle.exportKey("raw", key)), payload };
}

export async function decryptContent(rawKey: Uint8Array, payload: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", rawKey as BufferSource, "AES-GCM", false, ["decrypt"]);
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: payload.subarray(0, 12) as BufferSource },
    key,
    payload.subarray(12) as BufferSource,
  );
  return new Uint8Array(plain);
}
