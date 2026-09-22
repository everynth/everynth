"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useSignMessage, useWallets } from "@privy-io/react-auth/solana";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { loginMessage } from "@/lib/login-message";

// Two steps: Privy login (email / Google / Phantom …) gives the user a Solana wallet; then that
// wallet signs our login message and the server issues the session cookie (unchanged server side).
export function SignIn({ sessionWallet }: { sessionWallet: string | null }) {
  const { ready, authenticated, login, logout } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();
  const { signMessage } = useSignMessage();
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const attempted = useRef(false);
  const wallet = wallets[0];

  async function signIn() {
    if (!wallet) return;
    setBusy(true);
    setError("");
    try {
      const issuedAt = Date.now();
      const { signature } = await signMessage({
        message: new TextEncoder().encode(loginMessage(location.host, wallet.address, issuedAt)),
        wallet,
        options: { uiOptions: { title: "Sign in to EVERYNTH", description: "Free. This does not move any funds." } },
      });
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ wallet: wallet.address, issuedAt, signature: btoa(String.fromCharCode(...signature)) }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  // Right after Privy login, ask for the signature once without another click.
  useEffect(() => {
    if (authenticated && wallet && !sessionWallet && !attempted.current) {
      attempted.current = true;
      void signIn();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, wallet?.address, sessionWallet]);

  async function signOut() {
    await fetch("/api/session", { method: "DELETE" });
    await logout();
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
    <div className="flex flex-col items-end gap-2">
      {!authenticated ? (
        <button onClick={() => login()} disabled={!ready} className="btn">
          Sign in
        </button>
      ) : !walletsReady || !wallet ? (
        <span className="btn-ghost" aria-busy="true">Preparing your wallet…</span>
      ) : (
        <button onClick={signIn} disabled={busy} className="btn">
          {busy ? "Check your wallet…" : `Continue as ${wallet.address.slice(0, 4)}…${wallet.address.slice(-4)}`}
        </button>
      )}
      {error && (
        <p role="alert" className="max-w-xs text-right text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
