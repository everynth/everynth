"use client";

import { ComputeBudgetProgram, Connection, Keypair, PublicKey, Transaction, type TransactionInstruction } from "@solana/web3.js";
import { OnlinePumpSdk } from "@pump-fun/pump-sdk";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";

// localStorage as a store the button can subscribe to (one tab, so a plain listener set does).
const listeners = new Set<() => void>();
const subscribe = (f: () => void) => { listeners.add(f); return () => { listeners.delete(f); }; };
import { useWalletCtx } from "@/components/wallet";
import { RPC_URL } from "@/lib/config";
import type { PairId } from "@/lib/launchpad";
import { chainOf } from "@/lib/mint";
import { buyInstructions, createInstruction, quoteFor } from "@/lib/pump";
import { priorityFee, sendAndConfirm } from "@/lib/send";

type Props = { id: string; name: string; ticker: string; uri: string; owner: string; vault: string; devBuySol: number; pair: PairId };

const post = (url: string, body: unknown) =>
  fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

/**
 * Launches the coin on pump.fun from the frozen terms: the create, quoted in SOL or in EVYN,
 * signed by the launcher's wallet (and the new mint's keypair); then, when the terms say so, the
 * dev buy as a second transaction — through EVYN when that is the pair. The server reads the
 * bonding curve back off the chain and refuses anything that does not match.
 */
export function LaunchButton(p: Props) {
  const { address, signTransaction } = useWalletCtx();
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  // The create that went out but was never verified (the browser closed, the server did not answer): kept until it is.
  const KEY = `launch:${p.id}`;
  const raw = useSyncExternalStore(subscribe, () => { try { return localStorage.getItem(KEY); } catch { return null; } }, () => null);
  const pending = raw ? (JSON.parse(raw) as { signature: string; mint: string }) : null;
  const setPending = (v: { signature: string; mint: string } | null) => { try { if (v) localStorage.setItem(KEY, JSON.stringify(v)); else localStorage.removeItem(KEY); } catch { /* no storage */ } listeners.forEach((f) => f()); };

  async function launch() {
    setError("");
    try {
      if (!address) throw new Error("Connect your wallet first");
      if (address !== p.owner) throw new Error("Connect the wallet that froze these terms");
      const connection = new Connection(RPC_URL, "confirmed");
      const sdk = new OnlinePumpSdk(connection);
      const user = new PublicKey(address);
      const send = async (ixs: TransactionInstruction[], signers: Keypair[], label: string) => {
        const latest = await connection.getLatestBlockhash();
        const tx = new Transaction({ feePayer: user, ...latest }).add(ComputeBudgetProgram.setComputeUnitLimit({ units: 600_000 }), priorityFee(), ...ixs);
        if (signers.length) tx.partialSign(...signers);
        setStatus(`Approve ${label} in your wallet…`);
        const signed = await signTransaction(tx.serialize({ requireAllSignatures: false, verifySignatures: false }), chainOf(RPC_URL));
        setStatus(`Sending ${label}…`);
        return sendAndConfirm(connection, signed, latest);
      };

      setStatus(p.pair === "evyn" ? "Reading EVYN's curve…" : "Reading the curve settings…");
      const [global, feeConfig, quote] = await Promise.all([sdk.fetchGlobal(), sdk.fetchFeeConfig(), quoteFor(sdk, p.pair)]);
      // A coin created earlier whose verification never came back: verify that one, never create a second.
      let sent = pending;
      if (!sent) {
        const kp = Keypair.generate();
        const signature = await send(
          [await createInstruction({ mint: kp.publicKey, name: p.name.slice(0, 32), symbol: p.ticker.slice(0, 13), uri: p.uri, creator: new PublicKey(p.vault), user, quote })],
          [kp], "the launch",
        );
        sent = { signature, mint: kp.publicKey.toBase58() };
        setPending(sent);
      }
      const mint = new PublicKey(sent.mint);

      setStatus("Verifying the curve…");
      let why = "";
      for (let attempt = 0; attempt < 8; attempt++) {
        const res = await post(`/api/launches/${p.id}/launch`, { signature: sent.signature, mint: sent.mint });
        if (res.ok) { why = ""; break; }
        // The server may answer with no body at all (a timeout at the edge): treat that like "not yet".
        why = await res.json().then((j: { error?: string }) => j.error ?? `${res.status}`).catch(() => `no answer from the server (${res.status})`);
        if (res.status !== 402 && res.status < 500) break;
        await new Promise((r) => setTimeout(r, 2500));
      }
      if (why) throw new Error(`Launched (${sent.signature.slice(0, 8)}…), but not verified yet: ${why}. Press the button again in a minute — it will verify the coin ${sent.mint}, not create another.`);
      setPending(null);

      // The dev buy, as the terms say. A failure here leaves a launched coin with no dev buy, which
      // the launcher can do by hand on the site; the launch itself is already recorded.
      if (p.devBuySol > 0) {
        try {
          await send(await buyInstructions({ sdk, global, feeConfig, mint, user, sol: p.devBuySol, slippage: 5, quote }), [], `the dev buy of ${p.devBuySol} SOL`);
        } catch (e) {
          setError(`Launched, but the dev buy did not go through: ${e instanceof Error ? e.message : e}. You can buy on the site instead.`);
        }
      }
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Launch failed";
      // While EVYN graduates from its curve to its pool, the SDK can find no venue to quote against.
      setError(p.pair === "evyn" && /quote|curve|pool|route|account/i.test(msg)
        ? `${msg} — EVYN may be moving from its curve to its pool right now; try again in a few minutes, or launch this coin paired with SOL.`
        : msg);
    } finally {
      setStatus("");
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button onClick={launch} disabled={!!status} className="btn">
        {status || (pending ? `Verify $${p.ticker} on pump.fun (already created)` : `Launch $${p.ticker} on pump.fun · ${p.pair === "evyn" ? "EVYN" : "SOL"} pair${p.devBuySol ? ` · dev buy ${p.devBuySol} SOL` : ""}`)}
      </button>
      {error && <p role="alert" className="max-w-md text-right text-sm text-red-400">{error}</p>}
    </div>
  );
}
