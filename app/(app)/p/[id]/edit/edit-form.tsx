"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ProductFields } from "@/components/product-fields";
import type { Product } from "@/lib/db";

export function EditForm({ product }: { product: Product }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch(`/api/products/${product.id}`, { method: "PATCH", body: new FormData(e.currentTarget) });
    if (res.ok) return router.push(`/p/${product.id}`);
    setError((await res.json()).error);
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <ProductFields defaults={product} />
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <button disabled={busy} className="btn self-start">
        {busy ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
