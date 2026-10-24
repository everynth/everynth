"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** The launcher's switch: put the desk to work on this launch, then show what came back. */
export function DeskButton({ id, again }: { id: string; again: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function run() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/launches/${id}/desk`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `error ${res.status}`);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div style={{ display: "grid", gap: 6, justifyItems: "start" }}>
      <button type="button" className="btn" onClick={run} disabled={busy}>{busy ? "The desk is working… (a minute or two)" : again ? "Run the desk again" : "Put the desk to work"}</button>
      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
