"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ProductFields } from "@/components/product-fields";
import { useWalletCtx } from "@/components/wallet";
import type { Product } from "@/lib/db";
import { actionMessage, editFields } from "@/lib/launch-message";
import { parseFields } from "@/lib/product-form";

const issuedNow = () => Date.now();

export function EditForm({ product }: { product: Product }) {
  const router = useRouter();
  const { address, signMessage } = useWalletCtx();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const form = new FormData(e.currentTarget);
      // The new title and price are what the wallet shows, so an edit cannot be rewritten in flight.
      const fields = parseFields(form);
      if (typeof fields === "string") throw new Error(fields);
      if (!address) throw new Error("Connect your wallet first");
      const issuedAt = issuedNow();
      const text = actionMessage(location.host, address, "edit listing", editFields(product.id, fields.title, fields.price), issuedAt);
      const signature = await signMessage(new TextEncoder().encode(text));
      form.set("issuedAt", String(issuedAt));
      form.set("signature", btoa(String.fromCharCode(...signature)));

      const res = await fetch(`/api/products/${product.id}`, { method: "PATCH", body: form });
      if (res.ok) return router.push(`/p/${product.id}`);
      throw new Error((await res.json()).error);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <ProductFields defaults={product} />
      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}
      <button disabled={busy} className="btn self-start">
        {busy ? "Check your wallet…" : "Confirm & save changes"}
      </button>
      <p className="text-xs" style={{ color: "var(--mute)" }}>
        Your wallet will show the new title and price before anything is saved. Signing is free.
      </p>
    </form>
  );
}
