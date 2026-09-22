"use client";

import { upload } from "@vercel/blob/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ProductFields } from "@/components/product-fields";
import { BLOCKED_EXTENSIONS, MAX_PAYLOAD_BYTES, MAX_SECRET_BYTES } from "@/lib/config";
import { encryptContent } from "@/lib/content-crypto";

type Kind = "file" | "secret" | "github";

export function LaunchForm() {
  const router = useRouter();
  const [kind, setKind] = useState<Kind>("file");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setStatus("Encrypting…");
    try {
      const form = new FormData(e.currentTarget);
      const file = form.get("file");
      const secret = form.get("secret");
      form.delete("file");
      form.delete("secret");

      if (kind === "github") {
        // Nothing to encrypt here: the server checks the token against GitHub and stores it wrapped.
        setStatus("Checking repository…");
      } else {
        let plain: Uint8Array;
        if (kind === "file") {
          if (!(file instanceof File) || file.size === 0) throw new Error("Choose a file");
          if (file.size > MAX_PAYLOAD_BYTES) throw new Error("File is larger than 200 MB");
          if (BLOCKED_EXTENSIONS.test(file.name)) throw new Error("Executables and installers cannot be sold here. Zip source code or documents instead.");
          plain = new Uint8Array(await file.arrayBuffer());
          form.set("fileName", file.name);
          form.set("fileType", file.type);
        } else {
          plain = new TextEncoder().encode(String(secret ?? ""));
          if (plain.length === 0) throw new Error("Enter the secret text buyers will receive");
          if (plain.length > MAX_SECRET_BYTES) throw new Error("Secret text is too long (max 64 KB)");
        }

        // Plaintext never leaves this device: only the ciphertext and its key are sent.
        const { key, payload } = await encryptContent(plain);
        form.set("key", btoa(String.fromCharCode(...key)));
        if (kind === "file") {
          // Straight to blob storage, so large files never pass through the API.
          setStatus("Uploading…");
          const blob = await upload(`${(file as File).name}.enc`, new Blob([payload as BlobPart]), {
            access: "public",
            handleUploadUrl: "/api/upload",
            contentType: "application/octet-stream",
            onUploadProgress: (p) => setStatus(`Uploading… ${p.percentage.toFixed(0)}%`),
          });
          form.set("payloadUrl", blob.url);
        } else {
          form.set("payload", new Blob([payload as BlobPart]));
        }
        setStatus("Launching…");
      }

      const res = await fetch("/api/products", { method: "POST", body: form });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      router.push(`/p/${body.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Launch failed");
      setBusy(false);
      setStatus("");
    }
  }

  const kinds: [Kind, string][] = [
    ["file", "A file"],
    ["secret", "Secret text"],
    ["github", "GitHub repository"],
  ];

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <ProductFields />

      <fieldset className="flex flex-col gap-3 text-sm">
        <legend className="mb-2">What do buyers receive?</legend>
        <div className="seg" role="radiogroup" aria-label="Product kind">
          {kinds.map(([k, label]) => (
            <label key={k} className={`seg-item${kind === k ? " is-active" : ""}`}>
              <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => setKind(k)} className="sr-only" />
              {label}
            </label>
          ))}
        </div>
        {kind === "file" && (
          <>
            <p className="text-xs" style={{ color: "var(--mute)" }}>Dataset, research, template, code — up to 200 MB, encrypted before upload. Executables are refused.</p>
            <input type="file" name="file" required aria-label="Product file (max 200 MB)" className="field" />
          </>
        )}
        {kind === "secret" && (
          <>
            <p className="text-xs" style={{ color: "var(--mute)" }}>API key, invite link, credentials — up to 64 KB, shown to the buyer after payment.</p>
            <textarea name="secret" required rows={4} aria-label="Secret text" className="field font-mono" />
          </>
        )}
        {kind === "github" && (
          <div className="flex flex-col gap-3">
            <input name="repo" required pattern="[\w.-]+/[\w.-]+" placeholder="owner/repository" aria-label="Repository" className="field font-mono" />
            <input type="password" name="token" required placeholder="GitHub token with admin access to that repository" aria-label="GitHub token" className="field font-mono" autoComplete="off" />
            <p className="text-xs opacity-70">
              Buyers enter their GitHub username and are invited as read-only collaborators automatically. Create a
              fine-grained token at github.com → Settings → Developer settings, limited to this repository, with
              &quot;Administration: read and write&quot;. It is stored encrypted and never shown to buyers.
            </p>
          </div>
        )}
      </fieldset>

      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}
      <button disabled={busy} className="btn self-start">
        {busy ? status : kind === "github" ? "Launch" : "Encrypt & launch"}
      </button>
    </form>
  );
}
