"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { actionMessage, removeFields } from "@/lib/launch-message";
import { useWalletCtx } from "./wallet";

const issuedNow = () => Date.now();

// block=true (admins only): also bans the creator and unlists everything they sell.
export function RemoveButton({ productId, block = false }: { productId: string; block?: boolean }) {
  const router = useRouter();
  const { address, signMessage } = useWalletCtx();
  const [busy, setBusy] = useState(false);

  async function remove() {
    const msg = block
      ? "Remove this product AND block its creator from launching again? All their products are unlisted."
      : "Remove this product from the market? Existing buyers keep their access.";
    if (!confirm(msg)) return;
    if (!address) return alert("Connect your wallet first.");
    setBusy(true);
    try {
      // Taking a listing down is signed too, so a stolen session cannot empty someone's shop.
      const issuedAt = issuedNow();
      const text = actionMessage(location.host, address, "remove from market", removeFields(productId, block), issuedAt);
      const signature = await signMessage(new TextEncoder().encode(text));
      const res = await fetch(`/api/products/${productId}/remove`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ block, issuedAt, signature: btoa(String.fromCharCode(...signature)) }),
      });
      if (!res.ok) alert((await res.json()).error);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not remove");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button onClick={remove} disabled={busy} className="btn-ghost text-red-400">
      {busy ? "Check your wallet…" : block ? "Remove + block creator" : "Remove from market"}
    </button>
  );
}
