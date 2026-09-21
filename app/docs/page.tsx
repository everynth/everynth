import Link from "next/link";
import { DOC_GROUPS } from "@/lib/docs";

export const metadata = { title: "Documentation — EVERYNTH" };

export default function DocsIndex() {
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest opacity-60">Documentation</p>
      <h1>EVERYNTH docs</h1>
      <p className="lead">
        Everything about launching, buying, paying and gating on EVERYNTH. Every page has a permanent URL and every
        heading has a permalink you can share.
      </p>
      {DOC_GROUPS.map((g) => (
        <section key={g.group} className="mt-10">
          <h2 id={g.group.toLowerCase().replace(/\s+/g, "-")}>{g.group}</h2>
          <ul className="not-list grid gap-3 sm:grid-cols-2">
            {g.docs.map((d) => (
              <li key={d.slug}>
                <Link href={`/docs/${d.slug}`} className="card block h-full no-underline transition-colors hover:border-foreground/40">
                  <span className="block font-medium">{d.title}</span>
                  <span className="mt-1 block text-sm opacity-70">{d.summary}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
