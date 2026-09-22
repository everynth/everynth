"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLinks({ signedIn, admin }: { signedIn: boolean; admin: boolean }) {
  const path = usePathname();
  const links: [string, string][] = [["/", "Market"], ["/launch", "Launch"]];
  if (signedIn) links.push(["/purchases", "Purchases"], ["/dashboard", "Dashboard"]);
  if (admin) links.push(["/admin", "Admin"]);
  return (
    <nav className="flex flex-wrap items-center gap-1" aria-label="Primary">
      {links.map(([href, label]) => (
        <Link key={href} href={href} className={`tab-pill${path === href ? " is-active" : ""}`} aria-current={path === href ? "page" : undefined}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
