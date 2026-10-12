"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { DocGroup } from "@/lib/docs";

export function DocsNav({ groups }: { groups: DocGroup[] }) {
  const path = usePathname();
  return (
    <nav aria-label="Documentation" className="docs-nav">
      <details className="lg:hidden">
        <summary className="docs-cta inline-block cursor-pointer">Docs menu</summary>
        <div className="mt-3">{body(groups, path)}</div>
      </details>
      <div className="hidden lg:block lg:sticky lg:top-24">{body(groups, path)}</div>
    </nav>
  );
}

function body(groups: DocGroup[], path: string) {
  return (
    <>
      <Link href="/docs" className={`docs-all${path === "/docs" ? " is-active" : ""}`}>
        All docs
      </Link>
      {groups.map((g, i) => group(g, path, i))}
    </>
  );
}

function group(g: DocGroup, path: string, i: number) {
  return (
    <div key={g.group} className="docs-group" style={{ animationDelay: `${80 + i * 70}ms` }}>
      <p className="docs-group-label">{g.group}</p>
      <ul>
        {g.docs.map((d) => {
          const href = `/docs/${d.slug}`;
          const active = path === href;
          return (
            <li key={d.slug}>
              <Link href={href} aria-current={active ? "page" : undefined} className={`docs-item${active ? " is-active" : ""}`}>
                {d.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
