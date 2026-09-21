"use client";

import { useRouter } from "next/navigation";

export function UnblockButton({ wallet }: { wallet: string }) {
  const router = useRouter();
  async function unblock() {
    if (!confirm("Unblock this wallet? Their removed products stay removed.")) return;
    await fetch("/api/admin/unblock", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ wallet }) });
    router.refresh();
  }
  return (
    <button onClick={unblock} className="btn-ghost">
      Unblock
    </button>
  );
}
