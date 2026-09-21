"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { loginMessage } from "@/lib/login-message";

export function SignIn({ sessionWallet }: { sessionWallet: string | null }) {
  const { publicKey, signMessage, disconnect } = useWallet();
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function signIn() {
    if (!publicKey || !signMessage) return;
    setBusy(true);
    setError("");
    try {
      const wallet = publicKey.toBase58();
      const issuedAt = Date.now();
      const signed = await signMessage(new TextEncoder().encode(loginMessage(location.host, wallet, issuedAt)));
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ wallet, issuedAt, signature: btoa(String.fromCharCode(...signed)) }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

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
    <div className="flex flex-col items-start gap-2">
      <div className="flex items-center gap-3">
        <WalletMultiButton />
        {publicKey && (
          <button
            onClick={signIn}
            disabled={busy || !signMessage}
            className="btn"
          >
            {busy ? "Check your wallet…" : "Sign in (free)"}
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
