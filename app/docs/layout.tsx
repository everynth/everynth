import type { Metadata } from "next";
import Link from "next/link";
import { DocsToc } from "@/components/docs-toc";
import { DOC_GROUPS } from "@/lib/docs";
import { APP, SITE, SOCIALS } from "@/lib/site";
import { DocsNav } from "./nav";

export const metadata: Metadata = { title: "EVERYNTH Docs" };

// Docs have their own chrome: no wallet, no app menu. Three columns on a wide screen —
// the sections on the left, the page in the middle, its own headings on the right.
export default function DocsLayout({ children }: LayoutProps<"/docs">) {
  return (
    <div className="docs-shell flex min-h-full flex-1 flex-col">
      <header className="docs-top">
        <div className="docs-wrap docs-bar">
          {/* Read as a trail: the mark goes home, "Docs" goes to the docs index. */}
          <span className="docs-brand">
            <a href={SITE} className="docs-brand-home brand-home" aria-label="Back to everynth.org">
              <span className="brand-back" aria-hidden="true">←</span>
              {/* eslint-disable-next-line @next/next/no-img-element -- static mark */}
              <img src="/logo.png" alt="" width={22} height={22} className="brand-mark" />
              <span className="chrome">EVERYNTH</span>
            </a>
            <span className="docs-brand-sep" aria-hidden="true">/</span>
            <Link href="/docs">Docs</Link>
          </span>
          <nav className="docs-topnav" aria-label="Docs header">
            <a href={SITE} className="docs-link">Home</a>
            <Link href="/docs" className="docs-link is-current">Docs</Link>
            <a href={`${APP}/launchpad`} className="docs-link">Launchpad</a>
            <a href={APP} className="docs-cta">Open the market →</a>
          </nav>
        </div>
      </header>
      <div className="docs-wrap docs-body">
        <DocsNav groups={DOC_GROUPS} />
        <div className="doc docs-page min-w-0">{children}</div>
        <DocsToc />
      </div>
      <footer className="docs-foot">
        <div className="docs-wrap flex flex-wrap items-center gap-x-6 gap-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- static mark */}
          <img src="/logo.png" alt="" width={16} height={16} className="brand-mark brand-mark-sm" />
          <span className="chrome font-mono text-xs tracking-widest">EVERYNTH</span>
          <Link href="/terms" className="docs-link">Terms</Link>
          <Link href="/developers" className="docs-link">Developers</Link>
          {SOCIALS.map((s) => (
            <a key={s.name} href={s.url} target="_blank" rel="noreferrer noopener" className="docs-link">{s.name} ↗</a>
          ))}
          <span className="ml-auto font-mono text-[11px] uppercase tracking-widest opacity-50">non-custodial · no program · encrypted in your browser</span>
        </div>
      </footer>
    </div>
  );
}
