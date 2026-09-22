"use client";

import { useState } from "react";
import { useWalletCtx } from "@/components/wallet";

// Diagnostic page: runs each wallet step on its own and prints the raw result.
// Tells apart "Phantom itself is broken" from "our Wallet Standard path is broken".
type Provider = {
  isPhantom?: boolean;
  connect(): Promise<{ publicKey: { toBase58(): string } }>;
  signMessage(m: Uint8Array, d: "utf8"): Promise<{ signature: Uint8Array }>;
};
const phantom = () => (window as unknown as { phantom?: { solana?: Provider } }).phantom?.solana ?? null;
const describe = (e: unknown) => {
  const err = e as { code?: number; message?: string; name?: string };
  return `${err?.name ?? "Error"}: ${err?.message ?? String(e)}${err?.code ? ` (${err.code})` : ""}`;
};

export default function WalletCheck() {
  const { wallets, address, connect, signMessage } = useWalletCtx();
  const [log, setLog] = useState<string[]>([]);
  const add = (line: string) => setLog((l) => [...l, `${new Date().toLocaleTimeString()}  ${line}`]);

  async function run(label: string, fn: () => Promise<string>) {
    add(`▶ ${label}`);
    try {
      add(`✓ ${await fn()}`);
    } catch (e) {
      add(`✗ ${describe(e)}`);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold">Wallet check</h1>
      <p className="text-sm opacity-70">
        Wallets found: {wallets.map((w) => w.name).join(", ") || "none"} · Phantom injected: {typeof window !== "undefined" && phantom()?.isPhantom ? "yes" : "no"} · connected: {address ?? "—"}
      </p>
      <div className="flex flex-wrap gap-2">
        <button className="btn" onClick={() => run("Phantom direct connect", async () => {
          const p = phantom(); if (!p) throw new Error("window.phantom.solana not found");
          return (await p.connect()).publicKey.toBase58();
        })}>1. Phantom direct connect</button>
        <button className="btn" onClick={() => run("Phantom direct sign", async () => {
          const p = phantom(); if (!p) throw new Error("window.phantom.solana not found");
          const { signature } = await p.signMessage(new TextEncoder().encode("EVERYNTH wallet check"), "utf8");
          return `signature ${signature.length} bytes`;
        })}>2. Phantom direct sign</button>
        <button className="btn-ghost" onClick={() => run("Standard connect", async () => {
          const w = wallets.find((x) => /phantom/i.test(x.name)) ?? wallets[0];
          if (!w) throw new Error("no wallet registered");
          return `${w.name} → ${await connect(w)}`;
        })}>3. Standard connect</button>
        <button className="btn-ghost" onClick={() => run("Standard sign", async () => {
          const sig = await signMessage(new TextEncoder().encode("EVERYNTH wallet check"));
          return `signature ${sig.length} bytes`;
        })}>4. Standard sign</button>
        <button className="btn-ghost" onClick={() => setLog([])}>Clear</button>
      </div>
      <pre className="panel whitespace-pre-wrap p-4 font-mono text-xs">{log.join("\n") || "Press the buttons in order. Send me what appears here."}</pre>
      <p className="text-xs opacity-60">Browser: {typeof navigator !== "undefined" ? navigator.userAgent : ""}</p>
    </div>
  );
}
