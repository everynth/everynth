"use client";

import { useState } from "react";

export function ReportForm({ productId }: { productId: string }) {
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const reason = new FormData(e.currentTarget).get("reason");
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ productId, reason }),
    });
    setMessage(res.ok ? "Thanks — our team will review it." : (await res.json()).error);
  }

  if (message) return <p role="status" className="text-sm opacity-70">{message}</p>;
  return (
    <details className="text-sm">
      <summary className="cursor-pointer opacity-60">Report this product</summary>
      <form onSubmit={submit} className="mt-3 flex flex-col gap-2">
        <textarea name="reason" required minLength={5} maxLength={1000} rows={3} aria-label="Reason" placeholder="What is wrong with it?" className="field" />
        <button className="btn-ghost self-start">Send report</button>
      </form>
    </details>
  );
}
