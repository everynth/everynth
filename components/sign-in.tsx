"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { loginMessage } from "@/lib/login-message";
import { useWalletCtx } from "./wallet";

const issuedNow = () => Date.now(); // outside the component: event-time, never render-time
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Connect a Solana wallet, sign one free message, get a session cookie. One signature, no third party.
export function SignIn({ sessionWallet }: { sessionWallet: string | null }) {
  const { wallets, address, connect, disconnect, signMessage } = useWalletCtx();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const signing = useRef(false); // never two signature requests in flight: Phantom answers "Unexpected error"
  const attempted = useRef<string | null>(null);

  async function signIn(addr: string) {
    if (signing.current) return;
    signing.current = true;
    setBusy(true);
    setError("");
    try {
      const issuedAt = issuedNow();
      const bytes = new TextEncoder().encode(loginMessage(location.host, addr, issuedAt));
      let signature: Uint8Array;
      try {
        signature = await signMessage(bytes);
      } catch (e) {
        // Phantom sometimes fails the first request right after its connect popup closes. Once more, after a beat.
        if (!/unexpected error/i.test(String((e as Error)?.message))) throw e;
        await sleep(600);
        signature = await signMessage(bytes);
      }
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ wallet: addr, issuedAt, signature: btoa(String.fromCharCode(...signature)) }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      router.refresh();
    } catch (e) {
      const err = e as { message?: string; code?: number };
      const hint = err?.code === -32603 ? " — if this account is on a Ledger, Phantom cannot sign messages with it; use a regular account." : "";
      setError(`Sign failed: ${err?.message ?? "unknown"}${err?.code ? ` (${err.code})` : ""}${hint}`);
    } finally {
      signing.current = false;
      setBusy(false);
    }
  }

  async function pick(w: (typeof wallets)[number]) {
    setOpen(false);
    setError("");
    try {
      await connect(w); // the effect below asks for the signature once the address lands in state
    } catch (e) {
      const err = e as { message?: string; code?: number };
      setError(`Connect failed: ${err?.message ?? "unknown"}${err?.code ? ` (${err.code})` : ""}`);
    }
  }

  // One trigger for the signature: whenever a wallet is connected and there is no session yet.
  useEffect(() => {
    if (!address || sessionWallet || attempted.current === address) return;
    attempted.current = address;
    const t = setTimeout(() => void signIn(address), 400); // let the wallet popup settle first
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, sessionWallet]);

  async function signOut() {
    await fetch("/api/session", { method: "DELETE" });
    await disconnect();
    attempted.current = null;
    router.refresh();
  }

  if (sessionWallet) {
    return (
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm">
          {sessionWallet.slice(0, 4)}…{sessionWallet.slice(-4)}
        </span>
        <button onClick={signOut} className="btn-ghost">
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-end gap-2">
      {address ? (
        <button onClick={() => signIn(address)} disabled={busy} className="btn">
          {busy ? "Check your wallet…" : `Sign in as ${address.slice(0, 4)}…${address.slice(-4)}`}
        </button>
      ) : (
        <button onClick={() => setOpen((o) => !o)} className="btn" aria-expanded={open} aria-haspopup="menu">
          Connect wallet
        </button>
      )}
      {open && !address && (
        <div className="wmenu" role="menu">
          {wallets.length === 0 ? (
            <p className="wmenu-empty">
              No Solana wallet found. Install <a href="https://phantom.app" target="_blank" rel="noreferrer">Phantom</a> or{" "}
              <a href="https://solflare.com" target="_blank" rel="noreferrer">Solflare</a>, then reload.
            </p>
          ) : (
            wallets.map((w) => (
              <button key={w.name} role="menuitem" onClick={() => pick(w)} className="wmenu-item">
                {/* eslint-disable-next-line @next/next/no-img-element -- data: URI from the wallet itself */}
                <img src={w.icon} alt="" width={22} height={22} />
                <span>{w.name}</span>
              </button>
            ))
          )}
        </div>
      )}
      {error && (
        <p role="alert" className="max-w-xs text-right text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
