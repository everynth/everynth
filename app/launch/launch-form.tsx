"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CATEGORIES, MAX_PAYLOAD_BYTES } from "@/lib/config";
import { encryptContent } from "@/lib/content-crypto";

export function LaunchForm() {
  const router = useRouter();
  const [kind, setKind] = useState<"file" | "secret">("file");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const form = new FormData(e.currentTarget);
      const file = form.get("file");
      const secret = form.get("secret");
      form.delete("file");
      form.delete("secret");

      let plain: Uint8Array;
      if (kind === "file") {
        if (!(file instanceof File) || file.size === 0) throw new Error("Choose a file");
        if (file.size > MAX_PAYLOAD_BYTES) throw new Error("File is larger than 4 MB");
        plain = new Uint8Array(await file.arrayBuffer());
        form.set("fileName", file.name);
        form.set("fileType", file.type);
      } else {
        plain = new TextEncoder().encode(String(secret ?? ""));
        if (plain.length === 0) throw new Error("Enter the secret text buyers will receive");
      }

      // Plaintext never leaves this device: only the ciphertext and its key are sent.
      const { key, payload } = await encryptContent(plain);
      form.set("key", btoa(String.fromCharCode(...key)));
      form.set("payload", new Blob([payload as BlobPart]));

      const res = await fetch("/api/products", { method: "POST", body: form });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      router.push(`/p/${body.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Launch failed");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <label className="flex flex-col gap-1.5 text-sm">
        Title
        <input name="title" required minLength={3} maxLength={80} className="field" />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        Description
        <textarea name="description" required minLength={10} maxLength={4000} rows={6} className="field" />
      </label>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          Category
          <select name="category" required className="field">
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          Price (SOL, min 0.02)
          <input name="price" required inputMode="decimal" pattern="\d{1,7}(\.\d{1,9})?" placeholder="0.5" className="field" />
        </label>
      </div>

      <fieldset className="flex flex-col gap-3 text-sm">
        <legend className="mb-2">What do buyers receive?</legend>
        <div className="flex gap-5">
          <label className="flex items-center gap-2">
            <input type="radio" name="kind" value="file" checked={kind === "file"} onChange={() => setKind("file")} />
            A file
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="kind" value="secret" checked={kind === "secret"} onChange={() => setKind("secret")} />
            Secret text (API key, invite link, credentials)
          </label>
        </div>
        {kind === "file" ? (
          <input type="file" name="file" required aria-label="Product file (max 4 MB)" className="field" />
        ) : (
          <textarea name="secret" required rows={4} aria-label="Secret text" className="field font-mono" />
        )}
      </fieldset>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <button disabled={busy} className="btn self-start">
        {busy ? "Encrypting & launching…" : "Encrypt & launch"}
      </button>
    </form>
  );
}
