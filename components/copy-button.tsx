"use client";

import { useState } from "react";

/** A value with a copy button; shows "copied" for a moment. Unstyled beyond the class you pass. */
export function CopyButton({ text, label, className }: { text: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={className}
      title={text}
      onClick={async () => {
        try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1400); } catch { /* no clipboard: the title shows the value */ }
      }}
    >
      {done ? "copied ✓" : (label ?? text)}
    </button>
  );
}
