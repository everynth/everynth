"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { loginMessage } from "@/lib/login-message";
import { useWalletCtx } from "./wallet";

const issuedNow = () => Date.now(); // outside the component: event-time, never render-time

// Connect a Solana wallet, sign one free message, get a session cookie. One signature, no third party.
export function SignIn({ sessionWallet }: { sessionWallet: string | null }) {
  const { wallets, address, connect, disconnect, signMessage } = useWalletCtx();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const attempted = useRef<string | null>(null);

  async function signIn(addr: string) {
    setBusy(true);
    setError("");
    try {
      const issuedAt = issuedNow();
      const signature = await signMessage(new TextEncoder().encode(loginMessage(location.host, addr, issuedAt)));
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ wallet: addr, issuedAt, signature: btoa(String.fromCharCode(...signature)) }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  async function pick(w: (typeof wallets)[number]) {
    setOpen(false);
    setError("");
    try {
      const addr = await connect(w);
      attempted.current = addr;
      await signIn(addr);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not connect");
    }
  }

  // Wallet reconnected silently on page load but the cookie is gone: ask for the signature once.
  useEffect(() => {
    if (address && !sessionWallet && attempted.current !== address) {
      attempted.current = address;
      void signIn(address);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, sessionWallet]);

  async function signOut() {
    await fetch("/api/session", { method: "DELETE" });
    await disconnect();
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
