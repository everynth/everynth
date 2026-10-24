"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export function NavLinks({ signedIn, admin }: { signedIn: boolean; admin: boolean }) {
  const path = usePathname();
  const active = useRef<HTMLAnchorElement>(null);

  // On a phone the row scrolls sideways, so the page you are on can start out off-screen.
  // Move the strip itself rather than calling scrollIntoView, which is also allowed to scroll
  // every ancestor — including the document, which drags the whole page sideways.
  useEffect(() => {
    const el = active.current;
    const strip = el?.closest<HTMLElement>(".tabs");
    if (!el || !strip || strip.scrollWidth <= strip.clientWidth) return;
    strip.scrollLeft = Math.max(0, el.offsetLeft - (strip.clientWidth - el.offsetWidth) / 2);
  }, [path]);

  // Listing is the desks' job now, so "Launch product" is off the menu. The route still answers,
  // for the dashboard's edit links and for anyone who kept a bookmark.
  const links: [string, string][] = [["/", "Market"], ["/stats", "Live stats"], ["/launchpad", "Launchpad"], ["/community", "Community"], ["/agents", "Agents"]];
  if (signedIn) links.push(["/purchases", "Purchases"], ["/dashboard", "Dashboard"]);
  if (admin) links.push(["/admin", "Admin"]);

  return (
    // Never wraps: on a narrow screen the row scrolls sideways instead of folding the pill in half.
    <nav className="flex flex-nowrap items-center gap-1" aria-label="Primary">
      {links.map(([href, label]) => {
        const is = path === href || (href === "/community" && path.startsWith("/community/"));
        return (
          <Link
            key={href}
            href={href}
            ref={is ? active : undefined}
            className={`tab-pill${is ? " is-active" : ""}`}
            aria-current={is ? "page" : undefined}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
