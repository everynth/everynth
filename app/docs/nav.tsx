"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { DocGroup } from "@/lib/docs";

export function DocsNav({ groups }: { groups: DocGroup[] }) {
  const path = usePathname();
  return (
    <nav aria-label="Documentation" className="lg:sticky lg:top-6 lg:self-start">
      <details className="lg:hidden" open={false}>
        <summary className="btn-ghost cursor-pointer">Docs menu</summary>
        <div className="mt-3">{groups.map((g) => group(g, path))}</div>
      </details>
      <div className="hidden lg:block">{groups.map((g) => group(g, path))}</div>
    </nav>
  );
}

function group(g: DocGroup, path: string) {
  return (
    <div key={g.group} className="mb-5">
      <p className="mb-1.5 font-mono text-[11px] uppercase tracking-widest opacity-50">{g.group}</p>
      <ul className="flex flex-col">
        {g.docs.map((d) => {
          const href = `/docs/${d.slug}`;
          const active = path === href;
          return (
            <li key={d.slug}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`block rounded-lg px-2.5 py-1.5 text-sm transition-colors hover:bg-foreground/5 ${active ? "bg-foreground/10 font-medium" : "opacity-80"}`}
              >
                {d.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
