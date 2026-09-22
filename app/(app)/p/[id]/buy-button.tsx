"use client";

import { useSignTransaction, useWallets } from "@privy-io/react-auth/solana";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { RPC_URL } from "@/lib/config";
import { buildPaymentInstructions, type Order } from "@/lib/payment";

const post = (url: string, body: unknown) =>
  fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const CHAIN = RPC_URL.includes("devnet") ? "solana:devnet" : "solana:mainnet";

export function BuyButton({ productId, sessionWallet }: { productId: string; sessionWallet: string }) {
  const { wallets } = useWallets();
  const { signTransaction } = useSignTransaction();
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function buy() {
    setError("");
    try {
      const wallet = wallets.find((w) => w.address === sessionWallet);
      if (!wallet) throw new Error("Sign in again with the wallet you are paying from");

      setStatus("Preparing order…");
      const orderRes = await post("/api/orders", { productId });
      if (orderRes.status === 409) return router.refresh(); // an earlier payment was just recovered
      const order: Order & { purchaseId: string; error?: string } = await orderRes.json();
      if (!orderRes.ok) throw new Error(order.error);

      // Same transaction as before: two transfers + reference. Privy signs it, we broadcast it.
      const connection = new Connection(RPC_URL, "confirmed");
      const payer = new PublicKey(wallet.address);
      const latest = await connection.getLatestBlockhash();
      const tx = new Transaction({ feePayer: payer, ...latest }).add(...buildPaymentInstructions(payer, order));
      setStatus("Approve in your wallet…");
      const { signedTransaction } = await signTransaction({
        transaction: tx.serialize({ requireAllSignatures: false, verifySignatures: false }),
        wallet,
        chain: CHAIN,
      });
      setStatus("Confirming payment…");
      const signature = await connection.sendRawTransaction(signedTransaction);
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
        {status || "Buy with SOL"}
      </button>
      {error && (
        <p role="alert" className="max-w-xs text-right text-sm text-red-400">
          {error} {/insufficient|0x1\b/i.test(error) && "Make sure you have enough SOL for the price plus fees."}
        </p>
      )}
    </div>
  );
}
