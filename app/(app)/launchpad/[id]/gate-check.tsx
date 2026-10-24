"use client";

import { useState } from "react";

/** Paste any wallet, see whether it clears the holder gate — the same question the utility's app asks. */
export function GateCheck({ id, ticker, prefill }: { id: string; ticker: string; prefill: string }) {
  const [wallet, setWallet] = useState(prefill);
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<{ balance?: string; needed?: string; unlocked?: boolean; unlocks?: string; error?: string } | null>(null);
  const whole = (v: string) => (Number(v) / 1e6).toLocaleString("en-US", { maximumFractionDigits: 2 });

  async function check(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setRes(null);
    try {
      const r = await fetch(`/api/launches/${id}/gate?wallet=${encodeURIComponent(wallet.trim())}`);
      setRes(await r.json());
    } catch {
      setRes({ error: "no answer from the server" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={check} className="gate-check">
      <style>{`.gate-check{display:grid;gap:8px;margin:4px 0 10px}.gate-check-row{display:flex;gap:8px}
.gate-check-row .field{flex:1;min-width:0;font-family:var(--font-geist-mono),monospace;font-size:12.5px}
.gate-check-out{font-size:13px;line-height:1.5;padding:8px 12px;border-radius:10px;border:1px solid rgba(242,160,160,.35);background:rgba(242,160,160,.06);color:var(--ink2)}
.gate-check-out.is-open{border-color:rgba(123,224,160,.4);background:rgba(123,224,160,.07)}.gate-check-out b{color:var(--ink)}`}</style>
      <div className="gate-check-row">
        <input className="field" value={wallet} onChange={(e) => setWallet(e.target.value)} placeholder="Any Solana wallet address" aria-label="Wallet to check" spellCheck={false} />
        <button className="btn-ghost" disabled={busy || wallet.trim().length < 32}>{busy ? "Reading…" : "Check"}</button>
      </div>
      {res && (res.error
        ? <p className="lx-meta" role="alert">{res.error}</p>
        : <p className={`gate-check-out${res.unlocked ? " is-open" : ""}`}>
            {res.unlocked ? "✓ Unlocked" : "✗ Below the gate"} · holds <b>{whole(res.balance ?? "0")} {ticker}</b> of <b>{whole(res.needed ?? "0")}</b> needed
            {res.unlocked ? <> — <b>{res.unlocks}</b> is open to this wallet.</> : <> — {whole(String(Math.max(0, Number(res.needed) - Number(res.balance))))} {ticker} short.</>}
          </p>)}
    </form>
  );
}
