import Link from "next/link";
import { DOC_GROUPS } from "@/lib/docs";

export const metadata = { title: "Documentation — EVERYNTH" };

export default function DocsIndex() {
  return (
    <div>
      <p className="docs-kicker">Documentation</p>
      <h1 className="chrome shimmer">EVERYNTH docs</h1>
      <p className="lead">
        Everything about launching, buying, paying and gating on EVERYNTH. Every page has a permanent URL and every
        heading has a permalink you can share.
      </p>
      {DOC_GROUPS.map((g, gi) => (
        <section key={g.group} className="mt-12 docs-rise" style={{ animationDelay: `${200 + gi * 90}ms` }}>
          <h2 id={g.group.toLowerCase().replace(/\s+/g, "-")}>{g.group}</h2>
          <ul className="not-list docs-grid">
            {g.docs.map((d) => (
              <li key={d.slug}>
                <Link href={`/docs/${d.slug}`} className="docs-card no-underline">
                  <span className="docs-card-title">{d.title}</span>
                  <span className="docs-card-sum">{d.summary}</span>
                  <span className="docs-card-arrow" aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
