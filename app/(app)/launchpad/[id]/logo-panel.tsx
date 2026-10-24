"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * The launcher's switch for the coin's pictures: upload a logo, or have Prism draw the logo and
 * banner. Matters most before the create: pump.fun keeps the first image its indexer sees.
 */
export function LogoPanel({ id, pair, source, hasBanner, minted }: { id: string; pair: "evyn" | "sol"; source: "upload" | "prism" | null; hasBanner: boolean; minted: boolean }) {
  const router = useRouter();
  const [v, setV] = useState(0); // cache-buster after a change
  const [busy, setBusy] = useState<"upload" | "draw" | null>(null);
  const [error, setError] = useState("");
  const done = () => { setV(Date.now()); router.refresh(); };
  const fail = async (res: Response) => { throw new Error((await res.json().catch(() => ({}))).error ?? `error ${res.status}`); };

  async function upload(file: File) {
    setBusy("upload"); setError("");
    try {
      const fd = new FormData(); fd.set("file", file);
      const res = await fetch(`/api/launches/${id}/logo`, { method: "PUT", body: fd });
      if (!res.ok) await fail(res);
      done();
    } catch (e) { setError((e as Error).message); } finally { setBusy(null); }
  }
  async function draw() {
    setBusy("draw"); setError("");
    try {
      const res = await fetch(`/api/launches/${id}/identity`, { method: "POST" });
      if (!res.ok) await fail(res);
      done();
    } catch (e) { setError((e as Error).message); } finally { setBusy(null); }
  }

  return (
    <section className="panel" style={{ display: "grid", gap: 12 }}>
      <header className="panel-head"><h2>Logo &amp; banner</h2><span>{source === "upload" ? "your upload" : source === "prism" ? "drawn by Prism" : "the default mark"}</span></header>
      <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- our own API route */}
        <img src={`/api/launches/${id}/logo?v=${v}`} alt="" width={96} height={96} style={{ borderRadius: 22, border: "1px solid rgba(255,255,255,.12)" }} />
        {/* eslint-disable-next-line @next/next/no-img-element -- our own API route */}
        {hasBanner && <img src={`/api/launches/${id}/banner?v=${v}`} alt="" style={{ height: 96, borderRadius: 12, border: "1px solid rgba(255,255,255,.12)" }} />}
      </div>
      <div className="dash-sec-actions" style={{ justifyContent: "flex-start" }}>
        <label className="btn-ghost" style={{ cursor: busy ? "wait" : "pointer" }}>
          {busy === "upload" ? "Uploading…" : "Upload a logo"}
          <input type="file" hidden accept="image/png,image/jpeg,image/webp,image/gif" disabled={!!busy} onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
        </label>
        {pair === "evyn" && (
          <button type="button" className="btn-ghost" onClick={draw} disabled={!!busy}>
            {busy === "draw" ? "Prism is drawing… (about a minute)" : source === "upload" ? "Draw the banner with Prism" : source === "prism" ? "Draw again with Prism" : "Let Prism draw it"}
          </button>
        )}
      </div>
      <p className="lx-meta" style={{ margin: 0 }}>
        {minted ? "Wallets and the site read the logo from here; pump.fun shows what it saw when the coin was created." : "pump.fun keeps the first image it sees, so settle the logo before you press Launch."}
        {pair === "evyn" && source === "upload" ? " Prism keeps your logo and draws only the banner." : ""}
      </p>
      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
    </section>
  );
}
