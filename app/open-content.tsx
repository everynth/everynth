"use client";

import { useState } from "react";
import { decryptContent } from "@/lib/content-crypto";

const fromBase64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

// Fetches what a paid purchase unlocks: a file or secret (decrypted on this device),
// or a GitHub repository invitation.
export function OpenContent({ purchaseId }: { purchaseId: string }) {
  const [secret, setSecret] = useState("");
  const [github, setGithub] = useState<{ repo: string; user: string | null } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function open() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/purchases/${purchaseId}/content`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      if (body.kind === "github") return setGithub({ repo: body.repo, user: body.githubUser });

      // Files live in blob storage as ciphertext; secrets come inline.
      const payload = body.payloadUrl
        ? new Uint8Array(await (await fetch(body.payloadUrl)).arrayBuffer())
        : fromBase64(body.payload);
      const plain = await decryptContent(fromBase64(body.key), payload);
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

  async function invite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const username = String(new FormData(e.currentTarget).get("username") ?? "").trim();
    const res = await fetch(`/api/purchases/${purchaseId}/github`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username }),
    });
    const body = await res.json();
    if (res.ok) setGithub({ repo: body.repo, user: username });
    else setError(body.error);
    setBusy(false);
  }

  if (secret) return <pre className="field max-w-full overflow-x-auto whitespace-pre-wrap break-all font-mono">{secret}</pre>;

  if (github) {
    return (
      <div className="flex max-w-sm flex-col gap-2 text-sm">
        {github.user ? (
          <p>
            <span className="font-mono">{github.user}</span> was invited to <span className="font-mono">{github.repo}</span>.
            Accept it at{" "}
            <a href={`https://github.com/${github.repo}/invitations`} target="_blank" rel="noreferrer" className="underline">
              github.com/{github.repo}/invitations
            </a>
            . Didn&apos;t get it? Submit the same username again.
          </p>
        ) : (
          <p>
            Access to <span className="font-mono">{github.repo}</span>. Enter your GitHub username to be invited as a read-only
            collaborator.
          </p>
        )}
        <form onSubmit={invite} className="flex gap-2">
          <input name="username" required defaultValue={github.user ?? ""} placeholder="github username" aria-label="GitHub username" className="field" />
          <button disabled={busy} className="btn">
            {busy ? "Inviting…" : github.user ? "Resend" : "Invite me"}
          </button>
        </form>
        {error && (
          <p role="alert" className="text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }

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
