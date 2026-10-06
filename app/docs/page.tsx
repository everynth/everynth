import Link from "next/link";
import { DOC_GROUPS } from "@/lib/docs";

export const metadata = { title: "Documentation — EVERYNTH" };

// The index is one card per section, each listing its pages with a line about what they cover.
export default function DocsIndex() {
  return (
    <div>
      <p className="docs-kicker">Docs</p>
      <h1 className="docs-title">How the market works, in full.</h1>
      <p className="lead">
        Launch a product, buy one, and check every rule the payments, the encryption and the
        signatures apply. These pages describe EVERYNTH as it runs on Solana mainnet today.
      </p>

      <div className="docs-groups">
        {DOC_GROUPS.map((g, gi) => (
          <section key={g.group} className="docs-gcard docs-rise" style={{ animationDelay: `${160 + gi * 80}ms` }}>
            <p className="docs-gcard-n">{String(gi + 1).padStart(2, "0")}</p>
            <h2 id={g.group.toLowerCase().replace(/\s+/g, "-")} className="docs-gcard-h">{g.group}</h2>
            <ul className="not-list">
              {g.docs.map((d) => (
                <li key={d.slug}>
                  <Link href={`/docs/${d.slug}`} className="docs-gcard-link">{d.title}</Link>
                  <span className="docs-gcard-sum">{d.summary}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
