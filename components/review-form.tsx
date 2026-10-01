"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MAX_REVIEW_BODY } from "@/lib/config";

// Only shown to someone whose purchase of this product is paid. They may rewrite it later.
export function ReviewForm({ purchaseId, existing }: { purchaseId: string; existing?: { rating: number; body: string } }) {
  const router = useRouter();
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState(existing?.body ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) return setError("Pick a score from 1 to 5 first");
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/purchases/${purchaseId}/review`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rating, body }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setDone(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your review");
    } finally {
      setBusy(false);
    }
  }

  const shown = hover || rating;
  return (
    <form onSubmit={submit} className="rv-form">
      <div className="rv-pick" role="radiogroup" aria-label="Your score">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} out of 5`}
            className={`rv-star${n <= shown ? " is-on" : ""}`}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(n)}
          >
            ★
          </button>
        ))}
        <span className="rv-pick-label">{shown ? `${shown}/5` : "your score"}</span>
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value.slice(0, MAX_REVIEW_BODY))}
        rows={3}
        placeholder="Did it match the description? Was it worth the price? (optional)"
        aria-label="Your review"
        className="field"
      />
      <div className="rv-form-foot">
        <button disabled={busy} className="btn">{busy ? "Saving…" : existing ? "Update review" : "Post review"}</button>
        <span>{body.length}/{MAX_REVIEW_BODY}{done && " · saved"}</span>
      </div>
      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
    </form>
  );
}
