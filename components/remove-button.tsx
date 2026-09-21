"use client";

import { useRouter } from "next/navigation";

// block=true (admins only): also bans the creator and unlists everything they sell.
export function RemoveButton({ productId, block = false }: { productId: string; block?: boolean }) {
  const router = useRouter();
  async function remove() {
    const msg = block
      ? "Remove this product AND block its creator from launching again? All their products are unlisted."
      : "Remove this product from the market? Existing buyers keep their access.";
    if (!confirm(msg)) return;
    const res = await fetch(`/api/products/${productId}/remove`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ block }),
    });
    if (!res.ok) alert((await res.json()).error);
    router.refresh();
  }
  return (
    <button onClick={remove} className="btn-ghost text-red-400">
      {block ? "Remove + block creator" : "Remove from market"}
    </button>
  );
}
