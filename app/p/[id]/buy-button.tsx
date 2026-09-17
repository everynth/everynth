"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Transaction } from "@solana/web3.js";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { buildPaymentInstructions, type Order } from "@/lib/payment";

const post = (url: string, body: unknown) =>
  fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

export function BuyButton({ productId, sessionWallet }: { productId: string; sessionWallet: string }) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function buy() {
    setError("");
    try {
      if (publicKey?.toBase58() !== sessionWallet) throw new Error("Connect the same wallet you signed in with");

      setStatus("Preparing order…");
      const orderRes = await post("/api/orders", { productId });
      if (orderRes.status === 409) return router.refresh(); // an earlier payment was just recovered
      const order: Order & { purchaseId: string; error?: string } = await orderRes.json();
      if (!orderRes.ok) throw new Error(order.error);

      setStatus("Approve in your wallet…");
      const tx = new Transaction().add(...buildPaymentInstructions(publicKey, order));
      const latest = await connection.getLatestBlockhash();
      const signature = await sendTransaction(tx, connection);
      setStatus("Confirming payment…");
      await connection.confirmTransaction({ signature, ...latest }, "confirmed");

      // The server re-checks the chain itself; retry briefly while its RPC catches up.
      let confirmError = "";
      for (let attempt = 0; attempt < 5; attempt++) {
        const res = await post(`/api/orders/${order.purchaseId}/confirm`, { signature });
        if (res.ok) return router.refresh();
        confirmError = (await res.json()).error;
        await new Promise((r) => setTimeout(r, 2000));
      }
      throw new Error(`Paid, but not verified yet (${confirmError}). Press Buy again to re-check — you will not be charged twice.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment failed");
    } finally {
      setStatus("");
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button onClick={buy} disabled={!!status} className="btn">
        {status || "Buy with USDC"}
      </button>
      {error && (
        <p role="alert" className="max-w-xs text-right text-sm text-red-600">
          {error} {/insufficient|0x1\b/i.test(error) && "Make sure you have enough USDC plus a little SOL for fees."}
        </p>
      )}
    </div>
  );
}
