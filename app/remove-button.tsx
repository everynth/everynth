"use client";

import { useRouter } from "next/navigation";

export function RemoveButton({ productId }: { productId: string }) {
  const router = useRouter();
  async function remove() {
    if (!confirm("Remove this product from the market? Existing buyers keep their access.")) return;
    const res = await fetch(`/api/products/${productId}/remove`, { method: "POST" });
    if (!res.ok) alert((await res.json()).error);
    router.refresh();
  }
  return (
    <button onClick={remove} className="btn-ghost text-red-600">
      Remove from market
    </button>
  );
}
