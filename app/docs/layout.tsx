import type { Metadata } from "next";
import Link from "next/link";
import { DOC_GROUPS } from "@/lib/docs";
import { DocsNav } from "./nav";

export const metadata: Metadata = { title: "EVERYNTH Docs" };

// Docs have their own chrome: no wallet, no app menu. Dark, like the landing page.
export default function DocsLayout({ children }: LayoutProps<"/docs">) {
  return (
    <div className="docs-shell flex min-h-full flex-1 flex-col">
      <header className="docs-top">
        <div className="docs-wrap flex items-center gap-5">
          <Link href="/docs" className="docs-brand">
            <span className="chrome">EVERYNTH</span>
            <span className="docs-brand-sep" aria-hidden="true">/</span>
            <span>Docs</span>
          </Link>
          <nav className="ml-auto flex items-center gap-2 text-sm" aria-label="Docs header">
            <a href="/landing.html" className="docs-link">Home</a>
            <Link href="/" className="docs-cta">Open the market →</Link>
          </nav>
        </div>
      </header>
      <div className="docs-wrap docs-body grid gap-10 py-10 lg:grid-cols-[230px_minmax(0,1fr)]">
        <DocsNav groups={DOC_GROUPS} />
        <div className="doc docs-page min-w-0">{children}</div>
      </div>
      <footer className="docs-foot">
        <div className="docs-wrap flex flex-wrap items-center gap-x-6 gap-y-2">
          <span className="chrome font-mono text-xs tracking-widest">EVERYNTH</span>
          <Link href="/terms" className="docs-link">Terms</Link>
          <Link href="/developers" className="docs-link">Developers</Link>
          <span className="ml-auto font-mono text-[11px] uppercase tracking-widest opacity-50">non-custodial · no program · encrypted in your browser</span>
        </div>
      </footer>
    </div>
  );
}
