"use client";

import { useEffect, useState } from "react";

type Item = { id: string; text: string; level: 2 | 3 };

// Reads the headings out of the page that was just rendered, so no page has to keep its own
// table of contents in sync with its prose.
export function DocsToc() {
  const [items, setItems] = useState<Item[]>([]);
  const [active, setActive] = useState("");

  useEffect(() => {
    let spy: IntersectionObserver | undefined;
    // The headings only exist once the page has painted, so read them on the next frame
    // rather than synchronously inside the effect.
    const frame = requestAnimationFrame(() => {
      const article = document.querySelector(".doc");
      if (!article) return;
      const found = [...article.querySelectorAll<HTMLElement>("h2[id], h3[id]")].map((el) => ({
        id: el.id,
        // The heading carries a permalink anchor; its text is not part of the title.
        text: (el.querySelector(".h-text")?.textContent ?? el.textContent ?? "").replace(/#$/, "").trim(),
        level: (el.tagName === "H3" ? 3 : 2) as 2 | 3,
      }));
      setItems(found);
      if (found.length === 0) return;

      // Whichever heading last crossed the top of the viewport is the one being read.
      const seen = new Map<string, boolean>();
      spy = new IntersectionObserver(
        (entries) => {
          for (const e of entries) seen.set(e.target.id, e.isIntersecting);
          const first = found.find((i) => seen.get(i.id));
          if (first) setActive(first.id);
        },
        { rootMargin: "-80px 0px -70% 0px" },
      );
      for (const i of found) {
        const el = document.getElementById(i.id);
        if (el) spy.observe(el);
      }
    });
    return () => {
      cancelAnimationFrame(frame);
      spy?.disconnect();
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <nav className="docs-toc" aria-label="On this page">
      <p className="docs-toc-label">On this page</p>
      <ul>
        {items.map((i) => (
          <li key={i.id}>
            <a href={`#${i.id}`} className={`docs-toc-item${i.level === 3 ? " is-sub" : ""}${active === i.id ? " is-active" : ""}`}>
              {i.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
