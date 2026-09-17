"use client";

import { useState } from "react";
import { decryptContent } from "@/lib/content-crypto";

const fromBase64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

// Fetches the ciphertext + key for a paid purchase and decrypts on this device.
export function OpenContent({ purchaseId }: { purchaseId: string }) {
  const [secret, setSecret] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function open() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/purchases/${purchaseId}/content`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      const plain = await decryptContent(fromBase64(body.key), fromBase64(body.payload));
      if (body.kind === "secret") return setSecret(new TextDecoder().decode(plain));

      const url = URL.createObjectURL(new Blob([plain as BlobPart], { type: body.fileType }));
      const a = document.createElement("a");
      a.href = url;
      a.download = body.fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not open");
    } finally {
      setBusy(false);
    }
  }

  if (secret) return <pre className="field max-w-full overflow-x-auto whitespace-pre-wrap break-all font-mono">{secret}</pre>;
  return (
    <div className="flex flex-col items-end gap-2">
      <button onClick={open} disabled={busy} className="btn">
        {busy ? "Decrypting…" : "Unlock & open"}
      </button>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
