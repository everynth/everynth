"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export function NavLinks({ signedIn, admin }: { signedIn: boolean; admin: boolean }) {
  const path = usePathname();
  const active = useRef<HTMLAnchorElement>(null);

  // On a phone the row scrolls sideways, so the page you are on can start out off-screen.
  useEffect(() => {
    active.current?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [path]);

  // Named so the pair cannot be confused: one lists a product, the other will mint a token.
  const links: [string, string][] = [["/", "Market"], ["/stats", "Live stats"], ["/launch/product", "Launch product"], ["/launchpad", "Launch token"]];
  if (signedIn) links.push(["/purchases", "Purchases"], ["/dashboard", "Dashboard"]);
  if (admin) links.push(["/admin", "Admin"]);

  return (
    // Never wraps: on a narrow screen the row scrolls sideways instead of folding the pill in half.
    <nav className="flex flex-nowrap items-center gap-1" aria-label="Primary">
      {links.map(([href, label]) => {
        const is = path === href;
        return (
          <Link
            key={href}
            href={href}
            ref={is ? active : undefined}
            className={`tab-pill${is ? " is-active" : ""}`}
            aria-current={is ? "page" : undefined}
          >
            {label}
            {href === "/launchpad" && <span className="tab-soon">soon</span>}
          </Link>
        );
      })}
    </nav>
  );
}
